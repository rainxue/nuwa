import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { WechatOAuthService, initWechatOAuthService, wechatOAuthService } from './wechat_oauth_service';
import { accountService } from './account_service';
import { oauthService } from './oauth_service';

/**
 * 微信OAuth路由示例
 * 展示如何在Fastify应用中集成微信OAuth登录
 */

// 初始化微信OAuth服务（应该在应用启动时调用）
export function initializeWechatOAuth() {
    const config = {
        appId: process.env.WECHAT_APP_ID || 'your_wechat_app_id',
        appSecret: process.env.WECHAT_APP_SECRET || 'your_wechat_app_secret', 
        redirectUri: process.env.WECHAT_REDIRECT_URI || 'http://localhost:3000/auth/wechat/callback',
        scope: 'snsapi_userinfo' // 或 'snsapi_login' 用于网站应用
    };
    
    initWechatOAuthService(config);
}

/**
 * 注册微信OAuth相关路由
 */
export async function registerWechatOAuthRoutes(fastify: FastifyInstance) {
    // 1. 获取微信授权URL（微信内浏览器）
    fastify.get('/auth/wechat/authorize', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { state } = request.query as { state?: string };
            const authUrl = wechatOAuthService.getAuthorizationUrl(state);
            
            return reply.send({
                success: true,
                data: {
                    authUrl: authUrl
                }
            });
        } catch (error) {
            return reply.code(500).send({
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    // 2. 获取微信扫码登录URL（PC端）
    fastify.get('/auth/wechat/qrconnect', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { state } = request.query as { state?: string };
            const qrUrl = wechatOAuthService.getQRConnectUrl(state);
            
            return reply.send({
                success: true,
                data: {
                    qrUrl: qrUrl
                }
            });
        } catch (error) {
            return reply.code(500).send({
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    // 3. 微信OAuth回调处理
    fastify.get('/auth/wechat/callback', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { code, state } = request.query as { code?: string; state?: string };
            
            if (!code) {
                return reply.code(400).send({
                    success: false,
                    message: 'Authorization code is missing'
                });
            }

            // 执行OAuth登录流程
            const loginResult = await wechatOAuthService.loginWithCode(code);
            
            if (loginResult.oauthAccount) {
                // 用户已绑定，直接登录成功
                return reply.send({
                    success: true,
                    data: {
                        message: 'Login successful',
                        userId: loginResult.oauthAccount.user_id,
                        userInfo: loginResult.userInfo,
                        isExistingUser: true
                    }
                });
            } else {
                // 用户未绑定，需要注册或绑定现有账号
                return reply.send({
                    success: true,
                    data: {
                        message: 'User not bound, registration required',
                        userInfo: loginResult.userInfo,
                        tokenData: {
                            openid: loginResult.tokenData.openid,
                            unionid: loginResult.tokenData.unionid
                        },
                        isExistingUser: false
                    }
                });
            }
        } catch (error) {
            return reply.code(500).send({
                success: false,
                message: error instanceof Error ? error.message : 'OAuth callback failed'
            });
        }
    });

    // 4. 绑定微信账号到现有用户
    fastify.post('/auth/wechat/bind', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { code, userId } = request.body as { code: string; userId: number };
            
            if (!code || !userId) {
                return reply.code(400).send({
                    success: false,
                    message: 'Code and userId are required'
                });
            }

            // 验证用户是否存在
            const user = await accountService.get(userId);
            if (!user) {
                return reply.code(404).send({
                    success: false,
                    message: 'User not found'
                });
            }

            // 执行绑定流程
            const bindResult = await wechatOAuthService.completeOAuthLogin(code, userId);
            
            return reply.send({
                success: true,
                data: {
                    message: 'WeChat account bound successfully',
                    oauthAccountId: bindResult.oauthAccount.id,
                    userInfo: bindResult.userInfo,
                    isNewBinding: bindResult.isNewBinding
                }
            });
        } catch (error) {
            return reply.code(500).send({
                success: false,
                message: error instanceof Error ? error.message : 'Binding failed'
            });
        }
    });

    // 5. 新用户注册并绑定微信
    fastify.post('/auth/wechat/register', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { code, username, email, phone } = request.body as {
                code: string;
                username?: string;
                email?: string;
                phone?: string;
            };
            
            if (!code) {
                return reply.code(400).send({
                    success: false,
                    message: 'Authorization code is required'
                });
            }

            // 先获取微信用户信息
            const tokenData = await wechatOAuthService.getAccessToken(code);
            const userInfo = await wechatOAuthService.getUserInfo(tokenData.access_token, tokenData.openid);

            // 创建系统用户账号
            const accountData = {
                username: username || userInfo.nickname,
                email: email,
                phone: phone,
                avatar: userInfo.headimgurl
            };

            const createResult = await accountService.createAccount(accountData);
            if (!createResult || !createResult.insert_id) {
                throw new Error('Failed to create user account');
            }

            // 绑定微信账号
            const bindResult = await wechatOAuthService.completeOAuthLogin(code, createResult.insert_id);

            return reply.send({
                success: true,
                data: {
                    message: 'Registration and WeChat binding successful',
                    userId: createResult.insert_id,
                    oauthAccountId: bindResult.oauthAccount.id,
                    userInfo: bindResult.userInfo
                }
            });
        } catch (error) {
            return reply.code(500).send({
                success: false,
                message: error instanceof Error ? error.message : 'Registration failed'
            });
        }
    });

    // 6. 解除微信绑定
    fastify.delete('/auth/wechat/unbind/:userId', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { userId } = request.params as { userId: string };
            
            if (!userId) {
                return reply.code(400).send({
                    success: false,
                    message: 'User ID is required'
                });
            }

            const result = await wechatOAuthService.revokeAuthorization(userId);
            
            return reply.send({
                success: true,
                data: {
                    message: 'WeChat account unbound successfully',
                    result: result
                }
            });
        } catch (error) {
            return reply.code(500).send({
                success: false,
                message: error instanceof Error ? error.message : 'Unbinding failed'
            });
        }
    });

    // 7. 获取用户的微信绑定信息
    fastify.get('/auth/wechat/bindings/:userId', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { userId } = request.params as { userId: number };
            
            if (!userId) {
                return reply.code(400).send({
                    success: false,
                    message: 'User ID is required'
                });
            }

            const bindings = await oauthService.getUserOAuthBindings(userId);
            const wechatBindings = bindings.filter((binding: any) => binding.provider === 'wechat');
            
            return reply.send({
                success: true,
                data: {
                    bindings: wechatBindings
                }
            });
        } catch (error) {
            return reply.code(500).send({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get bindings'
            });
        }
    });

    // 8. 刷新微信访问令牌
    fastify.post('/auth/wechat/refresh/:oauthAccountId', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { oauthAccountId } = request.params as { oauthAccountId: number };
            
            if (!oauthAccountId) {
                return reply.code(400).send({
                    success: false,
                    message: 'OAuth account ID is required'
                });
            }

            const result = await wechatOAuthService.refreshOAuthToken(oauthAccountId);
            
            return reply.send({
                success: true,
                data: {
                    message: 'Token refreshed successfully',
                    result: result
                }
            });
        } catch (error) {
            return reply.code(500).send({
                success: false,
                message: error instanceof Error ? error.message : 'Token refresh failed'
            });
        }
    });
}

