# JWT Token 管理设计方案对比

## 方案一：纯无状态 JWT（当前默认方案）

### 特点
- 完全遵循 JWT 无状态设计
- 不提供撤销功能
- 性能最优

### 代码实现
```typescript
/**
 * 纯无状态验证（推荐用于高性能场景）
 */
async verifyAccessTokenStateless(token: string): Promise<ParsedToken | null> {
    try {
        // 只做 JWT 解析和签名验证
        const decoded = this.verifyJWT(token);
        if (!decoded) return null;

        // 检查过期时间
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp < now) return null;

        return decoded;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}
```

### 适用场景
- 高并发API服务
- 微服务架构
- 对性能要求极高的场景
- 可以接受Token无法撤销的业务

### 安全策略
- 设置较短的过期时间（如15-30分钟）
- 依赖 Refresh Token 轮换
- 通过密钥轮换实现全局撤销

---

## 方案二：黑名单模式（当前可选方案）

### 特点
- 保持 JWT 无状态优势
- 提供必要的撤销能力
- 性能适中

### 代码实现
```typescript
/**
 * 带撤销检查的验证（当前实现）
 */
async verifyAccessTokenWithRevocation(token: string): Promise<ParsedToken | null> {
    try {
        // JWT 解析（无状态）
        const decoded = this.verifyJWT(token);
        if (!decoded) return null;

        // 检查黑名单（有状态检查）
        const isRevoked = await this.isTokenRevoked(decoded.jti);
        if (isRevoked) return null;

        // 检查过期时间
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp < now) return null;

        return decoded;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}
```

### 适用场景
- 需要即时撤销能力的应用
- 安全要求较高的系统
- 用户可以主动登出的应用

### 性能考量
- 每次验证需要一次 Redis 查询
- 黑名单条目会自动过期
- 比完全有状态的方案性能更好

---

## 方案三：完全有状态（传统Session模式）

### 特点
- 完全放弃 JWT 无状态特性
- 所有Token信息存储在Redis
- 提供完整的撤销和管理能力

### 代码实现
```typescript
/**
 * 完全有状态验证
 */
async verifyAccessTokenStateful(token: string): Promise<ParsedToken | null> {
    try {
        // 解析 JWT 获取 Token ID
        const decoded = this.verifyJWT(token);
        if (!decoded) return null;

        // 从 Redis 获取完整的 Token 状态
        const tokenData = await this.getTokenData(decoded.jti);
        if (!tokenData || tokenData.revoked) return null;

        // 检查过期时间
        if (tokenData.expires_at < Math.floor(Date.now() / 1000)) return null;

        return decoded;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}
```

### 适用场景
- 企业级应用
- 需要详细审计日志
- 复杂的权限管理系统

---

## 推荐的混合策略

根据不同的API端点采用不同的验证策略：

```typescript
class AccessTokenService {
    // 公开API：纯无状态验证
    async verifyPublicAPI(token: string): Promise<ParsedToken | null> {
        return this.verifyAccessTokenStateless(token);
    }

    // 敏感操作：黑名单检查
    async verifySensitiveAPI(token: string): Promise<ParsedToken | null> {
        return this.verifyAccessTokenWithRevocation(token);
    }

    // 管理操作：完全有状态验证
    async verifyAdminAPI(token: string): Promise<ParsedToken | null> {
        return this.verifyAccessTokenStateful(token);
    }
}
```

## 建议

1. **默认使用方案一**：大多数API使用纯无状态验证
2. **按需使用方案二**：关键操作时检查撤销状态
3. **特殊场景使用方案三**：管理后台等需要强控制的场景

这样既保持了JWT的性能优势，又满足了安全需求。
