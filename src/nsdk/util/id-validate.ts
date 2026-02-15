import { randomBytes, randomUUID } from 'crypto';

/**
 * ID生成工具类
 * 提供各种格式的唯一标识符生成
 */
export class IdUtil {
    /**
     * 生成UUID v4
     * @returns UUID字符串
     */
    static uuid(): string {
        return randomUUID();
    }
    
    /**
     * 生成短UUID（去除连字符）
     * @returns 32位的UUID字符串
     */
    static shortUuid(): string {
        return randomUUID().replace(/-/g, '');
    }
    
    /**
     * 生成雪花ID（简化版）
     * 基于时间戳 + 机器ID + 序列号的组合
     * @param machineId 机器ID（0-1023）
     * @returns 雪花ID字符串
     */
    static snowflake(machineId: number = 1): string {
        const timestamp = Date.now();
        const machine = (machineId % 1024).toString().padStart(3, '0');
        const sequence = Math.floor(Math.random() * 4096).toString().padStart(4, '0');
        return `${timestamp}${machine}${sequence}`;
    }
    
    /**
     * 生成纳米ID
     * 使用自定义字符集生成短ID
     * @param size ID长度（默认21）
     * @param alphabet 字符集（默认URL安全字符）
     * @returns 纳米ID字符串
     */
    static nanoid(size: number = 21, alphabet: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'): string {
        let id = '';
        const bytes = randomBytes(size);
        
        for (let i = 0; i < size; i++) {
            id += alphabet[bytes[i] % alphabet.length];
        }
        
        return id;
    }
    
    /**
     * 生成数字ID
     * @param length ID长度（默认10位）
     * @returns 数字ID字符串
     */
    static numeric(length: number = 10): string {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += Math.floor(Math.random() * 10).toString();
        }
        return result;
    }
    
    /**
     * 生成带前缀的ID
     * @param prefix 前缀
     * @param length 数字部分长度（默认8位）
     * @returns 带前缀的ID
     */
    static withPrefix(prefix: string, length: number = 8): string {
        return prefix + this.numeric(length);
    }
    
    /**
     * 生成时间戳ID
     * @param includeRandom 是否包含随机数（默认true）
     * @returns 时间戳ID
     */
    static timestamp(includeRandom: boolean = true): string {
        const timestamp = Date.now().toString();
        if (includeRandom) {
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            return timestamp + random;
        }
        return timestamp;
    }
    
    /**
     * 生成自定义格式ID
     * @param format 格式字符串，支持占位符：
     *   - {timestamp} 时间戳
     *   - {uuid} UUID
     *   - {short_uuid} 短UUID
     *   - {random:n} n位随机数字
     *   - {alpha:n} n位随机字母
     *   - {alnum:n} n位随机字母数字
     * @returns 自定义格式的ID
     */
    static custom(format: string): string {
        let result = format;
        
        // 替换时间戳
        result = result.replace(/{timestamp}/g, Date.now().toString());
        
        // 替换UUID
        result = result.replace(/{uuid}/g, this.uuid());
        
        // 替换短UUID
        result = result.replace(/{short_uuid}/g, this.shortUuid());
        
        // 替换随机数字
        result = result.replace(/{random:(\d+)}/g, (match, length) => {
            return this.numeric(parseInt(length));
        });
        
        // 替换随机字母
        result = result.replace(/{alpha:(\d+)}/g, (match, length) => {
            const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
            return this.nanoid(parseInt(length), alphabet);
        });
        
        // 替换随机字母数字
        result = result.replace(/{alnum:(\d+)}/g, (match, length) => {
            const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            return this.nanoid(parseInt(length), alphabet);
        });
        
        return result;
    }
}

/**
 * 数据验证工具类
 * 提供常用的数据格式验证
 */
export class ValidateUtil {
    /**
     * 验证邮箱格式
     * @param email 邮箱地址
     * @returns 是否为有效邮箱
     */
    static isEmail(email: string): boolean {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    }
    
