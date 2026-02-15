/**
 * 日期时间工具类
 * 提供日期时间的格式化、计算、验证等功能
 */
export class DateUtil {
    /**
     * 格式化日期
     * @param date 日期对象或时间戳或日期字符串
     * @param format 格式字符串，支持以下占位符：
     *   - YYYY: 四位年份
     *   - MM: 两位月份
     *   - DD: 两位日期
     *   - HH: 两位小时（24小时制）
     *   - mm: 两位分钟
     *   - ss: 两位秒
     *   - SSS: 三位毫秒
     * @returns 格式化后的日期字符串
     */
    static format(date: Date | number | string, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
        const d = new Date(date);
        
        if (isNaN(d.getTime())) {
            throw new Error('Invalid date');
        }
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        const milliseconds = String(d.getMilliseconds()).padStart(3, '0');
        
        return format
            .replace(/YYYY/g, year.toString())
            .replace(/MM/g, month)
            .replace(/DD/g, day)
            .replace(/HH/g, hours)
            .replace(/mm/g, minutes)
            .replace(/ss/g, seconds)
            .replace(/SSS/g, milliseconds);
    }
    
    /**
     * 获取当前时间戳（毫秒）
     * @returns 时间戳
     */
    static now(): number {
        return Date.now();
    }
    
    /**
     * 获取当前日期时间字符串
     * @param format 格式字符串
     * @returns 格式化的当前时间
     */
    static nowString(format: string = 'YYYY-MM-DD HH:mm:ss'): string {
        return this.format(new Date(), format);
    }
    
    /**
     * 解析日期字符串
     * @param dateString 日期字符串
     * @param format 日期格式（可选，用于验证）
     * @returns Date对象
     */
    static parse(dateString: string, format?: string): Date {
        // 如果提供了格式，进行格式验证
        if (format) {
            const formatRegex = format
                .replace(/YYYY/g, '\\d{4}')
                .replace(/MM/g, '\\d{2}')
                .replace(/DD/g, '\\d{2}')
                .replace(/HH/g, '\\d{2}')
                .replace(/mm/g, '\\d{2}')
                .replace(/ss/g, '\\d{2}');
            
            if (!new RegExp(`^${formatRegex}$`).test(dateString)) {
                throw new Error(`Date string "${dateString}" does not match format "${format}"`);
            }
        }
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            throw new Error(`Invalid date string: ${dateString}`);
        }
        
