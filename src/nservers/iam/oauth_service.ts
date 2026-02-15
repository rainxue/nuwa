import { DaoBase, ServiceBase, StandardEntityBase,ID_GENERATOR } from '../../nsdk/base';
import { CryptoUtil, HashUtil } from '../../nsdk/util';

export enum OAuthStatus {
    ACTIVE = 'active',      // 激活状态
    REVOKED = 'revoked',    // 已撤销
    EXPIRED = 'expired'     // 已过期
}

export enum OAuthProvider {
    GOOGLE = 'google',
    FACEBOOK = 'facebook', 
    WECHAT = 'wechat',
    GITHUB = 'github',
    APPLE = 'apple'
}

export class OAuthAccount extends StandardEntityBase {
    provider?: string;              // OAuth提供商
    provider_user_id?: string;      // 提供商用户ID
    union_id?: string;              // 跨应用统一用户ID（主要用于微信）
    user_id?: number;               // 关联的用户账号ID
    access_token?: string;          // 访问令牌（加密存储）
    refresh_token?: string;         // 刷新令牌（加密存储）
    token_type?: string;            // 令牌类型，通常为"Bearer"
    scope?: string;                 // 授权范围
    expires_at?: Date;              // 访问令牌过期时间
    refresh_expires_at?: Date;      // 刷新令牌过期时间
    raw_user_info?: string;         // 原始用户信息JSON
    status?: string;                // 绑定状态
    last_used_at?: Date;            // 最后使用时间
}

class OAuthAccountDao extends DaoBase {
    constructor() {
        super('uc_oauth_account', 'default', { 
            id_generator: ID_GENERATOR.SNOWFLAKE, 
            multi_tenant: false 
        });
    }

    async insert(data: Partial<OAuthAccount>): Promise<any> {
        // 处理敏感令牌加密
        if (data.access_token) {
            data.access_token = CryptoUtil.encrypt(data.access_token);
        }
        
        if (data.refresh_token) {
            data.refresh_token = CryptoUtil.encrypt(data.refresh_token);
        }
        
        // 设置默认值
        if (!data.token_type) {
            data.token_type = 'Bearer';
        }
        
        if (!data.status) {
            data.status = OAuthStatus.ACTIVE;
        }
        
        if (!data.last_used_at) {
            data.last_used_at = new Date();
        }

        return super.insert(data);
    }

    async update(id: any, data: Partial<OAuthAccount>): Promise<Boolean> {
        // 处理敏感令牌加密
        if (data.access_token) {
            data.access_token = CryptoUtil.encrypt(data.access_token);
        }
        
        if (data.refresh_token) {
            data.refresh_token = CryptoUtil.encrypt(data.refresh_token);
        }

        return super.update(id, data);
    }

    /**
     * 根据提供商和用户ID查找OAuth账号
     * @param provider OAuth提供商
     * @param providerUserId 提供商用户ID
     * @returns OAuth账号记录
     */
    async findByProviderAndUserId(provider: string, providerUserId: string): Promise<OAuthAccount | null> {
        if (!provider || !providerUserId) return null;
        
        return await this.findOne({ 
            conditions: { 
                provider: provider,
                provider_user_id: providerUserId 
            } 
        });
    }

    /**
     * 根据微信unionId查找OAuth账号
     * @param unionId 微信unionId
     * @returns OAuth账号记录
     */
    async findByWechatUnionId(unionId: string): Promise<OAuthAccount | null> {
        if (!unionId) return null;
        
        return await this.findOne({ 
            conditions: { 
                provider: OAuthProvider.WECHAT,
                union_id: unionId 
            } 
        });
    }

    /**
     * 根据系统用户ID查找所有OAuth绑定
     * @param userId 系统用户ID
     * @returns OAuth账号列表
     */
    async findByUserId(userId: number): Promise<OAuthAccount[]> {
        if (!userId) return [];
        
        return await this.list({ 
            conditions: { user_id: userId },
            orders: { create_date: 'DESC' }
        });
    }

