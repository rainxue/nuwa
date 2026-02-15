export function Singleton<T extends { new (...args: any[]): {} }>(constructor: T) {
    let instance: T;
    return class extends constructor {
        constructor(...args: any[]) {
            if (instance) {
                return instance;
            }
            super(...args);
            instance = this as any;
            return instance;
        }
    } as T;
}
