import { createOSS, DEFAULT_MINIO_CONFIG } from './index';

// MinIO 使用示例
async function minioExample() {
    // 创建MinIO服务实例
    const oss = createOSS({
        ...DEFAULT_MINIO_CONFIG,
        // 根据您的 MinIO 实际配置调整
        endpoint: 'localhost',
        port: 9000,
        access_key_id: 'minioadmin',
        access_key_secret: 'minioadmin',
        bucket: 'test-bucket'
    });
    
    try {
        console.log('开始 MinIO 测试...');
        
        // 1. 上传文件
        const file_content = Buffer.from('Hello MinIO World! 🚀');
        await oss.upload(file_content, {
            key: 'test/hello-minio.txt',
            content_type: 'text/plain',
            metadata: {
                'author': 'nuwa-system',
                'created-at': new Date().toISOString()
            },
            tenant_id: 'tenant_minio_001'
        });
        console.log('✅ 文件上传成功');
        
        // 2. 检查文件是否存在
        const exists = await oss.exists('test/hello-minio.txt', 'tenant_minio_001');
        console.log('✅ 文件存在:', exists);
        
        // 3. 下载文件
        const downloaded = await oss.download('test/hello-minio.txt', 'tenant_minio_001');
        console.log('✅ 下载内容:', downloaded.toString());
        
        // 4. 列出对象
        const list_result = await oss.list_objects({
            tenant_id: 'tenant_minio_001',
            prefix: 'test/',
            max_keys: 10
        });
        console.log('✅ 对象列表:', list_result.objects.map(obj => ({
            key: obj.key,
            size: obj.size,
            last_modified: obj.last_modified
        })));
        
        // 5. 生成预签名URL (下载)
        const download_url = await oss.generate_presigned_url({
            key: 'test/hello-minio.txt',
            operation: 'get',
            expires_in: 3600,
            tenant_id: 'tenant_minio_001'
        });
        console.log('✅ 下载预签名URL:', download_url);
        
        // 6. 生成预签名URL (上传)
        const upload_url = await oss.generate_presigned_url({
            key: 'test/upload-via-presigned.txt',
            operation: 'put',
            expires_in: 3600,
            tenant_id: 'tenant_minio_001'
        });
        console.log('✅ 上传预签名URL:', upload_url);
        
        // 7. 获取租户使用量
        const usage = await oss.get_tenant_usage('tenant_minio_001');
        console.log('✅ 租户使用量:', {
            size_mb: (usage.size / 1024 / 1024).toFixed(2) + ' MB',
            count: usage.count + ' 个文件'
        });
        
        // 8. 清理：删除测试文件
        await oss.delete('test/hello-minio.txt', 'tenant_minio_001');
        console.log('✅ 测试文件删除成功');
        
        console.log('🎉 MinIO 测试完成！');
        
    } catch (error) {
        console.error('❌ 操作失败:', error);
        console.log('\n📋 请检查：');
        console.log('1. MinIO 服务是否正在运行');
        console.log('2. 连接配置是否正确');
        console.log('3. 是否已安装 minio 包: npm install minio @types/minio');
    }
}

// 导出示例函数
export { minioExample };

// 如果直接运行此文件，执行示例
if (require.main === module) {
    minioExample();
}
