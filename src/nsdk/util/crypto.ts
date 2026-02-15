import crypto from 'crypto';

/**
 * 加密解密工具类
 * 提供AES-256-GCM加密算法的封装
 */
export class CryptoUtil {
    private static readonly ALGORITHM = 'aes-256-gcm';
    private static readonly KEY_LENGTH = 32; // 256 bits
    private static readonly IV_LENGTH = 16;  // 128 bits
    private static readonly TAG_LENGTH = 16; // 128 bits
    
    // RSA 相关配置
    private static readonly RSA_KEY_SIZE = 2048;
    private static readonly RSA_PADDING = crypto.constants.RSA_PKCS1_OAEP_PADDING;
    private static readonly RSA_HASH = 'sha256';
    
    // 缓存 RSA 密钥对
    private static rsaKeyPair: { publicKey: string; privateKey: string } | null = null;
    
    // 从环境变量获取加密密钥，如果没有则使用默认值（生产环境必须设置）
    private static getEncryptionKey(): Buffer {
        const keyString = process.env.ENCRYPTION_KEY || 'default-key-for-development-only';
        
        // 使用PBKDF2从密钥字符串派生固定长度的密钥
        return crypto.pbkdf2Sync(keyString, 'nuwa-salt', 100000, this.KEY_LENGTH, 'sha256');
    }
    
