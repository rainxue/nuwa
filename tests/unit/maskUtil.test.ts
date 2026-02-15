import { describe, it, expect } from 'vitest';
import { MaskUtil } from '../../src/nsdk/util/maskUtil';

describe('MaskUtil', () => {
    describe('maskPhone', () => {
        it('应该正确脱敏中国手机号', () => {
            expect(MaskUtil.maskPhone('13812345678')).toBe('138****5678');
            expect(MaskUtil.maskPhone('13812345678', { keepStart: 4, keepEnd: 3 })).toBe('1381****678');
        });

        it('应该处理带格式的手机号', () => {
            expect(MaskUtil.maskPhone('138-1234-5678')).toBe('138****5678');
            expect(MaskUtil.maskPhone('138 1234 5678')).toBe('138****5678');
            expect(MaskUtil.maskPhone('(138) 1234-5678')).toBe('138****5678');
        });

        it('应该处理短手机号', () => {
            expect(MaskUtil.maskPhone('123456')).toBe('******');
        });
    });

    describe('maskEmail', () => {
        it('应该正确脱敏邮箱地址', () => {
            expect(MaskUtil.maskEmail('user@example.com')).toBe('u**r@example.com');
            expect(MaskUtil.maskEmail('admin@company.org', { keepStart: 2, keepEnd: 1 })).toBe('ad**n@company.org');
        });

        it('应该支持域名脱敏', () => {
            expect(MaskUtil.maskEmail('user@example.com', { keepDomain: false })).toBe('u**r@e******.com');
        });

        it('应该处理短用户名', () => {
            expect(MaskUtil.maskEmail('a@test.com')).toBe('a*@test.com');
        });

        it('应该处理无效邮箱格式', () => {
            expect(MaskUtil.maskEmail('invalid-email')).toBe('invalid-email');
        });
    });

    describe('maskIdCard', () => {
        it('应该正确脱敏身份证号', () => {
            expect(MaskUtil.maskIdCard('110101199001011234')).toBe('1101**********1234');
            expect(MaskUtil.maskIdCard('110101199001011234', { keepStart: 6, keepEnd: 2 })).toBe('110101**********34');
        });

        it('应该处理短身份证号', () => {
            expect(MaskUtil.maskIdCard('1234567')).toBe('*******');
        });
    });

    describe('maskBankCard', () => {
        it('应该正确脱敏银行卡号', () => {
            expect(MaskUtil.maskBankCard('6222021234567890')).toBe('6222 **** **** 7890');
        });

        it('应该支持不添加空格', () => {
            expect(MaskUtil.maskBankCard('6222021234567890', { addSpaces: false })).toBe('6222********7890');
        });

        it('应该处理短银行卡号', () => {
            expect(MaskUtil.maskBankCard('1234567')).toBe('*******');
        });
    });

    describe('maskName', () => {
        it('应该正确脱敏中文姓名', () => {
            expect(MaskUtil.maskName('张三')).toBe('张*');
            expect(MaskUtil.maskName('李小明')).toBe('李**');
            expect(MaskUtil.maskName('欧阳修')).toBe('欧**');
        });

        it('应该支持保留最后一个字符', () => {
            expect(MaskUtil.maskName('张三丰', { keepLast: true })).toBe('张*丰');
        });

        it('应该处理单字姓名', () => {
            expect(MaskUtil.maskName('王')).toBe('王');
            expect(MaskUtil.maskName('王', { keepFirst: false })).toBe('*');
        });
    });

    describe('maskAddress', () => {
        it('应该正确脱敏地址', () => {
            expect(MaskUtil.maskAddress('北京市朝阳区某某街道123号')).toBe('北京市朝阳区******');
        });

        it('应该支持自定义脱敏长度', () => {
            expect(MaskUtil.maskAddress('上海市浦东新区某某路456号', { keepLength: 4 })).toBe('上海市浦东新****');
        });

        it('应该处理短地址', () => {
            expect(MaskUtil.maskAddress('北京')).toBe('北京');
        });
    });

    describe('mask 通用方法', () => {
        it('应该根据类型调用相应的脱敏方法', () => {
            expect(MaskUtil.mask('13812345678', 'phone')).toBe('138****5678');
            expect(MaskUtil.mask('user@example.com', 'email')).toBe('u**r@example.com');
            expect(MaskUtil.mask('张三', 'name')).toBe('张*');
        });

        it('应该处理未知类型', () => {
            expect(MaskUtil.mask('test', 'unknown' as any)).toBe('test');
        });
    });

    describe('maskObject 批量脱敏', () => {
        it('应该正确脱敏对象属性', () => {
            const user = {
                name: '张三',
                phone: '13812345678',
                email: 'zhangsan@example.com',
                address: '北京市朝阳区某某街道123号'
            };

            const masked = MaskUtil.maskObject(user, {
                name: { type: 'name' },
                phone: { type: 'phone' },
                email: { type: 'email' },
                address: { type: 'address' }
            });

            expect(masked.name).toBe('张*');
            expect(masked.phone).toBe('138****5678');
            expect(masked.email).toBe('z******n@example.com');
            expect(masked.address).toBe('北京市朝阳区******');
        });

        it('应该跳过非字符串属性', () => {
            const data = {
                name: '张三',
                phone: '13812345678'
            };

            const masked = MaskUtil.maskObject(data, {
                name: { type: 'name' },
                phone: { type: 'phone' }
            });

            expect(masked.name).toBe('张*');
            expect(masked.phone).toBe('138****5678');
        });
    });

    describe('maskArray 批量脱敏数组', () => {
        it('应该正确脱敏对象数组', () => {
            const users = [
                { name: '张三', phone: '13812345678' },
                { name: '李四', phone: '13987654321' }
            ];

            const masked = MaskUtil.maskArray(users, {
                name: { type: 'name' },
                phone: { type: 'phone' }
            });

            expect(masked[0].name).toBe('张*');
            expect(masked[0].phone).toBe('138****5678');
            expect(masked[1].name).toBe('李*');
            expect(masked[1].phone).toBe('139****4321');
        });
    });
});
