// MaskUtil 使用示例 (JavaScript 版本)
// 由于 TypeScript 编译问题，这里用 JavaScript 展示功能

// 模拟 MaskUtil 的核心功能
class MaskUtil {
    static maskPhone(phone, options = {}) {
        if (!phone) return '';
        
        const { keepStart = 3, keepEnd = 4, maskChar = '*' } = options;
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        
        if (cleanPhone.length <= keepStart + keepEnd) {
            return maskChar.repeat(cleanPhone.length);
        }
        
        const start = cleanPhone.substring(0, keepStart);
        const end = cleanPhone.substring(cleanPhone.length - keepEnd);
        const maskLength = cleanPhone.length - keepStart - keepEnd;
        
        return start + maskChar.repeat(maskLength) + end;
    }
    
    static maskEmail(email, options = {}) {
        if (!email) return '';
        
        const emailRegex = /^([^@]+)@(.+)$/;
        const match = email.match(emailRegex);
        
        if (!match) return email;
        
        const [, username, domain] = match;
        const { keepStart = 1, keepEnd = 1, maskChar = '*', keepDomain = true } = options;
        
        let maskedUsername;
        if (username.length <= keepStart + keepEnd) {
            maskedUsername = username.charAt(0) + maskChar.repeat(Math.max(1, username.length - 1));
        } else {
            const start = username.substring(0, keepStart);
            const end = username.substring(username.length - keepEnd);
            const maskLength = Math.max(1, username.length - keepStart - keepEnd);
            maskedUsername = start + maskChar.repeat(maskLength) + end;
        }
        
        return keepDomain ? `${maskedUsername}@${domain}` : `${maskedUsername}@${domain}`;
    }
    
    static maskName(name, options = {}) {
        if (!name) return '';
        
        const { keepFirst = true, keepLast = false, maskChar = '*' } = options;
        
        if (name.length === 1) {
            return keepFirst ? name : maskChar;
        }
        
        if (name.length === 2) {
            if (keepFirst && keepLast) return name;
            else if (keepFirst) return name.charAt(0) + maskChar;
            else if (keepLast) return maskChar + name.charAt(1);
            else return maskChar.repeat(2);
        }
        
        let masked = '';
        if (keepFirst) masked += name.charAt(0);
        
        const middleLength = name.length - (keepFirst ? 1 : 0) - (keepLast ? 1 : 0);
        masked += maskChar.repeat(Math.max(1, middleLength));
        
        if (keepLast) masked += name.charAt(name.length - 1);
        
        return masked;
    }
}

console.log('=== MaskUtil 功能演示 ===\n');

// 1. 基础脱敏功能
console.log('1. 基础脱敏功能：');
console.log('手机号脱敏:', MaskUtil.maskPhone('13812345678'));
console.log('邮箱脱敏:', MaskUtil.maskEmail('zhangsan@example.com'));
console.log('姓名脱敏:', MaskUtil.maskName('张三丰'));
console.log();

// 2. 自定义脱敏选项
console.log('2. 自定义脱敏选项：');
console.log('手机号（保留4位开头）:', MaskUtil.maskPhone('13812345678', { keepStart: 4, keepEnd: 3 }));
console.log('邮箱（更多脱敏）:', MaskUtil.maskEmail('admin@company.com', { keepStart: 2, keepEnd: 0 }));
console.log('姓名（保留首尾）:', MaskUtil.maskName('欧阳修', { keepLast: true }));
console.log();

// 3. 处理格式化数据
console.log('3. 处理格式化数据：');
console.log('格式化手机号:', MaskUtil.maskPhone('138-1234-5678'));
console.log('带空格手机号:', MaskUtil.maskPhone('138 1234 5678'));
console.log('带括号手机号:', MaskUtil.maskPhone('(138) 1234-5678'));
console.log();

// 4. 边界情况处理
console.log('4. 边界情况处理：');
console.log('短手机号:', MaskUtil.maskPhone('123456'));
console.log('单字姓名:', MaskUtil.maskName('王'));
console.log('无效邮箱:', MaskUtil.maskEmail('invalid-email'));
console.log('空字符串:', MaskUtil.maskPhone(''));
console.log();

// 5. 不同遮蔽字符
console.log('5. 使用不同遮蔽字符：');
console.log('使用 ● :', MaskUtil.maskPhone('13812345678', { maskChar: '●' }));
console.log('使用 # :', MaskUtil.maskEmail('user@example.com', { maskChar: '#' }));
console.log('使用 X :', MaskUtil.maskName('张三丰', { maskChar: 'X' }));
console.log();

console.log('=== 功能演示完成 ===');
console.log('✅ 已保留 maskUtil.ts 作为主要的脱敏工具类');
console.log('✅ 支持多种数据类型的脱敏处理');
console.log('✅ 提供灵活的配置选项');
console.log('✅ 支持批量处理功能');
console.log('✅ 包含完整的单元测试');
