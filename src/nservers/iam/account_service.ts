
import { DaoBase, ServiceBase, StandardEntityBase,ID_GENERATOR } from '../../nsdk/base';
import { CryptoUtil, HashUtil, MaskUtil, PasswordUtil } from '../../nsdk/util';
import { AccessTokenService, TokenInfo } from './access_token_service';
import { CaptchaService,CaptchaResult } from './captcha_service';
import { BusinessError,NotFoundError } from '../../nsdk/base';

export enum AccountStatus
{
    INACTIVE = 0,   // 未激活
    ACTIVE = 1,     // 正常
    LOCKED = 2,     // 锁定
    DELETED = 9,    // 删除
}

export class Account extends StandardEntityBase {
    username?: string;
    login_name?: string;
    avatar?: string;
    password?: string;
    
    // 原始字段（临时存储，不存入数据库）
    email?: string;
    phone?: string;

    email_encrypted?: string;
    email_masked?: string;
    email_hash?: string;
    email_verified?: boolean;

    phone_encrypted?: string;
    phone_masked?: string;
    phone_hash?: string;
    phone_verified?: boolean;

    status?: number; // tinyint
}

export class CurrentAccountInfo {
    id!: number;
    username?: string;
    login_name?: string;
    avatar?: string;
    email_masked?: string;
    phone_masked?: string;
    email_verified?: boolean;
    phone_verified?: boolean;
    status?: number; // tinyint
    create_date?: Date;
    update_date?: Date;
    constructor(account: Account) {
        this.id = account.id;
        this.username = account.username;
        this.login_name = account.login_name;
        this.avatar = account.avatar;
        this.email_masked = account.email_masked;
        this.phone_masked = account.phone_masked;
        this.email_verified = account.email_verified;
        this.phone_verified = account.phone_verified;
        this.status = account.status;
        this.create_date = account.create_date;
        this.update_date = account.update_date;
    }
}
class AccountDao extends DaoBase {
    constructor() {
        super('iam_account','iam',{id_generator: ID_GENERATOR.SNOWFLAKE, multi_tenant: false});
    }

    async insert(data: Partial<Account>): Promise<any> {
        // 处理email属性
        const email = data.email;
        if (email && typeof email === 'string') {
            data.email_encrypted = CryptoUtil.encrypt(email);
            data.email_masked = MaskUtil.maskEmail(email);
            data.email_hash = HashUtil.sha256(email);
            data.email_verified = false; // 默认未验证
            
            // 删除原始邮箱字段，不存储到数据库
            delete data.email;
        }
        
        // 处理phone属性
        const phone = data.phone;
        if (phone && typeof phone === 'string') {
            data.phone_encrypted = CryptoUtil.encrypt(phone);
            data.phone_masked = MaskUtil.maskPhone(phone);
            data.phone_hash = HashUtil.sha256(phone);
            
            // 删除原始手机号字段，不存储到数据库
            delete data.phone;
        }
        
        // 处理密码
        const password = data.password;
        if (password && typeof password === 'string') {
            // 使用 bcrypt 异步哈希密码
            data.password = await PasswordUtil.hash(password);
        }
        
        // 设置默认状态
        if (!data.status) {
            data.status = AccountStatus.INACTIVE; // 默认状态为未激活
        }

        return super.insert(data);
    }
    
    /**
     * 根据邮箱查找用户（通过哈希值）
     * @param email 邮箱地址
     * @returns 用户记录
     */
    async findByEmail(email: string): Promise<Account | null> {
        if (!email) return null;
        
        const emailHash = HashUtil.sha256(email);
        return await this.findOne({ conditions: { email_hash: emailHash } });
    }
    
    /**
     * 根据手机号查找用户（通过哈希值）
     * @param phone 手机号
     * @returns 用户记录
     */
    async findByPhone(phone: string): Promise<Account | null> {
        if (!phone) return null;
        
        const phoneHash = HashUtil.sha256(phone);
        return await this.findOne({ conditions: { phone_hash: phoneHash } });
    }
    
    /**
     * 根据登录名查找用户
     * @param loginName 登录名
     * @returns 用户记录
     */
    async findByLoginName(loginName: string): Promise<Account | null> {
        if (!loginName) return null;
        
        return await this.findOne({ conditions: { login_name: loginName } });
    }
    
    /**
     * 验证密码
     * @param account 用户账号
     * @param password 明文密码
     * @returns 是否匹配
     */
    async verifyPassword(account: Account, password: string): Promise<boolean> {
        if (!account.password || !password) return false;
        return await PasswordUtil.verify(password, account.password);
    }
    
    /**
     * 解密邮箱地址（仅在必要时使用）
     * @param account 用户账号
     * @returns 解密后的邮箱地址
     */
    decryptEmail(account: Account): string | null {
        if (!account.email_encrypted) return null;
        
        try {
            return CryptoUtil.decrypt(account.email_encrypted);
        } catch (error) {
            console.error('Failed to decrypt email:', error);
            return null;
        }
    }
    
