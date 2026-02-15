import { ServiceBase,DaoBase, TenantStandardEntityBase, ID_GENERATOR } from '@/nsdk/base';

export class Process extends TenantStandardEntityBase {
    name?: string;      // 流程定义ID
    code?: string;      // 业务标识，比如订单ID、请假单ID等
    category?: string;  // 流程实例标题
    status?: string;    // 流程实例状态，比如进行中、已完成、已取消等
    config?: string | object;    // 流程实例扩展信息，JSON格式
    version?: number;   // 版本号
}
export class ProcessConfig {
    nodes!: Node[];     // 流程节点列表
    edges!: Edge[];     // 流程连线列表
    constructor(config?: any) {
        // 若config不是json对象，转换为对象
        if (config && typeof config === 'string') {
            try {
                config = JSON.parse(config);
            } catch (error) {
                throw new Error('Invalid process config JSON');
            }
        }

        this.nodes = config?.nodes || [];
        this.edges = config?.edges || [];

        this._init();
    }
    _init() {
        // 初始化节点图谱，以便后续更容易进行流程图遍历
        const nodeMap: { [key: string]: Node } = {};
        this.nodes.forEach(node => {
            nodeMap[node.node_id.toString()] = node;
        });
        this.edges.forEach(edge => {
            const sourceNode = nodeMap[edge.source_id.toString()];
            const targetNode = nodeMap[edge.target_id.toString()];
            if (sourceNode && targetNode) {
                edge.sourceNode = sourceNode;
                edge.targetNode = targetNode;
                sourceNode.outEdges.push(edge);
                targetNode.inEdges.push(edge);
            }
        });
    }
    getStartNode(): Node | undefined {
        return this.nodes.find(node => node.type === 'start');
    }
}
export class Edge {
    edge_id!: number;   // 连线ID
    source_id!: number; // 起始节点ID
    target_id!: number;   // 目标节点ID
    condition?: string;    // 连线条件表达式

    sourceNode?: Node; // 起始节点对象
    targetNode?: Node; // 目标节点对象
}
export class Node {
    node_id!: number;   // 节点ID
    name!: string;      // 节点名称
    type!: string;      // 节点类型，比如开始节点、结束节点、用户任务节点、服务任务节点等

    outEdges: Edge[] = [];  // 出度连线
    inEdges: Edge[] = [];   // 入度连线
    [key: string]: unknown;
}
export class TaskNode extends Node {}
export class UserTaskNode extends TaskNode {
    assignee?: number; // 任务执行者，可以是用户ID、角色ID等
    // candidate_users?: number[]; // 候选用户列表
    // candidate_groups?: number[]; // 候选角色列表
}
export enum UserTaskStatus {
    INIT = 'init',              // 初始化
    PENDING = 'pending',        // 待认领
    READY = 'ready',            // 待处理
    RUNNING = 'running',        // 处理中
    SUSPENDED = 'suspended',    // 已挂起
    COMPLETED = 'completed',    // 已完成
    CANCELED = 'canceled'       // 已取消
}

export class GatewayNode extends Node {}
export class EventNode extends Node {}

export class ProcessInstance extends TenantStandardEntityBase {
    process_id?: number;    // 流程定义ID
    title?: string;         // 流程实例名称
    biz_id?: number;        // 业务标识，比如订单ID、请假单ID
    status?: string;        // 流程实例状态，比如进行中、已完成、已取消等
    ext?: string | object;  // 流程实例扩展信息，JSON格式
}
export class UserTask extends TenantStandardEntityBase {
    process_instance_id?: number;   // 流程实例ID
    title?: string;                 // 任务名称
    node_id?: number;               // 任务节点ID
    category?: string;              // 任务分类，比如审批、知照等
    type?: string;                  // 任务类型
    sender?: number;                // 任务发送者
    executor?: number;              // 任务执行者
    status?: string;                // 任务状态，比如：待认领、待接收、待处理、处理中、已完成、已取消等
    priority?: number;              // 任务优先级，数值越大优先级越高
    due_date?: Date;                // 任务截止时间
    ext?: string | object;          // 任务扩展信息，JSON格式
}

class ProcessDao extends DaoBase {
    constructor() {
        super('bpm_process', "", {id_generator: ID_GENERATOR.SNOWFLAKE, json_fields: ['config']});
    }

}

class ProcessInstanceDao extends DaoBase {
    constructor() {
        super('bpm_process_instance', "", {id_generator: ID_GENERATOR.SNOWFLAKE, json_fields: ['ext']});
    }

}

class UserTaskDao extends DaoBase {
    constructor() {
        super('bpm_user_task', "", {id_generator: ID_GENERATOR.SNOWFLAKE, json_fields: ['ext']});
    }

}

export class ProcessService extends ServiceBase<Process> {
    constructor() {
        super(new ProcessDao());
    }

    async publish(id: number): Promise<void> {
        const process:Process = await this.get(id);
        
        if (process.status === 'published') {
            throw new Error('流程已发布');
        }

        // 检查流程配置
        if (!process.config) {
            throw new Error('流程配置不能为空');
        } else {
            // TODO: 进一步检查流程配置的合法性
        }



        process.status = 'published';

        // 更新版本
        if (!process.version) {
            process.version = 1;
        } else {
            process.version += 1;
        }

        await this.update(id, process);
    }
}

export class ProcessInstanceService extends ServiceBase<ProcessInstance> {
    constructor() {
        super(new ProcessInstanceDao());
    }
}

export class UserTaskService extends ServiceBase<UserTask> {
    constructor() {
        super(new UserTaskDao());
    }
}
