# AI生成wechat_oauth的记录
## 🚀 主要功能特性
微信OAuth服务 (WechatOAuthService)
- ✅ 多平台支持：微信公众号、开放平台、小程序
- ✅ 完整OAuth流程：授权URL生成 → 令牌获取 → 用户信息获取
- ✅ 安全令牌管理：自动加密存储、刷新机制、过期检查
- ✅ 用户绑定管理：新用户注册、现有用户绑定、解除绑定

## API路由 (8个完整接口)
- GET /auth/wechat/authorize - 获取授权URL
- GET /auth/wechat/qrconnect - 获取扫码登录URL
- GET /auth/wechat/callback - OAuth回调处理
- POST /auth/wechat/bind - 绑定微信到现有用户
- POST /auth/wechat/register - 新用户注册+绑定
- DELETE /auth/wechat/unbind/:userId - 解除绑定
- GET /auth/wechat/bindings/:userId - 查看绑定信息
- POST /auth/wechat/refresh/:oauthAccountId - 刷新令牌

## 自动化功能
- 🔄 自动令牌刷新：监控即将过期的令牌并自动刷新
- 🧹 定时清理任务：清理过期令牌和长期未使用的绑定
- 🛡️ 安全中间件：验证微信登录状态
- 📊 完整错误处理：详细的错误信息和恢复建议

## 🔧 技术亮点
### 安全性
- 令牌加密存储（使用项目现有的 CryptoUtil）
- CSRF防护（State参数验证）
- HTTPS强制要求
- 域名白名单验证

### 兼容性
- 完美集成现有的 oauth_service.ts 通用服务
- 复用 account_service.ts 的用户管理逻辑
- 使用Fastify框架和axios HTTP客户端
- 支持TypeScript类型安全

### 可维护性
- 工厂模式支持多应用实例
- 完整的接口定义和类型声明
- 详细的JSDoc注释
- 模块化设计，易于扩展

## 📈 扩展建议
这个实现为你提供了一个坚实的基础，你可以轻松扩展支持：
- Google OAuth（类似的服务类）
- Facebook OAuth
- GitHub OAuth
- Apple Sign In
只需要按照相同的模式创建对应的服务类即可。

# 微信OAuth集成指南

本文档说明如何使用微信OAuth服务进行用户登录和账号绑定。

## 功能特性

- ✅ 微信公众号OAuth（微信内浏览器登录）
- ✅ 微信开放平台OAuth（PC端扫码登录）
- ✅ 完整的用户注册和绑定流程
- ✅ 安全的令牌加密存储
- ✅ 自动令牌刷新机制
- ✅ 用户绑定管理
- ✅ 定时清理过期令牌

## 快速开始

### 1. 安装依赖

```bash
npm install axios
```

### 2. 配置微信应用信息

复制配置文件模板：
```bash
cp src/nservers/uc/wechat_oauth_config.example.ts src/nservers/uc/wechat_oauth_config.ts
```

编辑配置文件，填入你的微信应用信息：
```typescript
// wechat_oauth_config.ts
export const wechatConfig = {
    appId: 'your_wechat_app_id',
    appSecret: 'your_wechat_app_secret',
    redirectUri: 'https://yourdomain.com/auth/wechat/callback',
    scope: 'snsapi_userinfo'
};
```

### 3. 初始化服务

在应用启动时初始化微信OAuth服务：
```typescript
import { initializeWechatOAuth } from './src/nservers/uc/wechat_oauth_routes';

// 在应用启动时调用
initializeWechatOAuth();
```

### 4. 注册路由

在Fastify应用中注册微信OAuth路由：
```typescript
import { registerWechatOAuthRoutes } from './src/nservers/uc/wechat_oauth_routes';

// 注册路由
await registerWechatOAuthRoutes(fastify);
```

## API接口说明

### 获取授权URL

**GET** `/auth/wechat/authorize`

获取微信授权URL（适用于微信内浏览器）

**查询参数：**
- `state` (可选): 自定义参数，用于防止CSRF攻击

