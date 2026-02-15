interface DBClient {
    insert(table_name: string, data: any): Promise<any>;
    execute(sql: string, args?: any[]): Promise<any>;
    exists(sql: string, args?: any[]): Promise<boolean>;
    query(sql: string, args?: any[], limit?: number, offset?: number): Promise<any[]>;
    queryWithTotal(sql: string, args?: any[], limit?: number, offset?: number): Promise<{ total: number; items: any[] }>;
    findOne(sql: string, args?: any[]): Promise<any>;
    getOne(sql: string, args: any[]): Promise<any>;
    count(sql: string, args?: any[]): Promise<number>;
}

export { DBClient };