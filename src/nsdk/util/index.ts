// 加密和哈希工具
export { CryptoUtil, HashUtil, PasswordUtil } from './crypto';

// 数据脱敏工具
export { MaskUtil } from './maskUtil';

// ID生成和数据验证工具
export { IdUtil, ValidateUtil } from './id-validate';

// 日期时间工具
export { DateUtil } from './date';

// 导入工具类以便在Utils中使用
import { CryptoUtil, HashUtil, PasswordUtil } from './crypto';
import { MaskUtil } from './maskUtil';
import { IdUtil, ValidateUtil } from './id-validate';
import { DateUtil } from './date';

// 导出类型定义
export type MaskType = 'phone' | 'email' | 'idCard' | 'name' | 'bankCard' | 'address';

export type TimeUnit = 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';

export type ValidationRule = {
    required?: boolean;
    type?: 'email' | 'phone' | 'idCard' | 'url' | 'ipv4' | 'ipv6' | 'date' | 'time' | 'number' | 'string';
    pattern?: string | RegExp;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    custom?: (value: any) => boolean | { valid: boolean; message?: string };
    message?: string;
};

export type ValidationResult = {
    valid: boolean;
    errors: Record<string, string>;
};

// 常用工具函数
export const Utils = {
    /**
     * 生成随机字符串
     * @param length 长度
     * @param charset 字符集
     * @returns 随机字符串
     */
    randomString(length: number = 8, charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
        return IdUtil.nanoid(length, charset);
    },

    /**
     * 延迟执行
     * @param ms 延迟毫秒数
     * @returns Promise
     */
    sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * 深拷贝对象
     * @param obj 要拷贝的对象
     * @returns 拷贝后的对象
     */
    deepClone<T>(obj: T): T {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (obj instanceof Date) {
            return new Date(obj.getTime()) as T;
        }

        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item)) as T;
        }

        if (typeof obj === 'object') {
            const cloned = {} as T;
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        }

        return obj;
    },

    /**
     * 防抖函数
     * @param func 要防抖的函数
     * @param wait 等待时间
     * @param immediate 是否立即执行
     * @returns 防抖后的函数
     */
    debounce<T extends (...args: any[]) => any>(
        func: T,
        wait: number,
        immediate: boolean = false
    ): (...args: Parameters<T>) => void {
        let timeout: NodeJS.Timeout | null = null;
        
        return function (...args: Parameters<T>) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            
            const callNow = immediate && !timeout;
            
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            
            if (callNow) func(...args);
        };
    },

    /**
     * 节流函数
     * @param func 要节流的函数
     * @param wait 等待时间
     * @returns 节流后的函数
     */
    throttle<T extends (...args: any[]) => any>(
        func: T,
        wait: number
    ): (...args: Parameters<T>) => void {
        let timeout: NodeJS.Timeout | null = null;
        let previous = 0;
        
        return function (...args: Parameters<T>) {
            const now = Date.now();
            const remaining = wait - (now - previous);
            
            if (remaining <= 0 || remaining > wait) {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
                previous = now;
                func(...args);
            } else if (!timeout) {
                timeout = setTimeout(() => {
                    previous = Date.now();
                    timeout = null;
                    func(...args);
                }, remaining);
            }
        };
    },

    /**
     * 重试函数
     * @param func 要重试的函数
     * @param maxAttempts 最大重试次数
     * @param delay 重试延迟（毫秒）
     * @returns Promise
     */
    async retry<T>(
        func: () => Promise<T>,
        maxAttempts: number = 3,
        delay: number = 1000
    ): Promise<T> {
        let lastError: Error;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await func();
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                
                if (attempt === maxAttempts) {
                    throw lastError;
                }
                
                await this.sleep(delay * attempt);
            }
        }
        
        throw lastError!;
    },

    /**
     * 数组去重
     * @param arr 数组
     * @param key 去重依据的键名（对象数组时使用）
     * @returns 去重后的数组
     */
    unique<T>(arr: T[], key?: keyof T): T[] {
        if (!key) {
            return [...new Set(arr)];
        }
        
        const seen = new Set();
        return arr.filter(item => {
            const value = item[key];
            if (seen.has(value)) {
                return false;
            }
            seen.add(value);
            return true;
        });
    },

    /**
     * 数组分组
     * @param arr 数组
     * @param key 分组依据的键名或函数
     * @returns 分组后的对象
     */
    groupBy<T, K extends keyof T>(
        arr: T[],
        key: K | ((item: T) => string | number)
    ): Record<string, T[]> {
        const groups: Record<string, T[]> = {};
        
        arr.forEach(item => {
            const groupKey = typeof key === 'function' ? key(item) : item[key];
            const keyStr = String(groupKey);
            
            if (!groups[keyStr]) {
                groups[keyStr] = [];
            }
            groups[keyStr].push(item);
        });
        
        return groups;
    },

    /**
     * 数组分块
     * @param arr 数组
     * @param size 块大小
     * @returns 分块后的数组
     */
    chunk<T>(arr: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    },

    /**
     * 对象键名转换为驼峰命名
     * @param obj 对象
     * @returns 转换后的对象
     */
    camelCaseKeys<T extends Record<string, any>>(obj: T): any {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.camelCaseKeys(item));
        }

        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
            const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            result[camelKey] = this.camelCaseKeys(value);
        }
        return result;
    },

    /**
     * 对象键名转换为下划线命名
     * @param obj 对象
     * @returns 转换后的对象
     */
    snakeCaseKeys<T extends Record<string, any>>(obj: T): any {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.snakeCaseKeys(item));
        }

        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            result[snakeKey] = this.snakeCaseKeys(value);
        }
        return result;
    },

    /**
     * 格式化文件大小
     * @param bytes 字节数
     * @param decimals 小数位数
     * @returns 格式化的文件大小
     */
    formatFileSize(bytes: number, decimals: number = 2): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },

    /**
     * 生成范围内的随机数
     * @param min 最小值
     * @param max 最大值
     * @param isInteger 是否为整数
     * @returns 随机数
     */
    randomNumber(min: number, max: number, isInteger: boolean = true): number {
        const random = Math.random() * (max - min) + min;
        return isInteger ? Math.floor(random) : random;
    },

    /**
     * 检查值是否为空
     * @param value 值
     * @returns 是否为空
     */
    isEmpty(value: any): boolean {
        if (value === null || value === undefined) {
            return true;
        }
        
        if (typeof value === 'string') {
            return value.trim() === '';
        }
        
        if (Array.isArray(value)) {
            return value.length === 0;
        }
        
        if (typeof value === 'object') {
            return Object.keys(value).length === 0;
        }
        
        return false;
    }
};

// 默认导出所有工具类
export default {
    CryptoUtil,
    HashUtil,
    PasswordUtil,
    MaskUtil,
    IdUtil,
    ValidateUtil,
    DateUtil,
    Utils
};
