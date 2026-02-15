import "reflect-metadata";

/**
 * 增强的装饰器，可以存储 namespace 信息
 */
function NamespaceClass(namespaceName: string) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T) {
        // 在类上添加 namespace 元数据
        Reflect.defineMetadata('namespace', namespaceName, constructor);
        Reflect.defineMetadata('className', constructor.name, constructor);
        Reflect.defineMetadata('fullName', `${namespaceName}.${constructor.name}`, constructor);
        
        return constructor;
    };
}

/**
 * 简单的装饰器，用于触发元数据生成
 */
function Reflectable(target: any) {
    return target;
}

export namespace lib {
    export class Service {
        constructor() {
            console.log('Service initialized');
        }
    }

    @NamespaceClass('lib')
    @Reflectable
    export class ServiceA extends Service {
        constructor() {
            super();
            console.log('ServiceA initialized');
        }
    }

    @NamespaceClass('lib')
    @Reflectable
    export class ServiceB extends Service {
        sa: ServiceA;
        constructor(sa: ServiceA) {
            super();
            this.sa = sa;
            console.log('ServiceB initialized');
        }
    }
}

// 也可以单独导出类，提供另一种使用方式
export const { ServiceA, ServiceB, Service } = lib;
