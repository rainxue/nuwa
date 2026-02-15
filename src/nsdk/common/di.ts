
import 'reflect-metadata';
import * as path from 'path';
import { Singleton } from './singleton';
import { ModuleLocation,DependencyAnalyzer } from './meta';
import { RemoteProxyGenerator } from './remote_proxy';
import { nhost_service,NHostService } from './nhost_service';

export class DIContainer {
    private services: Map<string, any>;
    nhost_service: NHostService;
    private nserver_cache: Map<string, any> = new Map();
    constructor() {
        this.services = new Map();
        this.nhost_service = nhost_service;
    }
    register(name: string, instance: any) {
        if (this.services.has(name)) {
            throw new Error(`Service ${name} is already registered.`);
        }
        this.services.set(name, instance);
    }
    
    // resolve<T>(name: string): T {
    //     const service = this.services.get(name);
    //     if (!service) {
    //         // 判断是本地模块还是远程模块
    //         throw new Error(`Service ${name} not found.`);
    //     }
    //     return service as T;
    // }
    async resolve(nservice: string, nserver: string): Promise<any> {
        const key = `${nserver}@${nservice}`;
        const service = this.services.get(key);
        if (!service) {
            const current_nhost = this.nhost_service.get_current_nhost();
            if(current_nhost.nservers.includes(nserver)) {
                // 本地模块
                // 实例化本地模块
                // 加载本地模块的定义，判断构造函数是否有依赖
                let new_service = await this.create_local_service(nserver, nservice);
                this.services.set(key, new_service);
                return new_service;
            } else {
                // 远程模块
                let new_service = this.nhost_service.get_remote_service(nservice, nserver);
                this.services.set(key, new_service);
                return new_service;
            }
        } else {
            return service;
        }
    }
    async load_nserver(nserver: string): Promise<any> {
        if (this.nserver_cache.has(nserver)) {
            return this.nserver_cache.get(nserver);
        }
        try {
            const nserver_path = path.join(__dirname, '../..', 'nservers', nserver);
            const module = await import(nserver_path);

            this.nserver_cache.set(nserver, module);
            return module;
        } catch (error) {
            throw new Error(`Failed to load nserver ${nserver}: ${(error as any).message}`);
        }
    }
    async create_local_service(nserver: string, nservice: string): Promise<any> {
        const nserver_module = await this.load_nserver(nserver);
        const ServiceClass = nserver_module[nservice];
        if (!ServiceClass) {
            throw new Error(`Service ${nservice} not found in nserver ${nserver}`);
        }
        // 分析依赖
        let dependencies = DependencyAnalyzer.analyzeDependencies(ServiceClass, nserver);
        // 这里可以添加依赖注入逻辑
        let resolvedDependencies = await Promise.all(
            dependencies.map(dep => this.resolve(dep.nserver, dep.nservice))
        );

        return new ServiceClass(...resolvedDependencies);
    }
}
export const di_container = new DIContainer();

// /**
//  * 依赖信息
//  */
// interface DependencyInfo {
//     module: string;
//     service: string;
//     is_cross_module: boolean;
// }

// /**
//  * 依赖分析器
//  */
// export class DependencyAnalyzer {
//     /**
//      * 分析服务的构造函数依赖
//      */
//     static analyzeDependencies(
//         ServiceClass: any,
//         currentModule: string
//     ): DependencyInfo[] {
//         // 获取构造函数参数类型
//         const paramTypes = Reflect.getMetadata('design:paramtypes', ServiceClass) || [];

//         // 获取显式注入的依赖信息
//         const explicitDeps = Reflect.getMetadata('inject:dependencies', ServiceClass) || [];

//         const dependencies: DependencyInfo[] = [];

//         paramTypes.forEach((paramType: any, index: number) => {
//             let depModule: string;
//             let depService: string;

//             // 检查是否有显式的依赖声明
//             if (explicitDeps[index]) {
//                 [depModule, depService] = explicitDeps[index].split('.');
//             } else {
//                 // 尝试从参数类型的元数据中获取模块信息
//                 depModule = Reflect.getMetadata('service:module', paramType) || currentModule;
//                 depService = paramType.name;
//             }

//             dependencies.push({
//                 module: depModule,
//                 service: depService,
//                 is_cross_module: depModule !== currentModule
//             });
//         });

//         return dependencies;
//     }
// }


// /**
//  * 模块注册中心（简化版）
//  */
// // @Injectable('ModuleRegistry')
// @Singleton
// export class ModuleRegistry {
//     private modules: Map<string, ModuleLocation> = new Map();
//     private config: any;
//     private currentNode: string = '';
//     private localModules: Set<string> = new Set();

//     constructor() {
//         this.loadConfig();
//     }

//     private loadConfig(): void {
//         try {
//             const fs = require('fs');
//             const path = require('path');
//             const configPath = path.join(process.cwd(), 'config/deployment.json');
//             this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
//             this.currentNode = this.config.current_node;
//             this.buildModuleMap();
//         } catch (error) {
//             // throw new Error(`Failed to load deployment config: ${error.message}`);
//         }
//     }

//     private buildModuleMap(): void {
//         // 构建所有模块的位置映射
//         for (const [nodeId, nodeConfig] of Object.entries(this.config.nodes)) {
//             const node = nodeConfig as any;
//             for (const moduleName of node.modules) {
//                 const isLocal = nodeId === this.currentNode;

//                 this.modules.set(moduleName, {
//                     node_id: nodeId,
//                     host: node.host,
//                     port: node.port,
//                     is_local: isLocal
//                 });

//                 if (isLocal) {
//                     this.localModules.add(moduleName);
//                 }
//             }
//         }
//     }

