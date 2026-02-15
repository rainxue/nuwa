/**
 * 数据脱敏工具类
 * 提供手机号码、邮箱地址等敏感信息的脱敏处理
 */
export class MaskUtil {
    /**
     * 手机号码脱敏
     * @param phone 手机号码
     * @param options 脱敏选项
     * @returns 脱敏后的手机号码
     */
    static maskPhone(phone: string, options?: {
        keepStart?: number;  // 保留开头几位（默认3位）
        keepEnd?: number;    // 保留结尾几位（默认4位）
        maskChar?: string;   // 掩码字符（默认*）
    }): string {
        if (!phone) {
            return '';
        }
        
        // 清理手机号（移除空格、短横线等）
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        
        const { 
            keepStart = 3, 
            keepEnd = 4, 
            maskChar = '*' 
        } = options || {};
        
        // 如果手机号太短，直接用*代替
        if (cleanPhone.length <= keepStart + keepEnd) {
            return maskChar.repeat(cleanPhone.length);
        }
        
        const start = cleanPhone.substring(0, keepStart);
        const end = cleanPhone.substring(cleanPhone.length - keepEnd);
        const maskLength = cleanPhone.length - keepStart - keepEnd;
        
        return start + maskChar.repeat(maskLength) + end;
    }
    
    /**
     * 邮箱地址脱敏
     * @param email 邮箱地址
     * @param options 脱敏选项
     * @returns 脱敏后的邮箱地址
     */
    static maskEmail(email: string, options?: {
        keepStart?: number;  // 保留用户名开头几位（默认1位）
        keepEnd?: number;    // 保留用户名结尾几位（默认1位）
        maskChar?: string;   // 掩码字符（默认*）
        keepDomain?: boolean; // 是否保留完整域名（默认true）
    }): string {
        if (!email) {
            return '';
        }
        
        const emailRegex = /^([^@]+)@(.+)$/;
        const match = email.match(emailRegex);
        
        if (!match) {
            return email; // 如果不是有效邮箱格式，直接返回
        }
        
        const [, username, domain] = match;
        const { 
            keepStart = 1, 
            keepEnd = 1, 
            maskChar = '*',
            keepDomain = true 
        } = options || {};
        
        let maskedUsername: string;
        
        if (username.length <= keepStart + keepEnd) {
            // 用户名太短，只显示第一个字符
            maskedUsername = username.charAt(0) + maskChar.repeat(Math.max(1, username.length - 1));
        } else {
            const start = username.substring(0, keepStart);
            const end = username.substring(username.length - keepEnd);
            const maskLength = Math.max(1, username.length - keepStart - keepEnd);
            maskedUsername = start + maskChar.repeat(maskLength) + end;
        }
        
        if (keepDomain) {
            return `${maskedUsername}@${domain}`;
        } else {
            // 域名也进行脱敏
            const domainParts = domain.split('.');
            if (domainParts.length >= 2) {
                const maskedDomain = domainParts[0].charAt(0) + maskChar.repeat(Math.max(1, domainParts[0].length - 1));
                return `${maskedUsername}@${maskedDomain}.${domainParts.slice(1).join('.')}`;
            }
            return `${maskedUsername}@${domain}`;
        }
    }
    
    /**
     * 身份证号码脱敏
     * @param idCard 身份证号码
     * @param options 脱敏选项
     * @returns 脱敏后的身份证号码
     */
    static maskIdCard(idCard: string, options?: {
        keepStart?: number;  // 保留开头几位（默认4位）
        keepEnd?: number;    // 保留结尾几位（默认4位）
        maskChar?: string;   // 掩码字符（默认*）
    }): string {
        if (!idCard) {
            return '';
        }
        
        const { 
            keepStart = 4, 
            keepEnd = 4, 
            maskChar = '*' 
        } = options || {};
        
        if (idCard.length <= keepStart + keepEnd) {
            return maskChar.repeat(idCard.length);
        }
        
        const start = idCard.substring(0, keepStart);
        const end = idCard.substring(idCard.length - keepEnd);
        const maskLength = idCard.length - keepStart - keepEnd;
        
        return start + maskChar.repeat(maskLength) + end;
    }
    
    /**
     * 银行卡号脱敏
     * @param cardNumber 银行卡号
     * @param options 脱敏选项
     * @returns 脱敏后的银行卡号
     */
    static maskBankCard(cardNumber: string, options?: {
        keepStart?: number;  // 保留开头几位（默认4位）
        keepEnd?: number;    // 保留结尾几位（默认4位）
        maskChar?: string;   // 掩码字符（默认*）
        addSpaces?: boolean; // 是否添加空格分隔（默认true）
    }): string {
        if (!cardNumber) {
            return '';
        }
        
        // 清理卡号（移除空格等）
        const cleanCard = cardNumber.replace(/\s/g, '');
        
        const { 
            keepStart = 4, 
            keepEnd = 4, 
            maskChar = '*',
            addSpaces = true 
        } = options || {};
        
        if (cleanCard.length <= keepStart + keepEnd) {
            return maskChar.repeat(cleanCard.length);
        }
        
        const start = cleanCard.substring(0, keepStart);
        const end = cleanCard.substring(cleanCard.length - keepEnd);
        const maskLength = cleanCard.length - keepStart - keepEnd;
        
        let masked = start + maskChar.repeat(maskLength) + end;
        
        // 添加空格分隔（每4位一个空格）
        if (addSpaces) {
            masked = masked.replace(/(.{4})/g, '$1 ').trim();
        }
        
        return masked;
    }
    
