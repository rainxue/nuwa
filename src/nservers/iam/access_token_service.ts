import crypto from 'crypto';
import { Cache,CacheFactory } from '@/nsdk/cache';
import { Singleton } from '@/nsdk/common';

/**
 * Access Token 配置接口
 */
export interface AccessTokenConfig {
    secret_key?: string;          // JWT签名密钥
    access_token_ttl?: number;     // Access Token 过期时间（秒），默认2小时
    refresh_token_ttl?: number;    // Refresh Token 过期时间（秒），默认7天
    issuer?: string;             // 颁发者
    audience?: string;           // 受众
    algorithm?: string;          // 签名算法，默认HS256
    key_prefix?: string;          // Redis key前缀
}

/**
 * Token 载荷接口
 */
export interface TokenPayload {
    user_id: number;              // 用户ID
}

/**
 * Token 信息接口
 */
export interface TokenInfo {
    access_token: string;         // 访问令牌
    refresh_token: string;        // 刷新令牌
    token_type: string;           // 令牌类型，通常为 "Bearer"
    expires_in: number;           // 过期时间（秒）
    expires_at: number;           // 过期时间戳
}

/**
 * 解析后的 Token 信息
 */
export interface ParsedToken {
    payload: TokenPayload;       // 载荷信息
    iat: number;                 // 签发时间
    exp: number;                 // 过期时间
    iss?: string;                // 颁发者
    aud?: string;                // 受众
    jti: string;                 // Token ID
}

/**
 * Token 管理服务类
 * 基于 JWT + Redis 的 Access Token 管理方案
 */
@Singleton
export class AccessTokenService {
    private cache: Cache<any>;
    private config: Required<AccessTokenConfig>;

    constructor() {
        this.config = {
            secret_key: process.env.JWT_SECRET || 'default-jwt-secret-key',
            access_token_ttl: 2 * 60 * 60,        // 2小时
            refresh_token_ttl: 7 * 24 * 60 * 60,  // 7天
            issuer: 'nuwa-auth-service',
            audience: 'nuwa-api',
            algorithm: 'HS256',
            key_prefix: 'auth:token'
        };

        this.cache = CacheFactory.getInstance<any>("uc", this.config.key_prefix );
    }

