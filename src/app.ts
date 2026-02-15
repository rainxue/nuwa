import { FastifyInstance, FastifyPluginAsync } from 'fastify';

import { nhost_service } from './nservers/sys';

import { load_nservers } from './nservers';
import { context_manager } from './nsdk/common';
import { NGateway } from './ngateway';
import { middleware_access_control } from './ngateway/middleware_ac';
import { middleware_auth } from './ngateway/middleware_auth';

export const app: FastifyPluginAsync = async (server: FastifyInstance) => {
    // 初始化网关
    server.addHook('onRequest', context_manager.middleware_fastify());
    server.addHook('onRequest', async (request: any, reply: any) => {
        // 可以在这里添加其他的请求处理逻辑
        // 例如：设置请求上下文、记录日志等
        context_manager.setTenantId(1);
        // context_manager.setUserId(1);
    });

    server.addHook('onRequest', middleware_auth);
    server.addHook('onRequest', middleware_access_control);


    // await load_nservers();
    const gateway = new NGateway(server);
    gateway.init();


    //   // 注册插件
    //   await server.register(plugins)


    server.get('/nhosts', nhost_service.test.bind(nhost_service))
    server.get('/nhosts/list', nhost_service.list.bind(nhost_service))

    // 健康检查
    server.get('/health', async () => ({ status: 'OK' }))
}