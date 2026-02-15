# 概览
framework 模块定义了后台管理框架相关的功能，包括：
- 菜单管理
- 后台登录
- 可用产品列表
- 当前用户信息
- 产品基本信息设置


# Schema 设计
## 产品租户 - tenant
```json
{
    "id": "bigint",             // 租户ID
    "name": "string",           // 租户名称
    "domain": "string",         // 租户域名
    "logo": "string",           // 租户Logo URL
    "product_type": "string",   // 产品类型
    "owner_id": "bigint",       // 租户所有者用户ID，关联account表
    "status": "string",         // 租户状态，如启用、禁用等
    "create_by": "bigint",      // 创建人
    "create_date": "datetime",  // 创建时间
    "update_by": "bigint",      // 更新人
    "update_date": "datetime"   // 更新时间
}
```

