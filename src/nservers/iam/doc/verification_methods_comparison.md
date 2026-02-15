# Token 验证方式详细对比

## 核心差异总结

您的观察很准确！在我重新设计之前，这两个方法确实差异不大。现在让我详细解释它们的本质差异：

## 1. verifyAccessTokenWithRevocation (黑名单模式)

### 设计理念
- **JWT 为主，Redis 为辅**：优先使用 JWT 的无状态特性
- **轻量级撤销检查**：只查询黑名单，不依赖完整状态
- **性能优先**：最小化 Redis 查询

### 验证流程
```typescript
1. 解析 JWT（无状态）
2. 检查过期时间（JWT 内置）
3. 检查黑名单（1次 Redis 查询）
   └── 查询：blacklist:{tokenId}
   └── 目的：确认是否被撤销
```

### Redis 依赖
- **查询次数**：1 次
- **查询内容**：仅黑名单状态
- **数据结构**：`blacklist:{tokenId}` → 简单标记

### 适用场景
- 敏感操作（转账、修改密码）
- 需要撤销能力但优先考虑性能
- 大多数业务 API

---

## 2. verifyAccessTokenStateful (完全有状态)

### 设计理念
- **Redis 为主，JWT 为辅**：类似传统 Session 管理
- **完整状态检查**：依赖 Redis 中的所有 Token 状态
- **功能优先**：提供最强的控制和审计能力

### 验证流程
```typescript
1. 解析 JWT（仅获取 tokenId）
2. 获取完整 Token 状态（1次 Redis 查询）
   └── 查询：token:{tokenId}
   └── 获取：完整的 Token 元数据
3. 检查多种状态：
   ├── 是否被撤销
   ├── 是否过期（使用 Redis 时间）
   ├── 用户是否被禁用
   ├── 设备是否被禁用
   └── 其他扩展状态
4. 更新访问记录（审计功能）
```

### Redis 依赖
- **查询次数**：1 次查询 + 1 次更新
- **查询内容**：完整的 Token 状态数据
- **数据结构**：`token:{tokenId}` → 完整对象

### 适用场景
- 管理后台操作
- 需要详细审计的场景
- 要求最强安全控制的操作

---

## 具体差异对比

| 维度 | 黑名单模式 | 完全有状态 |
|------|------------|------------|
| **性能** | ★★★★☆ | ★★★☆☆ |
| **功能** | ★★★☆☆ | ★★★★★ |
| **Redis 查询** | 1 次（轻量） | 1 次（重量）+ 1 次更新 |
| **检查内容** | 仅撤销状态 | 完整状态 + 扩展检查 |
| **审计能力** | 无 | 完整访问记录 |
| **扩展性** | 有限 | 强大 |

---

## 数据存储差异

### 黑名单模式查询的数据
```json
// blacklist:{tokenId}
{
  "revoked_at": 1640995200,
  "reason": "manual_revocation"
}
```

### 完全有状态查询的数据
```json
// token:{tokenId}
{
  "user_id": "user123",
  "token_type": "Bearer",
  "created_at": 1640995200,
  "expires_at": 1640998800,
  "refresh_expires_at": 1641599200,
  "refresh_token": "abc...",
  
  // 状态控制字段
  "revoked": false,
  "user_disabled": false,
  "device_id": "device123",
  "device_disabled": false,
  
  // 审计字段
  "last_access_at": 1640997000,
  "access_count": 25,
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0..."
}
```

---

## 使用建议

### 选择黑名单模式的情况：
- 高频调用的 API
- 对性能要求较高
- 只需要基本的撤销功能
- 微服务架构中的内部调用

### 选择完全有状态的情况：
- 管理员操作
- 金融交易等高风险操作
- 需要详细审计日志
- 单体应用或对状态控制要求极高的场景

---

## 性能测试数据（假设）

```
并发用户：1000
测试时长：1分钟

verifyAccessTokenStateless:     平均 2ms  | TPS: 5000
verifyAccessTokenWithRevocation: 平均 5ms  | TPS: 2000  
verifyAccessTokenStateful:      平均 15ms | TPS: 666
```

---

## 总结

重新设计后的两种方法现在有了明确的差异：

1. **黑名单模式**：在保持 JWT 无状态优势的基础上，增加轻量级的撤销检查
2. **完全有状态**：放弃 JWT 无状态特性，提供类似传统 Session 的完整控制能力

这样的设计让开发者可以根据具体的业务需求和性能要求，选择最合适的验证策略。
