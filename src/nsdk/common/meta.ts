/**
 * 服务装饰器（标记模块归属）
 */
export function Service(nserver: string) {
    return function <T extends { new (...args: any[]): {} }>(constructor: T) {
        // Reflect.defineMetadata('service:module', moduleName, constructor);
        Reflect.defineMetadata('nservice:nserver', nserver, constructor);
        return constructor;
    };
}

/**
 * 跨模块依赖注入装饰器
 * 只有跨模块依赖才需要显式声明
 */
export function InjectFromNServer(nserver: string, nservice: string) {
    return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
        const existingDeps = Reflect.getMetadata('inject:dependencies', target) || [];
        existingDeps[parameterIndex] = `${nserver}.${nservice}`;
        Reflect.defineMetadata('inject:dependencies', existingDeps, target);
    };
}
// export function InjectFromModule(moduleName: string, serviceName: string) {
//     return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
//         const existingDeps = Reflect.getMetadata('inject:dependencies', target) || [];
//         existingDeps[parameterIndex] = `${moduleName}.${serviceName}`;
//         Reflect.defineMetadata('inject:dependencies', existingDeps, target);
//     };
// }

/**
 * 依赖信息
 */
export interface DependencyInfo {
    nserver: string;
    nservice: string;
    // is_cross_module: boolean;
}

/**
 * 依赖分析器
 */
export class DependencyAnalyzer {
    /**
     * 分析服务的构造函数依赖
     */
    static analyzeDependencies(
        service_class: any,
        current_nserver: string
    ): DependencyInfo[] {
        // 获取构造函数参数类型
        const paramTypes = Reflect.getMetadata('design:paramtypes', service_class) || [];

        // 获取显式注入的依赖信息
        const explicitDeps = Reflect.getMetadata('inject:dependencies', service_class) || [];

        const dependencies: DependencyInfo[] = [];

        paramTypes.forEach((paramType: any, index: number) => {
            let nserver: string;
            let nservice: string;

            // 检查是否有显式的依赖声明
            if (explicitDeps[index]) {
                [nserver, nservice] = explicitDeps[index].split('.');
            } else {
                // 尝试从参数类型的元数据中获取模块信息
                nserver = Reflect.getMetadata('nservice:nserver', paramType) || current_nserver;
                nservice = paramType.name;
            }

            dependencies.push({
                nserver: nserver,
                nservice: nservice
            });
        });

        return dependencies;
    }
}

/**
 * 模块位置信息
 */
export interface ModuleLocation {
  node_id: string;
  host: string;
  port: number;
  is_local: boolean;
}
