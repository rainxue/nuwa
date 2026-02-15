// 测试环境变量加载
require('dotenv').config();

console.log('=== 环境变量测试 ===');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('RDS_DS_HOST_default:', process.env.RDS_DS_HOST_default);

// 检查是否所有必要的环境变量都存在
const requiredEnvVars = [
    'PORT',
    'NODE_ENV', 
    'JWT_SECRET',
    'RDS_DS_HOST_default',
    'RDS_DS_DATABASE_default'
];

let missing = [];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        missing.push(envVar);
    }
}

if (missing.length > 0) {
    console.error('❌ 缺少环境变量:', missing);
} else {
    console.log('✅ 所有必要的环境变量都已加载');
}
