// const handler: ProxyHandler<typeof target> = {
//   get(target, prop, receiver) {
//     if (typeof target[prop] === "function") {
//       return (...args: any[]) => {
//         console.log(`Proxy: 拦截方法调用 ${String(prop)}`);
//         const result = Reflect.apply(target[prop], target, args);
//         console.log("Proxy: 调用完成");
//         return result;
//       };
//     }
//     return Reflect.get(target, prop, receiver);
//   },
// };
import axios from 'axios';
import { ModuleLocation } from './meta';
/**
 * 远程代理生成器
 */
export class RemoteProxyGenerator {
    /**
     * 创建远程服务代理
     */
    static createProxy<T extends Record<string, any>>(
        location: ModuleLocation,
        moduleName: string,
        serviceName: string
    ): T {
        const baseURL = `http://${location.host}:${location.port}`;

        // 创建一个干净的对象作为代理目标
        const target = Object.create(null);

        return new Proxy(target, {
            get(proxyTarget, prop: string | symbol) {
                // 处理常见的对象方法
                if (prop === 'toString') {
                    return () => `[RemoteProxy ${moduleName}.${serviceName}]`;
                }
                
                if (prop === 'valueOf') {
                    return () => proxyTarget;
                }

                if (typeof prop === 'string') {
                    return async (...args: any[]) => {
                        try {
                            const response = await axios.post(`${baseURL}/api/rpc`, {
                                module: moduleName,
                                service: serviceName,
                                method: prop,
                                args: args
                            });

                            return response.data.result;
                        } catch (error) {
                            console.error(`Remote call failed: ${moduleName}.${serviceName}.${prop}`, error);
                            throw new Error(`Remote service call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        }
                    };
                }
                
                return undefined;
            },
            
            // 处理属性设置（通常不需要，但为了完整性）
            set(proxyTarget, prop: string | symbol, value: any) {
                console.warn(`Attempting to set property ${String(prop)} on remote proxy`);
                return false;
            },
            
            // 处理属性枚举
            ownKeys(proxyTarget) {
                return [];
            },
            
            // 处理属性描述符
            getOwnPropertyDescriptor(proxyTarget, prop: string | symbol) {
                return undefined;
            }
        }) as T;
    }
}