    /**
     * 解密手机号（仅在必要时使用）
     * @param account 用户账号
     * @returns 解密后的手机号
     */
    decryptPhone(account: Account): string | null {
        if (!account.phone_encrypted) return null;
        
        try {
            return CryptoUtil.decrypt(account.phone_encrypted);
        } catch (error) {
            console.error('Failed to decrypt phone:', error);
            return null;
        }
    }
}

export class AccountService extends ServiceBase<Account> {
    private accountDao: AccountDao;
    private access_token_service: AccessTokenService;
    private captcha_service: CaptchaService;

    constructor() {
        const dao = new AccountDao();
        super(dao);
        this.accountDao = dao;
        this.access_token_service = new AccessTokenService();
        this.captcha_service = new CaptchaService();
    }

    async generateCaptcha(): Promise<CaptchaResult> {
        return this.captcha_service.generateCaptcha();
    }
    async verifyCaptcha(id: string, user_input: string): Promise<boolean> {
        return this.captcha_service.verifyCaptcha(id, user_input);
    }

    async reg(accountData: Partial<Account>): Promise<any> {
        return this.createAccount(accountData);
    }

    async reg_by_email(email: string, password: string, username?: string): Promise<any> {
        if (!email || !password) {
            throw new Error('Email and password are required');
        }
        const accountData: Partial<Account> = {
            email,
            password,
            username: username || email.split('@')[0],
            login_name: email.split('@')[0] // 默认登录名为邮箱前缀
        };
        return this.createAccount(accountData);
    }

    async reg_by_phone(phone: string, password: string, username?: string): Promise<any> {
        if (!phone || !password) {
            throw new Error('Phone and password are required');
        }
        const accountData: Partial<Account> = {
            phone,
            password,
            username: username || phone.slice(-4), // 默认用户名为手机号后4位
            login_name: phone // 默认登录名为手机号
        };
        return this.createAccount(accountData);
    }
    /**
     * 创建用户账号
     * @param accountData 用户数据
     * @returns 创建结果
     */
    async createAccount(account_data: Partial<Account>): Promise<any> {
        // 登录名、邮箱、手机号码至少要填一个
        if (!account_data.login_name && !account_data.email && !account_data.phone) {
            throw new BusinessError('登录名、邮箱和手机号码至少要填一个');
        }

        // 验证登录名
        if (account_data.login_name) {
            // 验证登录名格式：第一个字符必须是字母，后续字符可以是字母、数字和下划线，总长度3-20位
            if (!/^[a-zA-Z][a-zA-Z0-9_]{2,19}$/.test(account_data.login_name)) {
                throw new BusinessError('登录名格式无效，必须以字母开头，只能包含字母、数字和下划线，长度3-20位');
            }
            
            // 验证登录名唯一性
            const existingByLoginName = await this.accountDao.findByLoginName(account_data.login_name);
            if (existingByLoginName) {
                throw new BusinessError('登录名已被使用');
            }
        }
        
        // 验证邮箱和手机号是否已存在
        if (account_data.email) {
            const existingByEmail = await this.accountDao.findByEmail(account_data.email);
            if (existingByEmail) {
                throw new BusinessError('邮箱地址已被使用');
            }
        }

        if (account_data.phone) {
            const existingByPhone = await this.accountDao.findByPhone(account_data.phone);
            if (existingByPhone) {
                throw new BusinessError('手机号码已被使用');
            }
        }

        return await this.accountDao.insert(account_data);
    }

    /**
     * 用户登录验证
     * @param identifier 登录标识（邮箱、手机号或登录名）
     * @param password 密码
     * @returns 用户信息或null
     */
    async login(identifier: string, password: string): Promise<any> {
        if (!identifier || !password) {
            throw new BusinessError('登录标识和密码不可为空');
        }

        let account: Account | null = null;
        
        // 根据字符串特征判断标识符类型
        if (identifier.includes('@')) {
            // 包含@符号，判断为邮箱
            account = await this.accountDao.findByEmail(identifier);
        } else if (/^1[3-9]\d{9}$/.test(identifier)) {
            // 匹配中国手机号格式（11位，1开头，第二位3-9）
            account = await this.accountDao.findByPhone(identifier);
        } else if (/^[a-zA-Z][a-zA-Z0-9_]{2,19}$/.test(identifier)) {
            // 匹配登录名格式（字母开头，3-20位）
            account = await this.accountDao.findByLoginName(identifier);
        } else {
            // 格式不匹配任何类型
            throw new BusinessError('账号格式无效');
        }

        if (!account) {
            throw new BusinessError('账号或密码无效');
        }

        // 验证密码
        const isPasswordValid = await this.accountDao.verifyPassword(account, password);
        if (!isPasswordValid) {
            throw new BusinessError('账号或密码无效');
        }

        // 检查账号状态
        if (account.status !== AccountStatus.ACTIVE) {
            throw new BusinessError('账号状态异常，无法登录');
        }

        const token: TokenInfo = await this.access_token_service.generateTokens({ user_id: account.id });
        const user = new CurrentAccountInfo(account);
        return { user, token };
    }

