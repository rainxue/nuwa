# 领域模型
## 菜单 - Menu
```json
{
    "tenant_id": "bigint",      // 租户ID
    "id": "bigint",             // 菜单ID
    "pid": "bigint",            // 父菜单ID，一级菜单为0
    "name": "string",           // 菜单名称
    "icon": "string",           // 菜单图标
    "path": "string",           // 菜单路径
    "type": "string",           // 菜单类型，如目录、菜单、按钮等
    "sort_num": "double",       // 菜单排序号，越小越靠前
    "status": "string",         // 菜单状态，如启用、禁用等
    "create_by": "bigint",      // 创建人
    "create_date": "datetime",  // 创建时间
    "update_by": "bigint",      // 更新人
    "update_date": "datetime"   // 更新时间
}
```
