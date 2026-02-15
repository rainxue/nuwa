# 概览
本模块提供一个Eventhub
不同业务模块之间通过Eventhub进行通信和解耦

# 模型定义


## EventMeta - 事件元数据
```typescript
export interface EventMeta {
    id: string; // 事件ID
    name: string; // 事件名称
    description?: string; // 事件描述
    nserver: string;        // 事件所属的nserver名称
    object_type: string;    // 事件对象类型，例如 "user", "order" 等
    event_type: string;     // 事件类型，例如 "user.created", "order.placed" 等
    data: any; // 事件数据，可以是任意类型
    tenant_id?: any; // 租户ID，可选
    timestamp: Date;        // 事件发生的时间
}
```

## EventData - 事件数据
```typescript
export interface EventData {
    meta: EventMeta; // 事件元数据
    payload: any; // 事件负载，可以是任意类型的数据
}
```