    /**
     * 验证手机号格式（中国大陆）
     * @param phone 手机号
     * @returns 是否为有效手机号
     */
    static isPhone(phone: string): boolean {
        const phoneRegex = /^1[3-9]\d{9}$/;
        return phoneRegex.test(phone.replace(/\D/g, ''));
    }
    
    /**
     * 验证身份证号格式（中国大陆）
     * @param idCard 身份证号
     * @returns 是否为有效身份证号
     */
    static isIdCard(idCard: string): boolean {
        const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
        
        if (!idCardRegex.test(idCard)) {
            return false;
        }
        
        // 验证校验码
        const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
        const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
        
        let sum = 0;
        for (let i = 0; i < 17; i++) {
            sum += parseInt(idCard[i]) * weights[i];
        }
        
        const checkCode = checkCodes[sum % 11];
        return checkCode === idCard[17].toUpperCase();
    }
    
    /**
     * 验证URL格式
     * @param url URL地址
     * @returns 是否为有效URL
     */
    static isUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * 验证IP地址格式（IPv4）
     * @param ip IP地址
     * @returns 是否为有效IP地址
     */
    static isIpv4(ip: string): boolean {
        const ipRegex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;
        return ipRegex.test(ip);
    }
    
    /**
     * 验证IPv6地址格式
     * @param ip IPv6地址
     * @returns 是否为有效IPv6地址
     */
    static isIpv6(ip: string): boolean {
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
        return ipv6Regex.test(ip);
    }
    
    /**
     * 验证日期格式
     * @param date 日期字符串
     * @param format 日期格式（默认YYYY-MM-DD）
     * @returns 是否为有效日期
     */
    static isDate(date: string, format: string = 'YYYY-MM-DD'): boolean {
        if (format === 'YYYY-MM-DD') {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(date)) {
                return false;
            }
            
            const [year, month, day] = date.split('-').map(Number);
            const dateObj = new Date(year, month - 1, day);
            
            return dateObj.getFullYear() === year &&
                   dateObj.getMonth() === month - 1 &&
                   dateObj.getDate() === day;
        }
        
