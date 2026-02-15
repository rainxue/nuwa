/**
 * 缓存使用示例
 */

import { LocalCache, SimpleCache, RedisCache, defaultCache, defaultRedisCache } from '../src/nsdk/cache/index';

async function demonstrateCache() {
    console.log('=== 本地缓存示例 ===');
    
    // 1. 使用 SimpleCache
    const localCache = new SimpleCache({ max: 100, ttl: 10000 }); // 10秒TTL
    
    localCache.setString('user:name', 'Alice');
    localCache.setNumber('user:age', 25);
    localCache.setObject('user:profile', { id: 1, email: 'alice@example.com' });
    
    console.log('姓名:', localCache.getString('user:name'));
    console.log('年龄:', localCache.getNumber('user:age'));
    console.log('资料:', localCache.getObject('user:profile'));
    console.log('本地缓存信息:', localCache.info());

    console.log('\n=== Redis 缓存示例 ===');
    
    // 2. 使用 RedisCache
    const redisCache = new RedisCache({
        host: 'localhost',
        port: 6379,
        keyPrefix: 'app:' // 键前缀
    });

    try {
        // 设置数据
        await redisCache.setString('session:abc123', 'user_data', 300); // 5分钟过期
        await redisCache.setNumber('counter:visits', 1000, 3600); // 1小时过期
        await redisCache.setObject('config:app', {
            name: 'MyApp',
            version: '1.0.0',
            debug: true
        }, 1800); // 30分钟过期

        // 获取数据
        console.log('会话数据:', await redisCache.getString('session:abc123'));
        console.log('访问计数:', await redisCache.getNumber('counter:visits'));
        console.log('应用配置:', await redisCache.getObject('config:app'));

        // 检查是否存在
        console.log('会话是否存在:', await redisCache.has('session:abc123'));
        
        // 查看TTL
        console.log('会话TTL:', await redisCache.ttl('session:abc123'));

        // 获取Redis信息
        console.log('Redis信息:', await redisCache.info());

    } catch (error) {
        console.log('Redis连接失败，可能Redis服务未启动:', (error as Error).message);
    }

    console.log('\n=== 混合使用示例 ===');
    
    // 3. 本地缓存 + Redis 缓存的简单策略
    async function getCachedData(key: string): Promise<any> {
        // 先查本地缓存
        let data = defaultCache.get(key);
        if (data !== undefined) {
            console.log(`从本地缓存获取: ${key}`);
            return data;
        }

        // 再查Redis缓存
        try {
            data = await defaultRedisCache.get(key);
            if (data !== undefined) {
                console.log(`从Redis缓存获取: ${key}`);
                // 同时存到本地缓存
                defaultCache.set(key, data, { ttl: 60000 }); // 本地缓存1分钟
                return data;
            }
        } catch (error) {
            console.log('Redis查询失败，使用本地缓存');
        }

        console.log(`缓存未命中: ${key}`);
        return null;
    }

    async function setCachedData(key: string, value: any, ttlSeconds = 300): Promise<void> {
        // 同时设置本地和Redis缓存
        defaultCache.set(key, value, { ttl: Math.min(ttlSeconds * 1000, 60000) }); // 本地最多1分钟
        
        try {
            await defaultRedisCache.set(key, value, ttlSeconds);
            console.log(`数据已缓存到本地和Redis: ${key}`);
        } catch (error) {
            console.log(`数据已缓存到本地: ${key} (Redis失败)`);
        }
    }

    // 测试混合缓存
    await setCachedData('test:data', { message: 'Hello Cache!' }, 600);
    const cachedResult = await getCachedData('test:data');
    console.log('混合缓存结果:', cachedResult);
}

// 如果直接运行此文件
if (require.main === module) {
    demonstrateCache().catch(console.error);
}

export { demonstrateCache };
