// import { AsyncLocalStorage } from 'async_hooks';
const fp = require('fastify-plugin')
import { context_manager } from '../nsdk/common';

export async function middleware_context_test(fastify: any, opts: any) {
    fastify.addHook('onRequest', async (request: any, reply: any) => {
        // const startTime = Date.now()
        // request.log.info({
        //     method: request.method,
        //     url: request.url,
        //     headers: request.headers,
        //     ip: request.ip
        // }, 'Incoming request')

        // reply.header('X-Request-ID', request.id)

        context_manager.setTenantId(1);
        context_manager.setUserId(1);

        // reply.addHook('onSend', async (request: any, reply: any, payload: any) => {
        //     const responseTime = Date.now() - startTime
        //     request.log.info({
        //         statusCode: reply.statusCode,
        //         responseTime: `${responseTime}ms`,
        //         payloadSize: Buffer.byteLength(payload || '')
        //     }, 'Request completed')
        // })
    })
}

module.exports = fp(middleware_context_test, {
    fastify: '4.x',
    name: 'fastify-request-context-test'
})