    /**
     * 根据系统用户ID和提供商查找OAuth绑定
     * @param userId 系统用户ID
     * @param provider OAuth提供商
     * @returns OAuth账号记录
     */
    async findByUserIdAndProvider(userId: number, provider: string): Promise<OAuthAccount | null> {
        if (!userId || !provider) return null;
        
        return await this.findOne({ 
            conditions: { 
                user_id: userId,
                provider: provider 
            } 
        });
    }

    /**
     * 查找活跃状态的OAuth账号
     * @param provider OAuth提供商
     * @param providerUserId 提供商用户ID
     * @returns OAuth账号记录
     */
    async findActiveByProviderAndUserId(provider: string, providerUserId: string): Promise<OAuthAccount | null> {
        if (!provider || !providerUserId) return null;
        
        return await this.findOne({ 
            conditions: { 
                provider: provider,
                provider_user_id: providerUserId,
                status: OAuthStatus.ACTIVE
            } 
        });
    }

    /**
     * 查找即将过期的令牌（用于自动刷新）
     * @param beforeMinutes 多少分钟后过期
     * @returns OAuth账号列表
     */
    async findTokensExpiringBefore(beforeMinutes: number = 30): Promise<OAuthAccount[]> {
        const expireTime = new Date();
        expireTime.setMinutes(expireTime.getMinutes() + beforeMinutes);
        
        return await this.list({ 
            conditions: { 
                status: OAuthStatus.ACTIVE,
                expires_at: { '$lte': expireTime }
            } 
        });
    }

    /**
     * 解密访问令牌（仅在必要时使用）
     * @param oauthAccount OAuth账号
     * @returns 解密后的访问令牌
     */
    decryptAccessToken(oauthAccount: OAuthAccount): string | null {
        if (!oauthAccount.access_token) return null;
        
        try {
            return CryptoUtil.decrypt(oauthAccount.access_token);
        } catch (error) {
            console.error('Failed to decrypt access token:', error);
            return null;
        }
    }

    /**
     * 解密刷新令牌（仅在必要时使用）
     * @param oauthAccount OAuth账号
     * @returns 解密后的刷新令牌
     */
    decryptRefreshToken(oauthAccount: OAuthAccount): string | null {
        if (!oauthAccount.refresh_token) return null;
        
        try {
            return CryptoUtil.decrypt(oauthAccount.refresh_token);
        } catch (error) {
            console.error('Failed to decrypt refresh token:', error);
            return null;
        }
    }

    /**
     * 检查令牌是否已过期
     * @param oauthAccount OAuth账号
     * @returns 是否已过期
     */
    isTokenExpired(oauthAccount: OAuthAccount): boolean {
        if (!oauthAccount.expires_at) return false;
        
        return new Date() > new Date(oauthAccount.expires_at);
    }

    /**
     * 检查刷新令牌是否已过期
     * @param oauthAccount OAuth账号
     * @returns 是否已过期
     */
    isRefreshTokenExpired(oauthAccount: OAuthAccount): boolean {
        if (!oauthAccount.refresh_expires_at) return false;
        
        return new Date() > new Date(oauthAccount.refresh_expires_at);
    }
}

class OAuthService extends ServiceBase<OAuthAccount> {
    private oauthDao: OAuthAccountDao;

    constructor() {
        super(new OAuthAccountDao());
        this.oauthDao = new OAuthAccountDao();
    }

    /**
     * 创建或更新OAuth账号绑定
     * @param oauthData OAuth数据
     * @returns 创建/更新结果
     */
    async createOrUpdateOAuthAccount(oauthData: Partial<OAuthAccount>): Promise<any> {
        // 验证必要字段
        if (!oauthData.provider || !oauthData.provider_user_id) {
            throw new Error('Provider and provider_user_id are required');
        }

        // 验证提供商是否支持
        if (!Object.values(OAuthProvider).includes(oauthData.provider as OAuthProvider)) {
            throw new Error(`Unsupported OAuth provider: ${oauthData.provider}`);
        }

        // 查找是否已存在绑定
        const existingOAuth = await this.oauthDao.findByProviderAndUserId(
            oauthData.provider, 
            oauthData.provider_user_id
        );

        if (existingOAuth) {
            // 更新现有绑定
            const updateData = {
                access_token: oauthData.access_token,
                refresh_token: oauthData.refresh_token,
                token_type: oauthData.token_type || 'Bearer',
                scope: oauthData.scope,
                expires_at: oauthData.expires_at,
                refresh_expires_at: oauthData.refresh_expires_at,
                raw_user_info: oauthData.raw_user_info,
                status: OAuthStatus.ACTIVE,
                last_used_at: new Date()
            };

            const result = await this.oauthDao.update(existingOAuth.id, updateData);
            return { 
                result: result, 
                id: existingOAuth.id, 
                isNew: false 
            };
        } else {
            // 创建新绑定
            const result = await this.oauthDao.insert(oauthData);
            return { 
                result: Boolean(result?.affected_rows), 
                id: result?.insert_id, 
                isNew: true 
            };
        }
    }

