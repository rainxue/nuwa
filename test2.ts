// const createRemoteProxy = <T extends Record<string, any>>(target: T, remoteBaseUrl: string): T => {
//     return new Proxy(target, {
//         get(proxyTarget, propKey) {
//             if (typeof propKey !== 'string') return undefined;
            
//             const originalMethod = proxyTarget[propKey];
//             if (typeof originalMethod !== 'function') return originalMethod;

//             return async (...args: any[]) => {
//                 return "aaa";
//                 // const endpoint = `${remoteBaseUrl}/${propKey}`;
//                 // try {
//                 //     const response = await fetch(endpoint, {
//                 //         method: 'POST',
//                 //         body: JSON.stringify(args)
//                 //     });
//                 //     return await response.json();
//                 // } catch (error) {
//                 //     console.warn(`Remote ${propKey} failed, using local`);
//                 //     return originalMethod.apply(proxyTarget, args);
//                 // }
//             };
//         }
//     });
// }

// const createRemoteProxy<T>(serviceClass: new (...args: any[]) => T, remoteBaseUrl: string): T {
//     return new Proxy(Object.create(null) as T, {    
//         get(target, prop: string | symbol) {
//             if (typeof prop === 'string') {
//                 return async (...args: any[]) => {
//                     const endpoint = `${remoteBaseUrl}/${prop}`;
//                     try {
//                         const response = await fetch(endpoint, {
//                             method: 'POST',
//                             body: JSON.stringify(args),
//                             headers: {
//                                 'Content-Type': 'application/json'
//                             }
//                         });
//                         if (!response.ok) {
//                             throw new Error(`HTTP error! status: ${response.status}`);
//                         }
//                         return await response.json();
//                     } catch (error) {
//                         console.warn(`Remote ${String(prop)} failed:`, error);
//                         throw error;
//                     }
//                 };
//             }
//             return undefined;
//         }
//     });
// }

class ServiceA {
    async sayHello(name: string): Promise<string> {
        return `Hello, ${name} from ServiceA!`;
    }
    
    async sayGoodbye(name: string): Promise<string> {
        return `Goodbye, ${name} from ServiceA!`;
    }
    
    getInfo(): string {
        return "ServiceA information";
    }
}

class ServiceB {
    serviceA: ServiceA;

    constructor(serviceA: ServiceA) {
        this.serviceA = serviceA;
    }

    async greet(name: string): Promise<string> {
        return this.serviceA.sayHello(name);
    }
    
    async farewell(name: string): Promise<string> {
        return this.serviceA.sayGoodbye(name);
    }
}



// // 动态方法调用的辅助函数
// async function callDynamicMethod<T>(instance: T, methodName: string, ...args: any[]): Promise<any> {
//     const method = (instance as any)[methodName];
    
//     if (typeof method === 'function') {
//         const result = method.apply(instance, args);
//         // 如果返回 Promise，则等待
//         return result instanceof Promise ? await result : result;
//     } else {
//         throw new Error(`Method ${methodName} not found on instance`);
//     }
// }

// // let serviceAInstance = new ServiceA();
// let proxya = createRemoteProxy(ServiceA, 'http://localhost:3000/serviceA');

// let proxyb = createRemoteProxy(ServiceB, 'http://localhost:3000/serviceB');

// // 测试动态方法调用
// // async function testDynamicCalls() {
// //     console.log('=== 测试动态方法调用 ===');
    
// //     // 1. 直接在实例上动态调用
// //     try {
// //         const result1 = await callDynamicMethod(serviceAInstance, 'sayHello', 'Dynamic');
// //         console.log('Dynamic call result:', result1);
        
// //         const result2 = await callDynamicMethod(serviceAInstance, 'sayGoodbye', 'Dynamic');
// //         console.log('Dynamic goodbye:', result2);
        
// //         const result3 = await callDynamicMethod(serviceAInstance, 'getInfo');
// //         console.log('Dynamic info:', result3);
// //     } catch (error) {
// //         console.error('Error in dynamic call:', error);
// //     }
    
// //     // 2. 在代理上动态调用
// //     try {
// //         const result4 = await callDynamicMethod(proxya, 'sayHello', 'Proxy Dynamic');
// //         console.log('Proxy dynamic call:', result4);
// //     } catch (error) {
// //         console.error('Error in proxy dynamic call:', error);
// //     }
// // }

// // 运行测试
// // testDynamicCalls();

// async function testDynamicCalls2() {
//     // 原有的测试代码
//     let result = await callDynamicMethod(proxya, 'sayHello','World');
//     console.log('Proxy result:', result); // Should print: aaa (from proxy)

//     //     console.log('Proxy result:', result); // Should print: aaa (from proxy)
//     // }).catch(err => {
//     //     console.error('Error:', err);
//     // });

//     // proxyb.greet('Nuwa').then(result => {
//     //     console.log('ServiceB result:', result); // Should print: aaa (from proxy)
//     // }).catch(err => {
//     //     console.error('Error:', err);
//     // });
// }
// testDynamicCalls2();