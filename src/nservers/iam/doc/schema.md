# 


# 领域模型
## 用户账号 - account
```json
{
    "id": "bigint",             // 用户账号ID
    "username": "string",       // 用户名
    "login_name": "string",     // 登录名，唯一
    "password": "string",       // 密码
    "email": "string",          // 电子邮件
    "email_verified": "boolean",// 电子邮件是否已验证
    "phone": "string",          // 手机号码
    "avatar": "string",         // 头像URL
    "status": "string",         // 账号状态，如正常、禁用等
    "create_by": "bigint",      // 创建人
    "create_date": "datetime",  // 创建时间
    "update_by": "bigint",      // 更新人
    "update_date": "datetime"   // 更新时间
}
```
对于email和phone字段，建议使用加密存储，同时存储脱敏后的信息和哈希信息：
email_encrypted: 加密后的电子邮件
email_masked: 脱敏后的电子邮件
email_hash: 电子邮件的哈希值（用于快速查找）
phone_encrypted: 加密后的手机号码
phone_masked: 脱敏后的手机号码
phone_hash: 手机号码的哈希值（用于快速查找）

## OAuth账号 - oauth_account
```json
{
    "id": "bigint",             // id
    "provider": "string",       // OAuth提供商，如google、facebook、wechat等
    "provider_user_id": "string", // 提供商用户ID（Google的sub、Facebook的id、微信的openid）
    "union_id": "string",       // 提供商跨应用统一用户ID（主要用于微信unionid，其他可为空）
    "user_id": "bigint",        // 关联的用户账号ID
    "access_token": "string",   // 提供商访问令牌（加密存储）
    "refresh_token": "string",  // 提供商刷新令牌（加密存储）
    "token_type": "string",     // 令牌类型，通常为"Bearer"
    "scope": "string",          // 授权范围
    "expires_at": "datetime",   // 访问令牌过期时间
    "refresh_expires_at": "datetime", // 刷新令牌过期时间（如果有的话）
    "raw_user_info": "text",    // 提供商返回的原始用户信息JSON（可选，用于调试和扩展）
    "status": "string",         // 绑定状态：active、revoked、expired
    "last_used_at": "datetime", // 最后使用时间
    "create_date": "datetime",  // 创建时间
    "update_date": "datetime"   // 更新时间
}
```

**字段说明：**
- `provider_user_id`: 统一字段名，存储各提供商的用户标识
- `union_id`: 主要用于微信的unionid，其他提供商可为空
- `token_type`: OAuth 2.0 标准字段，通常为"Bearer"
- `scope`: 记录授权的权限范围
- `refresh_expires_at`: 刷新令牌的过期时间（Facebook可能不提供）
- `raw_user_info`: 可选字段，存储原始用户信息用于调试
- `status`: 跟踪绑定状态
- `last_used_at`: 用于清理不活跃的绑定

**安全建议：**
- `access_token` 和 `refresh_token` 应加密存储
- 建议添加唯一索引：`(provider, provider_user_id)`
- 建议添加索引：`(user_id)`, `(provider, union_id)`

## 用户资料 - user_profile
```json
{
    "user_id": "bigint",        // 用户ID，关联account表
    "real_name": "string",      // 真实姓名
    "gender": "string",         // 性别
    "birth_date": "date",       // 出生日期
    "education": "string",      // 教育背景
    "profession": "string",     // 职业
    "location": "string",       // 地理位置
    "bio": "string",            // 个人简介
    "school_id": "bigint",      // 学校ID，关联school表
    // ... 其他扩展信息字段
    "create_by": "bigint",      // 创建人
    "create_date": "datetime",  // 创建时间
    "update_by": "bigint",      // 更新人
    "update_date": "datetime"   // 更新时间
}
```

## 登录日志 - login_log
```json
{
    "id": "bigint",             // 日志ID
    "user_id": "bigint",        // 用户ID，关联account表
    "ip": "string",             // 登录IP地址
    "device": "string",         // 登录设备信息
    "location": "string",       // 登录地理位置
    "status": "string",         // 登录状态，如成功、失败等
    "create_date": "datetime"   // 创建时间
}
```

## 临时票据 - auth_ticket
用于向第三方应用提供临时访问权限
```json
{
    "id": "bigint",             // 票据ID
    "user_id": "bigint",        // 用户ID，关联account表
    "ticket": "string",         // 认证票据
    "expires_at": "datetime",   // 票据过期时间
    "create_date": "datetime",  // 创建时间
    "update_date": "datetime"   // 更新时间
}
```json
{
    "id": "bigint",             // 票据ID
    "user_id": "bigint",        // 用户ID，关联account表
    "ticket": "string",         // 认证票据
    "expires_at": "datetime",   // 票据过期时间
    "create_date": "datetime",  // 创建时间
    "update_date": "datetime"   // 更新时间
}
```

## 用户认证token
```json
{
    "id": "bigint",             // 认证token ID
    "user_id": "bigint",        // 用户ID，关联account表
    "expires_at": "datetime",   // token过期时间
    "create_date": "datetime",  // 创建时间
}
```