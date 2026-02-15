
import { ProcessService,ProcessInstanceService,UserTaskService,Process, ProcessInstance,
    ProcessConfig,Node,Edge,UserTask,UserTaskStatus } from "./process";
import { context_manager } from "../../nsdk/common/context";
import { create } from "domain";

interface EngineContext {
    process: Process;
    process_instance: ProcessInstance;
    currentNode: Node;
    variables: any;
}

interface NodeExecutor {
    execute(command:ProcessCommand, node:Node, engine_context:EngineContext): Promise<any>;
}
enum ProcessCommand {
    // 启动流程
    START_PROCESS = 'start_process',

    // 创建任务
    CREATE_TASK = 'create_task',
    // 接受任务
    ACCEPT_TASK = 'accept_task',

    // 拒绝任务
    REJECT_TASK = 'reject_task',

    // 认领任务
    CLAIM_TASK = 'claim_task',

    // 转办任务
    TRANSFER_TASK = 'transfer_task',

    // 交办任务
    ASSIGN_TASK = 'assign_task',

    // 完成任务
    COMPLETE_TASK = 'complete_task'
}


class StartNodeExecutor implements NodeExecutor {
    constructor() {
        
    }

    async execute(command:ProcessCommand, node:Node, engine_context:EngineContext): Promise<any> {
        // 
        for (const edge of node.outEdges) {
            let targetNode = edge.targetNode;
            if (targetNode) {
                // 调用下一个节点的执行器
                let executor = getNodeExecutor(targetNode.type);
                if (executor) {
                    if(ProcessUtils.isTaskNode(targetNode.type)) {
                        await executor.execute(ProcessCommand.CREATE_TASK, targetNode, engine_context);
                    } else {
                        throw new Error(`Unsupported task node type: ${targetNode.type}`);
                    }
                } else {
                    throw new Error(`Unsupported node type: ${targetNode.type}`);
                }
            }
        }
        return Promise.resolve();
    }
}
class UserTaskNodeExecutor implements NodeExecutor {
    userTaskService: UserTaskService;
    constructor(userTaskService?: UserTaskService) {
        if(userTaskService) {
            this.userTaskService = userTaskService;
        } else {
            this.userTaskService = new UserTaskService();
        }
    }
    async execute(command:ProcessCommand, node:Node, engine_context:EngineContext): Promise<any> {
        switch(command) {
            case ProcessCommand.CREATE_TASK:
                return this.createUserTask(node, engine_context);
            case ProcessCommand.CLAIM_TASK:
                return this.claimUserTask(node, engine_context);
            case ProcessCommand.COMPLETE_TASK:
                return this.completeUserTask(node, engine_context);
            default:
                throw new Error(`Unsupported command for UserTaskNodeExecutor: ${command}`);
        }
        return Promise.resolve();
    }
    async createUserTask(node:Node, engine_context:EngineContext): Promise<any> {
        // TODO: 当前只支持单一执行者，后续支持候选人、候选组等复杂场景
        let executor:number = node["assignee"] as number;
        let user_task:UserTask = {
            process_instance_id: engine_context.process_instance.id,
            node_id: node.node_id,
            title: node.name,   // TODO: title一般是来自业务数据
            // category: "",
            // type: "",
            sender: engine_context.process_instance.create_by,
            executor: executor,
            priority: 1,
            status: 'pending'
        }
        let dueDate = this.getDueDate(node["due_date"] as string);
        if(dueDate) {
            user_task.due_date = dueDate;
        }
        await this.userTaskService.add(user_task);
        return Promise.resolve();
    }
    async claimUserTask(node:Node, engine_context:EngineContext): Promise<any> {
        // 认领任务
        let userId = context_manager.getUserId() as number;
        let user_task_id = engine_context.variables['user_task_id'] as number;
        let user_task = await this.userTaskService.get(user_task_id);

        if(user_task.executor && user_task.executor !== userId) {
            throw new Error(`User task ${user_task.id} is already claimed by another user`);
        }
        await this.userTaskService.update(user_task.id, {
            executor: userId,
            status: UserTaskStatus.READY
        });
        return Promise.resolve();
    }
    async completeUserTask(node:Node, engine_context:EngineContext): Promise<any> {
        // 完成任务
        let userId = context_manager.getUserId() as number;
        let user_task_id = engine_context.variables['user_task_id'] as number;
        let user_task = await this.userTaskService.get(user_task_id);
        if(user_task.executor !== userId) {
            throw new Error(`User task ${user_task.id} is assigned to another user`);
        }
        if(user_task.status === UserTaskStatus.COMPLETED) {
            throw new Error(`User task ${user_task.id} is already completed`);
        }
        await this.userTaskService.update(user_task.id, {
            status: UserTaskStatus.COMPLETED
        });

        // 任务完成后，继续执行后续节点
        for (const edge of node.outEdges) {
            let targetNode = edge.targetNode;
            if (targetNode) {
                // 调用下一个节点的执行器
                let executor = getNodeExecutor(targetNode.type);
                if (executor) {
                    if(ProcessUtils.isTaskNode(targetNode.type)) {
                        await executor.execute(ProcessCommand.CREATE_TASK, targetNode, engine_context);
                    } else {
                        await executor.execute(ProcessCommand.START_PROCESS, targetNode, engine_context);
                    }
                } else {
                    throw new Error(`Unsupported node type: ${targetNode.type}`);
                }
            }
        }

        return Promise.resolve();
    }

