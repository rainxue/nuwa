import axios, { AxiosResponse } from 'axios';
import { oauthService, OAuthAccount, OAuthProvider } from './oauth_service';

/**
 * 微信OAuth配置接口
 */
export interface WechatOAuthConfig {
    appId: string;           // 微信应用ID
    appSecret: string;       // 微信应用密钥
    redirectUri: string;     // 回调地址
    scope?: string;          // 授权范围，默认为 snsapi_userinfo
}

/**
 * 微信用户信息接口
 */
export interface WechatUserInfo {
    openid: string;          // 用户的唯一标识
    nickname: string;        // 用户昵称
    sex: number;            // 用户的性别，值为1时是男性，值为2时是女性，值为0时是未知
    province: string;        // 用户个人资料填写的省份
    city: string;           // 普通用户个人资料填写的城市
    country: string;        // 国家，如中国为CN
    headimgurl: string;     // 用户头像，最后一个数值代表正方形头像大小
    privilege: string[];    // 用户特权信息，json 数组
    unionid?: string;       // 只有在用户将公众号绑定到微信开放平台帐号后，才会出现该字段
}

/**
 * 微信访问令牌响应接口
 */
export interface WechatAccessTokenResponse {
    access_token: string;    // 网页授权接口调用凭证
    expires_in: number;      // access_token接口调用凭证超时时间，单位（秒）
    refresh_token: string;   // 用户刷新access_token
    openid: string;         // 用户唯一标识
    scope: string;          // 用户授权的作用域
    unionid?: string;       // 当且仅当该网站应用已获得该用户的userinfo授权时，才会出现该字段
}

/**
 * 微信刷新令牌响应接口
 */
export interface WechatRefreshTokenResponse {
    access_token: string;    // 网页授权接口调用凭证
    expires_in: number;      // access_token接口调用凭证超时时间，单位（秒）
    refresh_token: string;   // 用户刷新access_token
    openid: string;         // 用户唯一标识
    scope: string;          // 用户授权的作用域
}

/**
 * 微信OAuth错误响应接口
 */
export interface WechatErrorResponse {
    errcode: number;
    errmsg: string;
}

/**
 * 微信OAuth服务类
 */
export class WechatOAuthService {
    private config: WechatOAuthConfig;
    
    // 微信OAuth相关API地址
    private static readonly WECHAT_OAUTH_BASE_URL = 'https://api.weixin.qq.com/sns';
    private static readonly WECHAT_OAUTH_AUTHORIZE_URL = 'https://open.weixin.qq.com/connect/oauth2/authorize';
    private static readonly WECHAT_QRCONNECT_URL = 'https://open.weixin.qq.com/connect/qrconnect';

    constructor(config: WechatOAuthConfig) {
        this.validateConfig(config);
        this.config = {
            ...config,
            scope: config.scope || 'snsapi_userinfo'
        };
    }

    /**
     * 验证配置参数
     */
    private validateConfig(config: WechatOAuthConfig): void {
        if (!config.appId) {
            throw new Error('WeChat appId is required');
        }
        if (!config.appSecret) {
            throw new Error('WeChat appSecret is required');
        }
        if (!config.redirectUri) {
            throw new Error('WeChat redirectUri is required');
        }
    }

    /**
     * 生成微信OAuth授权URL（适用于微信内浏览器）
     * @param state 自定义参数，用于防止CSRF攻击
     * @returns 授权URL
     */
    getAuthorizationUrl(state?: string): string {
        const params = new URLSearchParams({
            appid: this.config.appId,
            redirect_uri: this.config.redirectUri,
            response_type: 'code',
            scope: this.config.scope!,
            state: state || this.generateState()
        });

        return `${WechatOAuthService.WECHAT_OAUTH_AUTHORIZE_URL}?${params.toString()}#wechat_redirect`;
    }

    /**
     * 生成微信网站应用扫码登录URL（适用于PC端）
     * @param state 自定义参数
     * @returns 扫码登录URL
     */
    getQRConnectUrl(state?: string): string {
        const params = new URLSearchParams({
            appid: this.config.appId,
            redirect_uri: this.config.redirectUri,
            response_type: 'code',
            scope: 'snsapi_login',
            state: state || this.generateState()
        });

        return `${WechatOAuthService.WECHAT_QRCONNECT_URL}?${params.toString()}#wechat_redirect`;
    }

    /**
     * 生成随机state参数
     */
    private generateState(): string {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }

