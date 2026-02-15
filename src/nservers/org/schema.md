# 模型
## 区域 - area
```json
{
    "tenant_id": "int",     // 租户ID
    "id": "int",            // 区域ID
    "name": "string",       // 区域名称
    "code": "string",       // 区域代码
    "pid": "int",           // 父区域ID
    "level": "int",         // 区域级别
    "sort_num": "double",   // 排序号
    "create_by": "int",         // 创建人
    "create_date": "datetime",  // 创建时间
    "update_by": "int",         // 更新人
    "update_date": "datetime"   // 更新时间
}
```

## 组织 - org
```json
{
    "tenant_id": "int",     // 租户ID
    "id": "int",            // 组织ID
    "name": "string",       // 组织名称
    "code": "string",       // 组织代码
    "type": "string",       // 组织类型

    "pid": "int",           // 父组织ID
    "area_id": "int",       // 区域ID
    
    "sort_num": "double",   // 排序号，pid相同时，按sort_num升序排列
    "ext": {},              // 扩展属性
    "create_by": "int",         // 创建人
    "create_date": "datetime",  // 创建时间
    "update_by": "int",         // 更新人
    "update_date": "datetime"   // 更新时间
}
```
## 部门 - department
```json
{
    "tenant_id": "int",     // 租户ID
    "id": "int",            // 部门ID
    "name": "string",       // 部门名称
    "code": "string",       // 部门代码，不为空时唯一
    "org_id": "int",        // 组织ID
    "pid": "int",           // 父部门ID

    "sort_num": "double",   // 排序号，pid相同时，按sort_num升序排列
    "ext": {},              // 扩展属性
    "create_by": "int",         // 创建人
    "create_date": "datetime",  // 创建时间
    "update_by": "int",         // 更新人
    "update_date": "datetime"   // 更新时间
}
```
## 学校 - school
```json
{
    // ... 继承自组织模型
    // 新增学校特有属性，包括学校类型、学段
    "school_type": "string", // 学校类型（如：小学、中学、高中、大学等）
    "school_stage": "string", // 学段（如：小学、初中、高中、大学等）
    "school_level": "string", // 学校级别（如：公立、私立等）
    "ext": {
        "school_code": "string",// 学校代码
        "address": "string",    // 学校地址
        "phone": "string",      // 学校电话
        "email": "string",      // 学校邮箱
        "website": "string",    // 学校官网
        "logo": "string",       // 学校Logo
    },
}
```

## 群组 - group
```json
{
    "tenant_id": "int",     // 租户ID
    "id": "int",            // 群组ID
    "name": "string",       // 群组名称
    "org_id": "int",        // 组织ID
    "owner_id": "int",      // 群组所有者ID
    "type": "string",       // 群组类型，对应group_template.type
    "description": "string",// 群组描述
    "config": {

    },
    "ext": {},              // 扩展属性
    "create_by": "int",         // 创建人
    "create_date": "datetime",  // 创建时间
    "update_by": "int",         // 更新人
    "update_date": "datetime"   // 更新时间
}



```
群组类型：
- 普通群：normal
- 组织群：org
- 课程群：course
- 培训群：training
- 班级群：class
- 教研群：research

## 群组模板 - group_template
```json
{
    "id": "int",            // 群组模板ID
    "name": "string",       // 群组模板名称
    "description": "string",// 群组模板描述
    "type": "string",       // 群组模板类型，唯一
    "config": {
        // 是否运行群的所有者添加成员
        "allow_owner_add_members": "boolean", // 是否允许群所有者添加成员

        // 是否允许管理员添加成员
        "allow_add_members": "boolean",                 // 是否允许管理员添加成员
        "readonly_allow_add_members": "boolean",        // 是否允许所有者修改群组配置 - 是否允许管理员添加成员

        // 是否允许成员邀请其他人
        "allow_invite_members": "boolean",              // 是否允许成员邀请其他人
        "readonly_allow_invite_members": "boolean",     // 是否允许所有者修改群组配置 - 是否允许成员邀请其他人
        
        // 是否允许成员退出群组
        "allow_leave": "boolean",           // 是否允许成员退出群组
        "readonly_allow_leave": "boolean",  // 是否允许所有者修改群组配置 - 是否允许成员退出群组

        // 是否允许申请加入群组
        "allow_join_request": "boolean",            // 是否允许申请加入群组
        "readonly_allow_join_request": "boolean",   // 是否允许所有者修改群组配置 - 是否允许申请加入群组

        "max_members": "int",       // 最大成员数

        "roles": [ // 群组角色列表
            {
                "name": "string",   // 角色名称
                "code": "string",   // 角色代码
                "permissions": []   // 角色权限列表
            }
        ]
    },
    "create_by": "int",         // 创建人
    "create_date": "datetime",  // 创建时间
    "update_by": "int",         // 更新人
    "update_date": "datetime"   // 更新时间
}
```
## 群成员 - group_member
```json
{
    "tenant_id": "int",     // 租户ID
    "id": "int",            // 群成员ID
    "group_id": "int",      // 群组ID
    "user_id": "int",       // 用户ID
    "nick_name": "string",  // 群昵称
    "role": "string",       // 角色
    "status": "string",     // 状态
    "create_by": "int",         // 创建人
    "create_date": "datetime",  // 创建时间
    "update_by": "int",         // 更新人
    "update_date": "datetime"   // 更新时间
}
```


## 组织用户 - org_user
```json
{
    "tenant_id": "int",     // 租户ID
    "id": "int",            // 组织用户ID
    "org_id": "int",        // 组织ID
    "user_id": "int",       // 用户ID
    "role": "string",       // 角色
    "create_by": "int",         // 创建人
    "create_date": "datetime",  // 创建时间
    "update_by": "int",         // 更新人
    "update_date": "datetime"   // 更新时间
}
```

## 班级 - class
```json
{
    // ... 继承自群组模型，另外新增班级特有属性
    "school_id": "int",     // 学校ID
    "grade": "string",      // 年级
    "class_code": "string", // 班级代码
    "class_type": "string", // 班级类型（如：普通班、实验班、特长班等）

}
```

## 班级成员 - class_member
```json
{
    // ... 继承自群成员模型，另外新增班级成员特有属性
    "class_id": "int",      // 班级ID，同group_id
    // 座位号
    "seat_number": "int",   // 座位号
}
```

## 群组-成员申请记录 - group_member_request
```json
{
    "tenant_id": "int",     // 租户ID
    "id": "int",            // 申请记录ID
    "group_id": "int",      // 群组ID
    "user_id": "int",       // 用户ID
    "status": "string",     // 申请状态（pending, approved, rejected）
    "reason": "string",     // 申请理由
    "create_by": "int",         // 创建人
    "create_date": "datetime",  // 创建时间
    "update_by": "int",         // 更新人
    "update_date": "datetime"   // 更新时间
}
```
## 群组-成员邀请记录 - group_member_invite
```json
{
    "tenant_id": "int",     // 租户ID
    "id": "int",            // 邀请记录ID
    "group_id": "int",      // 群组ID
    "inviter_id": "int",    // 邀请人ID
    "invitee_id": "int",    // 被邀请人ID
    "status": "string",     // 邀请状态（pending, accepted, rejected）
    "create_by": "int",         // 创建人
    "create_date": "datetime",  // 创建时间
    "update_by": "int",         // 更新人
    "update_date": "datetime"   // 更新时间
}
```

