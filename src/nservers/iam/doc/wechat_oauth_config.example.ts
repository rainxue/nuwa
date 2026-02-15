/**
 * 微信OAuth配置示例
 * 
 * 使用方法：
 * 1. 复制此文件为 wechat_oauth_config.ts
 * 2. 填入你的微信应用信息
 * 3. 在应用启动时调用 initializeWechatOAuth()
 */

export interface WechatOAuthEnvConfig {
    // 微信公众号配置（用于微信内浏览器登录）
    WECHAT_MP_APP_ID?: string;          // 微信公众号AppID
    WECHAT_MP_APP_SECRET?: string;      // 微信公众号AppSecret
    WECHAT_MP_REDIRECT_URI?: string;    // 微信公众号回调地址

    // 微信开放平台配置（用于网站应用扫码登录）
    WECHAT_WEB_APP_ID?: string;         // 微信开放平台AppID
    WECHAT_WEB_APP_SECRET?: string;     // 微信开放平台AppSecret
    WECHAT_WEB_REDIRECT_URI?: string;   // 微信开放平台回调地址

    // 微信小程序配置
    WECHAT_MINI_APP_ID?: string;        // 微信小程序AppID
    WECHAT_MINI_APP_SECRET?: string;    // 微信小程序AppSecret
}

/**
 * 获取微信OAuth配置
 * @param platform 平台类型：'mp' | 'web' | 'mini'
 * @returns 配置对象
 */
export function getWechatOAuthConfig(platform: 'mp' | 'web' | 'mini' = 'mp') {
    const env = process.env as WechatOAuthEnvConfig;

    switch (platform) {
        case 'mp': // 微信公众号（微信内浏览器）
            return {
                appId: env.WECHAT_MP_APP_ID || 'your_mp_app_id',
                appSecret: env.WECHAT_MP_APP_SECRET || 'your_mp_app_secret',
                redirectUri: env.WECHAT_MP_REDIRECT_URI || 'http://localhost:3000/auth/wechat/callback',
                scope: 'snsapi_userinfo' // 获取用户基本信息
            };

        case 'web': // 微信开放平台（网站应用）
            return {
                appId: env.WECHAT_WEB_APP_ID || 'your_web_app_id',
                appSecret: env.WECHAT_WEB_APP_SECRET || 'your_web_app_secret',
                redirectUri: env.WECHAT_WEB_REDIRECT_URI || 'http://localhost:3000/auth/wechat/web/callback',
                scope: 'snsapi_login' // 网站应用扫码登录
            };

        case 'mini': // 微信小程序
            return {
                appId: env.WECHAT_MINI_APP_ID || 'your_mini_app_id',
                appSecret: env.WECHAT_MINI_APP_SECRET || 'your_mini_app_secret',
                redirectUri: '', // 小程序不需要回调地址
                scope: '' // 小程序有自己的授权机制
            };

        default:
            throw new Error(`Unsupported platform: ${platform}`);
    }
}

/**
 * 环境变量配置示例（.env 文件）
 * 
 * # 微信公众号配置
 * WECHAT_MP_APP_ID=wx1234567890abcdef
 * WECHAT_MP_APP_SECRET=abcdef1234567890abcdef1234567890
 * WECHAT_MP_REDIRECT_URI=https://yourdomain.com/auth/wechat/callback
 * 
 * # 微信开放平台配置
 * WECHAT_WEB_APP_ID=wx0987654321fedcba
 * WECHAT_WEB_APP_SECRET=fedcba0987654321fedcba0987654321
 * WECHAT_WEB_REDIRECT_URI=https://yourdomain.com/auth/wechat/web/callback
 * 
 * # 微信小程序配置
 * WECHAT_MINI_APP_ID=wxabcdef1234567890
 * WECHAT_MINI_APP_SECRET=1234567890abcdef1234567890abcdef
 */

/**
 * 生产环境安全配置建议
 */
export const securityRecommendations = {
    // 1. 使用HTTPS回调地址
    redirectUri: 'https://yourdomain.com/auth/wechat/callback',
    
    // 2. 验证回调域名白名单
    allowedDomains: [
        'yourdomain.com',
        'www.yourdomain.com'
    ],
    
    // 3. State参数配置（防CSRF攻击）
    stateConfig: {
        length: 32,
        includeTimestamp: true,
        expireMinutes: 10
    },
    
    // 4. 令牌存储配置
    tokenStorage: {
        encrypt: true,
        ttl: 7200, // 2小时
        refreshThreshold: 1800 // 30分钟前刷新
    }
};

/**
 * 微信OAuth申请流程说明
 * 
 * 1. 微信公众号OAuth:
 *    - 登录微信公众平台 (https://mp.weixin.qq.com/)
 *    - 开发 -> 接口权限 -> 网页服务 -> 网页帐号 -> 网页授权获取用户基本信息
 *    - 设置授权回调页面域名
 * 
 * 2. 微信开放平台OAuth:
 *    - 登录微信开放平台 (https://open.weixin.qq.com/)
 *    - 管理中心 -> 网站应用 -> 创建网站应用
 *    - 填写应用信息，等待审核通过
 *    - 获取AppID和AppSecret
 * 
 * 3. 配置要点:
 *    - 回调域名必须与申请时填写的域名一致
 *    - 使用HTTPS确保安全
 *    - AppSecret必须保密，不能暴露在前端代码中
 *    - 定期更换AppSecret（建议每年更换一次）
 */

/**
 * 测试用配置（仅用于开发环境）
 */
export const testConfig = {
    appId: 'test_app_id',
    appSecret: 'test_app_secret',
    redirectUri: 'http://localhost:3000/auth/wechat/callback',
    scope: 'snsapi_userinfo'
};

/**
 * 生产环境检查函数
 */
export function validateProductionConfig(config: any): boolean {
    const checks = [
        config.appId && config.appId !== 'test_app_id',
        config.appSecret && config.appSecret !== 'test_app_secret',
        config.redirectUri && config.redirectUri.startsWith('https://'),
        config.redirectUri && !config.redirectUri.includes('localhost')
    ];

    return checks.every(check => check);
}
