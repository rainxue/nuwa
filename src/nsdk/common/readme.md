# 背景
- 开发语言：typescript
- 运行环境：Node.js + Fastify

# 代码组织结构
- 代码分模块、分服务组织结构：src/nservers/{模块名}/{服务名}.ts
- 其中{服务名}.ts中可能包含多个服务类。
- 服务类的构造函数中可能会注入其他服务类实例，形成依赖关系。

示例：
src/nservers/sys/service.ts
```typescript
export class LogService {
    constructor() {
        // 初始化日志服务
    }
    log(message: string) {
        console.log(`[LOG]: ${message}`);
    }
}
```

src/nservers/user/service.ts
```typescript
import { LogService } from '../sys/service';
export class UserService {
    logService: LogService;
    constructor(logService: LogService) {
        this.logService = logService;
    }
    createUser(username: string) {
        // 创建用户逻辑
        this.logService.log(`User ${username} created.`);
    }
}
```

# 设计要求
- 自动实现依赖注入
- 根据需要不同的模块可能会进行分布式部署，比如
  - 场景1：sys和user两个模块部署在同一台机器上，所以UserService的构造函数中注入LogService实例是本地实例
  - 场景2：sys和user两个模块部署在不同的机器上，所以UserService的构造函数中注入LogService实例是一个远程代理实例
- 有一个配置文件可以配置，每台机器部署哪些模块
- 需要实现一个工厂函数createService，传入模块名和服务名，根据配置文件动态决定依赖注入返回对应的服务类实例是本地实例还是原创代理实例

# 设计挑战
- 动态依赖注入：根据部署配置决定注入本地实例还是远程代理
- 分布式服务发现：跨机器的服务调用
- 透明的远程代理：远程调用对业务代码透明
- 配置驱动的部署：通过配置文件控制服务分布

# 解决方案
提供了一个完整的分布式服务架构，支持透明的依赖注入和灵活的部署配置。
## 透明性
- 业务代码无需感知服务是本地还是远程
- 依赖注入自动处理分布式调用
## 灵活性
- 通过配置文件灵活调整部署结构
- 支持服务在不同节点间迁移
## 类型安全
- 完整的 TypeScript 类型支持
- 编译时依赖检查
## 性能优化
- 本地服务直接调用，无网络开销
- 远程服务调用缓存和连接池优化
## 可扩展性
- 支持服务注册发现
- 支持负载均衡和容错


1. 复杂度降低
配置文件更简单：只需配置模块级别
依赖分析更精确：区分模块内/跨模块依赖
缓存策略更高效：本地服务单例缓存
2. 性能提升
模块内依赖：零网络开销，直接实例化
本地服务缓存：避免重复创建实例
预热机制：启动时加载本地模块
3. 开发体验
模块内依赖：无需任何特殊标记
跨模块依赖：仅需 @InjectFromModule 标记
类型安全：完整的 TypeScript 支持
4. 运维友好
配置简化：只关心模块分布
部署灵活：模块级别的迁移
监控精确：区分本地/远程调用
这个优化方案充分利用了"同模块内服务必定同机部署"的约束，大幅简化了系统复杂度，同时保持了分布式部署的灵活性。