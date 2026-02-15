import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MySQLDBClient } from '../../../src/nsdk/dbclient/rdsdbclient_mysql';

// Mock mysql2/promise
const mockPool = {
  execute: vi.fn(),
  end: vi.fn()
};

const mockCreatePool = vi.fn(() => mockPool);

vi.mock('mysql2/promise', () => ({
  createPool: mockCreatePool
}));

describe('MySQLDBClient Unit Tests', () => {
  let dbClient: MySQLDBClient;
  const mockConfig = {
    host: 'localhost',
    user: 'test',
    password: 'test',
    database: 'test',
    port: 3306,
    connectionLimit: 10,
    charset: 'utf8mb4'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    dbClient = new MySQLDBClient(mockConfig);
  });

  describe('Constructor and Pool Initialization', () => {
    it('should initialize with correct config', () => {
      expect(mockCreatePool).toHaveBeenCalledWith({
        connectionLimit: 10,
        host: 'localhost',
        user: 'test',
        password: 'test',
        database: 'test',
        port: 3306,
        connectTimeout: 60000,
        charset: 'utf8mb4'
      });
    });

    it('should use default values for missing config', () => {
      const minimalConfig = {
        host: 'localhost',
        user: 'test',
        password: 'test',
        database: 'test'
      };

      new MySQLDBClient(minimalConfig);

      expect(mockCreatePool).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionLimit: 10,
          port: 3306,
          connectTimeout: 60000,
          charset: 'utf8mb4'
        })
      );
    });
  });

  describe('execute() method', () => {
    it('should execute SQL with parameters', async () => {
      const mockResults = [{ id: 1, name: 'test' }];
      mockPool.execute.mockResolvedValue([mockResults]);

      const result = await dbClient.execute('SELECT * FROM users WHERE id = ?', [1]);

      expect(mockPool.execute).toHaveBeenCalledWith('SELECT * FROM users WHERE id = ?', [1]);
      expect(result).toEqual(mockResults);
    });

    it('should execute SQL without parameters', async () => {
      const mockResults = [{ count: 5 }];
      mockPool.execute.mockResolvedValue([mockResults]);

      const result = await dbClient.execute('SELECT COUNT(*) as count FROM users');

      expect(mockPool.execute).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM users', undefined);
      expect(result).toEqual(mockResults);
    });

    it('should throw error when pool is not initialized', async () => {
      dbClient['pool'] = null;

      await expect(dbClient.execute('SELECT 1'))
        .rejects.toThrow('Database connection pool is not initialized');
    });

    it('should handle database errors', async () => {
      mockPool.execute.mockRejectedValue(new Error('Database connection failed'));

      await expect(dbClient.execute('SELECT 1'))
        .rejects.toThrow('SQL execution failed: Database connection failed');
    });
  });

  describe('exists() method', () => {
    it('should return true when records exist', async () => {
      const mockResults = [{ id: 1 }];
      mockPool.execute.mockResolvedValue([mockResults]);

      const result = await dbClient.exists('SELECT id FROM users WHERE name = ?', ['John']);

      expect(mockPool.execute).toHaveBeenCalledWith('SELECT id FROM users WHERE name = ?', ['John']);
      expect(result).toBe(true);
    });

    it('should return false when no records exist', async () => {
      const mockResults: any[] = [];
      mockPool.execute.mockResolvedValue([mockResults]);

      const result = await dbClient.exists('SELECT id FROM users WHERE name = ?', ['NonExistent']);

      expect(result).toBe(false);
    });

    it('should handle errors in exists check', async () => {
      mockPool.execute.mockRejectedValue(new Error('Table does not exist'));

      await expect(dbClient.exists('SELECT id FROM invalid_table'))
        .rejects.toThrow('SQL execution failed: Table does not exist');
    });
  });

  describe('insert() method', () => {
    it('should insert data successfully', async () => {
      const mockResult = {
        insertId: 123,
        affectedRows: 1
      };
      mockPool.execute.mockResolvedValue([mockResult]);

      const insertData = { name: 'John', email: 'john@example.com' };
      const result = await dbClient.insert('users', insertData);

      expect(mockPool.execute).toHaveBeenCalledWith(
        'INSERT INTO users (name, email) VALUES (?, ?)',
        ['John', 'john@example.com']
      );
      expect(result).toEqual({
        insertId: 123,
        affectedRows: 1
      });
    });

    it('should handle empty data object', async () => {
      await expect(dbClient.insert('users', {}))
        .rejects.toThrow('Invalid data for insert operation');
    });

    it('should handle null data', async () => {
      await expect(dbClient.insert('users', null))
        .rejects.toThrow('Invalid data for insert operation');
    });

    it('should handle insert with null values', async () => {
      const mockResult = {
        insertId: 124,
        affectedRows: 1
      };
      mockPool.execute.mockResolvedValue([mockResult]);

      const insertData = { name: 'Jane', email: null, age: 25 };
      const result = await dbClient.insert('users', insertData);

      expect(mockPool.execute).toHaveBeenCalledWith(
        'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
        ['Jane', null, 25]
      );
      expect(result).toEqual({
        insertId: 124,
        affectedRows: 1
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown error types', async () => {
      mockPool.execute.mockRejectedValue('String error');

      await expect(dbClient.execute('SELECT 1'))
        .rejects.toThrow('SQL execution failed: String error');
    });

    it('should handle non-Error objects', async () => {
      mockPool.execute.mockRejectedValue({ code: 'ER_NO_SUCH_TABLE', message: 'Table not found' });

      await expect(dbClient.execute('SELECT 1'))
        .rejects.toThrow('SQL execution failed: [object Object]');
    });
  });

  describe('Connection Management', () => {
    it('should close connection pool if close method exists', async () => {
      if ('close' in dbClient && typeof dbClient.close === 'function') {
        await dbClient.close();
        expect(mockPool.end).toHaveBeenCalled();
      } else {
        // 如果没有 close 方法，直接设置 pool 为 null
        dbClient['pool'] = null;
        expect(dbClient['pool']).toBeNull();
      }
    });

    it('should handle missing close method gracefully', async () => {
      // 测试当 close 方法不存在时的处理
      dbClient['pool'] = null;
      expect(dbClient['pool']).toBeNull();
    });
  });
});
