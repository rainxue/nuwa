/**
 * RSA 数字签名的实际应用场景示例
 */

import { CryptoUtil } from '../src/nsdk/util/crypto';

/**
 * 场景1: API 接口签名验证
 * 防止 API 请求被篡改和伪造
 */
export class APISignature {
    /**
     * 客户端：生成 API 请求签名
     * @param apiKey 客户端的 API Key
     * @param requestData 请求数据
     * @param timestamp 时间戳
     * @returns 签名后的请求
     */
    static async signAPIRequest(
        apiKey: string,
        requestData: any,
        timestamp: number,
        privateKey: string
    ): Promise<{
        apiKey: string;
        data: any;
        timestamp: number;
        signature: string;
    }> {
        // 1. 构造待签名的字符串
        const dataToSign = JSON.stringify({
            apiKey,
            data: requestData,
            timestamp
        });
        
        // 2. 生成签名
        const signature = CryptoUtil.signWithRSA(dataToSign, privateKey);
        
        return {
            apiKey,
            data: requestData,
            timestamp,
            signature
        };
    }
    
    /**
     * 服务端：验证 API 请求签名
     * @param request 客户端发送的请求
     * @param publicKey 客户端的公钥
     * @returns 验证结果
     */
    static verifyAPIRequest(
        request: {
            apiKey: string;
            data: any;
            timestamp: number;
            signature: string;
        },
        publicKey: string
    ): { valid: boolean; reason?: string } {
        try {
            // 1. 检查时间戳（防重放攻击）
            const now = Date.now();
            if (now - request.timestamp > 5 * 60 * 1000) { // 5分钟内有效
                return { valid: false, reason: '请求已过期' };
            }
            
            // 2. 重新构造待验证的数据
            const dataToVerify = JSON.stringify({
                apiKey: request.apiKey,
                data: request.data,
                timestamp: request.timestamp
            });
            
            // 3. 验证签名
            const isValid = CryptoUtil.verifyRSASignature(
                dataToVerify,
                request.signature,
                publicKey
            );
            
            return isValid 
                ? { valid: true } 
                : { valid: false, reason: '签名验证失败' };
                
        } catch (error) {
            return { valid: false, reason: `验证出错: ${error}` };
        }
    }
}

/**
 * 场景2: 文件完整性校验
 * 确保下载的文件没有被篡改
 */
export class FileSignature {
    /**
     * 对文件生成签名
     * @param fileContent 文件内容
     * @param fileName 文件名
     * @param privateKey 私钥
     * @returns 文件签名信息
     */
    static signFile(
        fileContent: Buffer,
        fileName: string,
        privateKey: string
    ): {
        fileName: string;
        fileSize: number;
        fileHash: string;
        signature: string;
        signedAt: number;
    } {
        // 1. 计算文件哈希
        const crypto = require('crypto');
        const fileHash = crypto.createHash('sha256').update(fileContent).digest('hex');
        
        // 2. 构造签名数据
        const signData = JSON.stringify({
            fileName,
            fileSize: fileContent.length,
            fileHash,
            signedAt: Date.now()
        });
        
        // 3. 生成签名
        const signature = CryptoUtil.signWithRSA(signData, privateKey);
        
        return {
            fileName,
            fileSize: fileContent.length,
            fileHash,
            signature,
            signedAt: Date.now()
        };
    }
    
    /**
     * 验证文件签名
     * @param fileContent 下载的文件内容
     * @param signatureInfo 签名信息
     * @param publicKey 公钥
     * @returns 验证结果
     */
    static verifyFile(
        fileContent: Buffer,
        signatureInfo: {
            fileName: string;
            fileSize: number;
            fileHash: string;
            signature: string;
            signedAt: number;
        },
        publicKey: string
    ): { valid: boolean; reason?: string } {
        try {
            // 1. 验证文件大小
            if (fileContent.length !== signatureInfo.fileSize) {
                return { valid: false, reason: '文件大小不匹配' };
            }
            
            // 2. 重新计算文件哈希
            const crypto = require('crypto');
            const actualHash = crypto.createHash('sha256').update(fileContent).digest('hex');
            
            if (actualHash !== signatureInfo.fileHash) {
                return { valid: false, reason: '文件内容已被篡改' };
            }
            
            // 3. 重新构造签名数据
            const signData = JSON.stringify({
                fileName: signatureInfo.fileName,
                fileSize: signatureInfo.fileSize,
                fileHash: signatureInfo.fileHash,
                signedAt: signatureInfo.signedAt
            });
            
            // 4. 验证签名
            const isValid = CryptoUtil.verifyRSASignature(
                signData,
                signatureInfo.signature,
                publicKey
            );
            
            return isValid 
                ? { valid: true } 
                : { valid: false, reason: '数字签名验证失败' };
                
        } catch (error) {
            return { valid: false, reason: `验证出错: ${error}` };
        }
    }
}

