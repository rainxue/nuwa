import { getConfigValue } from '../common';
import { LRUCache } from 'lru-cache';

export interface Cache<V extends {}> {
    get(key: string): Promise<V | undefined>;
    set(key: string, value: V, ttlSeconds?: number): Promise<boolean>;
    has(key: string): Promise<boolean>;
    delete(key: string): Promise<boolean>;
}
class LocalCacheProvider<V extends {}> {
    private options: any;
    private cache: LRUCache<any, V>;
    constructor(options?: {
        max?: number;
        ttl?: number;
        maxSize?: number;
        maxAge?: number;
    }) {
        // 初始化本地缓存提供者
        this.options = options;
        this.cache = new LRUCache({
                    max: options?.max || 1000,
                    ttl: options?.ttl || options?.maxAge,
                    maxSize: options?.maxSize,
                    ...options
                });
    }
    get(key: any): V | undefined {
        return this.cache.get(key);
    }

    set(key: any, value: V, ttl?: number): boolean {
        this.cache.set(key, value, { ttl });
        return true;
    }

    has(key: any): boolean {
        return this.cache.has(key);
    }

    delete(key: any): boolean {
        return this.cache.delete(key);
    }
}
class RedisCacheProvider {
    private client: any = null;
    private connected = false;
    private connecting = false;

    constructor(private options?: {
        host?: string;
        port?: number;
        password?: string;
        db?: number;
        keyPrefix?: string;
    }) {
        this.options = {
            host: options?.host || 'localhost',
            port: options?.port || 6379,
            db: options?.db || 0,
            keyPrefix: options?.keyPrefix || '',
            ...options
        };
    }
    async connect(): Promise<boolean> {
        if (this.connected) return true;
        if (this.connecting) {
            // 等待连接完成
            while (this.connecting) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            return this.connected;
        }

        this.connecting = true;
        try {
            const { createClient } = await import('redis');
            this.client = createClient({
                socket: {
                    host: this.options?.host,
                    port: this.options?.port
                },
                password: this.options?.password,
                database: this.options?.db
            });

            await this.client.connect();
            this.connected = true;
            console.log('Redis connected successfully');
            return true;
        } catch (error) {
            console.error('Redis connection failed:', error);
            this.connected = false;
            return false;
        } finally {
            this.connecting = false;
        }
    }
    async disconnect(): Promise<void> {
        if (this.client && this.connected) {
            try {
                await this.client.disconnect();
                this.connected = false;
                console.log('Redis disconnected');
            } catch (error) {
                console.error('Redis disconnect error:', error);
            }
        }
    }
    // 获取连接状态
    isConnected(): boolean {
        return this.connected;
    }
    async get(key: string): Promise<string | null> {
        if (!await this.connect()) return null;
        try {
            const value = await this.client.get(key);
            return value;
        } catch (error) {
            console.error('Redis get error:', error);
            return null;
        }
    }
    async set(key: string, value: string, ttl?: number): Promise<boolean> {
        if (!await this.connect()) return false;
        try {
            console.log('Redis set:', key, value);
            if (ttl) {
                await this.client.setEx(key, ttl, value);
            } else {
                await this.client.set(key, value);
            }
            return true;
        } catch (error) {
            console.error('Redis set error:', error);
            return false;
        }
    }
    async has(key: string): Promise<boolean> {
        if (!await this.connect()) return false;
        try {
            const exists = await this.client.exists(key);
            return exists === 1;
        } catch (error) {
            console.error('Redis has error:', error);
            return false;
        }
    }
    async delete(key: string): Promise<boolean> {
        if (!await this.connect()) return false;
        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            console.error('Redis delete error:', error);
            return false;
        }
    }
}
class LocalCache<V extends {}> implements Cache<V> {
    cache: LocalCacheProvider<V>;
    constructor(options: any) {
        // 初始化本地缓存
        this.cache = new LocalCacheProvider<V>(options);
    }

    async get(key: string): Promise<V | undefined> {
        // 实现获取缓存的逻辑
        return this.cache.get(key);
    }

    async set(key: any, value: V, ttlSeconds?: number): Promise<boolean> {
        // 实现设置缓存的逻辑
        this.cache.set(key, value, ttlSeconds ? ttlSeconds * 1000 : undefined);
        return true;
    }

    async has(key: string): Promise<boolean> {
        // 实现检查缓存是否存在的逻辑
        return this.cache.has(key);
    }

    async delete(key: string): Promise<boolean> {
        // 实现删除缓存的逻辑
        return this.cache.delete(key);
    }
}


class RedisCache<V extends {}> implements Cache<V> {
    options: any;
    provider: RedisCacheProvider;
    constructor(provider:RedisCacheProvider, options: any) {
        this.options = options;
        this.provider = provider;
    }
    private getKey(key: string): string {
        return this.options?.keyPrefix ? `${this.options.keyPrefix}:${key}` : key;
    }
    async get(key: string): Promise<V | undefined> {
        // 实现获取缓存的逻辑
        const _key = this.getKey(key);
        
        const result = await this.provider.get(_key);
        if(result === null) return undefined;
        try {
            return JSON.parse(result) as V;
        } catch {
            return undefined;
        }
    }

    async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
        // 实现设置缓存的逻辑
        const _key = this.getKey(key);
        const data = JSON.stringify(value);
        return await this.provider.set(_key, data, ttlSeconds);
    }

    async has(key: string): Promise<boolean> {
        // 实现检查缓存是否存在的逻辑
        const _key = this.getKey(key);
        return await this.provider.has(_key);
    }

    async delete(key: string): Promise<boolean> {
        // 实现删除缓存的逻辑
        const _key = this.getKey(key);
        return await this.provider.delete(_key);
    }
}

const cache_provider_mapping = getConfigValue('cache.mappings');
export class CacheFactory {
    private static redis_providers: Map<string, RedisCacheProvider> = new Map();
    private static instances: Map<string, Cache<any>> = new Map();
    static getRedisCacheProvider(name: string, options: any): RedisCacheProvider {
        let ret = this.redis_providers.get(name);
        if(!ret) {
            ret = new RedisCacheProvider(options);
            this.redis_providers.set(name, ret);
        }
        return ret;
    }

    /**
     * 获取缓存实例（单例模式）
     */
    static getInstance<V extends {}>(name: string = 'default', prefix?: string): Cache<V> {
        const real_name = cache_provider_mapping[name];
        const cache_name = prefix ? `${real_name}:${prefix}` : real_name;
        if (this.redis_providers.has(cache_name)) {
            return this.redis_providers.get(cache_name)!  as unknown as Cache<V>;
        } else {
            let config = getConfigValue(`cache.${real_name}`);
            if (config.type == "redis") {
                const provider = this.getRedisCacheProvider(real_name, config.options);
                this.redis_providers.set(cache_name, provider);
                const redisCache = new RedisCache<V>(provider, prefix);
                this.instances.set(cache_name, redisCache);
                return redisCache;
            } else if (config.type == "local") {
                if (!this.instances.has(cache_name)) {
                    this.instances.set(cache_name, new LocalCache<V>(config.options));
                }
                return this.instances.get(cache_name)! as Cache<V>;
            } else {
                throw new Error(`Unsupported cache type: ${config.type}`);
            }
        }
    }
}

