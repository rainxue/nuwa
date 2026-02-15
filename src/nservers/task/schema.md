# 概览
task 模块定义了任务相关的功能，包括：
- 异步任务（比如转码任务）
- 周期性任务（或称定时任务）


# Schema 设计
## 异步任务 - task
```json
{
    "id": "bigint",
    "tenant_id": "bigint",
    "type": "string",
    // 任务提交者，默认为0，
    // 个人发起任务，且需获取任务执行状态，则需要存储
    "creator": "bigint",
    
    // 启动时间，提交任务时一般设置为当前时间
    // 定时任务或出错重新执行时，可调整启动时间
    "start_time": "datetime",

    "status": "enum",
    
    // 状态为Executing，且当前时间超过时，需要分配Agent重新执行
    "executing_deadline": "datetime",
    
    // 当任务执行结束时，若执行失败，且exec_id并非原exec_id，
    // 说明本次执行已被判定为执行失败，且已发起新的Agent，
    // 无需累加ErrorCount并重新设置
    "exec_id": "uuid",
    
    // 当前执行出错次数，默认值为0
    "error_count": "int",
    // 最近一次执行失败的日志信息
    "error_info": "string",
    
    // 多种类型可以设置为一个分类，便于同一种客户端可以根据分类获取任务或批量获取任务
    "category": "string",
    
    // 人工处理时，标记为 ManuallyProcessed 时可填写remark
    "remark": "string",
    
    // 任务扩展数据，需要具体类型的Agent能够识别这里的扩展数据
    "ext": {},
    
    // 处理成功，回调业务失败时，状态为Completed，结果存入result
    "result": {},
    // 执行耗时，只保存最后一次执行时间(单位：秒)
    "exec_time": "int",
    
    "create_date": "datetime",
    "update_date": "datetime"
}
```

status:
*   New: 新任务
*   Executing：处理中，耗时任务先领取，领取完状态更新为处理中
*   Success：处理成功，处理完成且成功
*   Completed：处理成功，但回调通知失败，或尚未通知
*   Error：处理失败
*   Failure：处理失败，且不需要再次重试，且不需要人工干预
*   Pending：待人工处理
*   ManuallyProcessed：人工处理结束
*   Cancelled：任务已取消

获取任务时的隐含条件：
*   status in (New, Error)
*   now > start_time

获取任务可选条件：

*   tenant_id
*   type
*   category
*   creator

## 任务记录-历史 - task_his

属性和task一致，定时将task的 success、ManuallyProcessed 状态数据转移到task_his

## 任务类型元数据 - task_metadata

为系统级配置，暂不考虑分租户配置，因此 type 全局唯一
```json
{
    "id":"bigint",
    "code":"string",        // 同task.type
    "name":"string",        // 
    "category":"string",    // 所属agent分类
    
    "config":{
        // 重试策略：
        // none：不重试
        // fixed_period: 固定周期重试，周期由 retry_interval 参数指定
        // sequence：时间序列周期，周期由 retry_sequence 参数指定
        "retry_strategy":"string",
    
        // 重试周期的固定间隔时间，单位是秒
        // retry_strategy = fixed_period 时有效
        "retry_interval":"int",
        
        // 重试时间间隔序列，单位是秒
        // 重试的次数超过序列长度时，取最后一个时间间隔
        "retry_sequence":["int"],
        
        // 最大执行失败次数，retry_strategy = none 时为0，即不重试，否则大于0
        "max_error_count":"int",
        
        // 执行超时时间，单位：分钟，任务拉取时更新task.executing_deadline
        "timeout":"int",
        
        // 是否需人工干预
        // 默认为 false，重试失败次数超过 max_error_count 时 status 标记为 Failure
        // 当设置为 true，重试失败次数超过 max_error_count 时 status 标记为 Pending
        "need_manual":"boolean",
        
        // 回调，无需回调时，callback为空
        // 当callback为空时，若TaskAgent返回的状态为 Completed 时，无需回调，转为 Success
        // 当某类型任务确认无需 TaskServer 回调业务方，执行结果直接返回 Success，TaskServer则无视callback配置
        "callback":{
            // 成功回调
            "success":{
                // 请求地址，完整url地址
                "url":"string",
                
                // 请求方法，支持：POST、PUT。
                // { ext:${task.ext}, result:${task.result} } 作为body回传
                "method":"string",
            },
            // 失败回调
            "error":{
                // 请求地址，完整url地址
                "url":"string",
                
                // 请求方法，支持：POST、PUT。
                // { task_id:${task.id}, error_info:${task.error_info}, ext: ${task.ext} } 作为body回传
                "method":"string",
            },
            // 请求安全策略配置
            "security": {
                // 安全类型：
                // none: 无，回调接口可公开访问
                // aksk：基于AK/SK的安全访问策略
                "type":"string",
                
                // type = aksk时有效
                "ak":"string",
                "sk":"string",
            }
        }
    }
}
```

## 周期性任务调度 - periodic_task
一般用于定时调度业务服务接口执行任务，方案为通过cron表达式定时触发。若调用失败还需要重试，则创建task任务即可。
```json
{
    "id":"bigint",
    "tenant_id":"bigint",
    "type":"string",
    
    // 任务提交者，默认为0，
    // 个人发起任务，且需获取任务执行状态，则需要存储
    "creator":"bigint",

    // 标准 cron 表达式
    "cron_expressions":"string",

    // 任务状态
    // new: 新任务，尚未启用
    // online: 已上线，上线时系统将自动加入触发计划，系统重新启动时也会加载全部该状态任务
    // offline: 已下线，下线后，系统将立即停止任务触发计划
    "status":"string",
    
    // 是否记录执行日志
    // none：不记录日志，一般对频率高的不记录日志
    // trigger_log：只记录触发日志
    // trans_log：记录触发日志、执行完成更新执行结果
    "log":"string",
    
    // 多种类型可以设置为一个分类，便于同一种客户端可以根据分类获取任务或批量获取任务
    "category":"string",
    
    // 任务扩展数据，需要具体类型的Agent能够识别这里的扩展数据
    "ext":{},
    
    "create_date":"datetime",
    "update_date":"datetime",
}
```

注意：

*   周期性定时任务一般由单实例/单线程执行，以避免重复触发
*   一般对于需要retry的任务，触发后推送到 task，由 task 完成更复杂的控制
*   周期性任务自身调度失败时，不提供retry机制，由 task 服务提供可用性保障

## 周期性定时任务日志 - periodic_task_log

用于记录周期性定时任务执行的触发日志
```json
{
    "id":"bigint",
    
    "periodic_task_id":"int",    // periodic_task.id
    "tenant_id":"int",            // periodic_task.tenant_id
    
    // 执行结果
    // executing: 对于periodic_task.log = trans_log，新增记录时（非出错），result提交该值
    // success：对于periodic_task.log = trigger_log，始终为 success; 而对于periodic_task.log = trans_log，且执行结果成功时，设置为 success。
    // failure：对于periodic_task.log = trans_log，且执行结果失败时，设置为 failure
    "result":"string",
    
    // 异常信息，result = failure 时有效
    "error_info":"string",
    
    "create_date":"datetime",
    "update_date":"datetime",
}
```