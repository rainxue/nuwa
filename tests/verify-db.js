#!/usr/bin/env node

/**
 * 快速验证数据库连接和基础功能的脚本
 * 运行方式: node tests/verify-db.js
 */

require('dotenv').config();
const { getRDSDBClient } = require('../src/nsdk/dbclient');

async function verifyDatabaseConnection() {
  console.log('🔍 开始验证数据库连接...');
  
  try {
    const dbClient = getRDSDBClient('default');
    
    // 测试基本连接
    console.log('📡 测试数据库连接...');
    const versionResult = await dbClient.execute('SELECT VERSION() as version');
    console.log('✅ 数据库连接成功');
    console.log('📊 MySQL 版本:', versionResult[0].version);
    
    // 测试基本查询
    console.log('🔍 测试基本查询...');
    const testResult = await dbClient.execute('SELECT 1 + 1 as result');
    console.log('✅ 基本查询成功:', testResult[0].result);
    
    // 测试表操作权限
    console.log('🔧 测试表操作权限...');
    const testTableName = 'verify_test_' + Date.now();
    
    // 创建临时表
    await dbClient.execute(`
      CREATE TABLE ${testTableName} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        test_data VARCHAR(100)
      )
    `);
    console.log('✅ 创建表成功');
    
    // 插入测试数据
    const insertResult = await dbClient.insert(testTableName, {
      test_data: 'verification test'
    });
    console.log('✅ 插入数据成功, ID:', insertResult.insertId);
    
    // 查询测试数据
    const selectResult = await dbClient.execute(
      `SELECT * FROM ${testTableName} WHERE id = ?`,
      [insertResult.insertId]
    );
    console.log('✅ 查询数据成功:', selectResult[0].test_data);
    
    // 测试 exists 方法
    const exists = await dbClient.exists(
      `SELECT 1 FROM ${testTableName} WHERE test_data = ?`,
      ['verification test']
    );
    console.log('✅ exists 方法测试成功:', exists);
    
    // 清理临时表
    await dbClient.execute(`DROP TABLE ${testTableName}`);
    console.log('✅ 清理临时表成功');
    
    console.log('');
    console.log('🎉 所有验证测试通过！数据库配置正确。');
    console.log('');
    console.log('现在可以运行完整的测试套件:');
    console.log('  npm run test:integration  # 运行集成测试');
    console.log('  npm run test:unit         # 运行单元测试');
    console.log('  npm test                  # 运行所有测试');
    
  } catch (error) {
    console.error('❌ 数据库验证失败:');
    console.error('错误详情:', error.message);
    console.error('');
    console.error('请检查以下配置:');
    console.error('1. .env 文件中的数据库连接配置');
    console.error('2. 数据库服务是否运行');
    console.error('3. 数据库用户是否有足够权限');
    console.error('4. 数据库是否存在');
    
    process.exit(1);
  }
}

// 运行验证
verifyDatabaseConnection().catch(console.error);
