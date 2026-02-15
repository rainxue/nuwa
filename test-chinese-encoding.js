#!/usr/bin/env node

/**
 * 测试中文字符编码的脚本
 * 运行方式: node test-chinese-encoding.js
 */

require('dotenv').config();
const { getRDSDBClient } = require('./src/nsdk/rds');

async function testChineseEncoding() {
    console.log('🔍 开始测试中文字符编码...');
    
    try {
        const dbClient = getRDSDBClient('default');
        
        // 1. 检查数据库字符集设置
        console.log('📊 检查数据库字符集设置...');
        const charsetResult = await dbClient.execute(`
            SHOW VARIABLES WHERE Variable_name LIKE 'character_set_%' 
            OR Variable_name LIKE 'collation_%'
        `);
        
        console.log('数据库字符集配置:');
        charsetResult.forEach(row => {
            console.log(`  ${row.Variable_name}: ${row.Value}`);
        });
        
        // 2. 测试中文插入和查询
        console.log('\n🔤 测试中文数据插入和查询...');
        const testTableName = 'test_chinese_' + Date.now();
        
        // 创建测试表
        await dbClient.execute(`
            CREATE TABLE ${testTableName} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // 插入中文测试数据
        const testData = {
            name: '测试用户姓名',
            description: '这是一个包含中文字符的测试描述，包含各种符号：！@#￥%……&*（）'
        };
        
        console.log('插入的测试数据:', testData);
        await dbClient.insert(testTableName, testData);
        
        // 查询数据验证
        const result = await dbClient.query(`SELECT * FROM ${testTableName}`, []);
        console.log('查询结果:', result);
        
        if (result.length > 0) {
            const record = result[0];
            console.log('\n✅ 中文字符测试结果:');
            console.log(`  原始姓名: ${testData.name}`);
            console.log(`  查询姓名: ${record.name}`);
            console.log(`  原始描述: ${testData.description}`);
            console.log(`  查询描述: ${record.description}`);
            
            if (record.name === testData.name && record.description === testData.description) {
                console.log('🎉 中文字符编码测试通过！');
            } else {
                console.log('❌ 中文字符编码存在问题！');
            }
        }
        
        // 清理测试表
        await dbClient.execute(`DROP TABLE ${testTableName}`);
        console.log(`🗑️ 测试表 ${testTableName} 已清理`);
        
    } catch (error) {
        console.error('❌ 测试过程中出现错误:', error);
    }
}

// 运行测试
testChineseEncoding().catch(console.error);