//     /**
//      * 检查模块是否为本地模块
//      */
//     isLocalModule(moduleName: string): boolean {
//         return this.localModules.has(moduleName);
//     }

//     /**
//      * 获取模块位置信息
//      */
//     getModuleLocation(moduleName: string): ModuleLocation | null {
//         return this.modules.get(moduleName) || null;
//     }

//     /**
//      * 获取所有本地模块
//      */
//     getLocalModules(): string[] {
//         return Array.from(this.localModules);
//     }

//     /**
//      * 检查两个模块是否在同一节点
//      */
//     areModulesColocated(module1: string, module2: string): boolean {
//         const loc1 = this.modules.get(module1);
//         const loc2 = this.modules.get(module2);
//         return loc1?.node_id === loc2?.node_id;
//     }
// }


// /**
//  * 优化的分布式依赖注入容器
//  */
// export class OptimizedDistributedDI extends DIContainer {
//     private moduleRegistry: ModuleRegistry;
//     private moduleCache: Map<string, any> = new Map();
//     private localServiceCache: Map<string, any> = new Map();

//     constructor() {
//         super();
//         this.moduleRegistry = new ModuleRegistry();
//     }

//     /**
//      * 创建服务实例的核心工厂方法
//      */
//     async createService<T extends Record<string, any>>(moduleName: string, serviceName: string): Promise<T> {
//         const serviceKey = `${moduleName}.${serviceName}`;

//         // 检查本地缓存
//         if (this.localServiceCache.has(serviceKey)) {
//             return this.localServiceCache.get(serviceKey);
//         }

//         // 判断是本地模块还是远程模块
//         if (this.moduleRegistry.isLocalModule(moduleName)) {
//             const instance = await this.createLocalService<T>(moduleName, serviceName);
//             this.localServiceCache.set(serviceKey, instance);
//             return instance;
//         } else {
//             return this.createRemoteService<T>(moduleName, serviceName);
//         }
//     }

//     /**
//      * 创建本地服务实例（包含依赖注入）
//      */
//     private async createLocalService<T>(moduleName: string, serviceName: string): Promise<T> {
//         const module = await this.loadModule(moduleName);
//         const ServiceClass = module[serviceName];

//         if (!ServiceClass) {
//             throw new Error(`Service ${serviceName} not found in module ${moduleName}`);
//         }

//         // 分析依赖
//         const dependencies = DependencyAnalyzer.analyzeDependencies(ServiceClass, moduleName);

//         // 解析依赖实例
//         const resolvedDependencies = await Promise.all(
//             dependencies.map(dep => this.resolveDependency(dep, moduleName))
//         );

//         return new ServiceClass(...resolvedDependencies);
//     }

//     /**
//      * 解析单个依赖
//      */
//     private async resolveDependency(dep: any, currentModule: string): Promise<any> {
//         if (dep.is_cross_module) {
//             // 跨模块依赖：需要判断远程还是本地
//             return this.createService(dep.module, dep.service);
//         } else {
//             // 模块内依赖：必定是本地，直接创建
//             return this.createLocalServiceDirect(dep.module, dep.service);
//         }
//     }

//     /**
//      * 直接创建本地服务（用于模块内依赖）
//      */
//     private async createLocalServiceDirect<T>(moduleName: string, serviceName: string): Promise<T> {
//         const serviceKey = `${moduleName}.${serviceName}`;

//         if (this.localServiceCache.has(serviceKey)) {
//             return this.localServiceCache.get(serviceKey);
//         }

//         const module = await this.loadModule(moduleName);
//         const ServiceClass = module[serviceName];

//         if (!ServiceClass) {
//             throw new Error(`Service ${serviceName} not found in module ${moduleName}`);
//         }

//         // 递归解析依赖（但限制在同一模块内）
//         const dependencies = DependencyAnalyzer.analyzeDependencies(ServiceClass, moduleName);
//         const localDependencies = dependencies.filter(dep => !dep.is_cross_module);

//         const resolvedDependencies = await Promise.all(
//             localDependencies.map(dep => this.createLocalServiceDirect(dep.module, dep.service))
//         );

//         const instance = new ServiceClass(...resolvedDependencies);
//         this.localServiceCache.set(serviceKey, instance);

//         return instance;
//     }

//     /**
//      * 创建远程服务代理
//      */
//     private createRemoteService<T extends Record<string, any>>(moduleName: string, serviceName: string): T {
//         const location = this.moduleRegistry.getModuleLocation(moduleName);

//         if (!location) {
//             throw new Error(`Module ${moduleName} not found in deployment config`);
//         }

//         return RemoteProxyGenerator.createProxy<T>(
//             location,
//             moduleName,
//             serviceName
//         );
//     }

//     /**
//      * 加载模块
//      */
//     private async loadModule(moduleName: string): Promise<any> {
//         if (this.moduleCache.has(moduleName)) {
//             return this.moduleCache.get(moduleName);
//         }

//         try {
//             const modulePath = `../../nservers/${moduleName}/service`;
//             const module = await import(modulePath);
//             this.moduleCache.set(moduleName, module);
//             return module;
//         } catch (error) {
//             // throw new Error(`Failed to load module ${moduleName}: ${error.message}`);
//         }
//     }

//     /**
//      * 预热本地模块（启动时调用）
//      */
//     async warmupLocalModules(): Promise<void> {
//         const localModules = this.moduleRegistry.getLocalModules();

//         for (const moduleName of localModules) {
//             try {
//                 await this.loadModule(moduleName);
//                 console.log(`Module ${moduleName} preloaded successfully`);
//             } catch (error) {
//                 // console.warn(`Failed to preload module ${moduleName}:`, error.message);
//             }
//         }
//     }
// }

// // 全局实例
// export const optimizedDI = new OptimizedDistributedDI();