/**
 * 微信OAuth中间件示例
 * 用于保护需要微信登录的路由
 */
export async function wechatAuthMiddleware(request: FastifyRequest, reply: FastifyReply) {
    try {
        // 从请求头或会话中获取用户信息
        const userId = request.headers['x-user-id'] as number | undefined;
        
        if (!userId) {
            return reply.code(401).send({
                success: false,
                message: 'Authentication required'
            });
        }

        // 验证用户是否有有效的微信绑定
        const bindings = await oauthService.getUserOAuthBindings(userId);
        const wechatBinding = bindings.find((binding: any) =>
            binding.provider === 'wechat' && binding.status === 'active'
        );

        if (!wechatBinding) {
            return reply.code(401).send({
                success: false,
                message: 'WeChat authentication required'
            });
        }

        // 将用户信息添加到请求上下文
        (request as any).user = { userId, wechatBinding };
    } catch (error) {
        return reply.code(500).send({
            success: false,
            message: 'Authentication check failed'
        });
    }
}

/**
 * 定时任务：清理过期的微信令牌
 */
export async function cleanupExpiredWechatTokens() {
    try {
        console.log('Starting WeChat token cleanup...');
        
        // 标记过期的令牌
        const expiredCount = await oauthService.markExpiredTokens();
        console.log(`Marked ${expiredCount} expired WeChat tokens`);
        
        // 清理90天未使用的绑定
        const cleanedCount = await oauthService.cleanupUnusedOAuthAccounts(90);
        console.log(`Cleaned up ${cleanedCount} unused WeChat bindings`);
        
        return { expiredCount, cleanedCount };
    } catch (error) {
        console.error('WeChat token cleanup failed:', error);
        throw error;
    }
}

/**
 * 定时任务：自动刷新即将过期的微信令牌
 */
export async function autoRefreshWechatTokens() {
    try {
        console.log('Starting WeChat token auto-refresh...');
        
        // 获取30分钟内过期的令牌
        const tokensToRefresh = await oauthService.getTokensNeedingRefresh(30);
        console.log(`Found ${tokensToRefresh.length} WeChat tokens needing refresh`);
        
        let successCount = 0;
        let failureCount = 0;
        
        for (const token of tokensToRefresh) {
            try {
                await wechatOAuthService.refreshOAuthToken(token.id);
                successCount++;
            } catch (error) {
                console.error(`Failed to refresh token ${token.id}:`, error);
                failureCount++;
            }
        }
        
        console.log(`WeChat token refresh completed: ${successCount} success, ${failureCount} failures`);
        return { successCount, failureCount };
    } catch (error) {
        console.error('WeChat token auto-refresh failed:', error);
        throw error;
    }
}
