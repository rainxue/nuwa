import { IOSSService, OSSConfig, UploadOptions, PresignedUrlOptions, 
         ListObjectsOptions, ListObjectsResult, OSSObject } from './interface';
import * as path from 'path';
import * as fs from 'fs/promises';

export class SimpleOSSService implements IOSSService {
    private config: OSSConfig;
    private base_path: string;

    constructor(config: OSSConfig) {
        this.config = config;
        
        if (config.provider === 'local') {
            // 本地文件系统实现
            this.base_path = config.endpoint || './oss_storage';
        } else if (config.provider === 'minio') {
            throw new Error('Use MinIOService for MinIO provider');
        } else {
            throw new Error(`Provider ${config.provider} not implemented yet`);
        }
    }

    private get_tenant_path(tenant_id?: string): string {
        if (tenant_id) {
            return path.join(this.base_path, 'tenants', tenant_id);
        }
        return path.join(this.base_path, 'default');
    }

    private get_full_path(key: string, tenant_id?: string): string {
        const tenant_path = this.get_tenant_path(tenant_id);
        return path.join(tenant_path, key);
    }

    private async ensure_directory(file_path: string): Promise<void> {
        const dir = path.dirname(file_path);
        try {
            await fs.access(dir);
        } catch {
            await fs.mkdir(dir, { recursive: true });
        }
    }

    async upload(file: Buffer | string, options: UploadOptions): Promise<string> {
        const file_path = this.get_full_path(options.key, options.tenant_id);
        await this.ensure_directory(file_path);
        
        if (typeof file === 'string') {
            await fs.writeFile(file_path, file, 'utf8');
        } else {
            await fs.writeFile(file_path, file);
        }
        
        // 保存元数据
        if (options.metadata || options.content_type) {
            const metadata = {
                content_type: options.content_type,
                ...options.metadata,
                uploaded_at: new Date().toISOString()
            };
            await fs.writeFile(file_path + '.meta', JSON.stringify(metadata));
        }
        
        return options.key;
    }

    async download(key: string, tenant_id?: string): Promise<Buffer> {
        const file_path = this.get_full_path(key, tenant_id);
        try {
            return await fs.readFile(file_path);
        } catch (error) {
            throw new Error(`Object not found: ${key}`);
        }
    }

    async delete(key: string, tenant_id?: string): Promise<void> {
        const file_path = this.get_full_path(key, tenant_id);
        try {
            await fs.unlink(file_path);
            // 删除元数据文件
            try {
                await fs.unlink(file_path + '.meta');
            } catch {
                // 忽略元数据文件不存在的错误
            }
        } catch (error) {
            throw new Error(`Failed to delete object: ${key}`);
        }
    }

    async exists(key: string, tenant_id?: string): Promise<boolean> {
        const file_path = this.get_full_path(key, tenant_id);
        try {
            await fs.access(file_path);
            return true;
        } catch {
            return false;
        }
    }

    async list_objects(options?: ListObjectsOptions): Promise<ListObjectsResult> {
        const tenant_path = this.get_tenant_path(options?.tenant_id);
        const prefix = options?.prefix || '';
        const max_keys = options?.max_keys || 1000;
        
        try {
            await fs.access(tenant_path);
        } catch {
            return { objects: [], is_truncated: false };
        }

        const objects: OSSObject[] = [];
        await this.scan_directory(tenant_path, tenant_path, prefix, objects, max_keys);
        
        return {
            objects: objects.slice(0, max_keys),
            is_truncated: objects.length > max_keys,
            next_marker: objects.length > max_keys ? objects[max_keys].key : undefined
        };
    }

    private async scan_directory(
        dir_path: string, 
        base_path: string, 
        prefix: string, 
        objects: OSSObject[], 
        max_keys: number
    ): Promise<void> {
        if (objects.length >= max_keys) return;

        try {
            const entries = await fs.readdir(dir_path, { withFileTypes: true });
            
            for (const entry of entries) {
                if (objects.length >= max_keys) break;
                
                const full_path = path.join(dir_path, entry.name);
                const relative_key = path.relative(base_path, full_path).replace(/\\/g, '/');
                
                if (entry.isFile() && !entry.name.endsWith('.meta')) {
                    if (relative_key.startsWith(prefix)) {
                        const stats = await fs.stat(full_path);
                        objects.push({
                            key: relative_key,
                            size: stats.size,
                            last_modified: stats.mtime,
                            etag: `"${stats.mtime.getTime()}-${stats.size}"`
                        });
                    }
                } else if (entry.isDirectory()) {
                    await this.scan_directory(full_path, base_path, prefix, objects, max_keys);
                }
            }
        } catch (error) {
            // 忽略访问错误
        }
    }

    async generate_presigned_url(options: PresignedUrlOptions): Promise<string> {
        // 简单实现：返回一个带有时间戳和签名的本地URL
        const expires_at = Date.now() + (options.expires_in || 3600) * 1000;
        const signature = Buffer.from(`${options.key}:${expires_at}`).toString('base64');
        
        return `http://localhost:3000/oss/presigned/${options.operation}/${options.key}?expires=${expires_at}&signature=${encodeURIComponent(signature)}`;
    }

    async get_tenant_usage(tenant_id: string): Promise<{ size: number; count: number }> {
        const tenant_path = this.get_tenant_path(tenant_id);
        let total_size = 0;
        let count = 0;
        
        try {
            await this.calculate_directory_size(tenant_path, (size) => {
                total_size += size;
                count++;
            });
        } catch {
            // 租户目录不存在
        }
        
        return { size: total_size, count };
    }

    private async calculate_directory_size(dir_path: string, callback: (size: number) => void): Promise<void> {
        try {
            const entries = await fs.readdir(dir_path, { withFileTypes: true });
            
            for (const entry of entries) {
                const full_path = path.join(dir_path, entry.name);
                
                if (entry.isFile() && !entry.name.endsWith('.meta')) {
                    const stats = await fs.stat(full_path);
                    callback(stats.size);
                } else if (entry.isDirectory()) {
                    await this.calculate_directory_size(full_path, callback);
                }
            }
        } catch {
            // 忽略访问错误
        }
    }
}

// 工厂函数
export function createOSSService(config: OSSConfig): IOSSService {
    if (config.provider === 'minio') {
        // 动态导入 MinIO 服务，避免在不使用 MinIO 时的依赖问题
        try {
            const { MinIOService } = require('./minio');
            return new MinIOService(config);
        } catch (error) {
            throw new Error('MinIO service requires "minio" package. Please run: npm install minio @types/minio');
        }
    }
    
    return new SimpleOSSService(config);
}
