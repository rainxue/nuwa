# Schema for DCM

## 业务库模板 - lib_type

```json
{
    "id": "string",             // 业务库模板ID，即编码，唯一
    "name": "string",           // 业务库模板名称
    "description": "string",    // 业务库模板描述
    "status": "string",         // 业务库模板状态，如启用、禁用等
    // 业务库模板配置，JSON格式
    "config": {
        "content_types": ["string"], // 支持的内容类型列表，关联content_type.code
    },
    "create_by": "bigint",      // 创建人
    "create_date": "datetime",  // 创建时间
    "update_by": "bigint",      // 更新人
    "update_date": "datetime"   // 更新时间
}
```

## 内容库 - lib

```json
{
    "id": "bigint",             // 内容库ID
    "tenant_id": "bigint",      // 租户ID，关联tenant表
    "lib_type": "string",       // 库类型, 关联lib_type.id
    "name": "string",           // 内容库名称
    "code": "string",           // 内容库编码，若非空，租户内唯一
    "description": "string",    // 内容库描述
    "status": "string",         // 内容库状态，如启用、禁用等，禁用后，里面的内容不可编辑，不可引用
    // 内容库配置，JSON格式
    "config": {

    },
    "create_by": "bigint",      // 创建人
    "create_date": "datetime",  // 创建时间
    "update_by": "bigint",      // 更新人
    "update_date": "datetime"   // 更新时间
}
```

lib_type 说明：

- 编辑库（edit）：用于内容创建和编辑，支持草稿和未发布内容的存储，一般不直接对外提供服务，一般不用于内容引用
- 发布库（publish）：用于已发布内容的存储，内容一经发布即存入发布库，可直接对外提供服务，也可被引用
- 预览库（preview）：用于内容正式发布前的长时间预览，不可被引用
- 一个编辑库可以发布到多个发布库和多个预览库
- 发布库和预览库不能用于编辑管理，只能移除发布或回滚版本（若启用了多版本）

## 库关系 - lib_relation

```json
{
    "id": "bigint",             // 关系ID
    "tenant_id": "bigint",      // 租户ID，关联tenant表
    "source_lib_id": "bigint",  // 来源内容库ID，关联lib表
    "target_lib_id": "bigint",  // 目标内容库ID，关联lib表
    "target_lib_type": "string",// 关系类型，如发布、预览等
    "status": "string",         // 关系状态，如启用、禁用等，禁用后，不能再通过该关系推送新的发布内容
    "create_by": "bigint",      // 创建人
    "create_date": "datetime",  // 创建时间
    "update_by": "bigint",      // 更新人
    "update_date": "datetime"   // 更新时间
}
```

## 内容类型 - content_type

```json
{
    "id": "string",             // 内容类型ID
    "name": "string",           // 内容类型名称
    "description": "string",    // 内容类型描述
    "need_transcode": "boolean", // 是否需要转码，true表示需要转码，false表示不需要转码
    "status": "string",         // 内容类型状态，如启用、禁用等，禁用后，不能再创建该类型的内容（即前台选中不了该类型）
    // 内容类型配置，JSON格式
    "config": {
        "default_icon": "string",   // 默认图标(字符串)
    },
    "create_by": "bigint",      // 创建人
    "create_date": "datetime",  // 创建时间
    "update_by": "bigint",      // 更新人
    "update_date": "datetime"   // 更新时间
}
```

## 内容 - content

```json
{
    "id": "bigint",             // 内容ID
    "tenant_id": "bigint",      // 租户ID
    "lib_id": "bigint",         // 内容库ID
    "content_uuid": "string",   // 内容全局唯一标识
    "content_type": "string",   // 内容类型，关联content_type.id
    "title": "string",          // 内容标题
    "summary": "string",        // 内容摘要
    "thumbnail": "string",      // 内容缩略图URL
    
    "transcode_status": "string",   // 转码状态，如未转码、转码中、转码成功、转码失败、无需转码等
    "audit_status": "string",       // 内容审核状态，如未审核、审核中、审核通过、审核不通过等
    "publish_status": "string",     // 内容发布状态，如草稿、已发布、已下线等
    
    "sort_num": "double",           // 内容库内部的内容排序号，数值越小越靠前
    "is_top": "boolean",            // 是否置顶，true表示置顶，false表示不置顶

    "version": "string",            // 内容版本号

    
    "data": {},     // 内容数据，JSON格式，具体结构由content_type决定       
    "kn": {
        "kn_id": "bigint",          // 关联的知识体系
        "kn_points": ["bigint"]     // 关联的知识点列表
    },
    "category": "string",           // 内容分类，分类末级id，如 id3
    "category_path": "string",      // 内容分类路径，如 id1:id2:id3
    "tags": {"${key}": "string"},   // 内容标签列表
    "ext": {
        // is_reference 为 true 时，reference_info 不为空
        "reference_info": {             // 引用信息，若is_reference为true，则该字段不为空
            "lib_id": "string",         // 引用来源，如外部系统名称或URL
            "content_uuid": "string",   // 原始内容ID
            "imported_at": "datetime"   // 引用导入时间
        },
    },                      // 扩展字段，JSON格式

    // 是否是引用的资源
    "is_ref": "boolean",      // true表示是引用的资源，false表示是原创内容

    "create_by": "bigint",      // 创建人
    "create_date": "datetime",  // 创建时间
    "update_by": "bigint",      // 更新人
    "update_date": "datetime"   // 更新时间
}
```

