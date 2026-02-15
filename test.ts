

// function test(id: number, extra_conditions?: any) {

//     let conditions = {id: id, ...extra_conditions};
//     console.log("Conditions:", conditions);
// }

// test(123);
// test(456, { status: 'active' });
// let arr2 = [11,22]
// let arr = [33,22, ...arr2]
// console.log(arr)
// const className = 'MyClass';
// const MyClass = module[className];
// const instance = new MyClass();
// import "reflect-metadata";

// import { ServiceA, ServiceB } from './lib';

// console.log('开始测试反射元数据...');

// // 检查 ServiceA 的构造函数参数
// const serviceAParams = Reflect.getMetadata('design:paramtypes', ServiceA) || [];
// console.log('ServiceA 构造函数参数类型:', serviceAParams.map((type: any, index: number) => ({
//     index,
//     typeName: type?.name || 'unknown'
// })));

// // 检查 ServiceB 的构造函数参数
// const serviceBParams = Reflect.getMetadata('design:paramtypes', ServiceB) || [];
// console.log('ServiceB 构造函数参数类型:', serviceBParams.map((type: any, index: number) => ({
//     index,
//     typeName: type?.name || 'unknown'
// })));

// // 检查是否有其他元数据
// const serviceBKeys = Reflect.getMetadataKeys(ServiceB);
// console.log('ServiceB 的所有元数据键:', serviceBKeys);

// // 尝试创建实例进行测试
// console.log('\n测试实例创建:');
// try {
//     const serviceA = new ServiceA();
//     const serviceB = new ServiceB(serviceA);
//     console.log('实例创建成功');
// } catch (error) {
//     console.error('实例创建失败:', error);
// }

async function dynamicCreate(class_path: string) {
    /** class_path 格式：{module_path}.{class_name} */
    const last_dot_index = class_path.lastIndexOf('.');
    if (last_dot_index === -1) {
        throw new Error(`Invalid class path: ${class_path}`);
    }
    const module_path = class_path.substring(0, last_dot_index);
    const class_name = class_path.substring(last_dot_index + 1);
    const module = await import(`./${module_path}`);
    let cls = module[class_name];

    // 处理构造函数带参数情况
    // type clsParams = ConstructorParameters<typeof cls>;

    // type paramDetails = {
    //     [K in keyof clsParams]: {
    //         index: K,
    //         type: clsParams[K]
    //     }
    // };
    

    // const paramTypes = Reflect.getMetadata(
    //     'design:paramtypes', 
    //     cls
    // ) as ConstructorParameters<typeof cls>;

    // type Example = paramDetails;

    // paramTypes.forEach((type:any, index) => {
    //     console.log(`参数${index}:`, type.name);
    // });

    if (!cls) {
        throw new Error(`Class ${class_name} not found in module ${module_path}`);
    } else {
        return new cls();
    }
}

// dynamicCreate('lib.ServiceA').then((instance) => {
//     console.log('Instance created:', instance);
// }).catch((error) => {
//     console.error('Error creating instance:', error);
// });

// dynamicCreate('lib.ServiceB').then((instance) => {
//     console.log('Instance created:', instance);
// }).catch((error) => {
//     console.error('Error creating instance:', error);
// });

import "reflect-metadata";

// 方式1: 导入 namespace
import { lib } from './src/lib/service';

// 方式2: 也可以单独导入类
// import { ServiceA, ServiceB } from './src/lib/service';

console.log('测试 namespace 中的类引用...');

// 使用 namespace 中的类
try {
    // 创建 ServiceA 实例
    const sa = new lib.ServiceA();
    console.log('ServiceA 创建成功:', sa);
    
    // 创建 ServiceB 实例（需要 ServiceA 作为参数）
    const sb = new lib.ServiceB(sa);
    console.log('ServiceB 创建成功:', sb);
    
    // 测试反射元数据
    console.log('\n测试反射元数据:');
    const serviceBParams = Reflect.getMetadata('design:paramtypes', lib.ServiceB) || [];
    console.log('ServiceB 构造函数参数类型:', serviceBParams.map((type: any, index: number) => ({
        index,
        typeName: type?.name || 'unknown'
    })));
    
    // 检查所有元数据键
    const metadataKeys = Reflect.getMetadataKeys(lib.ServiceB);
    console.log('ServiceB 的所有元数据键:', metadataKeys);
    
    // 检查自定义的 namespace 元数据
    console.log('\n检查自定义 namespace 元数据:');
    const namespace = Reflect.getMetadata('namespace', lib.ServiceB);
    const className = Reflect.getMetadata('className', lib.ServiceB);
    const fullName = Reflect.getMetadata('fullName', lib.ServiceB);
    
    console.log('Namespace:', namespace);
    console.log('Class Name:', className);
    console.log('Full Name:', fullName);
    
    // 尝试获取 namespace 相关信息
    console.log('\n尝试获取 namespace 信息:');
    
    // 方法1: 检查构造函数的名称和完整路径
    console.log('ServiceB.name:', lib.ServiceB.name);
    console.log('ServiceB.constructor.name:', lib.ServiceB.constructor.name);
    
    // 方法2: 自定义元数据来存储 namespace 信息
    // 我们可以在装饰器中添加自定义元数据
    
    // 方法3: 通过函数的 toString() 来尝试获取信息
    const functionString = lib.ServiceB.toString();
    console.log('ServiceB.toString()的前100个字符:', functionString.substring(0, 100));
    
    // 方法4: 检查原型链
    console.log('ServiceB.prototype:', lib.ServiceB.prototype);
    console.log('ServiceB.prototype.constructor.name:', lib.ServiceB.prototype.constructor.name);
    
    // 方法5: 通过模块引用来获取 namespace 信息
    console.log('\n检查模块级别的 namespace:');
    console.log('lib namespace keys:', Object.keys(lib));
    
    // 检查类是否属于特定 namespace
    const isServiceBInLib = lib.ServiceB === lib.ServiceB;
    console.log('ServiceB 是否在 lib namespace 中:', isServiceBInLib);
    
    // 尝试反向查找 namespace
    function findNamespaceForClass(targetClass: any, rootObject: any, currentPath = ''): string | null {
        for (const [key, value] of Object.entries(rootObject)) {
            const newPath = currentPath ? `${currentPath}.${key}` : key;
            
            if (value === targetClass) {
                return newPath;
            }
            
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                const result = findNamespaceForClass(targetClass, value, newPath);
                if (result) return result;
            }
        }
        return null;
    }
    
    const namespacePath = findNamespaceForClass(lib.ServiceB, { lib });
    console.log('通过反向查找找到的 namespace 路径:', namespacePath);
    
} catch (error) {
    console.error('创建实例失败:', error);
}