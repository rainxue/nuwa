export * from './interface';
export * from './service';

// 便捷的默认导出
export { createOSSService as createOSS } from './service';

// 示例配置
export const DEFAULT_LOCAL_CONFIG = {
    provider: 'local' as const,
    bucket: 'default-bucket',
    endpoint: './storage/oss'
};

export const DEFAULT_MINIO_CONFIG = {
    provider: 'minio' as const,
    bucket: 'default-bucket',
    endpoint: 'localhost',
    port: 9000,
    use_ssl: false,
    access_key_id: 'minioadmin',
    access_key_secret: 'minioadmin'
};