**响应：**
```json
{
    "success": true,
    "data": {
        "authUrl": "https://open.weixin.qq.com/connect/oauth2/authorize?..."
    }
}
```

### 获取扫码登录URL

**GET** `/auth/wechat/qrconnect`

获取微信扫码登录URL（适用于PC端）

**响应：**
```json
{
    "success": true,
    "data": {
        "qrUrl": "https://open.weixin.qq.com/connect/qrconnect?..."
    }
}
```

### OAuth回调处理

**GET** `/auth/wechat/callback`

处理微信OAuth回调

**查询参数：**
- `code`: 微信返回的授权码
- `state`: 自定义参数

**响应（已绑定用户）：**
```json
{
    "success": true,
    "data": {
        "message": "Login successful",
        "userId": "12345",
        "userInfo": { ... },
        "isExistingUser": true
    }
}
```

**响应（未绑定用户）：**
```json
{
    "success": true,
    "data": {
        "message": "User not bound, registration required",
        "userInfo": { ... },
        "tokenData": { ... },
        "isExistingUser": false
    }
}
```

### 绑定微信账号

**POST** `/auth/wechat/bind`

将微信账号绑定到现有用户

**请求体：**
```json
{
    "code": "微信授权码",
    "userId": "用户ID"
}
```

**响应：**
```json
{
    "success": true,
    "data": {
        "message": "WeChat account bound successfully",
        "oauthAccountId": "OAuth账号ID",
        "userInfo": { ... },
        "isNewBinding": true
    }
}
```

### 新用户注册

**POST** `/auth/wechat/register`

新用户注册并绑定微信

**请求体：**
```json
{
    "code": "微信授权码",
    "username": "用户名（可选）",
    "email": "邮箱（可选）",
    "phone": "手机号（可选）"
}
```

### 解除绑定

**DELETE** `/auth/wechat/unbind/:userId`

解除用户的微信绑定

### 获取绑定信息

**GET** `/auth/wechat/bindings/:userId`

获取用户的微信绑定信息

### 刷新令牌

**POST** `/auth/wechat/refresh/:oauthAccountId`

手动刷新微信访问令牌

## 集成示例

### 前端集成示例

```javascript
// 1. 获取微信授权URL
async function getWechatAuthUrl() {
    const response = await fetch('/auth/wechat/authorize');
    const data = await response.json();
    
    if (data.success) {
        // 跳转到微信授权页面
        window.location.href = data.data.authUrl;
    }
}

// 2. 处理微信登录回调（在回调页面中）
async function handleWechatCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        const response = await fetch('/auth/wechat/callback?' + urlParams.toString());
        const data = await response.json();
        
        if (data.success) {
            if (data.data.isExistingUser) {
                // 登录成功，跳转到用户页面
                localStorage.setItem('userId', data.data.userId);
                window.location.href = '/dashboard';
            } else {
                // 需要注册，显示注册表单
                showRegistrationForm(data.data.userInfo, code);
            }
        }
    }
}

// 3. 用户注册
async function registerWithWechat(code, userData) {
    const response = await fetch('/auth/wechat/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            code: code,
            ...userData
        })
    });
    
    const data = await response.json();
    if (data.success) {
        localStorage.setItem('userId', data.data.userId);
        window.location.href = '/dashboard';
    }
}
```

### 小程序集成示例

```javascript
// 小程序登录
wx.login({
    success: function(res) {
        if (res.code) {
            // 发送code到后端
            wx.request({
                url: 'https://yourdomain.com/auth/wechat/mini/login',
                method: 'POST',
                data: {
                    code: res.code
                },
                success: function(response) {
                    if (response.data.success) {
                        // 登录成功处理
                        wx.setStorageSync('userId', response.data.userId);
                    }
                }
            });
        }
    }
});
```

## 定时任务配置

### 清理过期令牌