    /**
     * 生成 Access Token 和 Refresh Token
     * @param payload Token 载荷
     * @returns Token 信息
     */
    async generateTokens(payload: TokenPayload): Promise<TokenInfo> {
        const now = Math.floor(Date.now() / 1000);
        const tokenId = this.generateTokenId();
        
        // 构建 JWT 载荷
        const jwtPayload = {
            ...payload,
            iat: now,
            exp: now + this.config.access_token_ttl,
            iss: this.config.issuer,
            aud: this.config.audience,
            jti: tokenId
        };

        // 生成 Access Token (JWT)
        const accessToken = this.createJWT(jwtPayload);
        
        // 生成 Refresh Token (随机字符串)
        const refreshToken = this.generateRefreshToken();

        // 计算过期时间
        const expiresAt = (now + this.config.access_token_ttl) * 1000; // 转换为毫秒

        // 在 Redis 中存储 Token 管理信息（简化版）
        const tokenData = {
            user_id: payload.user_id,
            token_type: 'Bearer',
            created_at: now,
            expires_at: now + this.config.access_token_ttl,
            refresh_expires_at: now + this.config.refresh_token_ttl,
            refresh_token: refreshToken
        };

        // 存储到 Redis
        await this.storeTokenData(tokenId, tokenData);
        await this.storeRefreshTokenMapping(refreshToken, tokenId);
        await this.storeUserTokenMapping(payload.user_id, tokenId);

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            token_type: 'Bearer',
            expires_in: this.config.access_token_ttl,
            expires_at: expiresAt
        };
    }

    /**
     * 验证 Access Token (默认推荐方法)
     * @param token Access Token
     * @param checkRevocation 是否检查撤销状态，默认 false
     * @returns 解析后的 Token 信息
     */
    async verifyAccessToken(token: string, checkRevocation: boolean = false): Promise<ParsedToken | null> {
        try {
            // 解析 JWT（无状态验证）
            const decoded = this.verifyJWT(token);
            if (!decoded) return null;

            // 检查是否过期（JWT 自带过期检查）
            const now = Math.floor(Date.now() / 1000);
            if (decoded.exp < now) return null;

            // 可选的撤销检查（检查 Redis 中是否还存在 Token 数据）
            if (checkRevocation) {
                const tokenData = await this.getTokenData(decoded.jti);
                if (!tokenData) return null; // 数据不存在 = 已被撤销
            }

            return decoded;
        } catch (error) {
            console.error('Token verification failed:', error);
            return null;
        }
    }

    /**
     * 便捷方法：验证公开API的Token（纯无状态，性能最优）
     */
    async verifyPublicAPI(token: string): Promise<ParsedToken | null> {
        return this.verifyAccessToken(token, false);
    }

    /**
     * 便捷方法：验证敏感操作的Token（带撤销检查）
     */
    async verifySensitiveAPI(token: string): Promise<ParsedToken | null> {
        return this.verifyAccessToken(token, true);
    }

    /**
     * 刷新 Access Token
     * @param refreshToken Refresh Token
     * @returns 新的 Token 信息
     */
    async refreshAccessToken(refreshToken: string): Promise<TokenInfo | null> {
        try {
            // 获取 Token ID
            const tokenId = await this.getTokenIdByRefreshToken(refreshToken);
            if (!tokenId) return null;

            // 获取 Token 数据
            const tokenData = await this.getTokenData(tokenId);
            if (!tokenData) return null;

            // 检查 Refresh Token 是否过期
            const now = Math.floor(Date.now() / 1000);
            if (tokenData.refresh_expires_at < now) {
                // Refresh Token 已过期，清理数据
                await this.revokeToken(tokenId);
                return null;
            }

            // 撤销旧 Token
            await this.revokeToken(tokenId);

            // 生成新 Token
            const payload: TokenPayload = {
                user_id: tokenData.user_id
            };

            return await this.generateTokens(payload);
        } catch (error) {
            console.error('Token refresh failed:', error);
            return null;
        }
    }

    /**
     * 撤销 Token（直接删除所有相关数据）
     * @param tokenIdOrAccessToken Token ID 或 Access Token
     * @returns 是否成功
     */
    async revokeToken(tokenIdOrAccessToken: string): Promise<boolean> {
        try {
            let tokenId = tokenIdOrAccessToken;

            // 如果传入的是 Access Token，先解析获取 Token ID
            if (tokenIdOrAccessToken.includes('.')) {
                const decoded = this.verifyJWT(tokenIdOrAccessToken);
                if (!decoded) return false;
                tokenId = decoded.jti;
            }

            // 获取 Token 数据（用于清理关联数据）
            const tokenData = await this.getTokenData(tokenId);
            if (!tokenData) return false; // Token 不存在

            // 直接删除所有相关数据
            await Promise.all([
                // 删除 Token 数据
                this.cache.delete(`token:${tokenId}`),
                // 删除 Refresh Token 映射
                this.deleteRefreshTokenMapping(tokenData.refresh_token),
                // 删除用户 Token 映射中的这个 Token
                this.deleteUserTokenMapping(tokenData.user_id, tokenId)
            ]);

            return true;
        } catch (error) {
            console.error('Token revocation failed:', error);
            return false;
        }
    }

    /**
     * 撤销用户的所有 Token
     * @param user_id 用户ID
     * @returns 撤销的 Token 数量
     */
    async revokeUserTokens(user_id: number): Promise<number> {
        try {
            const tokenIds = await this.getUserTokenIds(user_id);
            let revokedCount = 0;

            // 并行删除所有 Token
            const deletePromises = tokenIds.map(async (tokenId) => {
                try {
                    const tokenData = await this.getTokenData(tokenId);
                    if (tokenData) {
                        // 删除 Token 数据和 Refresh Token 映射
                        await Promise.all([
                            this.cache.delete(`token:${tokenId}`),
                            this.deleteRefreshTokenMapping(tokenData.refresh_token)
                        ]);
                        return true;
                    }
                    return false;
                } catch (error) {
                    console.error(`Failed to revoke token ${tokenId}:`, error);
                    return false;
                }
            });

            const results = await Promise.all(deletePromises);
            revokedCount = results.filter(success => success).length;

            // 清理用户 Token 映射
            await this.cache.delete(`user:${user_id}`);

            return revokedCount;
        } catch (error) {
            console.error('User tokens revocation failed:', error);
            return 0;
        }
    }

    /**
     * 获取用户的活跃 Token 列表
     * @param user_id 用户ID
     * @returns Token 列表（脱敏）
     */
    async getUserActiveTokens(user_id: number): Promise<any[]> {
        try {
            const tokenIds = await this.getUserTokenIds(user_id);
            const activeTokens = [];

            for (const tokenId of tokenIds) {
                const tokenData = await this.getTokenData(tokenId);
                if (!tokenData) continue; // Token 数据不存在（可能已被撤销）

                // 检查是否过期
                const now = Math.floor(Date.now() / 1000);
                if (tokenData.expires_at < now) continue;

                activeTokens.push({
                    token_id: tokenId,
                    created_at: tokenData.created_at,
                    expires_at: tokenData.expires_at,
                    refresh_token: '***masked***'
                });
            }

            return activeTokens;
        } catch (error) {
            console.error('Get user active tokens failed:', error);
            return [];
        }
    }

    /**
     * 清理过期的 Token
     * @returns 清理的数量
     */
    async cleanupExpiredTokens(): Promise<number> {
        // 这个方法需要遍历所有 Token，在生产环境中建议使用 Redis 的过期机制
        console.log('Token cleanup should be handled by Redis TTL mechanism');
        return 0;
    }

    /**
     * 生成 Token ID
     */
    private generateTokenId(): string {
        return crypto.randomBytes(16).toString('hex');
    }

    /**
     * 生成 Refresh Token
     */
    private generateRefreshToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * 创建 JWT
     */
    private createJWT(payload: any): string {
        const header = {
            alg: this.config.algorithm,
            typ: 'JWT'
        };

        const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
        const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
        
        const signature = this.sign(`${encodedHeader}.${encodedPayload}`);
        
        return `${encodedHeader}.${encodedPayload}.${signature}`;
    }

    /**
     * 验证 JWT
     */
    private verifyJWT(token: string): ParsedToken | null {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;

            const [headerB64, payloadB64, signature] = parts;
            
            // 验证签名
            const expectedSignature = this.sign(`${headerB64}.${payloadB64}`);
            if (signature !== expectedSignature) return null;

            // 解析载荷
            const payload = JSON.parse(this.base64UrlDecode(payloadB64));
            
            return payload;
        } catch (error) {
            return null;
        }
    }

    /**
     * 签名
     */
    private sign(data: string): string {
        return crypto
            .createHmac('sha256', this.config.secret_key)
            .update(data)
            .digest('base64url');
    }

    /**
     * Base64 URL 编码
     */
    private base64UrlEncode(data: string): string {
        return Buffer.from(data)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    /**
     * Base64 URL 解码
     */
    private base64UrlDecode(data: string): string {
        let base64 = data.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }
        return Buffer.from(base64, 'base64').toString();
    }

    /**
     * 存储 Token 数据到 Redis
     */
    private async storeTokenData(tokenId: string, data: any, ttl?: number): Promise<void> {
        const key = `token:${tokenId}`;
        const expiration = ttl || this.config.access_token_ttl;
        await this.cache.set(key, data, expiration);
    }

    /**
     * 从 Redis 获取 Token 数据
     */
    private async getTokenData(tokenId: string): Promise<any> {
        const key = `token:${tokenId}`;
        return await this.cache.get(key);
    }

    /**
     * 存储 Refresh Token 映射
     */
    private async storeRefreshTokenMapping(refreshToken: string, tokenId: string): Promise<void> {
        const key = `refresh:${refreshToken}`;
        await this.cache.set(key, tokenId, this.config.refresh_token_ttl);
    }

    /**
     * 获取 Token ID 通过 Refresh Token
     */
    private async getTokenIdByRefreshToken(refreshToken: string): Promise<string | null> {
        const key = `refresh:${refreshToken}`;
        const result = await this.cache.get(key);
        return result || null;
    }

    /**
     * 删除 Refresh Token 映射
     */
    private async deleteRefreshTokenMapping(refreshToken: string): Promise<void> {
        const key = `refresh:${refreshToken}`;
        await this.cache.delete(key);
    }

    /**
     * 存储用户 Token 映射
     */
    private async storeUserTokenMapping(user_id: number, tokenId: string): Promise<void> {
        const key = `user:${user_id}`;
        const tokenIds = await this.getUserTokenIds(user_id);
        tokenIds.push(tokenId);
        
        // 只保留最近的 10 个 Token
        if (tokenIds.length > 10) {
            tokenIds.splice(0, tokenIds.length - 10);
        }
        
        await this.cache.set(key, tokenIds, this.config.refresh_token_ttl);
    }

    /**
     * 获取用户的 Token ID 列表
     */
    private async getUserTokenIds(user_id: number): Promise<string[]> {
        const key = `user:${user_id}`;
        const tokenIds = await this.cache.get(key);
        return tokenIds || [];
    }

    /**
     * 删除用户 Token 映射中的特定 Token
     */
    private async deleteUserTokenMapping(user_id: number, tokenId: string): Promise<void> {
        const key = `user:${user_id}`;
        const tokenIds = await this.getUserTokenIds(user_id);
        const filteredIds = tokenIds.filter(id => id !== tokenId);
        
        if (filteredIds.length > 0) {
            await this.cache.set(key, filteredIds, this.config.refresh_token_ttl);
        } else {
            await this.cache.delete(key);
        }
    }

    /**
     * 获取服务配置信息（脱敏）
     */
    getConfig(): Partial<AccessTokenConfig> {
        return {
            access_token_ttl: this.config.access_token_ttl,
            refresh_token_ttl: this.config.refresh_token_ttl,
            issuer: this.config.issuer,
            audience: this.config.audience,
            algorithm: this.config.algorithm,
            key_prefix: this.config.key_prefix
        };
    }

    /**
     * 更新配置
     */
    updateConfig(newConfig: Partial<AccessTokenConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }
}

