import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { getRDSDBClient } from '../../../src/nsdk/dbclient';
import { DBClient } from '../../../src/nsdk/dbclient/interface';

describe('MySQL DBClient Integration Tests', () => {
  let dbClient: DBClient;
  const testTableName = 'test_users';

  beforeAll(async () => {
    // 获取数据库客户端实例
    dbClient = getRDSDBClient('default');
    
    // 创建测试表
    await createTestTable();
  });

  afterAll(async () => {
    // 清理测试表
    await dropTestTable();
    
    // 关闭数据库连接
    if ('close' in dbClient && typeof dbClient.close === 'function') {
      await dbClient.close();
    }
  });

  beforeEach(async () => {
    // 每个测试前清空测试表
    await dbClient.execute(`DELETE FROM ${testTableName}`);
  });

  async function createTestTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${testTableName} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE,
        age INT,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `;
    
    await dbClient.execute(createTableSQL);
    console.log(`✅ Test table ${testTableName} created`);
  }

  async function dropTestTable() {
    try {
      await dbClient.execute(`DROP TABLE IF EXISTS ${testTableName}`);
      console.log(`🗑️ Test table ${testTableName} dropped`);
    } catch (error) {
      console.warn(`Failed to drop test table: ${error}`);
    }
  }

  describe('Database Connection', () => {
    it('should establish database connection successfully', async () => {
      // 测试基本连接
      const result = await dbClient.execute('SELECT 1 as test');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('test', 1);
    });

    it('should handle database version query', async () => {
      const result = await dbClient.execute('SELECT VERSION() as version');
      expect(result).toBeDefined();
      expect(result[0]).toHaveProperty('version');
      expect(typeof result[0].version).toBe('string');
    });
  });

  describe('insert() method', () => {
    it('should insert a single record successfully', async () => {
      const testData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        status: 'active'
      };

      const result = await dbClient.insert(testTableName, testData);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('insertId');
      expect(result).toHaveProperty('affectedRows', 1);
      expect(result.insertId).toBeGreaterThan(0);
    });

    it('should insert multiple records with different data types', async () => {
      const testCases = [
        {
          name: 'Alice Smith',
          email: 'alice@example.com',
          age: 25,
          status: 'active'
        },
        {
          name: 'Bob Johnson',
          email: 'bob@example.com',
          age: 35,
          status: 'inactive'
        },
        {
          name: 'Charlie Brown',
          email: null, // 测试 null 值
          age: 28,
          status: 'active'
        }
      ];

      for (const testData of testCases) {
        const result = await dbClient.insert(testTableName, testData);
        expect(result.affectedRows).toBe(1);
        expect(result.insertId).toBeGreaterThan(0);
      }
    });

    it('should handle duplicate key error', async () => {
      const testData = {
        name: 'Test User',
        email: 'duplicate@example.com',
        age: 30
      };

      // 插入第一条记录
      await dbClient.insert(testTableName, testData);

      // 尝试插入重复的 email，应该抛出错误
      await expect(dbClient.insert(testTableName, testData))
        .rejects.toThrow(/Duplicate entry/);
    });
  });

  describe('execute() method', () => {
    beforeEach(async () => {
      // 为测试准备一些数据
      const testData = [
        { name: 'User 1', email: 'user1@example.com', age: 25, status: 'active' },
        { name: 'User 2', email: 'user2@example.com', age: 30, status: 'inactive' },
        { name: 'User 3', email: 'user3@example.com', age: 35, status: 'active' }
      ];

      for (const data of testData) {
        await dbClient.insert(testTableName, data);
      }
    });

    it('should execute SELECT query with parameters', async () => {
      const sql = `SELECT * FROM ${testTableName} WHERE status = ? ORDER BY age`;
      const result = await dbClient.execute(sql, ['active']);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('email');
      expect(result[0].status).toBe('active');
    });

    it('should execute UPDATE query', async () => {
      const updateSQL = `UPDATE ${testTableName} SET age = ? WHERE name = ?`;
      const result = await dbClient.execute(updateSQL, [40, 'User 1']);

      expect(result).toHaveProperty('affectedRows', 1);
      expect(result).toHaveProperty('changedRows', 1);

      // 验证更新结果
      const selectSQL = `SELECT age FROM ${testTableName} WHERE name = ?`;
      const selectResult = await dbClient.execute(selectSQL, ['User 1']);
      expect(selectResult[0].age).toBe(40);
    });

    it('should execute DELETE query', async () => {
      const deleteSQL = `DELETE FROM ${testTableName} WHERE status = ?`;
      const result = await dbClient.execute(deleteSQL, ['inactive']);

      expect(result).toHaveProperty('affectedRows', 1);

      // 验证删除结果
      const countSQL = `SELECT COUNT(*) as count FROM ${testTableName}`;
      const countResult = await dbClient.execute(countSQL);
      expect(countResult[0].count).toBe(2);
    });

    it('should handle complex queries with multiple parameters', async () => {
      const sql = `
        SELECT * FROM ${testTableName} 
        WHERE age BETWEEN ? AND ? 
        AND status = ? 
        ORDER BY age DESC
      `;
      const result = await dbClient.execute(sql, [25, 35, 'active']);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0].age).toBeGreaterThanOrEqual(25);
      expect(result[0].age).toBeLessThanOrEqual(35);
    });

    it('should handle queries that return no results', async () => {
      const sql = `SELECT * FROM ${testTableName} WHERE name = ?`;
      const result = await dbClient.execute(sql, ['Non-existent User']);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('exists() method', () => {
    beforeEach(async () => {
      // 插入测试数据
      await dbClient.insert(testTableName, {
        name: 'Existing User',
        email: 'existing@example.com',
        age: 30
      });
    });

    it('should return true for existing record', async () => {
      const sql = `SELECT 1 FROM ${testTableName} WHERE email = ?`;
      const exists = await dbClient.exists(sql, ['existing@example.com']);

      expect(exists).toBe(true);
    });

    it('should return false for non-existing record', async () => {
      const sql = `SELECT 1 FROM ${testTableName} WHERE email = ?`;
      const exists = await dbClient.exists(sql, ['nonexistent@example.com']);

      expect(exists).toBe(false);
    });

    it('should work with complex WHERE conditions', async () => {
      const sql = `
        SELECT 1 FROM ${testTableName} 
        WHERE name = ? AND age > ? AND status = ?
      `;
      const exists = await dbClient.exists(sql, ['Existing User', 25, 'active']);

      expect(exists).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle SQL syntax errors', async () => {
      const invalidSQL = 'INVALID SQL QUERY';
      
      await expect(dbClient.execute(invalidSQL))
        .rejects.toThrow();
    });

    it('should handle invalid table name', async () => {
      const sql = 'SELECT * FROM non_existent_table';
      
      await expect(dbClient.execute(sql))
        .rejects.toThrow(/Table.*doesn't exist/);
    });

    it('should handle invalid column name', async () => {
      const sql = `SELECT invalid_column FROM ${testTableName}`;
      
      await expect(dbClient.execute(sql))
        .rejects.toThrow(/Unknown column/);
    });

    it('should handle invalid data types', async () => {
      const invalidData = {
        name: 'Test User',
        age: 'invalid_age_string' // 应该是数字
      };

      await expect(dbClient.insert(testTableName, invalidData))
        .rejects.toThrow();
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple concurrent operations', async () => {
      const operations: Promise<any>[] = [];
      
      // 创建多个并发插入操作
      for (let i = 0; i < 10; i++) {
        operations.push(
          dbClient.insert(testTableName, {
            name: `Concurrent User ${i}`,
            email: `concurrent${i}@example.com`,
            age: 20 + i
          })
        );
      }

      const results = await Promise.all(operations);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.affectedRows).toBe(1);
        expect(result.insertId).toBeGreaterThan(0);
      });

      // 验证所有记录都被插入
      const countResult = await dbClient.execute(`SELECT COUNT(*) as count FROM ${testTableName}`);
      expect(countResult[0].count).toBe(10);
    });

    it('should handle large dataset operations', async () => {
      const largeDataset: Array<{name: string, email: string, age: number}> = [];
      for (let i = 0; i < 100; i++) {
        largeDataset.push({
          name: `User ${i}`,
          email: `user${i}@example.com`,
          age: 20 + (i % 50)
        });
      }

      // 批量插入
      const startTime = Date.now();
      for (const data of largeDataset) {
        await dbClient.insert(testTableName, data);
      }
      const endTime = Date.now();

      console.log(`⏱️ Inserted 100 records in ${endTime - startTime}ms`);

      // 验证插入结果
      const countResult = await dbClient.execute(`SELECT COUNT(*) as count FROM ${testTableName}`);
      expect(countResult[0].count).toBe(100);
    });
  });

  describe('Transaction-like Operations', () => {
    it('should maintain data consistency across multiple operations', async () => {
      // 插入用户
      const userResult = await dbClient.insert(testTableName, {
        name: 'Transaction User',
        email: 'transaction@example.com',
        age: 30
      });

      const userId = userResult.insertId;

      // 更新用户
      const updateResult = await dbClient.execute(
        `UPDATE ${testTableName} SET age = ? WHERE id = ?`,
        [35, userId]
      );

      expect(updateResult.affectedRows).toBe(1);

      // 验证更新
      const selectResult = await dbClient.execute(
        `SELECT * FROM ${testTableName} WHERE id = ?`,
        [userId]
      );

      expect(selectResult[0].age).toBe(35);
      expect(selectResult[0].name).toBe('Transaction User');
    });
  });
});
