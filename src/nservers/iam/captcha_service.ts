import { createCanvas, CanvasRenderingContext2D } from 'canvas';
import { randomBytes } from 'crypto';
import { CacheFactory,Cache } from '@/nsdk/cache';
import { Singleton } from '@/nsdk/common';

export interface CaptchaResult {
    id: string;
    image: string; // base64 编码的图片
    expires_at: Date;
}

export interface CaptchaConfig {
    width?: number;
    height?: number;
    length?: number; // 验证码长度
    fontSize?: number;
    bgColor?: string;
    textColor?: string;
    noiseLines?: number; // 干扰线数量
    noiseDots?: number; // 干扰点数量
    ttl?: number; // 过期时间（秒）
}

@Singleton
export class CaptchaService {
    private defaultConfig: Required<CaptchaConfig> = {
        width: 120,
        height: 40,
        length: 4,
        fontSize: 24,
        bgColor: '#f0f0f0',
        textColor: '#333333',
        noiseLines: 3,
        noiseDots: 30,
        ttl: 300 // 300秒，5分钟
    };

    private captcha_store:Cache<{code: string, expires_at: Date}> = CacheFactory.getInstance<{code: string, expires_at: Date}>("uc","uc:captcha");

    constructor() {

    }

    /**
     * 生成图片验证码
     * @param config 验证码配置
     * @returns 验证码结果
     */
    async generateCaptcha(): Promise<CaptchaResult> {
        const finalConfig = this.defaultConfig;
        
        // 生成验证码文本
        const code = this.generateCode(finalConfig.length);
        
        // 生成唯一ID
        const id = this.generateId();
               
        // 生成图片
        const image = await this.generateImage(code, finalConfig);
        
        const expires_at = new Date(Date.now() + finalConfig.ttl * 1000)
        // 存储验证码（实际项目中应该存储到Redis等缓存中）
        this.captcha_store.set(id, { code: code.toLowerCase(), expires_at: expires_at }, finalConfig.ttl);

        return {
            id,
            image,
            expires_at: expires_at
        };
    }

    /**
     * 验证验证码
        
        return {
            id,
            image,
            expires_at
        };
    }

    /**
     * 验证验证码
     * @param id 验证码ID
     * @param userInput 用户输入
     * @returns 是否验证成功
     */
    async verifyCaptcha(id: string, userInput: string): Promise<boolean> {
        if (!id || !userInput) {
            return false;
        }

        const stored = await this.captcha_store.get(id);
        if (!stored) {
            return false;
        }

        // 检查是否过期
        if (new Date() > stored.expires_at) {
            this.captcha_store.delete(id);
            return false;
        }

        // 验证码不区分大小写
        const isValid = stored.code === userInput.toLowerCase();
        
        // 验证后删除（一次性使用）
        if (isValid) {
            this.captcha_store.delete(id);
        }

        return isValid;
    }

    /**
     * 生成验证码文本
     * @param length 长度
     * @returns 验证码文本
     */
    private generateCode(length: number): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去除容易混淆的字符
        let result = '';
        
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return result;
    }

    /**
     * 生成唯一ID
     * @returns 唯一ID
     */
    private generateId(): string {
        return randomBytes(16).toString('hex');
    }

    /**
     * 生成验证码图片
     * @param code 验证码文本
     * @param config 配置
     * @returns base64编码的图片
     */
    private async generateImage(code: string, config: Required<CaptchaConfig>): Promise<string> {
        const canvas = createCanvas(config.width, config.height);
        const ctx = canvas.getContext('2d');

        // 设置背景
        ctx.fillStyle = config.bgColor;
        ctx.fillRect(0, 0, config.width, config.height);

        // 添加干扰线
        this.drawNoiseLines(ctx, config);

        // 绘制验证码文字
        this.drawText(ctx, code, config);

        // 添加干扰点
        this.drawNoiseDots(ctx, config);

        // 转换为base64
        return canvas.toDataURL('image/png');
    }

    /**
     * 绘制验证码文字
     * @param ctx 画布上下文
     * @param code 验证码文本
     * @param config 配置
     */
    private drawText(ctx: CanvasRenderingContext2D, code: string, config: Required<CaptchaConfig>): void {
        ctx.fillStyle = config.textColor;
        ctx.font = `${config.fontSize}px Arial`;
        ctx.textBaseline = 'middle';

        const charWidth = config.width / code.length;
        
        for (let i = 0; i < code.length; i++) {
            const char = code[i];
            const x = charWidth * i + charWidth / 2;
            const y = config.height / 2;
            
            // 随机旋转角度
            const angle = (Math.random() - 0.5) * 0.4; // -0.2 到 0.2 弧度
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.fillText(char, -ctx.measureText(char).width / 2, 0);
            ctx.restore();
        }
    }

    /**
     * 绘制干扰线
     * @param ctx 画布上下文
     * @param config 配置
     */
    private drawNoiseLines(ctx: CanvasRenderingContext2D, config: Required<CaptchaConfig>): void {
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;

        for (let i = 0; i < config.noiseLines; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * config.width, Math.random() * config.height);
            ctx.lineTo(Math.random() * config.width, Math.random() * config.height);
            ctx.stroke();
        }
    }

    /**
     * 绘制干扰点
     * @param ctx 画布上下文
     * @param config 配置
     */
    private drawNoiseDots(ctx: CanvasRenderingContext2D, config: Required<CaptchaConfig>): void {
        ctx.fillStyle = '#999999';

        for (let i = 0; i < config.noiseDots; i++) {
            ctx.beginPath();
            ctx.arc(
                Math.random() * config.width,
                Math.random() * config.height,
                1,
                0,
                2 * Math.PI
            );
            ctx.fill();
        }
    }


}