
# 安全相关模型
## ac_mode - 访问控制模式
```json
{
    "id": "string",             // 模板类型，如系统级、产品级、群组级、组织级等，全局唯一
    "name": "string",           // 模板名称
    "description": "string",    // 模板描述
}
```
id:
- system: 系统级（系统管理员定义和管理）
- product: 产品级（租户管理员或授权的管理员定义和管理）
- org: 组织级（组织管理员定义和管理）
- group: 群组级（群组管理员定义和管理）
- lib: 库级（库管理员定义和管理）

无需db存储，在代码中定义

定义阶段：开发期

## permission - 权限
```json
{
    "id": "bigint",         // 权限ID
    "ac_mode": "string",    // 对应到ac_mode.id
    "name": "string",       // 权限名称
    "category": "string",       // 分类
    "sub_category": "string",   // 子分类
    "description": "string" // 权限描述
}
```
定义阶段：开发期

可无需db存储，在文件中定义，跟着源码走？不过貌似通过db存储在使用时更加友好。

## uri_permission - URI权限关系
```json
{
    "uri": "string",        // 接口URI
    "method": "string",     // HTTP方法，如GET、POST等
    "permission": "bigint"  // 权限标识
}
```
定义阶段：开发期

## role - 角色
```json
{
    "tenant_id": "bigint",      // 租户ID
    "id": "bigint",             // 角色ID，role_id
    "name": "string",           // 角色名称
    "ac_mode": "string",        // 角色类型，如产品级、群组级、组织级等
    "owner_type": "string",     // 角色所属对象类型，如租户、组织、群组、班级、教研组、习题库等
    "owner_id": "bigint",       // 角色所属对象ID，如租户ID、组织ID、群组ID等
    "description": "string",    // 角色描述
    "create_by": "bigint",      // 创建人
    "create_date": "datetime",  // 创建时间
    "update_by": "bigint",      // 更新人
    "update_date": "datetime"   // 更新时间

}
```
定义阶段：开发期(预置)、运营期(调整)

各典型业务获取可选角色列表的方法：
- 租户管理员授权：tenant_id + ac_mode=product
- 组织管理员授权：
  - 所有组织统一角色：tenant_id + ac_mode=org + owner_type=system + owner_id=0
  - 租户内所有组织统一角色：tenant_id + ac_mode=org + owner_type=product + owner_id=tenant_id
  - 组织可自定义角色：tenant_id + ac_mode=org + owner_type=org + owner_id=org_id
- 群组管理员授权：tenant_id + ac_mode=group + owner_id=group_id
  - 所有群组统一角色：tenant_id + ac_mode=group + owner_type=system +  owner_id=0
  - 租户内所有群组统一角色：tenant_id + ac_mode=group + owner_type=product + owner_id=tenant_id
  - 群组可自定义角色：tenant_id + ac_mode=group + owner_type=group + owner_id=group_id
- 内容库管理员授权：
  - 所有内容库统一角色：tenant_id + ac_mode=lib + owner_type=system + owner_id=0
  - 租户内所有内容库统一角色：tenant_id + ac_mode=lib + owner_type=product + owner_id=0
  - 内容库可自定义角色：tenant_id + ac_mode=lib + owner_type=lib + owner_id=lib_id

## role_permission - 角色权限关系
```json
{
    "tenant_id": "bigint",      // 租户ID
    "id": "bigint",             // 角色权限关系ID
    "role_id": "bigint",        // 角色ID
    "permission_id": "bigint",  // 权限ID
    "create_by": "bigint",      // 创建人
    "create_date": "datetime",  // 创建时间
    "update_by": "bigint",      // 更新人
    "update_date": "datetime"   // 更新时间
}

```