内容版本号更新逻辑：

- 新建内容时，版本号设为"0.0.0"
- 内容转码完成且审核通过、首次发布，版本号更新为"1.0.0"
- data 内容变更，主版本号+1，次版本号和修订号归0
- title、summary、kn 变更，次版本号+1，修订号归0
- category、category_path、tags、ext 变更，修订号+1

## 内容关系 - content_relation

```json
{
    "id": "bigint",                 // 关系ID
    "tenant_id": "bigint",          // 租户ID
    "source_lib_id": "bigint",      // 来源内容库ID，关联lib.id
    "source_content_uuid": "bigint",// 来源内容ID，关联content.id
    "target_lib_id": "bigint",      // 目标内容库ID，关联lib.id
    "target_content_uuid": "bigint",// 目标内容ID，关联content.id
    "target_version": "string",     // 目标内容版本号

    "relation_type": "string",      // 关系类型

    "status": "string",             // 关系状态，正常，已取消

    "create_by": "bigint",      // 创建人
    "create_date": "datetime",  // 创建时间
    "update_by": "bigint",      // 更新人
    "update_date": "datetime"   // 更新时间
}
```

relation_type 说明：

- 复制：copy，同类型资源，表示内容被复制到另一个库(不复制媒体文件)，两个内容互不影响
- 快照引用：snapshot_ref，同类型资源，引用某个内容的特定版本，后续该内容更新不影响引用内容，但源内容（data）变更会通知引用方
- 最新引用：latest_ref，同类型资源，引用某个内容的最新版本，后续该内容更新会同步更新引用内容
- 静态引用：embedding，不同类型资源，仅引用二进制文件（如图片/视频地址）
- 快照集成：snapshot_embed，不同类型资源，集成某个内容的特定版本，后续该内容更新不影响集成内容，但源内容（data）变更会通知集成方
- 最新集成：latest_embed，不同类型资源，集成某个内容的最新版本，后续该内容更新会同步更新集成内容
- 链接：link，不同类型资源，仅链接某个内容的访问地址，即做跳转
- 衍生创作：derive_ref，同类型资源，基于某个内容进行衍生创作，两个内容互不影响，但源内容（data）变更会通知衍生方

复制、快照引用、最新引用 是在库列表中进行的操作。而其他则是在内容编辑时的操作。但不管在哪里，真正修改数据，需要依赖引用方本身信息的更新，而不是全部依赖content_relation表。

## 供应商类型 - publisher_type

```json
{
    "id": "string",             // 供应商类型ID，即编码，唯一
    "name": "string",           // 供应商类型名称
    "description": "string",    // 描述
    "config": {
        // 角色列表，用于定义模板中的角色及其权限
        "roles": [
            {
                "role": "string",           // 角色编码，如admin, editor, viewer等，决定了member中的role字段取值范围
                "role_type": "string",      // 角色类型，如team-团队级别角色，lib-库级别角色等
                "name": "string",           // 角色名称
                "description": "string",    // 角色描述
                "permissions": ["string"]   // 角色权限列表
            }
        ],

        // 自动创建的资源库列表
        "init_libs": [
            {
                "lib_type": "long",         // 资源库类型ID
            }
        ],

        // 允许创建的资源库类型列表
        "creatable_lib_types": [
            {
                "lib_type": "long",         // 资源库类型ID
                "config": {}                // 资源库的默认配置
            }
        ]
    },
    "status": "string",         // 状态，0-禁用，1-启用
    "create_by": "string",
    "create_date": "datetime",
    "update_by": "string",
    "update_date": "datetime"
}
```

## 供应商 - Publisher

```json
{
    "tenant_id": "bigint",      // 租户ID，关联tenant表
    "id": "bigint",             // 供应商ID
    "publisher_type": "string", // 供应商类型，关联publisher_type.id
    "owner_id": "bigint",       // 供应商负责人用户ID
    "name": "string",           // 供应商名称
    "description": "string",    // 供应商描述
    // 供应商配置，JSON格式
    "config": {
        "rules": [
            {
                "lib_id": "string",
                "publisher_type": "string"
            }
        ]
    },
    "status": "string",         // 供应商状态，如启用、禁用等
    "create_by": "bigint",      // 创建人
    "create_date": "datetime",  // 创建时间
    "update_by": "bigint",      // 更新人
    "update_date": "datetime"   // 更新时间
}
```

## 标签 - tag

