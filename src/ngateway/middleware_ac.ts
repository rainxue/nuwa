
const fp = require('fastify-plugin')
import { context_manager } from '../nsdk/common';
import { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { ac_service } from '../nservers/iam/ac_service';
export async function middleware_access_control(request: FastifyRequest, reply: FastifyReply) {
    // 输出路由地址
    const matchedRoute = request.routeOptions?.url
    console.log(`middleware_access_control请求的路由地址: ${matchedRoute}`);

    if(matchedRoute === undefined) {
        reply.status(404).send({ error: '路由地址未找到' });
    } else {
        const method = request.method;
        const uri = matchedRoute;
        ac_service.getUriPermissionAcModes(method, uri).forEach((ac_mode) => {
            console.log(`middleware_access_control请求的ac_mode: ${ac_mode}`);
            // 根据ac_mode进行不同的处理
            switch (ac_mode) {
                case 'system':
                    // 系统级权限处理逻辑
                    console.log('处理系统级权限');
                    break;
                case 'tenant':
                    // 租户级权限处理逻辑
                    console.log('处理租户级权限');
                    break;
                case 'user':
                    // 用户级权限处理逻辑
                    console.log('处理用户级权限');
                    break;
                default:
                    console.warn(`未知的ac_mode: ${ac_mode}`);
            }
        });
    }

    const params = request.params as Record<string, any>;
    const id = params?.id;
    console.log(`middleware_access_control请求的参数 id: ${id}`);
    // const route = fastify.find(request.method, request.url);
    // console.log('路由对象:', route?.path); 
    // 输出请求的URI
    console.log(`middleware_access_control请求的URI: ${request.url}`);
}
