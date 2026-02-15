# Access Token 服务使用指南

本文档介绍如何使用 Access Token 服务进行 RESTful API 的接口认证。

## 功能特性

- ✅ **JWT + Redis** 双重验证机制
- ✅ **Access Token** 和 **Refresh Token** 管理
- ✅ **自动过期处理** 和令牌撤销
- ✅ **多设备登录** 支持
- ✅ **安全的令牌存储** 在 Redis 中
- ✅ **中间件支持** 简化接口保护

## 快速开始

### 1. 安装依赖

```bash
npm install redis  # Redis客户端
```

### 2. 环境变量配置

```bash
# .env 文件
JWT_SECRET=your-super-secret-jwt-key-here
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

### 3. 初始化服务

```typescript
import { initializeAccessTokenService, registerAccessTokenRoutes } from './access_token_routes';

// 应用启动时初始化
initializeAccessTokenService({
    secretKey: process.env.JWT_SECRET,
    accessTokenTTL: 2 * 60 * 60,      // 2小时
    refreshTokenTTL: 7 * 24 * 60 * 60  // 7天
});

// 注册路由
await registerAccessTokenRoutes(fastify);
```

## API 接口

### 1. 用户登录

**POST** `/auth/login`

**请求体：**
```json
{
    "identifier": "admin",
    "password": "password123"
}
```

**响应：**
```json
{
    "success": true,
    "data": {
        "message": "Login successful",
        "user": {
            "id": "12345",
            "username": "admin",
            "email_masked": "a***@example.com",
            "phone_masked": "138****5678",
            "avatar": "https://example.com/avatar.jpg",
            "status": 1
        },
        "token": {
            "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "refreshToken": "abc123def456...",
            "tokenType": "Bearer",
            "expiresIn": 7200,
            "expiresAt": 1692750000000
        }
    }
}
```

### 2. 刷新令牌

**POST** `/auth/refresh`

**请求体：**
```json
{
    "refreshToken": "abc123def456..."
}
```

**响应：**
```json
{
    "success": true,
    "data": {
        "message": "Token refreshed successfully",
        "token": {
            "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "refreshToken": "new_refresh_token...",
            "tokenType": "Bearer",
            "expiresIn": 7200,
            "expiresAt": 1692750000000
        }
    }
}
```

### 3. 用户登出

**POST** `/auth/logout`

**请求头：**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应：**
```json
{
    "success": true,
    "data": {
        "message": "Logout successful"
    }
}
```

### 4. 登出所有设备

**POST** `/auth/logout-all`

**请求头：**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应：**
```json
{
    "success": true,
    "data": {
        "message": "All tokens revoked successfully",
        "revokedCount": 3
    }
}
```

### 5. 获取活跃令牌列表

**GET** `/auth/tokens`

**响应：**
```json
{
    "success": true,
    "data": {
        "tokens": [
            {
                "tokenId": "abc123",
                "createdAt": 1692750000,
                "expiresAt": 1692757200,
                "accessToken": "***masked***",
                "refreshToken": "***masked***"
            }
        ],
        "count": 1
    }
}
```

### 6. 验证令牌

**GET** `/auth/verify`

**响应：**
```json
{
    "success": true,
    "data": {
        "message": "Token is valid",
        "user": {
            "userId": "12345",
            "tokenId": "abc123",
            "iat": 1692750000,
            "exp": 1692757200
        }
    }
}
```

### 7. 健康检查

**GET** `/auth/health`

**响应：**
```json
{
    "success": true,
    "data": {
        "status": "healthy",
        "redis": true,
        "config": {
            "accessTokenTTL": 7200,
            "refreshTokenTTL": 604800,
            "issuer": "nuwa-auth-service",
            "audience": "nuwa-api"
        }
    }
}
```

## 中间件使用

### 1. 必需认证中间件

```typescript
import { authMiddleware } from './access_token_routes';

// 保护需要登录的接口
fastify.get('/api/profile', { preHandler: [authMiddleware] }, async (request, reply) => {
    const userInfo = (request as any).user;
    
    return reply.send({
        success: true,
        data: {
            userId: userInfo.userId,
            message: 'This is a protected route'
        }
    });
});
```

### 2. 可选认证中间件

```typescript
import { optionalAuthMiddleware } from './access_token_routes';

// 可选登录的接口（有登录状态时显示更多信息）
fastify.get('/api/posts', { preHandler: [optionalAuthMiddleware] }, async (request, reply) => {
    const userInfo = (request as any).user;
    
    const posts = await getPublicPosts();
    
    if (userInfo) {
        // 登录用户可以看到更多信息
        posts.forEach(post => {
            post.canEdit = post.authorId === userInfo.userId;
        });
    }
    
    return reply.send({ success: true, data: posts });
});
```

### 3. 管理员权限中间件

```typescript
import { authMiddleware, adminMiddleware } from './access_token_routes';