    /**
     * 绑定OAuth账号到系统用户
     * @param userId 系统用户ID
     * @param provider OAuth提供商
     * @param providerUserId 提供商用户ID
     * @param oauthData OAuth数据
     * @returns 绑定结果
     */
    async bindOAuthToUser(
        userId: number, 
        provider: string, 
        providerUserId: string, 
        oauthData: Partial<OAuthAccount>
    ): Promise<any> {
        if (!userId || !provider || !providerUserId) {
            throw new Error('userId, provider, and providerUserId are required');
        }

        // 检查是否已经绑定到其他用户
        const existingOAuth = await this.oauthDao.findByProviderAndUserId(provider, providerUserId);
        if (existingOAuth && existingOAuth.user_id && existingOAuth.user_id !== userId) {
            throw new Error('This OAuth account is already bound to another user');
        }

        // 检查用户是否已经绑定了同一个提供商
        const existingBinding = await this.oauthDao.findByUserIdAndProvider(userId, provider);
        if (existingBinding) {
            throw new Error(`User already has a ${provider} account bound`);
        }

        // 创建或更新绑定
        const fullOAuthData = {
            ...oauthData,
            provider,
            provider_user_id: providerUserId,
            user_id: userId
        };

        return await this.createOrUpdateOAuthAccount(fullOAuthData);
    }

    /**
     * 解除OAuth绑定
     * @param userId 系统用户ID
     * @param provider OAuth提供商
     * @returns 解除结果
     */
    async unbindOAuthFromUser(userId: number, provider: string): Promise<boolean> {
        if (!userId || !provider) {
            throw new Error('userId and provider are required');
        }

        const oauthAccount = await this.oauthDao.findByUserIdAndProvider(userId, provider);
        if (!oauthAccount) {
            throw new Error('OAuth binding not found');
        }

        // 软删除：更新状态为已撤销
        const result = await this.oauthDao.update(oauthAccount.id, { 
            status: OAuthStatus.REVOKED 
        });
        
        return Boolean(result);
    }

    /**
     * 通过OAuth登录（查找或创建用户）
     * @param provider OAuth提供商
     * @param providerUserId 提供商用户ID
     * @param unionId 跨应用统一ID（可选，主要用于微信）
     * @returns OAuth账号信息
     */
    async loginWithOAuth(
        provider: string, 
        providerUserId: string, 
        unionId?: string
    ): Promise<OAuthAccount | null> {
        if (!provider || !providerUserId) {
            return null;
        }

        // 首先根据provider和providerUserId查找
        let oauthAccount = await this.oauthDao.findActiveByProviderAndUserId(provider, providerUserId);
        
        // 如果是微信且提供了unionId，尝试根据unionId查找
        if (!oauthAccount && provider === OAuthProvider.WECHAT && unionId) {
            oauthAccount = await this.oauthDao.findByWechatUnionId(unionId);
        }

        if (!oauthAccount) {
            return null;
        }

        // 检查账号状态
        if (oauthAccount.status !== OAuthStatus.ACTIVE) {
            throw new Error('OAuth account is not active');
        }

        // 更新最后使用时间
        await this.oauthDao.update(oauthAccount.id, { 
            last_used_at: new Date() 
        });

        return oauthAccount;
    }