    /**
     * 使用授权码获取访问令牌
     * @param code 微信回调返回的授权码
     * @returns 访问令牌信息
     */
    async getAccessToken(code: string): Promise<WechatAccessTokenResponse> {
        if (!code) {
            throw new Error('Authorization code is required');
        }

        const url = `${WechatOAuthService.WECHAT_OAUTH_BASE_URL}/oauth2/access_token`;
        const params = {
            appid: this.config.appId,
            secret: this.config.appSecret,
            code: code,
            grant_type: 'authorization_code'
        };

        try {
            const response: AxiosResponse<WechatAccessTokenResponse | WechatErrorResponse> = 
                await axios.get(url, { params });

            if (this.isErrorResponse(response.data)) {
                throw new Error(`WeChat API Error: ${response.data.errcode} - ${response.data.errmsg}`);
            }

            return response.data as WechatAccessTokenResponse;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Failed to get WeChat access token: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * 刷新访问令牌
     * @param refreshToken 刷新令牌
     * @returns 新的访问令牌信息
     */
    async refreshAccessToken(refreshToken: string): Promise<WechatRefreshTokenResponse> {
        if (!refreshToken) {
            throw new Error('Refresh token is required');
        }

        const url = `${WechatOAuthService.WECHAT_OAUTH_BASE_URL}/oauth2/refresh_token`;
        const params = {
            appid: this.config.appId,
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        };

        try {
            const response: AxiosResponse<WechatRefreshTokenResponse | WechatErrorResponse> = 
                await axios.get(url, { params });

            if (this.isErrorResponse(response.data)) {
                throw new Error(`WeChat API Error: ${response.data.errcode} - ${response.data.errmsg}`);
            }

            return response.data as WechatRefreshTokenResponse;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Failed to refresh WeChat access token: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * 验证访问令牌是否有效
     * @param accessToken 访问令牌
     * @param openid 用户openid
     * @returns 是否有效
     */
    async validateAccessToken(accessToken: string, openid: string): Promise<boolean> {
        if (!accessToken || !openid) {
            return false;
        }

        const url = `${WechatOAuthService.WECHAT_OAUTH_BASE_URL}/auth`;
        const params = {
            access_token: accessToken,
            openid: openid
        };

        try {
            const response: AxiosResponse<WechatErrorResponse> = 
                await axios.get(url, { params });

            // 如果errcode为0，表示访问令牌有效
            return response.data.errcode === 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * 获取用户信息
     * @param accessToken 访问令牌
     * @param openid 用户openid
     * @param lang 语言版本，默认为zh_CN
     * @returns 用户信息
     */
    async getUserInfo(accessToken: string, openid: string, lang: string = 'zh_CN'): Promise<WechatUserInfo> {
        if (!accessToken || !openid) {
            throw new Error('Access token and openid are required');
        }

        const url = `${WechatOAuthService.WECHAT_OAUTH_BASE_URL}/userinfo`;
        const params = {
            access_token: accessToken,
            openid: openid,
            lang: lang
        };

        try {
            const response: AxiosResponse<WechatUserInfo | WechatErrorResponse> = 
                await axios.get(url, { params });

            if (this.isErrorResponse(response.data)) {
                throw new Error(`WeChat API Error: ${response.data.errcode} - ${response.data.errmsg}`);
            }

            return response.data as WechatUserInfo;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Failed to get WeChat user info: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * 完整的微信OAuth登录流程
     * @param code 授权码
     * @param userId 系统用户ID（可选，用于绑定现有用户）
     * @returns OAuth账号信息和用户信息
     */
    async completeOAuthLogin(code: string, userId?: number): Promise<{
        oauthAccount: OAuthAccount;
        userInfo: WechatUserInfo;
        isNewBinding: boolean;
    }> {
        // 1. 获取访问令牌
        const tokenData = await this.getAccessToken(code);

        // 2. 获取用户信息
        const userInfo = await this.getUserInfo(tokenData.access_token, tokenData.openid);

        // 3. 计算令牌过期时间
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

        // 4. 准备OAuth账号数据
        const oauthData: Partial<OAuthAccount> = {
            provider: OAuthProvider.WECHAT,
            provider_user_id: tokenData.openid,
            union_id: tokenData.unionid || userInfo.unionid,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            token_type: 'Bearer',
            scope: tokenData.scope,
            expires_at: expiresAt,
            raw_user_info: JSON.stringify(userInfo),
            user_id: userId
        };

        // 5. 创建或更新OAuth绑定
        let result;
        if (userId) {
            // 绑定到指定用户
            result = await oauthService.bindOAuthToUser(
                userId,
                OAuthProvider.WECHAT,
                tokenData.openid,
                oauthData
            );
        } else {
            // 创建或更新OAuth账号
            result = await oauthService.createOrUpdateOAuthAccount(oauthData);
        }

        // 6. 获取完整的OAuth账号信息
        const oauthAccount = await oauthService.get(result.id);

        return {
            oauthAccount,
            userInfo,
            isNewBinding: result.isNew
        };
    }

    /**
     * 刷新微信OAuth令牌
     * @param oauthAccountId OAuth账号ID
     * @returns 刷新结果
     */
    async refreshOAuthToken(oauthAccountId: any): Promise<boolean> {
        // 1. 获取OAuth账号信息
        const oauthAccount = await oauthService.get(oauthAccountId);
        if (!oauthAccount) {
            throw new Error('OAuth account not found');
        }

        if (oauthAccount.provider !== OAuthProvider.WECHAT) {
            throw new Error('Not a WeChat OAuth account');
        }

        // 2. 解密刷新令牌
        const refreshToken = await this.getDecryptedRefreshToken(oauthAccount);
        if (!refreshToken) {
            throw new Error('Refresh token not available');
        }

        try {
            // 3. 调用微信API刷新令牌
            const newTokenData = await this.refreshAccessToken(refreshToken);

            // 4. 计算新的过期时间
            const expiresAt = new Date();
            expiresAt.setSeconds(expiresAt.getSeconds() + newTokenData.expires_in);

            // 5. 更新OAuth账号
            return await oauthService.refreshOAuthToken(oauthAccountId, {
                access_token: newTokenData.access_token,
                refresh_token: newTokenData.refresh_token,
                expires_at: expiresAt,
                scope: newTokenData.scope
            });
        } catch (error) {
            console.error('Failed to refresh WeChat token:', error);
            
            // 如果刷新失败，可能是刷新令牌也过期了，标记为过期
            await oauthService.revokeOAuthToken(oauthAccountId);
            throw error;
        }
    }

    /**
     * 获取解密后的刷新令牌
     * @param oauthAccount OAuth账号
     * @returns 解密后的刷新令牌
     */
    private async getDecryptedRefreshToken(oauthAccount: OAuthAccount): Promise<string | null> {
        // 这里需要使用DAO的解密方法
        const { OAuthAccountDao } = await import('./oauth_service');
        const dao = new OAuthAccountDao();
        return dao.decryptRefreshToken(oauthAccount);
    }

    /**
     * 微信OAuth登录（查找现有绑定）
     * @param code 授权码
     * @returns OAuth账号信息，如果不存在则返回null
     */
    async loginWithCode(code: string): Promise<{
        oauthAccount: OAuthAccount | null;
        userInfo: WechatUserInfo;
        tokenData: WechatAccessTokenResponse;
    }> {
        // 1. 获取访问令牌
        const tokenData = await this.getAccessToken(code);

        // 2. 获取用户信息
        const userInfo = await this.getUserInfo(tokenData.access_token, tokenData.openid);

        // 3. 查找现有OAuth绑定
        const oauthAccount = await oauthService.loginWithOAuth(
            OAuthProvider.WECHAT,
            tokenData.openid,
            tokenData.unionid || userInfo.unionid
        );

        // 4. 如果找到绑定，更新令牌信息
        if (oauthAccount) {
            const expiresAt = new Date();
            expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

            await oauthService.refreshOAuthToken(oauthAccount.id, {
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
                expires_at: expiresAt,
                scope: tokenData.scope
            });
        }

        return {
            oauthAccount,
            userInfo,
            tokenData
        };
    }

    /**
     * 检查响应是否为错误响应
     */
    private isErrorResponse(data: any): data is WechatErrorResponse {
        return data && typeof data.errcode === 'number' && data.errcode !== 0;
    }

    /**
     * 撤销微信授权（注意：微信不提供撤销API，只能在本地标记为撤销）
     * @param oauthAccountId OAuth账号ID
     * @returns 撤销结果
     */
    async revokeAuthorization(oauthAccountId: any): Promise<boolean> {
        return await oauthService.revokeOAuthToken(oauthAccountId);
    }

    /**
     * 获取当前配置信息（敏感信息已脱敏）
     */
    getConfig(): Partial<WechatOAuthConfig> {
        return {
            appId: this.config.appId,
            redirectUri: this.config.redirectUri,
            scope: this.config.scope
        };
    }

    /**
     * 更新配置
     * @param newConfig 新配置
     */
    updateConfig(newConfig: Partial<WechatOAuthConfig>): void {
        this.config = {
            ...this.config,
            ...newConfig
        };
        this.validateConfig(this.config);
    }
}

/**
 * 微信OAuth服务工厂
 */
export class WechatOAuthServiceFactory {
    private static instances: Map<string, WechatOAuthService> = new Map();

    /**
     * 获取微信OAuth服务实例（单例模式）
     * @param appId 微信应用ID
     * @param config 配置信息
     * @returns 服务实例
     */
    static getInstance(appId: string, config?: WechatOAuthConfig): WechatOAuthService {
        if (!WechatOAuthServiceFactory.instances.has(appId)) {
            if (!config) {
                throw new Error('Config is required for first-time initialization');
            }
            WechatOAuthServiceFactory.instances.set(appId, new WechatOAuthService(config));
        }
        return WechatOAuthServiceFactory.instances.get(appId)!;
    }

    /**
     * 创建新的微信OAuth服务实例
     * @param config 配置信息
     * @returns 服务实例
     */
    static create(config: WechatOAuthConfig): WechatOAuthService {
        return new WechatOAuthService(config);
    }

    /**
     * 清理所有实例
     */
    static clear(): void {
        WechatOAuthServiceFactory.instances.clear();
    }
}

// 导出默认实例（需要在使用前配置）
export let wechatOAuthService: WechatOAuthService;

/**
 * 初始化默认微信OAuth服务
 * @param config 配置信息
 */
export function initWechatOAuthService(config: WechatOAuthConfig): void {
    wechatOAuthService = new WechatOAuthService(config);
}