    /**
     * 加密数据
     * @param plaintext 明文
     * @returns 加密后的数据（格式：iv:tag:encrypted）
     */
    static encrypt(plaintext: string): string {
        if (!plaintext) {
            throw new Error('Plaintext cannot be empty');
        }
        
        try {
            const key = this.getEncryptionKey();
            const iv = crypto.randomBytes(this.IV_LENGTH);
            
            // 使用 createCipheriv 和正确的 GCM 算法
            const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
            
            let encrypted = cipher.update(plaintext, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const tag = cipher.getAuthTag();
            
            // 格式：iv:tag:encrypted
            return [
                iv.toString('hex'),
                tag.toString('hex'),
                encrypted
            ].join(':');
        } catch (error) {
            throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    
    /**
     * 解密数据
     * @param encryptedData 加密的数据（格式：iv:tag:encrypted）
     * @returns 解密后的明文
     */
    static decrypt(encryptedData: string): string {
        if (!encryptedData) {
            throw new Error('Encrypted data cannot be empty');
        }
        
        try {
            const parts = encryptedData.split(':');
            if (parts.length !== 3) {
                throw new Error('Invalid encrypted data format');
            }
            
            const [ivHex, tagHex, encrypted] = parts;
            const key = this.getEncryptionKey();
            const iv = Buffer.from(ivHex, 'hex');
            const tag = Buffer.from(tagHex, 'hex');
            
            const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
            decipher.setAuthTag(tag);
            
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    
    /**
     * 生成随机密钥
     * @param length 密钥长度（字节）
     * @returns 十六进制格式的随机密钥
     */
    static generateKey(length: number = 32): string {
        return crypto.randomBytes(length).toString('hex');
    }
    
    /**
     * 生成随机字符串
     * @param length 字符串长度
     * @returns 随机字符串
     */
    static generateRandomString(length: number = 16): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    /**
     * 生成 RSA 密钥对
     * @returns Promise<{publicKey: string, privateKey: string}> PEM 格式的密钥对
     */
    static async generateRSAKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
        return new Promise((resolve, reject) => {
            crypto.generateKeyPair('rsa', {
                modulusLength: this.RSA_KEY_SIZE,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem'
                }
            }, (err, publicKey, privateKey) => {
                if (err) {
                    reject(new Error(`RSA key generation failed: ${err.message}`));
                } else {
                    resolve({ publicKey, privateKey });
                }
            });
        });
    }
    
    /**
     * 获取或生成 RSA 密钥对（单例模式）
     * @returns Promise<{publicKey: string, privateKey: string}>
     */
    static async getRSAKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
        if (!this.rsaKeyPair) {
            this.rsaKeyPair = await this.generateRSAKeyPair();
        }
        return this.rsaKeyPair;
    }
    
    /**
     * 设置 RSA 密钥对（用于使用预生成的密钥）
     * @param publicKey PEM 格式的公钥
     * @param privateKey PEM 格式的私钥
     */
    static setRSAKeyPair(publicKey: string, privateKey: string): void {
        this.rsaKeyPair = { publicKey, privateKey };
    }
    
    /**
     * 获取公钥（用于前端）
     * @returns Promise<string> PEM 格式的公钥
     */
    static async getPublicKey(): Promise<string> {
        const keyPair = await this.getRSAKeyPair();
        return keyPair.publicKey;
    }
    
    /**
     * 使用 RSA 公钥加密数据（通常用于前端加密密码）
     * @param plaintext 明文数据
     * @param publicKey PEM 格式的公钥（可选，不提供则使用默认公钥）
     * @returns 加密后的数据（Base64 格式）
     */
    static encryptWithRSA(plaintext: string, publicKey?: string): string {
        if (!plaintext) {
            throw new Error('Plaintext cannot be empty');
        }
        
        try {
            const keyToUse = publicKey || (this.rsaKeyPair?.publicKey);
            if (!keyToUse) {
                throw new Error('Public key not available. Call getRSAKeyPair() first.');
            }
            
            const encrypted = crypto.publicEncrypt(
                {
                    key: keyToUse,
                    padding: this.RSA_PADDING,
                    oaepHash: this.RSA_HASH
                },
                Buffer.from(plaintext, 'utf8')
            );
            
            return encrypted.toString('base64');
        } catch (error) {
            throw new Error(`RSA encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    
    /**
     * 使用 RSA 私钥解密数据（服务端解密密码）
     * @param encryptedData 加密的数据（Base64 格式）
     * @param privateKey PEM 格式的私钥（可选，不提供则使用默认私钥）
     * @returns 解密后的明文
     */
    static decryptWithRSA(encryptedData: string, privateKey?: string): string {
        if (!encryptedData) {
            throw new Error('Encrypted data cannot be empty');
        }
        
        try {
            const keyToUse = privateKey || (this.rsaKeyPair?.privateKey);
            if (!keyToUse) {
                throw new Error('Private key not available. Call getRSAKeyPair() first.');
            }
            
            const decrypted = crypto.privateDecrypt(
                {
                    key: keyToUse,
                    padding: this.RSA_PADDING,
                    oaepHash: this.RSA_HASH
                },
                Buffer.from(encryptedData, 'base64')
            );
            
            return decrypted.toString('utf8');
        } catch (error) {
            throw new Error(`RSA decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    
    /**
     * 使用 RSA 私钥签名数据
     * @param data 要签名的数据
     * @param privateKey PEM 格式的私钥（可选）
     * @returns 签名（Base64 格式）
     */
    static signWithRSA(data: string, privateKey?: string): string {
        if (!data) {
            throw new Error('Data cannot be empty');
        }
        
        try {
            const keyToUse = privateKey || (this.rsaKeyPair?.privateKey);
            if (!keyToUse) {
                throw new Error('Private key not available. Call getRSAKeyPair() first.');
            }
            
            const signature = crypto.sign(this.RSA_HASH, Buffer.from(data, 'utf8'), {
                key: keyToUse,
                padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            });
            
            return signature.toString('base64');
        } catch (error) {
            throw new Error(`RSA signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    
    /**
     * 使用 RSA 公钥验证签名
     * @param data 原始数据
     * @param signature 签名（Base64 格式）
     * @param publicKey PEM 格式的公钥（可选）
     * @returns 验证结果
     */
    static verifyRSASignature(data: string, signature: string, publicKey?: string): boolean {
        if (!data || !signature) {
            return false;
        }
        
        try {
            const keyToUse = publicKey || (this.rsaKeyPair?.publicKey);
            if (!keyToUse) {
                throw new Error('Public key not available. Call getRSAKeyPair() first.');
            }
            
            return crypto.verify(
                this.RSA_HASH,
                Buffer.from(data, 'utf8'),
                {
                    key: keyToUse,
                    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
                },
                Buffer.from(signature, 'base64')
            );
        } catch (error) {
            return false;
        }
    }
}

/**
 * 哈希工具类
 * 提供SHA256等哈希算法的封装
 */
export class HashUtil {
    private static readonly DEFAULT_ALGORITHM = 'sha256';
    
    // 从环境变量获取哈希盐值
    private static getHashSalt(): string {
        return process.env.HASH_SALT || 'nuwa-default-salt';
    }
    
    /**
     * 生成SHA256哈希
     * @param data 要哈希的数据
     * @param salt 盐值（可选，默认使用环境变量中的盐值）
     * @returns 十六进制格式的哈希值
     */
    static sha256(data: string, salt?: string): string {
        if (!data) {
            throw new Error('Data cannot be empty');
        }
        
        const saltToUse = salt || this.getHashSalt();
        return crypto
            .createHash(this.DEFAULT_ALGORITHM)
            .update(data + saltToUse)
            .digest('hex');
    }
    
    /**
     * 生成MD5哈希（不推荐用于安全敏感场景）
     * @param data 要哈希的数据
     * @param salt 盐值（可选）
     * @returns 十六进制格式的哈希值
     */
    static md5(data: string, salt?: string): string {
        if (!data) {
            throw new Error('Data cannot be empty');
        }
        
        const saltToUse = salt || this.getHashSalt();
        return crypto
            .createHash('md5')
            .update(data + saltToUse)
            .digest('hex');
    }
    
    /**
     * 验证数据与哈希值是否匹配
     * @param data 原始数据
     * @param hash 哈希值
     * @param algorithm 哈希算法（默认sha256）
     * @param salt 盐值（可选）
     * @returns 是否匹配
     */
    static verify(data: string, hash: string, algorithm: string = 'sha256', salt?: string): boolean {
        try {
            const computedHash = algorithm === 'md5' 
                ? this.md5(data, salt) 
                : this.sha256(data, salt);
            
            // 使用时间安全的比较方法
            return crypto.timingSafeEqual(
                Buffer.from(computedHash, 'hex'),
                Buffer.from(hash, 'hex')
            );
        } catch (error) {
            return false;
        }
    }
    
    /**
     * 生成多轮哈希（增加计算复杂度）
     * @param data 要哈希的数据
     * @param rounds 哈希轮数（默认10000）
     * @param salt 盐值（可选）
     * @returns 十六进制格式的哈希值
     */
    static multiRoundHash(data: string, rounds: number = 10000, salt?: string): string {
        if (!data) {
            throw new Error('Data cannot be empty');
        }
        
        let hash = data + (salt || this.getHashSalt());
        
        for (let i = 0; i < rounds; i++) {
            hash = crypto.createHash(this.DEFAULT_ALGORITHM).update(hash).digest('hex');
        }
        
        return hash;
    }
}

/**
 * 密码哈希工具类
 * 使用bcrypt等专用的密码哈希算法
 */
export class PasswordUtil {
    /**
     * 哈希密码
     * @param password 明文密码
     * @param saltRounds 盐值轮数（默认12）
     * @returns Promise<string> 哈希后的密码
     */
    static async hash(password: string, saltRounds: number = 12): Promise<string> {
        if (!password) {
            throw new Error('Password cannot be empty');
        }
        
        try {
            const bcrypt = require('bcrypt');
            return await bcrypt.hash(password, saltRounds);
        } catch (error) {
            throw new Error(`Password hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    
    /**
     * 验证密码
     * @param password 明文密码
     * @param hash 哈希后的密码
     * @returns Promise<boolean> 是否匹配
     */
    static async verify(password: string, hash: string): Promise<boolean> {
        if (!password || !hash) {
            return false;
        }
        
        try {
            const bcrypt = require('bcrypt');
            return await bcrypt.compare(password, hash);
        } catch (error) {
            return false;
        }
    }
    
    /**
     * 简单密码强度检查
     * @param password 密码
     * @returns 密码强度对象
     */
    static checkStrength(password: string): {
        score: number;
        level: string;
        suggestions: string[];
    } {
        if (!password) {
            return {
                score: 0,
                level: '无效',
                suggestions: ['密码不能为空']
            };
        }
        
        let score = 0;
        const suggestions: string[] = [];
        
        // 长度检查
        if (password.length >= 8) score += 1;
        else suggestions.push('密码长度至少8位');
        
        if (password.length >= 12) score += 1;
        
        // 复杂度检查
        if (/[a-z]/.test(password)) score += 1;
        else suggestions.push('包含小写字母');
        
        if (/[A-Z]/.test(password)) score += 1;
        else suggestions.push('包含大写字母');
        
        if (/\d/.test(password)) score += 1;
        else suggestions.push('包含数字');
        
        if (/[^a-zA-Z\d]/.test(password)) score += 1;
        else suggestions.push('包含特殊字符');
        
        // 常见密码检查
        const commonPasswords = ['123456', 'password', 'admin', '123456789', 'qwerty'];
        if (commonPasswords.includes(password.toLowerCase())) {
            score = Math.max(0, score - 2);
            suggestions.push('避免使用常见密码');
        }
        
        let level = '弱';
        if (score >= 5) level = '强';
        else if (score >= 3) level = '中等';
        
        return { score, level, suggestions };
    }
}