```typescript
import { cleanupExpiredWechatTokens } from './src/nservers/uc/wechat_oauth_routes';

// 每天凌晨2点执行清理
const cron = require('node-cron');
cron.schedule('0 2 * * *', async () => {
    try {
        await cleanupExpiredWechatTokens();
        console.log('WeChat token cleanup completed');
    } catch (error) {
        console.error('WeChat token cleanup failed:', error);
    }
});
```

### 自动刷新令牌

```typescript
import { autoRefreshWechatTokens } from './src/nservers/uc/wechat_oauth_routes';

// 每30分钟检查并刷新即将过期的令牌
cron.schedule('*/30 * * * *', async () => {
    try {
        await autoRefreshWechatTokens();
        console.log('WeChat token auto-refresh completed');
    } catch (error) {
        console.error('WeChat token auto-refresh failed:', error);
    }
});
```

## 安全建议

### 1. 环境变量配置

```bash
# .env 文件
WECHAT_APP_ID=wx1234567890abcdef
WECHAT_APP_SECRET=abcdef1234567890abcdef1234567890
WECHAT_REDIRECT_URI=https://yourdomain.com/auth/wechat/callback

# 加密相关
ENCRYPTION_KEY=your-32-character-encryption-key
HASH_SALT=your-hash-salt-value
```

### 2. HTTPS配置

生产环境必须使用HTTPS：
- 回调地址必须为HTTPS
- 前端页面必须为HTTPS
- API接口必须为HTTPS

### 3. 域名白名单

在微信公众平台/开放平台设置授权回调域名白名单。

### 4. State参数验证

实现State参数的生成和验证，防止CSRF攻击：

```typescript
// 生成State
function generateState(userId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36);
    return btoa(`${userId}:${timestamp}:${random}`);
}

// 验证State
function validateState(state: string, userId: string): boolean {
    try {
        const decoded = atob(state);
        const [stateUserId, timestamp] = decoded.split(':');
        
        // 验证用户ID和时间戳
        return stateUserId === userId && 
               (Date.now() - parseInt(timestamp)) < 10 * 60 * 1000; // 10分钟有效
    } catch (error) {
        return false;
    }
}
```

## 错误处理

常见错误及处理方式：

### 1. 授权码过期

```json
{
    "success": false,
    "message": "WeChat API Error: 40029 - invalid code"
}
```

**解决方案：** 重新获取授权码

### 2. 应用配置错误

```json
{
    "success": false,
    "message": "WeChat API Error: 40013 - invalid appid"
}
```

**解决方案：** 检查AppID配置是否正确

### 3. 令牌过期

```json
{
    "success": false,
    "message": "WeChat API Error: 40001 - invalid credential, access_token is invalid or not latest"
}
```

**解决方案：** 使用refresh_token刷新令牌

## 最佳实践

1. **令牌管理**
   - 定期刷新即将过期的令牌
   - 安全存储refresh_token
   - 及时清理过期令牌

2. **用户体验**
   - 提供清晰的登录流程指引
   - 处理授权失败的情况
   - 支持账号解绑功能

3. **安全性**
   - 使用HTTPS
   - 验证State参数
   - 限制回调域名
   - 定期更换AppSecret

4. **监控和日志**
   - 记录OAuth操作日志
   - 监控API调用频率
   - 设置异常告警

## 故障排查

### 检查清单

1. **配置检查**
   - [ ] AppID和AppSecret是否正确
   - [ ] 回调地址是否匹配
   - [ ] 域名是否在白名单中

2. **网络检查**
   - [ ] 服务器能否访问微信API
   - [ ] HTTPS证书是否有效
   - [ ] 防火墙是否允许访问

3. **代码检查**
   - [ ] 参数编码是否正确
   - [ ] 错误处理是否完善
   - [ ] 日志是否记录详细信息

### 调试工具

使用微信开发者工具进行调试：
- 网页调试器
- 公众号开发者工具
- 小程序开发者工具

## 更新日志

### v1.0.0
- 初始版本
- 支持微信公众号OAuth
- 支持微信开放平台OAuth
- 完整的用户绑定流程
- 自动令牌管理

---

如有问题，请查看[微信开发文档](https://developers.weixin.qq.com/)或提交Issue。
