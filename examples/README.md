# Examples 示例目录

本目录包含了 nuwa 项目中各个模块的使用示例。

## 📁 文件说明

### 🔐 加密相关示例

#### `rsa-auth-example.ts` - RSA 用户认证示例
演示如何使用 RSA 加密保护用户注册和登录过程中的密码传输：
- 前端密码加密
- 服务端密码解密
- 密码强度验证
- 时间戳防重放攻击

**运行方式：**
```bash
npx ts-node examples/rsa-auth-example.ts
```

#### `rsa-signature-examples.ts` - RSA 数字签名示例
展示 RSA 数字签名在各种安全场景中的应用：
- API 接口签名验证
- 文件完整性校验
- 用户身份令牌（类似 JWT）
- 数据库操作审计

**运行方式：**
```bash
npx ts-node examples/rsa-signature-examples.ts
```

### 🗃️ 缓存相关示例

#### `cache-example.ts` - 缓存系统示例
演示本地缓存和 Redis 分布式缓存的使用：
- LocalCache（LRU 本地缓存）
- RedisCache（Redis 分布式缓存）
- 混合缓存策略（本地+Redis）

**运行方式：**
```bash
npx ts-node examples/cache-example.ts
```

## 🚀 快速开始

1. **安装依赖：**
   ```bash
   npm install
   ```

2. **编译项目：**
   ```bash
   npm run build
   ```

3. **运行示例：**
   ```bash
   # 运行 RSA 认证示例
   npx ts-node examples/rsa-auth-example.ts
   
   # 运行 RSA 签名示例
   npx ts-node examples/rsa-signature-examples.ts
   
   # 运行缓存示例
   npx ts-node examples/cache-example.ts
   ```

## 📋 环境要求

### RSA 示例
- Node.js 14+
- bcrypt 依赖（用于密码哈希）

### 缓存示例
- **本地缓存**：无额外要求
- **Redis 缓存**：需要运行 Redis 服务
  ```bash
  # 启动 Redis（如果已安装）
  redis-server
  ```

## 🔧 配置说明

### 环境变量
可以通过环境变量配置加密相关参数：

```bash
# 加密密钥（生产环境必须设置）
ENCRYPTION_KEY=your-encryption-key

# 哈希盐值
HASH_SALT=your-hash-salt
```

### Redis 配置
Redis 缓存默认配置：
- 主机：localhost
- 端口：6379
- 数据库：0

可以在代码中自定义配置：
```typescript
const redisCache = new RedisCache({
    host: 'your-redis-host',
    port: 6379,
    password: 'your-password',
    keyPrefix: 'your-app:'
});
```

## 🛡️ 安全注意事项

1. **生产环境**必须设置自定义的 `ENCRYPTION_KEY`
2. **RSA 密钥**应妥善保管，私钥绝不能泄露
3. **Redis 连接**在生产环境应使用密码保护
4. **时间戳验证**用于防止重放攻击，建议保持 5 分钟以内的有效期

## 📚 相关文档

- [CryptoUtil API 文档](../src/nsdk/util/crypto.ts)
- [Cache API 文档](../src/nsdk/cache/index.ts)
- [项目主文档](../README.md)

## 🤝 贡献

如果您有新的示例或改进建议，欢迎提交 Pull Request！