        return date;
    }
    
    /**
     * 添加时间
     * @param date 基准日期
     * @param amount 数量
     * @param unit 时间单位
     * @returns 新的日期对象
     */
    static add(
        date: Date | number | string,
        amount: number,
        unit: 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years'
    ): Date {
        const d = new Date(date);
        
        if (isNaN(d.getTime())) {
            throw new Error('Invalid date');
        }
        
        const result = new Date(d);
        
        switch (unit) {
            case 'milliseconds':
                result.setMilliseconds(result.getMilliseconds() + amount);
                break;
            case 'seconds':
                result.setSeconds(result.getSeconds() + amount);
                break;
            case 'minutes':
                result.setMinutes(result.getMinutes() + amount);
                break;
            case 'hours':
                result.setHours(result.getHours() + amount);
                break;
            case 'days':
                result.setDate(result.getDate() + amount);
                break;
            case 'weeks':
                result.setDate(result.getDate() + (amount * 7));
                break;
            case 'months':
                result.setMonth(result.getMonth() + amount);
                break;
            case 'years':
                result.setFullYear(result.getFullYear() + amount);
                break;
            default:
                throw new Error(`Unsupported time unit: ${unit}`);
        }
        
        return result;
    }
    
    /**
     * 减去时间
     * @param date 基准日期
     * @param amount 数量
     * @param unit 时间单位
     * @returns 新的日期对象
     */
    static subtract(
        date: Date | number | string,
        amount: number,
        unit: 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years'
    ): Date {
        return this.add(date, -amount, unit);
    }
    
    /**
     * 计算两个日期之间的差值
     * @param date1 第一个日期
     * @param date2 第二个日期
     * @param unit 返回差值的单位
     * @returns 差值数量
     */
    static diff(
        date1: Date | number | string,
        date2: Date | number | string,
        unit: 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' = 'milliseconds'
    ): number {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        
        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
            throw new Error('Invalid date');
        }
        
        const diffMs = d1.getTime() - d2.getTime();
        
        switch (unit) {
            case 'milliseconds':
                return diffMs;
            case 'seconds':
                return Math.floor(diffMs / 1000);
            case 'minutes':
                return Math.floor(diffMs / (1000 * 60));
            case 'hours':
                return Math.floor(diffMs / (1000 * 60 * 60));
            case 'days':
                return Math.floor(diffMs / (1000 * 60 * 60 * 24));
            default:
                throw new Error(`Unsupported time unit: ${unit}`);
        }
    }
    
    /**
     * 获取日期的开始时间（00:00:00.000）
     * @param date 日期
     * @returns 日期开始时间
     */
    static startOfDay(date: Date | number | string): Date {
        const d = new Date(date);
        if (isNaN(d.getTime())) {
            throw new Error('Invalid date');
        }
        
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    
    /**
     * 获取日期的结束时间（23:59:59.999）
     * @param date 日期
     * @returns 日期结束时间
     */
    static endOfDay(date: Date | number | string): Date {
        const d = new Date(date);
        if (isNaN(d.getTime())) {
            throw new Error('Invalid date');
        }
        
        return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
    }
    
    /**
     * 获取月份的开始日期
     * @param date 日期
     * @returns 月份开始日期
     */
    static startOfMonth(date: Date | number | string): Date {
        const d = new Date(date);
        if (isNaN(d.getTime())) {
            throw new Error('Invalid date');
        }
        
        return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    
    /**
     * 获取月份的结束日期
     * @param date 日期
     * @returns 月份结束日期
     */
    static endOfMonth(date: Date | number | string): Date {
        const d = new Date(date);
        if (isNaN(d.getTime())) {
            throw new Error('Invalid date');
        }
        
        return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    }
    
    /**
     * 判断是否为同一天
     * @param date1 第一个日期
     * @param date2 第二个日期
     * @returns 是否为同一天
     */
    static isSameDay(date1: Date | number | string, date2: Date | number | string): boolean {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        
        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
            return false;
        }
        
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    }
    
    /**
     * 判断是否为今天
     * @param date 日期
     * @returns 是否为今天
     */
    static isToday(date: Date | number | string): boolean {
        return this.isSameDay(date, new Date());
    }
    
    /**
     * 判断是否为昨天
     * @param date 日期
     * @returns 是否为昨天
     */
    static isYesterday(date: Date | number | string): boolean {
        const yesterday = this.subtract(new Date(), 1, 'days');
        return this.isSameDay(date, yesterday);
    }
    
    /**
     * 判断是否为明天
     * @param date 日期
     * @returns 是否为明天
     */
    static isTomorrow(date: Date | number | string): boolean {
        const tomorrow = this.add(new Date(), 1, 'days');
        return this.isSameDay(date, tomorrow);
    }
    
    /**
     * 判断是否为闰年
     * @param year 年份
     * @returns 是否为闰年
     */
    static isLeapYear(year: number): boolean {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    }
    
    /**
     * 获取月份的天数
     * @param year 年份
     * @param month 月份（1-12）
     * @returns 天数
     */
    static getDaysInMonth(year: number, month: number): number {
        return new Date(year, month, 0).getDate();
    }
    
    /**
     * 获取星期几（0=周日，1=周一...6=周六）
     * @param date 日期
     * @returns 星期几
     */
    static getWeekday(date: Date | number | string): number {
        const d = new Date(date);
        if (isNaN(d.getTime())) {
            throw new Error('Invalid date');
        }
        
        return d.getDay();
    }
    
    /**
     * 获取星期几的中文名称
     * @param date 日期
     * @returns 星期几的中文名称
     */
    static getWeekdayName(date: Date | number | string): string {
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return weekdays[this.getWeekday(date)];
    }
    
    /**
     * 获取相对时间描述
     * @param date 日期
     * @param baseDate 基准日期（默认为当前时间）
     * @returns 相对时间描述
     */
    static getRelativeTime(date: Date | number | string, baseDate?: Date | number | string): string {
        const d = new Date(date);
        const base = baseDate ? new Date(baseDate) : new Date();
        
        if (isNaN(d.getTime()) || isNaN(base.getTime())) {
            throw new Error('Invalid date');
        }
        
        const diffMs = base.getTime() - d.getTime();
        const diffSeconds = Math.floor(Math.abs(diffMs) / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        const isFuture = diffMs < 0;
        const prefix = isFuture ? '' : '';
        const suffix = isFuture ? '后' : '前';
        
        if (diffSeconds < 60) {
            return isFuture ? '即将' : '刚刚';
        } else if (diffMinutes < 60) {
            return `${diffMinutes}分钟${suffix}`;
        } else if (diffHours < 24) {
            return `${diffHours}小时${suffix}`;
        } else if (diffDays < 7) {
            return `${diffDays}天${suffix}`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks}周${suffix}`;
        } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            return `${months}个月${suffix}`;
        } else {
            const years = Math.floor(diffDays / 365);
            return `${years}年${suffix}`;
        }
    }
    
    /**
     * 获取时间范围数组
     * @param start 开始日期
     * @param end 结束日期
     * @param unit 时间单位
     * @param step 步长（默认1）
     * @returns 时间范围数组
     */
    static getRange(
        start: Date | number | string,
        end: Date | number | string,
        unit: 'days' | 'weeks' | 'months' | 'years',
        step: number = 1
    ): Date[] {
        const startDate = new Date(start);
        const endDate = new Date(end);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error('Invalid date');
        }
        
        if (startDate > endDate) {
            throw new Error('Start date must be before end date');
        }
        
        const result: Date[] = [];
        let current = new Date(startDate);
        
        while (current <= endDate) {
            result.push(new Date(current));
            current = this.add(current, step, unit);
        }
        
        return result;
    }
}