// 需要管理员权限的接口
fastify.get('/api/admin/users', { 
    preHandler: [authMiddleware, adminMiddleware] 
}, async (request, reply) => {
    const userDetail = (request as any).userDetail;
    
    return reply.send({
        success: true,
        data: {
            message: `Hello Admin: ${userDetail.username}`,
            users: await getAllUsers()
        }
    });
});
```

## 前端集成示例

### JavaScript/TypeScript

```javascript
class AuthClient {
    constructor(baseURL = 'http://localhost:3000') {
        this.baseURL = baseURL;
        this.accessToken = localStorage.getItem('accessToken');
        this.refreshToken = localStorage.getItem('refreshToken');
    }

    // 登录
    async login(identifier, password) {
        const response = await fetch(`${this.baseURL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ identifier, password })
        });

        const data = await response.json();
        
        if (data.success) {
            this.accessToken = data.data.token.accessToken;
            this.refreshToken = data.data.token.refreshToken;
            
            localStorage.setItem('accessToken', this.accessToken);
            localStorage.setItem('refreshToken', this.refreshToken);
            
            return data.data.user;
        }
        
        throw new Error(data.message);
    }

    // 刷新令牌
    async refreshAccessToken() {
        if (!this.refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await fetch(`${this.baseURL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refreshToken: this.refreshToken })
        });

        const data = await response.json();
        
        if (data.success) {
            this.accessToken = data.data.token.accessToken;
            this.refreshToken = data.data.token.refreshToken;
            
            localStorage.setItem('accessToken', this.accessToken);
            localStorage.setItem('refreshToken', this.refreshToken);
            
            return data.data.token;
        }
        
        throw new Error(data.message);
    }

    // 带认证的请求
    async request(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.accessToken) {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
        }

        let response = await fetch(`${this.baseURL}${url}`, {
            ...options,
            headers
        });

        // 如果 token 过期，尝试刷新
        if (response.status === 401 && this.refreshToken) {
            try {
                await this.refreshAccessToken();
                
                // 重新发起请求
                headers['Authorization'] = `Bearer ${this.accessToken}`;
                response = await fetch(`${this.baseURL}${url}`, {
                    ...options,
                    headers
                });
            } catch (error) {
                // 刷新失败，清除本地存储
                this.logout();
                throw new Error('Authentication failed');
            }
        }

        return response.json();
    }

    // 登出
    async logout() {
        if (this.accessToken) {
            try {
                await fetch(`${this.baseURL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                });
            } catch (error) {
                console.error('Logout request failed:', error);
            }
        }

        this.accessToken = null;
        this.refreshToken = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }

    // 检查是否已登录
    isAuthenticated() {
        return !!this.accessToken;
    }
}

// 使用示例
const authClient = new AuthClient();

// 登录
authClient.login('admin', 'password123')
    .then(user => {
        console.log('登录成功:', user);
    })
    .catch(error => {
        console.error('登录失败:', error);
    });

// 调用受保护的 API
authClient.request('/api/profile')
    .then(data => {
        console.log('用户资料:', data);
    })
    .catch(error => {
        console.error('请求失败:', error);
    });
```

## 定时任务

### 清理过期令牌

```typescript
import { cleanupExpiredTokens } from './access_token_routes';

// 使用 node-cron 或其他定时任务库
const cron = require('node-cron');

// 每小时清理一次过期令牌
cron.schedule('0 * * * *', async () => {
    try {
        const cleanedCount = await cleanupExpiredTokens();
        console.log(`Cleaned up ${cleanedCount} expired tokens`);
    } catch (error) {
        console.error('Token cleanup failed:', error);
    }
});
```

## 配置建议

### 生产环境配置

```typescript
initializeAccessTokenService({
    secretKey: process.env.JWT_SECRET, // 必须设置强密钥
    accessTokenTTL: 30 * 60,          // 30分钟（较短）
    refreshTokenTTL: 7 * 24 * 60 * 60 // 7天
});
```

### 开发环境配置

```typescript
initializeAccessTokenService({
    secretKey: 'dev-secret-key',
    accessTokenTTL: 24 * 60 * 60,     // 24小时（便于调试）
    refreshTokenTTL: 30 * 24 * 60 * 60 // 30天
});
```

## 安全建议

1. **JWT 密钥**：使用足够长且复杂的密钥
2. **HTTPS**：生产环境必须使用 HTTPS
3. **Token 存储**：前端避免存储在 localStorage，考虑使用 httpOnly Cookie
4. **定期轮换**：定期更换 JWT 密钥
5. **监控异常**：监控异常登录和令牌使用模式

## 故障排查

### 常见问题

1. **Redis 连接失败**
   - 检查 Redis 服务是否启动
   - 验证连接配置是否正确

2. **Token 验证失败**
   - 检查 JWT 密钥是否一致
   - 确认 Token 格式正确

3. **Token 过期**
   - 使用 Refresh Token 刷新
   - 检查系统时间是否同步

---

更多详细信息请参考源码注释和接口文档。
