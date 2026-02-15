# 领域模型
## 学习记录 - learning_record
```json
{
    "tenant_id": "int",         // 租户ID
    "id": "bigint",             // 学习记录ID
    "title": "string",          // 标题
    "content_id": "string",     // 内容ID
    "content_type": "string",   // 内容类型
    "category": "string",       // 分类
    "sub_category": "string",   // 子分类
    "ext":"string",             // 扩展信息，JSON字符串
    "create_date": "datetime",  // 创建时间
    "create_by": "bigint",      // 创建人
    "update_by": "bigint",      // 更新人
    "update_date": "datetime"   // 更新时间
}
```

## 个人收藏夹 - favorite_folder
```json
{
    "tenant_id": "int",         // 租户ID
    "id": "bigint",             // 收藏夹ID
    "pid": "bigint",            // 父收藏夹ID
    "name": "string",           // 收藏夹名称，同一个父收藏夹下唯一
    "sort_num": "double",       // 排序号，pid相同时，按sort_num升序排列
    "ext":"string",             // 扩展信息，JSON字符串
    "create_date": "datetime",  // 创建时间
    "create_by": "bigint",      // 创建人
    "update_by": "bigint",      // 更新人
    "update_date": "datetime"   // 更新时间
}
```

## 个人收藏 - favorite
```json
{
    "tenant_id": "int",         // 租户ID
    "id": "bigint",             // 收藏ID
    "folder_id": "bigint",      // 收藏夹ID
    "content_id": "string",     // 内容ID
    "content_type": "string",   // 内容类型
    "category": "string",       // 分类
    "sub_category": "string",   // 子分类
    "ext":"string",             // 扩展信息，JSON字符串
    "create_date": "datetime",  // 创建时间
    "create_by": "bigint",      // 创建人
    "update_by": "bigint",      // 更新人
    "update_date": "datetime"   // 更新时间
}
```