```json
{
    "id": "bigint",             // 标签ID
    "tenant_id": "bigint",      // 租户ID
    "publisher_id": "bigint",   // 关联的供应商ID, 关联publisher.id，可以为 0
    "lib_id": "bigint",         // 关联的内容库ID, 关联lib.id，可以为 0
    "name": "string",           // 标签名称
    "code": "string",           // 标签编码，租户内唯一，用于被其他业务引用，比如学科、学段等
    "type": "string",           // 标签类型，如dict、tree等
    "description": "string",    // 标签描述
    "config": {
        // 分类配置，JSON格式
        // type 为 dict 时，items 表示分类节点列表
        "items": [               // 分类项列表
            {
                "id": "int",            // 分类项ID
                "name": "string",       // 分类项名称
                "code": "string",       // 分类项编码，分类内唯一，未指定code时，默认与id相同
                "description": "string" // 分类项描述
            }
        ],

        // type 为 tree 时，nodes 表示分类节点树
        "items": [               // 分类节点列表
            {
                "id": "int",            // 分类节点ID
                "name": "string",       // 分类节点名称
                "code": "string",       // 分类节点编码，分类内唯一
                "description": "string",// 分类节点描述
                "items": []             // 子节点列表，结构同上
            }
        ]
    },
    "status": "string",         // 分类状态，如启用、禁用等
    "create_by": "bigint",      // 创建人
    "create_date": "datetime",  // 创建时间
    "update_by": "bigint",      // 更新人
    "update_date": "datetime"   // 更新时间
}
```

## 标签视图 - tag_view

```json
{
    "id": "bigint",             // 视图ID
    "tenant_id": "bigint",      // 租户ID
    "publisher_id": "bigint",   // 关联的供应商ID, 关联publisher.id，可以为 0
    "lib_id": "bigint",         // 关联的内容库ID, 关联lib.id，可以为 0
    "name": "string",           // 视图名称
    "code": "string",           // 视图编码，租户内唯一
    "description": "string",    // 视图描述
    // 视图配置，JSON格式
    "config": {
        "items": [              // 视图项列表
            {
                "tag_id": "int",   // 关联的标签项ID
                "name": "string",       // 关联的标签项名称
            }
        ]
    },
    "status": "string",         // 视图状态，如启用、禁用等
    "create_by": "bigint",      // 创建人
    "create_date": "datetime",  // 创建时间
    "update_by": "bigint",      // 更新人
    "update_date": "datetime"   // 更新时间
}
```

## 分类 - Category

```json
{
    "tenant_id": "bigint",      // 租户ID
    "id": "bigint",             // 分类ID
    "name": "string",           // 分类名称
    "description": "string",    // 分类描述
    "config": {
        // 分类配置，JSON格式
        // 分类节点树
        "items": [               // 分类节点列表
            {
                "id": "int",            // 分类节点ID
                "name": "string",       // 分类节点名称
                "code": "string",       // 分类节点编码，分类内唯一
                "description": "string",// 分类节点描述
                "items": []             // 子节点列表，结构同上
            }
        ]
    },
    "status": "string",         // 分类状态，如启用、禁用等
    "create_by": "bigint",      // 创建人
    "create_date": "datetime",  // 创建时间
    "update_by": "bigint",      // 更新人
    "update_date": "datetime"   // 更新时间
}
```

## 共享策略 - SharingStrategy

```json
{
    "tenant_id": "bigint",      // 租户ID
    "id": "bigint",             // 共享策略ID
    "publisher_id": "bigint",   // 关联的供应商ID, 关联publisher.id，可以为 0
    "target_publisher_id": "bigint", // 目标供应商ID, 关联publisher.id，可以为 0，为 0 时，表示对所有供应商开放
    "lib_id": "bigint",         // 关联的内容库ID, 关联lib.id，可以为 0
    "strategy_type": "string",  // 策略类型，如只读、读写等
    "config": {
        // 共享策略配置，JSON格式
    },
    "status": "string",         // 共享策略状态，如启用、禁用等
    "create_by": "bigint",      // 创建人
    "create_date": "datetime",  // 创建时间
    "update_by": "bigint",      // 更新人
    "update_date": "datetime"   // 更新时间
}
```

## 分发策略 - DispatchStrategy

```json
{
    "tenant_id": "bigint",      // 租户ID
    "id": "bigint",             // 分发策略ID
    "publisher_id": "bigint",   // 关联的供应商ID, 关联publisher.id，可以为 0
    "target_publisher_id": "bigint", // 目标供应商ID, 关联publisher.id，可以为 0，为 0 时，表示对所有供应商分发
    "lib_id": "bigint",         // 关联的内容库ID, 关联lib.id，可以为 0
    "target_lib_id": "bigint", // 目标内容库ID, 关联lib.id，可以为 0
    "strategy_type": "string",  // 策略类型，如自动分发、手动分发等
    "config": {
        // 分发策略配置，JSON格式
        // 内容类型过滤
        "content_types": ["string"], // 支持的内容类型列表，关联content_type.code
        // 内容分类过滤
        "categories": ["string"],    // 支持的内容分类列表，关联category.id
        // 内容tag过滤
        "tags": {"${key}": "string"}  // 支持的内容标签列表，key为标签名称，value为标签值
    },
    "status": "string",         // 分发策略状态，如启用、禁用等
    "create_by": "bigint",      // 创建人
    "create_date": "datetime",  // 创建时间
    "update_by": "bigint",      // 更新人
    "update_date": "datetime"   // 更新时间
}
```
