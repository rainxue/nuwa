
// 加载环境变量（必须在最开始）
import 'dotenv/config';

import fastify, { FastifyInstance } from 'fastify';
import { app } from './app'

const server = fastify({
    logger: {
        level: 'info',
        transport: { target: 'pino-pretty' }
    }
})

// 注册 CORS 支持
server.register(require('@fastify/cors'), {
    // 开发环境允许所有域，生产环境需要配置具体域名
    origin: process.env.NODE_ENV === 'development' ? true : [
        'http://localhost:3000',
        'http://localhost:3001', 
        'http://localhost:8080',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:8080',
        // 添加您的生产域名
        // 'https://yourdomain.com'
    ],
    credentials: true, // 允许发送 cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token']
});

server.register(app)

// 使用环境变量中的端口配置
const port = parseInt(process.env.PORT || '3000', 10);
const host = process.env.HOST || '0.0.0.0';

server.listen({ port, host }, (err) => {
    if (err) {
        server.log.error(err)
        process.exit(1)
    }
})
