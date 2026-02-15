// OSS 基础接口定义
export interface OSSConfig {
    provider: 'aws' | 'aliyun' | 'tencent' | 'local' | 'minio';
    region?: string;
    access_key_id?: string;
    access_key_secret?: string;
    bucket: string;
    endpoint?: string;
    use_ssl?: boolean; // MinIO 可能需要配置是否使用SSL
    port?: number;     // MinIO 端口配置
}

export interface UploadOptions {
    key: string;
    content_type?: string;
    metadata?: Record<string, string>;
    tenant_id?: string;
}

export interface PresignedUrlOptions {
    key: string;
    expires_in?: number; // 秒数，默认3600
    operation: 'put' | 'get';
    tenant_id?: string;
}

export interface ListObjectsOptions {
    prefix?: string;
    max_keys?: number;
    marker?: string;
    tenant_id?: string;
}

export interface OSSObject {
    key: string;
    size: number;
    last_modified: Date;
    etag: string;
    content_type?: string;
}

export interface ListObjectsResult {
    objects: OSSObject[];
    is_truncated: boolean;
    next_marker?: string;
}

// OSS 服务接口
export interface IOSSService {
    // 基本对象操作
    upload(file: Buffer | string, options: UploadOptions): Promise<string>;
    download(key: string, tenant_id?: string): Promise<Buffer>;
    delete(key: string, tenant_id?: string): Promise<void>;
    exists(key: string, tenant_id?: string): Promise<boolean>;
    
    // 列出对象
    list_objects(options?: ListObjectsOptions): Promise<ListObjectsResult>;
    
    // 预签名URL（旁路上传）
    generate_presigned_url(options: PresignedUrlOptions): Promise<string>;
    
    // 多租户相关
    get_tenant_usage(tenant_id: string): Promise<{ size: number; count: number }>;
}
