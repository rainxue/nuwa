import { createOSS, DEFAULT_LOCAL_CONFIG } from './index';

// 使用示例
async function example() {
    // 创建OSS服务实例
    const oss = createOSS(DEFAULT_LOCAL_CONFIG);
    
    try {
        // 1. 上传文件
        const file_content = Buffer.from('Hello OSS World!');
        await oss.upload(file_content, {
            key: 'test/hello.txt',
            content_type: 'text/plain',
            tenant_id: 'tenant_001'
        });
        console.log('文件上传成功');
        
        // 2. 检查文件是否存在
        const exists = await oss.exists('test/hello.txt', 'tenant_001');
        console.log('文件存在:', exists);
        
        // 3. 下载文件
        const downloaded = await oss.download('test/hello.txt', 'tenant_001');
        console.log('下载内容:', downloaded.toString());
        
        // 4. 列出对象
        const list_result = await oss.list_objects({
            tenant_id: 'tenant_001',
            prefix: 'test/'
        });
        console.log('对象列表:', list_result.objects);
        
        // 5. 生成预签名URL
        const presigned_url = await oss.generate_presigned_url({
            key: 'test/hello.txt',
            operation: 'get',
            expires_in: 3600,
            tenant_id: 'tenant_001'
        });
        console.log('预签名URL:', presigned_url);
        
        // 6. 获取租户使用量
        const usage = await oss.get_tenant_usage('tenant_001');
        console.log('租户使用量:', usage);
        
        // 7. 删除文件
        await oss.delete('test/hello.txt', 'tenant_001');
        console.log('文件删除成功');
        
    } catch (error) {
        console.error('操作失败:', error);
    }
}

// 导出示例函数
export { example as ossExample };
