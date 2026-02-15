import { IOSSService, OSSConfig, UploadOptions, PresignedUrlOptions, 
         ListObjectsOptions, ListObjectsResult, OSSObject } from './interface';
import { Client as MinioClient } from 'minio';
import { Readable } from 'stream';

export class MinIOService implements IOSSService {
    private client: MinioClient;
    private config: OSSConfig;

    constructor(config: OSSConfig) {
        this.config = config;
        
        if (!config.access_key_id || !config.access_key_secret) {
            throw new Error('MinIO requires access_key_id and access_key_secret');
        }
        
        if (!config.endpoint) {
            throw new Error('MinIO requires endpoint');
        }

        // 创建 MinIO 客户端
        this.client = new MinioClient({
            endPoint: config.endpoint,
            port: config.port || 9000,
            useSSL: config.use_ssl || false,
            accessKey: config.access_key_id,
            secretKey: config.access_key_secret,
            region: config.region || 'us-east-1'
        });

        // 确保 bucket 存在
        this.ensureBucket();
    }

    private async ensureBucket(): Promise<void> {
        try {
            const exists = await this.client.bucketExists(this.config.bucket);
            if (!exists) {
                await this.client.makeBucket(this.config.bucket, this.config.region || 'us-east-1');
                console.log(`Created bucket: ${this.config.bucket}`);
            }
        } catch (error) {
            console.warn('Failed to ensure bucket exists:', error);
        }
    }

    private get_tenant_key(key: string, tenant_id?: string): string {
        if (tenant_id) {
            return `tenants/${tenant_id}/${key}`;
        }
        return `default/${key}`;
    }

    async upload(file: Buffer | string, options: UploadOptions): Promise<string> {
        const object_key = this.get_tenant_key(options.key, options.tenant_id);
        
        let buffer: Buffer;
        if (typeof file === 'string') {
            buffer = Buffer.from(file, 'utf8');
        } else {
            buffer = file;
        }

        const metadata: Record<string, string> = {
            ...options.metadata
        };

        if (options.content_type) {
            metadata['content-type'] = options.content_type;
        }

        try {
            await this.client.putObject(
                this.config.bucket,
                object_key,
                buffer,
                buffer.length,
                metadata
            );
            
            return options.key;
        } catch (error) {
            throw new Error(`Failed to upload object: ${error}`);
        }
    }

    async download(key: string, tenant_id?: string): Promise<Buffer> {
        const object_key = this.get_tenant_key(key, tenant_id);
        
        try {
            const stream = await this.client.getObject(this.config.bucket, object_key);
            return this.streamToBuffer(stream);
        } catch (error) {
            throw new Error(`Object not found: ${key}`);
        }
    }

    private async streamToBuffer(stream: Readable): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
    }

    async delete(key: string, tenant_id?: string): Promise<void> {
        const object_key = this.get_tenant_key(key, tenant_id);
        
        try {
            await this.client.removeObject(this.config.bucket, object_key);
        } catch (error) {
            throw new Error(`Failed to delete object: ${key}`);
        }
    }

    async exists(key: string, tenant_id?: string): Promise<boolean> {
        const object_key = this.get_tenant_key(key, tenant_id);
        
        try {
            await this.client.statObject(this.config.bucket, object_key);
            return true;
        } catch {
            return false;
        }
    }

    async list_objects(options?: ListObjectsOptions): Promise<ListObjectsResult> {
        const tenant_prefix = options?.tenant_id ? `tenants/${options.tenant_id}/` : 'default/';
        const full_prefix = tenant_prefix + (options?.prefix || '');
        const max_keys = options?.max_keys || 1000;

        try {
            const objects: OSSObject[] = [];
            
            const stream = this.client.listObjectsV2(
                this.config.bucket, 
                full_prefix, 
                false  // recursive: false for folder-like listing
            );

            for await (const obj of stream) {
                if (objects.length >= max_keys) break;
                
                // 移除租户前缀，返回相对路径
                const relative_key = obj.name?.replace(tenant_prefix, '') || '';
                
                objects.push({
                    key: relative_key,
                    size: obj.size || 0,
                    last_modified: obj.lastModified || new Date(),
                    etag: obj.etag || '',
                    content_type: obj.metaData?.['content-type']
                });
            }

            return {
                objects,
                is_truncated: objects.length >= max_keys,
                next_marker: objects.length >= max_keys ? objects[objects.length - 1].key : undefined
            };
        } catch (error) {
            console.error('Failed to list objects:', error);
            return { objects: [], is_truncated: false };
        }
    }

    async generate_presigned_url(options: PresignedUrlOptions): Promise<string> {
        const object_key = this.get_tenant_key(options.key, options.tenant_id);
        const expires = options.expires_in || 3600; // 默认1小时
        
        try {
            if (options.operation === 'get') {
                return await this.client.presignedGetObject(
                    this.config.bucket,
                    object_key,
                    expires
                );
            } else if (options.operation === 'put') {
                return await this.client.presignedPutObject(
                    this.config.bucket,
                    object_key,
                    expires
                );
            } else {
                throw new Error(`Unsupported operation: ${options.operation}`);
            }
        } catch (error) {
            throw new Error(`Failed to generate presigned URL: ${error}`);
        }
    }

    async get_tenant_usage(tenant_id: string): Promise<{ size: number; count: number }> {
        const prefix = `tenants/${tenant_id}/`;
        
        try {
            let total_size = 0;
            let count = 0;
            
            const stream = this.client.listObjectsV2(this.config.bucket, prefix, true);
            
            for await (const obj of stream) {
                total_size += obj.size || 0;
                count++;
            }
            
            return { size: total_size, count };
        } catch (error) {
            console.error('Failed to get tenant usage:', error);
            return { size: 0, count: 0 };
        }
    }
}