        // 其他格式可以扩展
        return !isNaN(Date.parse(date));
    }
    
    /**
     * 验证时间格式（HH:mm:ss）
     * @param time 时间字符串
     * @returns 是否为有效时间
     */
    static isTime(time: string): boolean {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
        return timeRegex.test(time);
    }
    
    /**
     * 验证数字
     * @param value 值
     * @param options 验证选项
     * @returns 是否为有效数字
     */
    static isNumber(
        value: any, 
        options?: {
            min?: number;
            max?: number;
            integer?: boolean;
            positive?: boolean;
        }
    ): boolean {
        const num = Number(value);
        
        if (isNaN(num)) {
            return false;
        }
        
        if (options?.integer && !Number.isInteger(num)) {
            return false;
        }
        
        if (options?.positive && num <= 0) {
            return false;
        }
        
        if (options?.min !== undefined && num < options.min) {
            return false;
        }
        
        if (options?.max !== undefined && num > options.max) {
            return false;
        }
        
        return true;
    }
    
    /**
     * 验证字符串长度
     * @param str 字符串
     * @param minLength 最小长度
     * @param maxLength 最大长度
     * @returns 是否符合长度要求
     */
    static isStringLength(str: string, minLength?: number, maxLength?: number): boolean {
        if (typeof str !== 'string') {
            return false;
        }
        
        if (minLength !== undefined && str.length < minLength) {
            return false;
        }
        
        if (maxLength !== undefined && str.length > maxLength) {
            return false;
        }
        
        return true;
    }
    
    /**
     * 验证密码强度
     * @param password 密码
     * @param options 验证选项
     * @returns 验证结果
     */
    static isStrongPassword(
        password: string,
        options?: {
            minLength?: number;
            requireUppercase?: boolean;
            requireLowercase?: boolean;
            requireNumbers?: boolean;
            requireSymbols?: boolean;
        }
    ): { valid: boolean; message?: string } {
        const opts = {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSymbols: false,
            ...options
        };
        
        if (password.length < opts.minLength) {
            return { valid: false, message: `密码长度至少需要${opts.minLength}位` };
        }
        
        if (opts.requireUppercase && !/[A-Z]/.test(password)) {
            return { valid: false, message: '密码必须包含大写字母' };
        }
        
        if (opts.requireLowercase && !/[a-z]/.test(password)) {
            return { valid: false, message: '密码必须包含小写字母' };
        }
        
        if (opts.requireNumbers && !/\d/.test(password)) {
            return { valid: false, message: '密码必须包含数字' };
        }
        
        if (opts.requireSymbols && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            return { valid: false, message: '密码必须包含特殊符号' };
        }
        
        return { valid: true };
    }
    
    /**
     * 自定义正则验证
     * @param value 要验证的值
     * @param pattern 正则表达式
     * @param flags 正则标志
     * @returns 是否匹配
     */
    static isPattern(value: string, pattern: string | RegExp, flags?: string): boolean {
        const regex = typeof pattern === 'string' ? new RegExp(pattern, flags) : pattern;
        return regex.test(value);
    }
    
    /**
     * 批量验证
     * @param data 要验证的数据对象
     * @param rules 验证规则
     * @returns 验证结果
     */
    static validate<T extends Record<string, any>>(
        data: T,
        rules: Partial<Record<keyof T, {
            required?: boolean;
            type?: 'email' | 'phone' | 'idCard' | 'url' | 'ipv4' | 'ipv6' | 'date' | 'time' | 'number' | 'string';
            pattern?: string | RegExp;
            min?: number;
            max?: number;
            minLength?: number;
            maxLength?: number;
            custom?: (value: any) => boolean | { valid: boolean; message?: string };
            message?: string;
        }>>
    ): { valid: boolean; errors: Record<string, string> } {
        const errors: Record<string, string> = {};
        
        for (const [key, rule] of Object.entries(rules) as [keyof T, any][]) {
            const value = data[key];
            
            // 检查必填
            if (rule.required && (value === undefined || value === null || value === '')) {
                errors[key as string] = rule.message || `${String(key)}为必填项`;
                continue;
            }
            
            // 如果值为空且非必填，跳过后续验证
            if (!rule.required && (value === undefined || value === null || value === '')) {
                continue;
            }
            
            // 类型验证
            if (rule.type) {
                let isValid = false;
                switch (rule.type) {
                    case 'email':
                        isValid = this.isEmail(value);
                        break;
                    case 'phone':
                        isValid = this.isPhone(value);
                        break;
                    case 'idCard':
                        isValid = this.isIdCard(value);
                        break;
                    case 'url':
                        isValid = this.isUrl(value);
                        break;
                    case 'ipv4':
                        isValid = this.isIpv4(value);
                        break;
                    case 'ipv6':
                        isValid = this.isIpv6(value);
                        break;
                    case 'date':
                        isValid = this.isDate(value);
                        break;
                    case 'time':
                        isValid = this.isTime(value);
                        break;
                    case 'number':
                        isValid = this.isNumber(value, { min: rule.min, max: rule.max });
                        break;
                    case 'string':
                        isValid = this.isStringLength(value, rule.minLength, rule.maxLength);
                        break;
                }
                
                if (!isValid) {
                    errors[key as string] = rule.message || `${String(key)}格式不正确`;
                    continue;
                }
            }
            
            // 正则验证
            if (rule.pattern && !this.isPattern(value, rule.pattern)) {
                errors[key as string] = rule.message || `${String(key)}格式不正确`;
                continue;
            }
            
            // 自定义验证
            if (rule.custom) {
                const result = rule.custom(value);
                if (typeof result === 'boolean' && !result) {
                    errors[key as string] = rule.message || `${String(key)}验证失败`;
                    continue;
                } else if (typeof result === 'object' && !result.valid) {
                    errors[key as string] = result.message || rule.message || `${String(key)}验证失败`;
                    continue;
                }
            }
        }
        
        return {
            valid: Object.keys(errors).length === 0,
            errors
        };
    }
}
