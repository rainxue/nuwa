import { createOSS } from './index';

async function testMinIO() {
    console.log('🚀 开始测试 MinIO 集成...');
    
    try {
        // 测试配置
        const config = {
            provider: 'minio' as const,
            endpoint: 'localhost',
            port: 9000,
            use_ssl: false,
            access_key_id: 'minioadmin',
            access_key_secret: 'minioadmin',
            bucket: 'test-bucket'
        };
        
        console.log('📋 配置信息:', {
            endpoint: `${config.endpoint}:${config.port}`,
            bucket: config.bucket,
            ssl: config.use_ssl ? 'HTTPS' : 'HTTP'
        });
        
        // 创建服务实例
        console.log('🔗 正在连接 MinIO...');
        const oss = createOSS(config);
        
        // 简单的连接测试 - 尝试列出对象
        console.log('📝 测试连接...');
        const result = await oss.list_objects({ tenant_id: 'test' });
        
        console.log('✅ MinIO 连接成功！');
        console.log(`📊 当前有 ${result.objects.length} 个对象`);
        
        return true;
        
    } catch (error) {
        console.error('❌ MinIO 测试失败:', error);
        console.log('\n💡 请检查：');
        console.log('1. MinIO 服务是否在 localhost:9000 运行');
        console.log('2. 用户名密码是否为 minioadmin/minioadmin');
        console.log('3. 网络连接是否正常');
        
        return false;
    }
}

// 导出测试函数
export { testMinIO };

// 如果直接运行此文件
if (require.main === module) {
    testMinIO().then(success => {
        if (success) {
            console.log('🎉 测试完成！可以开始使用 MinIO OSS 服务了。');
        } else {
            console.log('⚠️  请修复配置后重试。');
            process.exit(1);
        }
    });
}