    /**
     * 刷新OAuth令牌
     * @param oauthAccountId OAuth账号ID
     * @param newTokenData 新的令牌数据
     * @returns 刷新结果
     */
    async refreshOAuthToken(
        oauthAccountId: any, 
        newTokenData: {
            access_token: string;
            refresh_token?: string;
            expires_at: Date;
            refresh_expires_at?: Date;
            scope?: string;
        }
    ): Promise<boolean> {
        if (!oauthAccountId || !newTokenData.access_token) {
            throw new Error('oauthAccountId and access_token are required');
        }

        const updateData: any = {
            access_token: newTokenData.access_token,
            expires_at: newTokenData.expires_at,
            scope: newTokenData.scope,
            last_used_at: new Date()
        };

        // 如果提供了新的刷新令牌，也一起更新
        if (newTokenData.refresh_token) {
            updateData.refresh_token = newTokenData.refresh_token;
            updateData.refresh_expires_at = newTokenData.refresh_expires_at;
        }

        const result = await this.oauthDao.update(oauthAccountId, updateData);
        return Boolean(result);
    }

    /**
     * 撤销OAuth令牌
     * @param oauthAccountId OAuth账号ID
     * @returns 撤销结果
     */
    async revokeOAuthToken(oauthAccountId: any): Promise<boolean> {
        if (!oauthAccountId) {
            throw new Error('oauthAccountId is required');
        }

        const result = await this.oauthDao.update(oauthAccountId, { 
            status: OAuthStatus.REVOKED,
            access_token: undefined,
            refresh_token: undefined
        });
        
        return Boolean(result);
    }

    /**
     * 获取用户的所有OAuth绑定
     * @param userId 系统用户ID
     * @returns OAuth绑定列表（脱敏）
     */
    async getUserOAuthBindings(userId: number): Promise<any[]> {
        if (!userId) {
            return [];
        }

        const oauthAccounts = await this.oauthDao.findByUserId(userId);
        
        // 返回脱敏后的信息
        return oauthAccounts.map(account => ({
            id: account.id,
            provider: account.provider,
            provider_user_id: account.provider_user_id,
            status: account.status,
            scope: account.scope,
            expires_at: account.expires_at,
            last_used_at: account.last_used_at,
            create_date: account.create_date
        }));
    }

    /**
     * 检查并标记过期的令牌
     * @returns 处理的记录数
     */
    async markExpiredTokens(): Promise<number> {
        const now = new Date();
        
        // 查找已过期但状态仍为active的记录
        const expiredAccounts = await this.oauthDao.list({
            conditions: {
                status: OAuthStatus.ACTIVE,
                expires_at: { '$lt': now }
            }
        });

        let count = 0;
        for (const account of expiredAccounts) {
            const result = await this.oauthDao.update(account.id, { 
                status: OAuthStatus.EXPIRED 
            });
            if (result) count++;
        }

        return count;
    }

    /**
     * 清理长时间未使用的OAuth绑定
     * @param daysUnused 未使用天数阈值
     * @returns 清理的记录数
     */
    async cleanupUnusedOAuthAccounts(daysUnused: number = 90): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysUnused);

        const unusedAccounts = await this.oauthDao.list({
            conditions: {
                status: OAuthStatus.ACTIVE,
                last_used_at: { '$lt': cutoffDate }
            }
        });

        let count = 0;
        for (const account of unusedAccounts) {
            const result = await this.oauthDao.update(account.id, { 
                status: OAuthStatus.EXPIRED 
            });
            if (result) count++;
        }

        return count;
    }

    /**
     * 获取需要刷新的令牌列表
     * @param beforeMinutes 多少分钟后过期
     * @returns 需要刷新的OAuth账号列表
     */
    async getTokensNeedingRefresh(beforeMinutes: number = 30): Promise<OAuthAccount[]> {
        return await this.oauthDao.findTokensExpiringBefore(beforeMinutes);
    }

    /**
     * 验证OAuth提供商是否支持
     * @param provider OAuth提供商
     * @returns 是否支持
     */
    static isSupportedProvider(provider: string): boolean {
        return Object.values(OAuthProvider).includes(provider as OAuthProvider);
    }

    /**
     * 获取支持的OAuth提供商列表
     * @returns 提供商列表
     */
    static getSupportedProviders(): string[] {
        return Object.values(OAuthProvider);
    }
}

// 导出类和实例
export { OAuthAccountDao, OAuthService };
export const oauthService = new OAuthService();