    getDueDate(dueDateStr: string): Date | undefined {
        // dueDateStr 支持的格式：
        // 1. 相对时间：Nd（天）、Nh（小时）、Nm（分钟），如 "3d" 表示3天后
        // 2. 绝对时间：ISO 8601格式，如 "2024-12-31T23:59:59.000Z"
        // 3. 常见日期格式，如 "2024-12-31"、 "Dec 31, 2024"、"12/31/2024" 等
        if (!dueDateStr) return undefined;
        let now = new Date();
        let match = dueDateStr.match(/^(\d+)([dhm])$/);
        if (match) {
            let value = parseInt(match[1]);
            let unit = match[2];
            switch (unit) {
                case 'd':
                    return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
                case 'h':
                    return new Date(now.getTime() + value * 60 * 60 * 1000);
                case 'm':
                    return new Date(now.getTime() + value * 60 * 1000);
                default:
                    return undefined;
            }
        } else {
            let parsedDate = new Date(dueDateStr);
            if (!isNaN(parsedDate.getTime())) {
                return parsedDate;
            } else {
                return undefined;
            }
        }
    }
}
class EndNodeExecutor implements NodeExecutor {
    async execute(command:ProcessCommand, node:Node, engine_context:EngineContext): Promise<any> {  
        // 标记流程实例为已完成
        let processInstanceService = new ProcessInstanceService();
        await processInstanceService.update(engine_context.process_instance.id, {
            status: 'completed'
        });
        console.log(`Process instance ${engine_context.process_instance.id} completed`);
        return Promise.resolve();
    }
}
const node_executors: { [key: string]: NodeExecutor } = {
    'start': new StartNodeExecutor(),
    'user_task': new UserTaskNodeExecutor(),
    'end': new EndNodeExecutor()
};

class ProcessUtils {
    static getNodeExecutor(node_type: string): NodeExecutor {
        return node_executors[node_type];
    }
    static isTaskNode(node_type: string): boolean {
        return node_type === 'user_task';
    }
}
function getNodeExecutor(node_type: string): NodeExecutor {
    return node_executors[node_type];
}
class SimpleEngine {
    processService: ProcessService;
    processInstanceService: ProcessInstanceService;
    userTaskService: UserTaskService;

    constructor() {
        this.processService = new ProcessService();
        this.processInstanceService = new ProcessInstanceService();
        this.userTaskService = new UserTaskService();
    }
    
    async startProcess(process_id: number, biz_id: number, biz_ext_data: any): Promise<number> {
        // 简化的流程启动逻辑
        const process = await this.processService.get(process_id);
        if (!process) {
            throw new Error(`流程ID ${process_id} 不存在`);
        }
        const process_instance:ProcessInstance = {
            biz_id: biz_id,
            process_id: process_id,
            title: process.name,    // TODO: title一般是来自业务数据
            status: 'active',
            ext: {
                biz_ext_data: biz_ext_data
            }
        }
        let process_config = new ProcessConfig(process.config);
        process_config.getStartNode();

        // let initiator = context_manager.getUserId() as number;

        // console.log(`Starting process ${processCode} by user ${initiator} with variables`, variables);
        // 返回一个模拟的流程实例ID
        return Date.now();
    }

    async completeTask(taskId: number, executor: number, variables: any): Promise<void> {
        // 简化的任务完成逻辑
        console.log(`Completing task ${taskId} by user ${executor} with variables`, variables);
    }
}