/**
 * 场景3: 用户身份令牌签名
 * JWT 类似的令牌系统
 */
export class TokenSignature {
    /**
     * 生成用户令牌
     * @param userId 用户ID
     * @param permissions 权限列表
     * @param expiresIn 过期时间（秒）
     * @param privateKey 私钥
     * @returns 签名的令牌
     */
    static generateToken(
        userId: string,
        permissions: string[],
        expiresIn: number,
        privateKey: string
    ): string {
        const payload = {
            userId,
            permissions,
            issuedAt: Date.now(),
            expiresAt: Date.now() + (expiresIn * 1000)
        };
        
        const header = {
            alg: 'RS256',
            typ: 'JWT'
        };
        
        // 1. Base64 编码 header 和 payload
        const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
        
        // 2. 构造待签名数据
        const dataToSign = `${encodedHeader}.${encodedPayload}`;
        
        // 3. 生成签名
        const signature = CryptoUtil.signWithRSA(dataToSign, privateKey);
        const encodedSignature = Buffer.from(signature, 'base64').toString('base64url');
        
        // 4. 返回完整令牌
        return `${dataToSign}.${encodedSignature}`;
    }
    
    /**
     * 验证用户令牌
     * @param token 令牌
     * @param publicKey 公钥
     * @returns 验证结果和用户信息
     */
    static verifyToken(
        token: string,
        publicKey: string
    ): { 
        valid: boolean; 
        payload?: any; 
        reason?: string 
    } {
        try {
            // 1. 解析令牌
            const parts = token.split('.');
            if (parts.length !== 3) {
                return { valid: false, reason: '令牌格式错误' };
            }
            
            const [encodedHeader, encodedPayload, encodedSignature] = parts;
            
            // 2. 解码数据
            const header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString());
            const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());
            
            // 3. 检查过期时间
            if (Date.now() > payload.expiresAt) {
                return { valid: false, reason: '令牌已过期' };
            }
            
            // 4. 验证签名
            const dataToVerify = `${encodedHeader}.${encodedPayload}`;
            const signature = Buffer.from(encodedSignature, 'base64url').toString('base64');
            
            const isValid = CryptoUtil.verifyRSASignature(
                dataToVerify,
                signature,
                publicKey
            );
            
            return isValid 
                ? { valid: true, payload } 
                : { valid: false, reason: '令牌签名无效' };
                
        } catch (error) {
            return { valid: false, reason: `令牌验证出错: ${error}` };
        }
    }
}

/**
 * 场景4: 数据库操作审计
 * 对重要的数据库操作进行签名记录
 */
export class AuditSignature {
    /**
     * 为数据库操作生成审计签名
     * @param operation 操作类型
     * @param tableName 表名
     * @param recordId 记录ID
     * @param changes 变更内容
     * @param operatorId 操作员ID
     * @param privateKey 私钥
     * @returns 审计记录
     */
    static signAuditLog(
        operation: 'INSERT' | 'UPDATE' | 'DELETE',
        tableName: string,
        recordId: string,
        changes: any,
        operatorId: string,
        privateKey: string
    ): {
        id: string;
        operation: string;
        tableName: string;
        recordId: string;
        changes: any;
        operatorId: string;
        timestamp: number;
        signature: string;
    } {
        const auditId = CryptoUtil.generateRandomString(16);
        const timestamp = Date.now();
        
        const auditData = {
            id: auditId,
            operation,
            tableName,
            recordId,
            changes,
            operatorId,
            timestamp
        };
        
        // 生成签名
        const signature = CryptoUtil.signWithRSA(
            JSON.stringify(auditData),
            privateKey
        );
        
        return {
            ...auditData,
            signature
        };
    }
    
