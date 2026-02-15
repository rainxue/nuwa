/**
 * MaskUtil 使用示例
 * 演示各种数据脱敏场景
 */
import { MaskUtil } from '../src/nsdk/util/maskUtil';

console.log('=== MaskUtil 使用示例 ===\n');

// 1. 基础脱敏功能
console.log('1. 基础脱敏功能：');
console.log('手机号脱敏:', MaskUtil.maskPhone('13812345678'));
console.log('邮箱脱敏:', MaskUtil.maskEmail('zhangsan@example.com'));
console.log('身份证脱敏:', MaskUtil.maskIdCard('110101199001011234'));
console.log('银行卡脱敏:', MaskUtil.maskBankCard('6222021234567890'));
console.log('姓名脱敏:', MaskUtil.maskName('张三丰'));
console.log('地址脱敏:', MaskUtil.maskAddress('北京市朝阳区某某街道123号'));
console.log();

// 2. 自定义脱敏选项
console.log('2. 自定义脱敏选项：');
console.log('手机号（保留4位开头）:', MaskUtil.maskPhone('13812345678', { keepStart: 4, keepEnd: 3 }));
console.log('邮箱（域名脱敏）:', MaskUtil.maskEmail('admin@company.com', { keepDomain: false }));
console.log('银行卡（无空格）:', MaskUtil.maskBankCard('6222021234567890', { addSpaces: false }));
console.log('姓名（保留首尾）:', MaskUtil.maskName('欧阳修', { keepLast: true }));
console.log('地址（自定义长度）:', MaskUtil.maskAddress('上海市浦东新区某某路456号', { keepLength: 4 }));
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

// 5. 通用脱敏方法
console.log('5. 通用脱敏方法：');
const sensitiveData = [
    { type: 'phone' as const, value: '13987654321' },
    { type: 'email' as const, value: 'user@test.com' },
    { type: 'name' as const, value: '李小明' },
    { type: 'idcard' as const, value: '110101199001011234' }
];

sensitiveData.forEach(item => {
    console.log(`${item.type} 脱敏:`, MaskUtil.mask(item.value, item.type));
});
console.log();

// 6. 批量脱敏对象
console.log('6. 批量脱敏对象：');
const user = {
    id: 1,
    name: '张三',
    phone: '13812345678',
    email: 'zhangsan@example.com',
    idCard: '110101199001011234',
    bankCard: '6222021234567890',
    address: '北京市朝阳区某某街道123号',
    age: 30,
    isActive: true
};

console.log('原始数据:', user);

const maskedUser = MaskUtil.maskObject(user, {
    name: { type: 'name' },
    phone: { type: 'phone' },
    email: { type: 'email' },
    idCard: { type: 'idcard' },
    bankCard: { type: 'bankcard' },
    address: { type: 'address' }
});

console.log('脱敏后数据:', maskedUser);
console.log();

// 7. 批量脱敏数组
console.log('7. 批量脱敏数组：');
const users = [
    { name: '张三', phone: '13812345678', email: 'zhangsan@example.com' },
    { name: '李四', phone: '13987654321', email: 'lisi@test.com' },
    { name: '王五', phone: '15612345678', email: 'wangwu@company.org' }
];

console.log('原始数组:', users);

const maskedUsers = MaskUtil.maskArray(users, {
    name: { type: 'name' },
    phone: { type: 'phone' },
    email: { type: 'email' }
});

console.log('脱敏后数组:', maskedUsers);
console.log();

// 8. 不同遮蔽字符
console.log('8. 使用不同遮蔽字符：');
console.log('使用 ● :', MaskUtil.maskPhone('13812345678', { maskChar: '●' }));
console.log('使用 # :', MaskUtil.maskEmail('user@example.com', { maskChar: '#' }));
console.log('使用 X :', MaskUtil.maskName('张三丰', { maskChar: 'X' }));
console.log();

// 9. 实际应用场景
console.log('9. 实际应用场景：');

// 模拟用户列表 API 响应
const apiResponse = {
    code: 200,
    message: 'success',
    data: {
        total: 2,
        list: [
            {
                id: 1,
                name: '张三',
                phone: '13812345678',
                email: 'zhangsan@example.com',
                createTime: '2023-01-01 10:00:00'
            },
            {
                id: 2,
                name: '李四',
                phone: '13987654321',
                email: 'lisi@test.com',
                createTime: '2023-01-02 11:00:00'
            }
        ]
    }
};

// 对列表数据进行脱敏
apiResponse.data.list = MaskUtil.maskArray(apiResponse.data.list, {
    name: { type: 'name' },
    phone: { type: 'phone' },
    email: { type: 'email' }
});

console.log('脱敏后的 API 响应:', JSON.stringify(apiResponse, null, 2));

console.log('\n=== 示例结束 ===');
