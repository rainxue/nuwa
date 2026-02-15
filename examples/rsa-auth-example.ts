/**
 * RSA 加密在用户认证中的使用示例
 */

import { CryptoUtil, PasswordUtil } from '../src/nsdk/util/crypto';

/**
 * 模拟前端加密密码的过程
 */
export class ClientPasswordEncryption {
    /**
     * 获取服务端公钥
     * @returns Promise<string> 公钥
     */
    static async getServerPublicKey(): Promise<string> {
        // 实际项目中这里会发送 HTTP 请求到服务端
        return await CryptoUtil.getPublicKey();
    }
    
    /**
     * 加密用户密码（前端使用）
     * @param password 用户输入的明文密码
     * @returns Promise<string> 加密后的密码
     */
    static async encryptPassword(password: string): Promise<string> {
        try {
            const publicKey = await this.getServerPublicKey();
            return CryptoUtil.encryptWithRSA(password, publicKey);
        } catch (error) {
            throw new Error(`密码加密失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    
    /**
     * 模拟用户注册流程
     * @param username 用户名
     * @param password 明文密码
     * @returns Promise<object> 注册请求数据
     */
    static async prepareRegistrationData(username: string, password: string): Promise<{
        username: string;
        encryptedPassword: string;
        timestamp: number;
    }> {
        const encryptedPassword = await this.encryptPassword(password);
        
        return {
            username,
            encryptedPassword,
            timestamp: Date.now()
        };
    }
    
    /**
     * 模拟用户登录流程
     * @param username 用户名
     * @param password 明文密码
     * @returns Promise<object> 登录请求数据
     */
    static async prepareLoginData(username: string, password: string): Promise<{
        username: string;
        encryptedPassword: string;
        timestamp: number;
    }> {
        const encryptedPassword = await this.encryptPassword(password);
        
        return {
            username,
            encryptedPassword,
            timestamp: Date.now()
        };
    }
}

/**
 * 模拟服务端解密密码的过程
 */
export class ServerPasswordDecryption {
    /**
     * 解密客户端发送的密码（服务端使用）
     * @param encryptedPassword 加密的密码
     * @returns string 解密后的明文密码
     */
    static decryptPassword(encryptedPassword: string): string {
        try {
            return CryptoUtil.decryptWithRSA(encryptedPassword);
        } catch (error) {
            throw new Error(`密码解密失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    
    /**
     * 处理用户注册请求
     * @param requestData 注册请求数据
     * @returns Promise<object> 处理结果
     */
    static async handleRegistration(requestData: {
        username: string;
        encryptedPassword: string;
        timestamp: number;
    }): Promise<{ success: boolean; message: string }> {
        try {
            // 1. 解密密码
            const plainPassword = this.decryptPassword(requestData.encryptedPassword);
            
            // 2. 验证时间戳（防重放攻击）
            const now = Date.now();
            const timeDiff = now - requestData.timestamp;
            if (timeDiff > 5 * 60 * 1000) { // 5分钟超时
                return { success: false, message: '请求已过期' };
            }
            
            // 3. 验证密码强度
            const strength = PasswordUtil.checkStrength(plainPassword);
            if (strength.score < 3) {
                return { 
                    success: false, 
                    message: `密码强度不足: ${strength.suggestions.join(', ')}` 
                };
            }
            
            // 4. 哈希密码存储
            const hashedPassword = await PasswordUtil.hash(plainPassword);
            
            // 5. 这里会保存到数据库
            console.log(`用户注册成功: ${requestData.username}`);
            console.log(`密码哈希: ${hashedPassword}`);
            
            return { success: true, message: '注册成功' };
        } catch (error) {
            return { 
                success: false, 
                message: `注册失败: ${error instanceof Error ? error.message : '未知错误'}` 
            };
        }
    }
    
    /**
     * 处理用户登录请求
     * @param requestData 登录请求数据
     * @param storedPasswordHash 数据库中存储的密码哈希
     * @returns Promise<object> 处理结果
     */
    static async handleLogin(
        requestData: {
            username: string;
            encryptedPassword: string;
            timestamp: number;
        },
        storedPasswordHash: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            // 1. 解密密码
            const plainPassword = this.decryptPassword(requestData.encryptedPassword);
            
            // 2. 验证时间戳
            const now = Date.now();
            const timeDiff = now - requestData.timestamp;
            if (timeDiff > 5 * 60 * 1000) {
                return { success: false, message: '请求已过期' };
            }
            
            // 3. 验证密码
            const isValid = await PasswordUtil.verify(plainPassword, storedPasswordHash);
            
            if (isValid) {
                console.log(`用户登录成功: ${requestData.username}`);
                return { success: true, message: '登录成功' };
            } else {
                return { success: false, message: '用户名或密码错误' };
            }
        } catch (error) {
            return { 
                success: false, 
                message: `登录失败: ${error instanceof Error ? error.message : '未知错误'}` 
            };
        }
    }
}

/**
 * 完整的用户认证流程示例
 */
export async function demonstrateUserAuthentication() {
    try {
        console.log('=== RSA 加密用户认证流程演示 ===\n');
        
        // 1. 初始化 RSA 密钥对
        console.log('1. 生成 RSA 密钥对...');
        const keyPair = await CryptoUtil.generateRSAKeyPair();
        CryptoUtil.setRSAKeyPair(keyPair.publicKey, keyPair.privateKey);
        console.log('RSA 密钥对生成完成\n');
        
        // 2. 模拟用户注册
        console.log('2. 用户注册流程...');
        const username = 'testuser';
        const password = 'SecurePassword123!';
        
        // 前端加密
        const registrationData = await ClientPasswordEncryption.prepareRegistrationData(username, password);
        console.log('前端加密完成:', {
            username: registrationData.username,
            encryptedPassword: registrationData.encryptedPassword.substring(0, 50) + '...',
            timestamp: new Date(registrationData.timestamp).toISOString()
        });
        
        // 服务端处理
        const registrationResult = await ServerPasswordDecryption.handleRegistration(registrationData);
        console.log('注册结果:', registrationResult);
        
        if (!registrationResult.success) {
            return;
        }
        
        // 3. 模拟用户登录
        console.log('\n3. 用户登录流程...');
        
        // 前端加密
        const loginData = await ClientPasswordEncryption.prepareLoginData(username, password);
        console.log('前端加密完成:', {
            username: loginData.username,
            encryptedPassword: loginData.encryptedPassword.substring(0, 50) + '...',
            timestamp: new Date(loginData.timestamp).toISOString()
        });
        
        // 模拟从数据库获取的密码哈希
        const storedPasswordHash = await PasswordUtil.hash(password);
        
        // 服务端处理
        const loginResult = await ServerPasswordDecryption.handleLogin(loginData, storedPasswordHash);
        console.log('登录结果:', loginResult);
        
        // 4. 测试错误密码
        console.log('\n4. 测试错误密码...');
        const wrongLoginData = await ClientPasswordEncryption.prepareLoginData(username, 'WrongPassword');
        const wrongLoginResult = await ServerPasswordDecryption.handleLogin(wrongLoginData, storedPasswordHash);
        console.log('错误密码登录结果:', wrongLoginResult);
        
    } catch (error) {
        console.error('认证流程演示失败:', error);
    }
}

// 如果直接运行此文件
if (require.main === module) {
    demonstrateUserAuthentication().catch(console.error);
}
