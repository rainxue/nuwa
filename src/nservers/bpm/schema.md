# 模型
## 流程定义 - process
```json
{
    "id": "bigint",             // 流程定义ID
    "tenant_id": "bigint",      // 租户ID，关联tenant表
    "name": "string",           // 流程名称
    "code": "string",           // 流程唯一标识
    "category": "string",       // 流程分类，比如审批、事务处理等
    "version": "int",           // 版本号
    "status": "string",         // 流程状态，比如草稿、发布、禁用等
    // 流程设计数据，JSON格式，包含节点和连线信息
    "config": {
        "nodes": [],
        "edges": []
    },
    "create_by": "bigint",      // 创建人
    "create_date": "datetime",  // 创建时间
    "update_by": "bigint",      // 更新人
    "update_date": "datetime"   // 更新时间
}
```

流程节点 - node
```json
{
    "node_id": "bigint",        // 节点ID，唯一标识
    "type": "string",           // 节点类型，比如开始节点、结束节点、任务节点、网关节点等
    "name": "string",           // 节点名称

    // 节点特定配置项，根据节点类型不同而不同
    // type = start 时
    "initiator": "string",      // 流程发起人

    // type = user_task 时
    "assignee": "bigint",           // 任务处理人，指定具体的人
    "candidate_users": "string",    // 任务候选人，逗号分隔
    "candidate_groups": "string",   // 任务候选组，逗号分隔
    // "candidate_roles": "string",    // 任务候选角色，逗号分隔
    // "candidate_custom": "string",   // 任务候选自定义处理人标识，比如用户直接上级、学生所在班级班主任、用户所在部门主管等，或表达式
    "due_date": "datetime",         // 任务截止时间
    "task_type": "string",          // 任务类型，比如审批、知照等

    // type = service_task 时
    "service_type": "string",       // 服务任务类型，比如脚本、接口等
    "service_config": {},           // 服务任务配置，JSON格式

    // type = end 时
    "result": "string",             // 流程结束结果，比如通过、拒绝
}
```

流向 - edge
```json
{
    "edge_id": "bigint",        // 流向ID，唯一标识
    "source_id": "bigint",      // 源节点ID，关联node.node_id
    "target_id": "bigint",      // 目标节点ID，关联node.node_id
    "condition": "string"       // 条件表达式，仅在网关节点时使用
}
```

## 流程实例 - process_instance
```json
{
    "id": "bigint",             // 流程实例ID
    "tenant_id": "bigint",      // 租户ID，关联tenant表
    "process_id": "bigint",     // 流程定义ID，关联process
    // "parent_id": "bigint",      // 父流程实例ID，用于关联子流程的父流程实例id
    "biz_id": "bigint",         // 业务标识，比如订单ID、请假单ID、资源id等

    "status": "string",         // 流程实例状态，比如进行中、已完成、已取消等

    // // 流程实例当前节点，JSON格式，包含节点ID和名称等信息
    // "current_node": {
    //     "node_id": "bigint",
    //     "name": "string"
    // },
    "ext": {},                   // 流程实例扩展信息，JSON格式
    "create_by": "bigint",      // 创建人
    "create_date": "datetime",  // 创建时间
    "update_by": "bigint",      // 更新人
    "update_date": "datetime"   // 更新时间
}
```

<!-- ## 节点实例 - node_instance -->
<!-- ```json
{
    "id": "bigint",             // 节点实例ID
    "tenant_id": "bigint",      // 租户ID
    "process_instance_id": "bigint", // 流程实例ID，关联process_instance表
    "node_id": "bigint",        // 流程节点ID，关联process_definition.config.nodes.node_id
    "name": "string",           // 节点名称
    "type": "string",           // 节点类型，比如开始节点、结束节点、任务节点、网关节点等
    "status": "string",         // 节点实例状态，比如执行中、已完成、已取消等
    "start_date": "datetime",   // 节点开始时间
    "end_date": "datetime",     // 节点结束时间
    // 节点实例扩展信息，JSON格式
    "ext": {},
}
``` -->


## 任务 - user_task
```json
{
    "id": "bigint",             // 任务ID
    "tenant_id": "bigint",      // 租户ID，关联tenant表
    "process_instance_id": "bigint", // 流程实例ID，关联process_instance表
    "node_id": "bigint",        // 流程节点ID，关联process_definition.config.nodes.node_id
    "title": "string",          // 任务名称
    "category": "string",       // 任务分类，比如审批、事务处理等
    "type": "string",           // 任务类型
    "sender": "bigint",         // 任务发送者
    "executor": "bigint",       // 任务执行者
    "status": "string",         // 任务状态，比如：待认领、待接收、待处理、处理中、已完成、已取消等
    "priority": "int",          // 任务优先级，数值越大优先级越高
    "due_date": "datetime",     // 任务截止时间
    // 任务扩展信息，JSON格式
    "ext": {},
    "create_by": "bigint",      // 创建人
    "create_date": "datetime",  // 创建时间
    "update_by": "bigint",      // 更新人
    "update_date": "datetime"   // 更新时间
}