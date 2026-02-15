# 



# 模型
## Role
```json
{
    "tenant_id": "bigint",  // 租户ID
    "name": "string",       // 角色名称
    "code": "string",       // 角色编码
    "type": "string",       // 角色类型，system-系统内置，custom-自定义
    "description": "string",// 角色描述
}
```

type(RoleType):
- system: 系统内置（角色由超管定义和管理）
- product: 产品级（租户级，角色由租户管理员或授权的管理员定义和管理）
- org：组织级（由系统管理员根据组织类型进行定义，由组织管理员设置用户在组织中的角色）
- group：群组级（由群组管理员设置用户在群组中的角色）
- lib：库级（由库管理员（即库对应的群组管理员）设置用户在库中的角色）

## UserRole
产品级UserRole
```json
{
    "tenant_id": "bigint",  // 租户ID
    "user_id": "bigint",    // 用户ID
    "role_id": "bigint",    // 角色ID
}
```
群组UserRole
```json
{
    "tenant_id": "bigint",  // 租户ID
    "group_id": "bigint",   // 群组ID
    "user_id": "bigint",    // 用户ID
    "role_id": "bigint",    // 角色ID
}
```
组织UserRole
```json
{
    "tenant_id": "bigint",  // 租户ID
    "org_id": "bigint",     // 组织ID
    "user_id": "bigint",    // 用户ID
    "role_id": "bigint",    // 角色ID
}
```
内容库UserRole
```json
{
    "tenant_id": "bigint",  // 租户ID
    "lib_id": "bigint",     // 内容库ID
    "user_id": "bigint",    // 用户ID
    "role_id": "bigint",    // 角色ID
}
```



# 鉴权过程
1. 通过路由确定当前请求应该由哪种角色类型进行鉴权，并识别出权限
2. 根据请求的角色类型，查询对应的用户角色，并最终确定用户拥有的权限
3. 对比用户权限和请求的权限，判断是否有权限访问该接口


## 身份认证分类
- /api/p/..     // 公开接口，无需身份认证
- /api/m/..     // 管理台接口，需要双因素认证
- /api/c/..     // 客户端接口，需要MAC认证

## 接口鉴权分类
- POST /api/m/libs          // 产品级角色鉴权
- POST /api/libs/:lib_id/contents/..  // 库级接口，需库管理员或群组管理员角色


# uri_permission_mapping
```json
{
    "uri": "string",             // 接口URI，支持通配符*
    "method": "string",          // HTTP方法，GET,POST,PUT,DELETE
    "role_type": "string",       // 角色类型，system-系统内置，product-产品级，org-组织级，group-群组级，lib-库级
    "permission": "string",      // 所需权限，read,write,admin
    "description": "string",     // 描述
}
```

# userole


# role——permission