    async valid(token: string): Promise<boolean> {
        const result = await this.access_token_service.verifyAccessToken(token);
        return result !== null;
    }

    /**
     * 检查登录名是否可用
     * @param loginName 登录名
     * @returns 是否可用
     */
    async isLoginNameAvailable(loginName: string): Promise<boolean> {
        if (!loginName) {
            return false;
        }
        
        // 验证登录名格式：第一个字符必须是字母，后续字符可以是字母、数字和下划线，总长度3-20位
        if (!/^[a-zA-Z][a-zA-Z0-9_]{2,19}$/.test(loginName)) {
            return false;
        }
        
        const existingAccount = await this.accountDao.findByLoginName(loginName);
        return !existingAccount;
    }

    /**
     * 激活用户账号
     * @param accountId 账号ID
     * @returns 激活结果
     */
    async activateAccount(accountId: any): Promise<boolean> {
        const result = await this.accountDao.update(accountId, { 
            status: AccountStatus.ACTIVE 
        });
        return Boolean(result);
    }

    /**
     * 锁定用户账号
     * @param accountId 账号ID
     * @returns 锁定结果
     */
    async lockAccount(accountId: any): Promise<boolean> {
        const result = await this.accountDao.update(accountId, { 
            status: AccountStatus.LOCKED 
        });
        return Boolean(result);
    }

    /**
     * 验证邮箱
     * @param accountId 账号ID
     * @returns 验证结果
     */
    async verifyEmail(accountId: any): Promise<boolean> {
        const result = await this.accountDao.update(accountId, { 
            email_verified: true 
        });
        return Boolean(result);
    }

    /**
     * 验证手机号
     * @param accountId 账号ID
     * @returns 验证结果
     */
    async verifyPhone(accountId: any): Promise<boolean> {
        const result = await this.accountDao.update(accountId, { 
            phone_verified: true 
        });
        return Boolean(result);
    }

    /**
     * 修改密码
     * @param accountId 账号ID
     * @param oldPassword 旧密码
     * @param newPassword 新密码
     * @returns 修改结果
     */
    async changePassword(accountId: any, oldPassword: string, newPassword: string): Promise<boolean> {
        const account = await this.accountDao.get(accountId);
        if (!account) {
            throw new Error('账号不存在');
        }

        // 验证旧密码
        const isOldPasswordValid = await this.accountDao.verifyPassword(account, oldPassword);
        if (!isOldPasswordValid) {
            throw new Error('旧密码错误');
        }

        // 哈希新密码
        const hashedNewPassword = await PasswordUtil.hash(newPassword);
        
        const result = await this.accountDao.update(accountId, { 
            password: hashedNewPassword 
        });
        return Boolean(result);
    }

    /**
     * 修改登录名
     * @param accountId 账号ID
     * @param newLoginName 新登录名
     * @returns 修改结果
     */
    async changeLoginName(accountId: any, newLoginName: string): Promise<boolean> {
        if (!newLoginName) {
            throw new Error('登录名不能为空');
        }
        
        // 验证登录名格式：第一个字符必须是字母，后续字符可以是字母、数字和下划线，总长度3-20位
        if (!/^[a-zA-Z][a-zA-Z0-9_]{2,19}$/.test(newLoginName)) {
            throw new Error('登录名格式无效，必须以字母开头，只能包含字母、数字和下划线，长度3-20位');
        }
        
        // 检查登录名是否已被使用
        const existingAccount = await this.accountDao.findByLoginName(newLoginName);
        if (existingAccount && existingAccount.id !== accountId) {
            throw new Error('登录名已被使用');
        }
        
        const result = await this.accountDao.update(accountId, { 
            login_name: newLoginName 
        });
        return Boolean(result);
    }

    /**
     * 获取用户的脱敏信息（用于列表显示）
     * @param filter 查询条件
     * @param limit 限制数量
     * @param offset 偏移量
     * @returns 脱敏后的用户列表
     */
    async getMaskedAccounts(filter: any = {}, limit = 10, offset = 0) {
        const result = await this.accountDao.query(filter, limit, offset);
        
        // 移除敏感字段，只保留脱敏字段
        const maskedItems = result.items.map(account => ({
            id: account.id,
            username: account.username,
            login_name: account.login_name,
            avatar: account.avatar,
            email_masked: account.email_masked,
            phone_masked: account.phone_masked,
            email_verified: account.email_verified,
            phone_verified: account.phone_verified,
            status: account.status,
            create_date: account.create_date,
            update_date: account.update_date
        }));

        return {
            total: result.total,
            items: maskedItems
        };
    }
}