    /**
     * 验证审计记录的完整性
     * @param auditRecord 审计记录
     * @param publicKey 公钥
     * @returns 验证结果
     */
    static verifyAuditLog(
        auditRecord: {
            id: string;
            operation: string;
            tableName: string;
            recordId: string;
            changes: any;
            operatorId: string;
            timestamp: number;
            signature: string;
        },
        publicKey: string
    ): { valid: boolean; reason?: string } {
        try {
            // 提取签名，重新构造数据
            const { signature, ...dataWithoutSignature } = auditRecord;
            
            // 验证签名
            const isValid = CryptoUtil.verifyRSASignature(
                JSON.stringify(dataWithoutSignature),
                signature,
                publicKey
            );
            
            return isValid 
                ? { valid: true } 
                : { valid: false, reason: '审计记录签名无效，可能已被篡改' };
                
        } catch (error) {
            return { valid: false, reason: `审计验证出错: ${error}` };
        }
    }
}

/**
 * 综合示例演示
 */
export async function demonstrateRSASignature() {
    try {
        console.log('=== RSA 数字签名应用场景演示 ===\n');
        
        // 生成密钥对
        const keyPair = await CryptoUtil.generateRSAKeyPair();
        const { publicKey, privateKey } = keyPair;
        
        console.log('🔑 RSA 密钥对已生成\n');
        
        // 场景1: API 签名
        console.log('📡 场景1: API 接口签名验证');
        const apiRequest = await APISignature.signAPIRequest(
            'client123',
            { action: 'getUserInfo', userId: '12345' },
            Date.now(),
            privateKey
        );
        console.log('API 请求已签名:', {
            ...apiRequest,
            signature: apiRequest.signature.substring(0, 50) + '...'
        });
        
        const apiVerifyResult = APISignature.verifyAPIRequest(apiRequest, publicKey);
        console.log('API 签名验证结果:', apiVerifyResult);
        console.log();
        
        // 场景2: 文件签名
        console.log('📄 场景2: 文件完整性校验');
        const fileContent = Buffer.from('这是一个重要的文件内容');
        const fileSignature = FileSignature.signFile(fileContent, 'important.txt', privateKey);
        console.log('文件签名信息:', {
            ...fileSignature,
            signature: fileSignature.signature.substring(0, 50) + '...'
        });
        
        const fileVerifyResult = FileSignature.verifyFile(fileContent, fileSignature, publicKey);
        console.log('文件签名验证结果:', fileVerifyResult);
        console.log();
        
        // 场景3: 用户令牌
        console.log('🎫 场景3: 用户身份令牌');
        const token = TokenSignature.generateToken(
            'user123',
            ['read', 'write'],
            3600, // 1小时
            privateKey
        );
        console.log('生成的令牌:', token.substring(0, 100) + '...');
        
        const tokenVerifyResult = TokenSignature.verifyToken(token, publicKey);
        console.log('令牌验证结果:', {
            valid: tokenVerifyResult.valid,
            userId: tokenVerifyResult.payload?.userId,
            permissions: tokenVerifyResult.payload?.permissions
        });
        console.log();
        
        // 场景4: 审计签名
        console.log('📋 场景4: 数据库操作审计');
        const auditLog = AuditSignature.signAuditLog(
            'UPDATE',
            'users',
            '12345',
            { email: 'new@example.com' },
            'admin',
            privateKey
        );
        console.log('审计记录:', {
            ...auditLog,
            signature: auditLog.signature.substring(0, 50) + '...'
        });
        
        const auditVerifyResult = AuditSignature.verifyAuditLog(auditLog, publicKey);
        console.log('审计记录验证结果:', auditVerifyResult);
        
    } catch (error) {
        console.error('演示失败:', error);
    }
}

// 如果直接运行此文件
if (require.main === module) {
    demonstrateRSASignature().catch(console.error);
}
