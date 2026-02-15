// const mysql = require('mysql2/promise');
import { Pool, createPool, PoolOptions } from 'mysql2/promise';
import { DBClient } from './interface';
import { NotFoundError } from '../base';

class MySQLDBClient implements DBClient {
    config: any;
    pool: Pool | null = null;
    constructor(config: any) {
        // Initialize the MySQL client with the provided datasource
        this.config = config;
        this.initPool();
    }
    initPool() {
        const options:PoolOptions = {
            connectionLimit: this.config.connectionLimit || 10,
            host: this.config.host,
            user: this.config.user,
            password: this.config.password,
            database: this.config.database,
            port: this.config.port || 3306,
            connectTimeout: this.config.connectTimeout || 60000,
            charset: this.config.charset || 'utf8mb4',
            // 添加字符编码相关配置
            supportBigNumbers: true,
            bigNumberStrings: true,
            dateStrings: false,
            debug: false,
            multipleStatements: false,
            // 设置时区
            timezone: '+08:00',
            // 确保使用正确的字符编码
            typeCast: function (field: any, next: any) {
                if (field.type === 'TINY' && field.length === 1) {
                    return (field.string() === '1'); // 1 = true, 0 = false
                }
                return next();
            }
        }

        this.pool = createPool(options);
        
        // 连接后立即设置字符集，确保连接级别的字符编码正确
        this.initializeConnection();
    }
    
    /**
     * 初始化数据库连接，设置字符集和其他连接级别的配置
     */
    private async initializeConnection() {
        try {
            // 设置连接字符集，确保中文正确显示
            await this.execute("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
            await this.execute("SET CHARACTER SET utf8mb4");
            await this.execute("SET character_set_connection=utf8mb4");
            console.log('数据库连接字符集初始化完成');
        } catch (error) {
            console.warn('数据库连接字符集初始化失败:', error);
        }
    }

    // Implement the methods defined in the DBClient interface
    async insert(table_name: string, data: any): Promise<any> {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data for insert operation');
        }

        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = fields.map(() => '?').join(', ');
        const fieldNames = fields.join(', ');

        const sql = `INSERT INTO ${table_name} (${fieldNames}) VALUES (${placeholders})`;
        
        try {
            const result = await this.execute(sql, values);
            return {
                insert_id: data.id || result.insertId,
                affected_rows: result.affectedRows
            };
        } catch (error) {
            const err = error as Error;
            throw new Error(`Insert operation failed: ${err.message}`);
        }
    }

    async execute(sql: string, args?: any[]): Promise<any> {
        if (!this.pool) {
            throw new Error('Database connection pool is not initialized');
        }
        try {
            console.log(`Executing SQL: ${sql}, args: ${args ? args.length : 0}`);
            const [results] = await this.pool.execute(sql, args);
            return results;
        } catch (error) {
            const err = error as Error;
            throw new Error(`SQL execution failed: ${err.message}`);
        }
    }

    async exists(sql: string, args?: any[]): Promise<boolean> {
        try {
            const result = await this.execute(sql, args);
            return Array.isArray(result) && result.length > 0;
        } catch (error) {
            const err = error as Error;
            throw new Error(`Exists check failed: ${err.message}`);
        }
    }

    async query(sql: string, args: any[], limit: number = 0, offset: number = 0): Promise<any[]> {
        let finalSql = sql;
        let finalArgs = [...args];

        // 添加 LIMIT 和 OFFSET
        if (limit > 0) {
            finalSql += ' LIMIT ' + limit;
            if (offset > 0) {
                finalSql += ' OFFSET ' + offset;
            }
        }
        console.log(`Executing query: ${finalSql}, args: ${finalArgs.length}`);
        try {
            const result = await this.execute(finalSql, finalArgs);
            return Array.isArray(result) ? result : [];
        } catch (error) {
            const err = error as Error;
            throw new Error(`Query operation failed: ${err.message}`);
        }
    }

    async queryWithTotal(sql: string, args: any[], limit: number = 10, offset: number = 0): Promise<{ total: number; items: any[] }> {
        try {
            const total = await this.count(sql, args);
            if (total === 0) {
                return { total: 0, items: [] };
            }
            // 获取分页数据
            const data = await this.query(sql, args, limit, offset);

            return {
                items: data,
                total: total
            };
        } catch (error) {
            const err = error as Error;
            throw new Error(`QueryWithTotal operation failed: ${err.message}`);
        }
    }

    async findOne(sql: string, args: any[]): Promise<any> {
        const results = await this.query(sql, args, 1);
        return results.length === 0 ? null : results[0];
    }

    async getOne(sql: string, args: any[]): Promise<any> {
        const results = await this.query(sql, args, 1);
        if(results.length === 0) {
            throw new NotFoundError('expected record not found');
        } else {
            return results[0];
        }
    }

    async count(sql: string, args: any[]): Promise<number> {
        try {
            const countSql = `SELECT COUNT(*) as total FROM (${sql}) as count_table`;
            console.log(`Executing count: ${countSql}, args: ${args.length}`);
            const countResult = await this.execute(countSql, args);
            return countResult[0] ? countResult[0].total : 0;
        } catch (error) {
            const err = error as Error;
            throw new Error(`Query operation failed: ${err.message}`);
        }
    }
}

export { MySQLDBClient };