'use strict';

import { AsyncLocalStorage } from 'async_hooks';

class Context {
    user_id?: any; // 实体ID
    tenant_id?: any; // 租户ID
    [key: string]: unknown;
}
/**
 * 类似Java ThreadLocal的上下文管理器
 * 使用Node.js的AsyncLocalStorage来在异步执行链中维护上下文
 */
class ContextManager {
    asyncLocalStorage: AsyncLocalStorage<Context> = new AsyncLocalStorage<Context>();
    constructor() {
        // this.asyncLocalStorage = new AsyncLocalStorage<CurrentContext>();
    }

    /**
     * 在指定的上下文中运行回调函数
     * @param {Object} context 上下文对象
     * @param {Function} callback 回调函数
     * @returns {*} 回调函数的返回值
     */
    run(context: Context, callback: any) {
        return this.asyncLocalStorage.run(context, callback);
    }

    /**
     * 获取当前上下文
     * @returns {Object|undefined} 当前上下文对象
     */
    getContext(): Context {
        return this.asyncLocalStorage.getStore() || {};
    }

    /**
     * 设置租户ID
     * @param {string|number} tenantId 租户ID
     */
    setTenantId(tenant_id: any) {
        const context = this.getContext();
        if (context) {
            context.tenant_id = tenant_id;
        }
    }

    /**
     * 获取租户ID
     * @returns {string|number|undefined} 租户ID
     */
    getTenantId() {
        const context = this.getContext();
        return context ? context.tenant_id : undefined;
    }

    /**
     * 设置用户ID
     * @param {string|number} user_id 用户ID
     */
    setUserId(user_id: any) {
        const context = this.getContext();
        if (context) {
            context.user_id = user_id;
        }
    }

    /**
     * 获取用户ID
     * @returns {string|number|undefined} 用户ID
     */
    getUserId() {
        const context = this.getContext();
        return context ? context.user_id : undefined;
    }

    /**
     * 设置自定义参数
     * @param {string} key 参数键
     * @param {*} value 参数值
     */
    set(key: string, value: any) {
        const context = this.getContext();
        if (context) {
            context[key] = value;
        }
    }

    /**
     * 获取自定义参数
     * @param {string} key 参数键
     * @param {*} defaultValue 默认值
     * @returns {*} 参数值
     */
    get(key: string, defaultValue = undefined) {
        const context = this.getContext();
        return context && context.hasOwnProperty(key) ? context[key] : defaultValue;
    }

    /**
     * 获取所有上下文参数
     * @returns {Object} 所有参数的副本
     */
    getAll() {
        const context = this.getContext();
        return context ? { ...context } : {};
    }

    /**
     * 清除指定参数
     * @param {string} key 参数键
     */
    remove(key: string) {
        const context = this.getContext();
        if (context && context.hasOwnProperty(key)) {
            delete context[key];
        }
    }

    /**
     * 检查参数是否存在
     * @param {string} key 参数键
     * @returns {boolean} 是否存在
     */
    has(key: string): boolean {
        const context = this.getContext();
        return context ? context.hasOwnProperty(key) : false;
    }

    /**
     * 设置多个参数
     * @param {Object} params 参数对象
     */
    setAll(params: Record<string, any>) {
        const context = this.getContext();
        if (context && params && typeof params === 'object') {
            Object.assign(context, params);
        }
    }

    /**
     * 清除所有参数
     */
    clear() {
        const context = this.getContext();
        if (context) {
            Object.keys(context).forEach(key => {
                delete context[key];
            });
        }
    }

    /**
     * 创建中间件函数，用于Koa框架
     * @returns {Function} Koa中间件函数
     */
    middleware_koa() {
        return async (ctx: any, next: any) => {
            const context = {};
            return this.run(context, async () => {
                await next();
            });
        };
    }

    /**
     * 创建中间件函数，用于fastify框架
     * @returns {Function} Fastify中间件函数
     */
    middleware_fastify() {
        return (request: any, reply: any, done: any) => {
            const context = {};
            return this.run(context, () => {
                request.context = context; // 将上下文挂载到请求对象上
                done();
            });
        };
    }

    middleware_fastify_test() {
        return (request: any, reply: any, done: any) => {
            const context = {};
            return this.run(context, () => {
                request.context = context; // 将上下文挂载到请求对象上
                done();
            });
        };
    }
    /**
     * 包装异步函数，确保在执行时有上下文
     * @param {Function} fn 要包装的函数
     * @param {Object} context 上下文对象（可选）
     * @returns {Function} 包装后的函数
     */
    wrap(fn: any, context = {}) {
        return (...args:any[]) => {
            return this.run(context, () => fn(...args));
        };
    }
}

// 创建全局单例实例
const context_manager = new ContextManager();

export { context_manager, Context };