    /**
     * 姓名脱敏
     * @param name 姓名
     * @param options 脱敏选项
     * @returns 脱敏后的姓名
     */
    static maskName(name: string, options?: {
        keepFirst?: boolean;  // 是否保留第一个字符（默认true）
        keepLast?: boolean;   // 是否保留最后一个字符（默认false）
        maskChar?: string;    // 掩码字符（默认*）
    }): string {
        if (!name) {
            return '';
        }
        
        const { 
            keepFirst = true, 
            keepLast = false, 
            maskChar = '*' 
        } = options || {};
        
        if (name.length === 1) {
            return keepFirst ? name : maskChar;
        }
        
        if (name.length === 2) {
            if (keepFirst && keepLast) {
                return name;
            } else if (keepFirst) {
                return name.charAt(0) + maskChar;
            } else if (keepLast) {
                return maskChar + name.charAt(1);
            } else {
                return maskChar.repeat(2);
            }
        }
        
        // 3个字符或以上
        let masked = '';
        
        if (keepFirst) {
            masked += name.charAt(0);
        }
        
        // 中间用*代替
        const middleLength = name.length - (keepFirst ? 1 : 0) - (keepLast ? 1 : 0);
        masked += maskChar.repeat(Math.max(1, middleLength));
        
        if (keepLast) {
            masked += name.charAt(name.length - 1);
        }
        
        return masked;
    }
    
    /**
     * 地址脱敏
     * @param address 地址
     * @param options 脱敏选项
     * @returns 脱敏后的地址
     */
    static maskAddress(address: string, options?: {
        keepStart?: number;  // 保留开头几位（默认6位）
        maskChar?: string;   // 掩码字符（默认*）
        keepLength?: number; // 脱敏部分的长度（默认6位）
    }): string {
        if (!address) {
            return '';
        }
        
        const { 
            keepStart = 6, 
            maskChar = '*',
            keepLength = 6 
        } = options || {};
        
        if (address.length <= keepStart) {
            return address;
        }
        
        const start = address.substring(0, keepStart);
        return start + maskChar.repeat(keepLength);
    }
    
    /**
     * 通用脱敏方法
     * @param data 要脱敏的数据
     * @param type 数据类型
     * @param options 脱敏选项
     * @returns 脱敏后的数据
     */
    static mask(data: string, type: 'phone' | 'email' | 'idcard' | 'bankcard' | 'name' | 'address', options?: any): string {
        switch (type) {
            case 'phone':
                return this.maskPhone(data, options);
            case 'email':
                return this.maskEmail(data, options);
            case 'idcard':
                return this.maskIdCard(data, options);
            case 'bankcard':
                return this.maskBankCard(data, options);
            case 'name':
                return this.maskName(data, options);
            case 'address':
                return this.maskAddress(data, options);
            default:
                return data;
        }
    }
    
    /**
     * 批量脱敏对象的属性
     * @param data 包含敏感数据的对象
     * @param maskConfig 脱敏配置映射（只需配置需要脱敏的字段）
     * @returns 脱敏后的对象
     */
    static maskObject<T extends Record<string, any>>(
        data: T,
        maskConfig: Partial<Record<keyof T, {
            type: 'phone' | 'email' | 'idcard' | 'bankcard' | 'name' | 'address';
            options?: any;
        }>>
    ): T {
        const result = { ...data } as any;
        
        for (const [key, config] of Object.entries(maskConfig)) {
            if (config && result[key] && typeof result[key] === 'string') {
                result[key] = this.mask(result[key], config.type, config.options);
            }
        }
        
        return result;
    }
    
    /**
     * 批量脱敏数组中对象的指定属性
     * @param dataArray 包含敏感数据的对象数组
     * @param maskConfig 脱敏配置映射（只需配置需要脱敏的字段）
     * @returns 脱敏后的对象数组
     */
    static maskArray<T extends Record<string, any>>(
        dataArray: T[],
        maskConfig: Partial<Record<keyof T, {
            type: 'phone' | 'email' | 'idcard' | 'bankcard' | 'name' | 'address';
            options?: any;
        }>>
    ): T[] {
        return dataArray.map(item => this.maskObject(item, maskConfig));
    }
}