// // 导出默认实例
// export const accessTokenService = new AccessTokenService();

/**
 * Token 服务工厂类
 */
// export class AccessTokenServiceFactory {
//     private static instances: Map<string, AccessTokenService> = new Map();

//     /**
//      * 获取 Token 服务实例（单例模式）
//      */
//     static getInstance(name: string = 'default', config?: AccessTokenConfig): AccessTokenService {
//         if (!this.instances.has(name)) {
//             this.instances.set(name, new AccessTokenService(config));
//         }
//         return this.instances.get(name)!;
//     }

//     /**
//      * 创建新的 Token 服务实例
//      */
//     static create(config?: AccessTokenConfig): AccessTokenService {
//         return new AccessTokenService(config);
//     }

//     /**
//      * 清理所有实例
//      */
//     static clear(): void {
//         this.instances.clear();
//     }
// }

/**
 * 设计说明：
 * 
 * 1. 极简的 JWT 管理方案：
 *    - 默认使用纯无状态验证（性能最优）
 *    - 撤销 = 直接删除 Redis 数据（简单直接）
 *    - 验证时找不到数据 = Token 已撤销
 * 
 * 2. 验证方式：
 *    - verifyAccessToken(token, false) - 纯无状态，不查 Redis
 *    - verifyAccessToken(token, true)  - 检查 Redis 中是否存在数据
 * 
 * 3. 撤销机制：
 *    - 无需黑名单，直接删除就是最好的撤销
 *    - 删除 token:{tokenId}、refresh:{refreshToken}、user:{user_id} 映射
 *    - 简单高效，无额外存储开销
 * 
 * 4. 使用建议：
 *    - 大多数 API：verifyAccessToken(token) - 纯无状态
 *    - 敏感操作：verifyAccessToken(token, true) - 检查是否被撤销
 *    - Token TTL 几小时自动过期，撤销机制仅用于紧急情况
 */
