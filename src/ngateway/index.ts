import { FastifyInstance, FastifyError } from 'fastify';
import { RestapiGateway } from "./restapi_gateway";
import { NotFoundError, BusinessError,ServerError } from '../nsdk/base';

interface ErrorResponse {
  code: number
  message: string
  details?: unknown
}

export class NGateway {
    private restapiGateway: RestapiGateway;

    constructor(server: FastifyInstance) {
        this.restapiGateway = new RestapiGateway(server);
        this.errorHandler(server);
    }

    init() {
        this.restapiGateway.init();
    }

    errorHandler(app: FastifyInstance) {
        app.setErrorHandler((error: Error, request, reply) => {
            let response: ErrorResponse = { code: 500, message: 'Internal Server Error' };
            // 若 error 是 NotFoundError
            if (error instanceof NotFoundError) {
                response = {
                    code: 404,
                    message: 'Not Found',
                    details: error.message
                }
            } else if (error instanceof BusinessError) {
                response = {
                    code: 400,
                    message: 'Business Error',
                    details: error.message
                }
            } else if (error instanceof ServerError) {
                // TODO: 记录服务器错误日志
                console.error('Server Error:', error);
                response = {
                    code: 500,
                    message: 'Server Error',
                    details: ""
                }
            }

            // const response: ErrorResponse = {
            //     code: error.statusCode || 500,
            //     message: error.message
            // }

            // // 处理校验错误
            // if (error.validation) {
            //     response.code = 400
            //     response.details = error.validation
            // }

            // // JWT相关错误
            // if (error.code === 'FST_JWT_NO_AUTHORIZATION') {
            //     response.code = 401
            //     reply.header('WWW-Authenticate', 'Bearer')
            // }

            reply.status(response.code).send(response)
        })
    }
}