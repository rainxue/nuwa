import { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import * as fs from 'fs';
import * as path from 'path';
import { NHostService, NHost, nhost_service } from '../nsdk/common/nhost_service';

enum HTTP_METHODS {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE',
    PATCH = 'PATCH'
}

enum RESTAPI_PARAM_FROMWAY {
    BODY = 'body',
    QUERY = 'query',
    PATH = 'path',
    HEADER = 'header',
    CONFIG = 'config'
}

interface RestapiParam {
    fromway: string;// 参数来源方式
    code: string;  // 参数代码
    name?: string;  // 参数名称
    type?: string;  // 可选的参数类型
    default?: any;  // 可选的默认值
}
interface RestapiItem {
    standard_action?: string;   // 标准动作名称
    function: string;           // 对应的nservice的函数名称
    method: string;             // HTTP 方法，默认为 GET
    url?: string;               // 可选的 URL 路径
    params?: RestapiParam[],
    action_name?: string;       // 可选的动作名称，用于自定义操作
    filter_name?: string;       // 可选的过滤器名称，用于自定义过滤器
    data?: any;                 // 可选的静态数据
}
interface RestapiConfig {
    nservice: string;
    base_url: string;
    items: RestapiItem[];
}

import { di_container } from '../nsdk/common';

const restapi_root_path = '/api';


export class RestapiGateway {
    server: FastifyInstance;
    nhost_service: NHostService = nhost_service;
    current_nhost: NHost | undefined;
    constructor(server: FastifyInstance) {
        this.server = server;
        this.nhost_service = nhost_service;
        this.current_nhost = this.nhost_service.get_current_nhost();
    }
    load_configs(nserver: string): any[] {
        try {
            // 构建配置文件路径
            const configPath = path.join(__dirname, '..', 'nservers', nserver, 'restapi.json');
            
            // 检查文件是否存在
            if (!fs.existsSync(configPath)) {
                console.warn(`配置文件不存在: ${configPath}`);
                return [];
            }
            
            // 读取并解析 JSON 文件
            const configContent = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(configContent);
            
            // 如果配置是数组，直接返回；如果是对象，包装成数组
            return Array.isArray(config) ? config : [config];
        } catch (error) {
            console.error(`加载配置文件失败 (${nserver}):`, error);
            return [];
        }
    }
    init() {
        // 初始化 RESTful 网关
        this.init_restapi_gateway();
    }
    get_local_nservers(): string[] {
        // 获取本地 nservers 列表
        return this.current_nhost?.nservers || [];
    }
    async init_restapi_gateway() {
        console.log('初始化 RESTful 网关...');

        const nservers: string[] = this.get_local_nservers();
        if (nservers.length === 0) {
            console.warn('当前 nhost 未配置任何 nserver，跳过 REST API 加载');
            return;
        } else {
            console.log(`当前 nhost 配置的 nserver: ${nservers.join(', ')}`);
        }
        for (const nserver of nservers) {
            console.log(`为 nserver ${nserver} 加载 REST API 配置:`);
            const configs: RestapiConfig[] = this.load_configs(nserver);
            for (const config of configs) {
                // 获取服务实例
                const service_instance = await this.get_nservice(config.nservice, nserver);
                if(!service_instance) {
                    console.warn(`未找到服务实例: ${config.nservice}`);
                    return;
                }
                // 为每个配置创建路由
                config.items.forEach((item) => {
                    const item_config: RestapiItem = this.prehandle_restapi_item(item);
                    this.server.route({
                        method: item_config.method,
                        url: `${restapi_root_path}${config.base_url}${item_config.url || ''}`,
                        handler: async (request: FastifyRequest, reply: FastifyReply) => {
                            // 这里可以调用对应的服务方法
                            try{
                                const args:any[] = [];
                                item_config.params?.forEach((param) => {
                                    switch (param.fromway) {
                                        case RESTAPI_PARAM_FROMWAY.BODY:
                                            const body = request.body as Record<string, any>;
                                            args.push(param.code ? body[param.code]: body);
                                            break;
                                        case RESTAPI_PARAM_FROMWAY.QUERY:
                                            const query = request.query as Record<string, any>;
                                            args.push(query[param.code] || param.default);
                                            break;
                                        case RESTAPI_PARAM_FROMWAY.PATH:
                                            const params = request.params as Record<string, any>;
                                            args.push(params[param.code]);
                                            break;
                                        case RESTAPI_PARAM_FROMWAY.HEADER:
                                            args.push(request.headers[param.code]);
                                            break;
                                        case RESTAPI_PARAM_FROMWAY.CONFIG:
                                            args.push(item_config.data);
                                            break;
                                        default:
                                            throw new Error(`未知的参数来源方式: ${param.fromway}`);
                                            // args.push(null);
                                    }
                                });
                                const result = await service_instance[item.function](...args);
                                reply.send(result);
                            } catch (error) {
                                console.error(`调用 ${config.nservice} 的 ${item.function} 动作失败:`, error);
                                // reply.status(500).send({ error: error });
                                throw error;
                            }
                            // return { message: `调用 ${config.nservice} 的 ${item.action} 动作` };
                        }
                    });
                });
            };
        };

    }
    prehandle_restapi_item(item: RestapiItem): RestapiItem {
        // 预处理标准 action 的 RestapiItem 配置
        return item.standard_action ? this.generate_restapi_item(item.standard_action, item) : item;
    }
    // is_standard_action(action: string): boolean {
    //     const standard_actions = [
    //         'findOne', 'query', 'tree', 'filter', 
    //         'add', 'update', 'action', 'remove', 'get', 
    //         'batch_action','batch_remove', 'count'];
    //     return standard_actions.includes(action);
    // }
    generate_restapi_item(standard_action: string, item: RestapiItem): RestapiItem {
        switch(standard_action) {
            case 'add':
                return {
                    function: 'add',
                    method: HTTP_METHODS.POST,
                    params: [{ fromway: RESTAPI_PARAM_FROMWAY.BODY, code: ""}]
                }
            case 'update':
                return {
                    function: 'update',
                    url: '/:id',
                    method: HTTP_METHODS.PUT,
                    params: [{ fromway: RESTAPI_PARAM_FROMWAY.PATH, code:"id"}
                        ,{ fromway: RESTAPI_PARAM_FROMWAY.BODY, code: ""}]
                }
            case 'action':
                return {
                    function: 'update',
                    url: `/:id/actions/${item.action_name}`,
                    method: HTTP_METHODS.POST,
                    params: [{ fromway: RESTAPI_PARAM_FROMWAY.PATH, code:"id"}
                        ,{ fromway: RESTAPI_PARAM_FROMWAY.CONFIG, code: "data"}]
                }
            case 'batch_action':
                return {
                    function: 'batch_update',
                    url: `/actions/${item.action_name}`,
                    method: HTTP_METHODS.POST,
                    params: [{ fromway: RESTAPI_PARAM_FROMWAY.BODY, code:"ids"}
                        , { fromway: RESTAPI_PARAM_FROMWAY.CONFIG, code: "data"}]
                }
            case 'remove':
                return {
                    function: 'remove',
                    url: '/:id',
                    method: HTTP_METHODS.DELETE,
                    params: [{ fromway: RESTAPI_PARAM_FROMWAY.PATH, code:"id"}]
                }
            case 'batch_remove':
                return {
                    function: 'batch_remove',
                    url: '/actions/batch_remove',
                    method: HTTP_METHODS.DELETE,
                    params: [{ fromway: RESTAPI_PARAM_FROMWAY.BODY, code: "ids"}]
                }
            case 'get':
                return {
                    function: 'get',
                    url: '/:id',
                    method: HTTP_METHODS.GET,
                    params: [{ fromway: RESTAPI_PARAM_FROMWAY.PATH, code:"id"}]
                }
            case 'findOne':
                return {
                    function: 'findOne',
                    url: '/filters/findOne',
                    method: HTTP_METHODS.POST,
                    params: [{ fromway: RESTAPI_PARAM_FROMWAY.BODY, code: ""}]
                }
            case 'query':
                return {
                    function: 'query',
                    url: '/filters/query',
                    method: HTTP_METHODS.POST,
                    params: [{ fromway: RESTAPI_PARAM_FROMWAY.BODY, code: ""}
                        , { fromway: RESTAPI_PARAM_FROMWAY.QUERY, code: 'limit', type: 'number', default: 10 }
                        , { fromway: RESTAPI_PARAM_FROMWAY.QUERY, code: 'offset', type: 'number', default: 0 }]
                }
            case 'tree':
                return {
                    function: 'tree',
                    url: '/filters/tree',
                    method: HTTP_METHODS.POST,
                    params: [{ fromway: RESTAPI_PARAM_FROMWAY.BODY, code: ""}]
                }
            case 'filter':
                return {
                    function: 'query',
                    url: `/filters/${item.filter_name}`,
                    method: HTTP_METHODS.GET,
                    params: [{ fromway: RESTAPI_PARAM_FROMWAY.CONFIG, code: "data"}
                        , { fromway: RESTAPI_PARAM_FROMWAY.QUERY, code: 'limit', type: 'number', default: 10 }
                        , { fromway: RESTAPI_PARAM_FROMWAY.QUERY, code: 'offset', type: 'number', default: 0 }]
                }
            case 'count':
                return {
                    function: 'count',
                    url: '/filters/count',
                    method: HTTP_METHODS.POST,
                    params: [{ fromway: RESTAPI_PARAM_FROMWAY.BODY, code: ""}]
                }
            default:
                throw new Error(`未知的 REST API 动作: ${standard_action}`);
        }
    }
    async get_nservice(nservice: string, nserver: string): Promise<any> {
        return await di_container.resolve(nservice, nserver);
    }
}

