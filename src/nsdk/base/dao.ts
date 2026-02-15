'use strict'

import { DBClient,getRDSDBClient } from '../rds';
import { context_manager as context } from '../common';
import * as uuid from 'uuid';
import { new_id } from './id';
export enum Status {
    ACTIVE = 'active',
    INACTIVE = 'inactive'
}

/**
 * ID生成器类型
 */
export enum ID_GENERATOR {
    /** 需要业务方自行生成，不提供自动生成能力 */
    NONE = 'none',
    /** 自动生成UUID */
    UUID = 'uuid',
    /** 自动生成大整数ID，基于雪花算法的简化版本 */
    SNOWFLAKE = 'snowflake'
}
/**
 * 排序字段策略
 */
export interface SortFieldStrategy {
    /** 排序字段名称，默认为sort_num */
    field?: string;
    /** 排序字段初始值，默认为0 */
    initial_value?: number;
    /** 排序字段步长，默认为10 */
    step?: number;
    /** 获取排序字段最大值的条件 */
    condition_fields?: string[];
}
const default_sort_field_strategy: SortFieldStrategy = {
    field: 'sort_num',
    initial_value: 0,
    step: 10,
    condition_fields: []
}
export interface EntitySchema {
    /** 是否多租户，默认为true。若为是，实体中必须存在 tenant_id字段 */
    multi_tenant?: boolean;
    /** 是否启用标准属性，默认为true。配置为true时，会自动对标准属性进行处理，包括create_by、create_date、update_by、update_date */
    standard_properties?: boolean;
    /** ID生成器类型，默认为SNOWFLAKE。用于Dao.insert 方法中自动创建id */
    id_generator?: ID_GENERATOR;
    /** JSON字段列表配置，无默认值，需要显式声明。用于在Dao.insert、update、get方法中自动进行JSON字段的序列化或反序列化 */
    json_fields?: string[];
    /** 自动生成排序字段值 */
    sort_field_strategy?: SortFieldStrategy;
}
const default_entity_schema:EntitySchema = {
    /**
     * 是否多租户，true时，表示表中有tenant_id字段，那么需要支持以下逻辑：
     * 1. 新增时，需要从Context中获取当前租户ID，作为tenant_id字段的值
     * 2. 更新、删除、获取或查询时，需要考虑将当前租户ID作为条件，以免跨租户横向越权
     */
    multi_tenant: true,
    
    /**
     * 是否启用标准属性，若为 true，则实体将包含以下标准属性：
     * - create_date: 创建时间
     * - update_date: 更新时间
     * - create_by: 创建用户id
     * - update_by: 更新用户id
     * 同时，需要进行如下逻辑处理：
     * 1. 新增时，自动设置 create_date、update_date为当前时间，create_by、update_by为当前用户ID, 从Context中获取
     * 2. 更新时，自动设置 update_date 和 update_by
     */
    standard_properties: true,  // 是否启用标准属性

    /**
     * ID生成器，默认使用UUID
     * 可选值包括：
     * 1. UUID使用UUID作为ID
     * 2. SNOWFLAKE方创建ID
     * 
     * 处理逻辑包括：
     * - 新增时，如果实体没有提供ID，则自动生成一个ID
     */
    id_generator: ID_GENERATOR.SNOWFLAKE
}
export interface Filter {
    conditions?: any; // 查询条件对象
    orders?: any; // 排序条件对象
}

export class EntityBase {
    id?: any; // 实体ID
    [key: string]: unknown;
}

export class TenantEntityBase extends EntityBase {
    tenant_id?: any; // 租户ID
}

export class StandardEntityBase extends EntityBase {
    create_date?: Date; // 创建时间
    update_date?: Date; // 更新时间
    create_by?: number; // 创建用户ID
    update_by?: number; // 更新用户ID
}

export class ConfigBase extends StandardEntityBase {
    type?: any; // 配置类型
}

export class TenantStandardEntityBase extends TenantEntityBase {
    create_date?: Date; // 创建时间
    update_date?: Date; // 更新时间
    create_by?: number; // 创建用户ID
    update_by?: number; // 更新用户ID
}

class Org extends TenantStandardEntityBase {
    parent_id?: any; // 父组织ID
    area_id?: any; // 区域ID
}
// const org = new Org();
// org.aaa = 33;

export class DaoBase {
    table_name: string;
    datasource: string;
    entity_schema: EntitySchema; // 存储实体的元数据
    dbclient: DBClient;
    /**
     * 
     * @param {*} table_name 
     * @param {*} datasource 
     * @param {*} entity_schema 
     */
    constructor(table_name: string, datasource: string= "default", entity_schema: EntitySchema = {}) {
        this.table_name = table_name;
        this.datasource = datasource || 'default';
        const schema = Object.assign({}, default_entity_schema, entity_schema);
        this.entity_schema = schema; // 存储实体的元数据
        if(this.entity_schema.sort_field_strategy) {
            // 设置默认值
            this.entity_schema.sort_field_strategy = Object.assign({}, default_sort_field_strategy, this.entity_schema.sort_field_strategy);
        }

        this.dbclient = getRDSDBClient(datasource);
    }
    _handleJsonFieldBeforeSave(data: any) {
        if(this.entity_schema.json_fields && Array.isArray(this.entity_schema.json_fields)) {
            for(const key of this.entity_schema.json_fields) {
                if(data[key] && typeof(data[key])!='string') {
                    data[key] = JSON.stringify(data[key]);
                }
            }
        }
    }
    _handleJsonFieldAfterLoad(data: any) {
        if(this.entity_schema.json_fields && Array.isArray(this.entity_schema.json_fields)) {
            for(const key of this.entity_schema.json_fields) {
                if(data[key] && typeof(data[key])=='string') {
                    try {
                        data[key] = JSON.parse(data[key]);
                    } catch(err) {
                        data[key] = {};
                    }
                }
            }
        }
    }
    async insert(data: any): Promise<{insert_id?: any, affected_rows?: number}> {
        // 创建数据的副本，避免修改原始数据
        const insertData = { ...data };
        
        // 处理多租户
        if (this.entity_schema.multi_tenant) {
            const tenantId = context.getTenantId();
            if (!tenantId) {
                throw new Error('Multi-tenant mode enabled but no tenant_id found in context');
            }
            insertData.tenant_id = tenantId;
        }
        
        // 处理标准属性
        if (this.entity_schema.standard_properties) {
            const currentTime = new Date();
            const currentUserId = context.getUserId();
            
            insertData.create_date = currentTime;
            insertData.update_date = currentTime;
            
            if (currentUserId) {
                insertData.create_by = currentUserId;
                insertData.update_by = currentUserId;
            }
        }

        // 处理JSON字段
        this._handleJsonFieldBeforeSave(insertData);
        
        // 处理ID生成
        if (!insertData.id && this.entity_schema.id_generator) {
            insertData.id = this._generateId();
        }

        // 处理排序字段
        if(this.entity_schema.sort_field_strategy) {
            const sort_field = this.entity_schema.sort_field_strategy.field || 'sort_num';
            insertData[sort_field] = await this.genNewSortNum(insertData);
        }

        return this.dbclient.insert(this.table_name, insertData);
    }
    async genNewSortNum(data: any): Promise<number> {
        const sort_field_strategy = this.entity_schema.sort_field_strategy;
        // 构造查询条件
        const cond: Record<string, any> = {};
        sort_field_strategy?.condition_fields?.forEach((field) => {
            // 根据具体需求构造查询条件
            cond[field] = data[field];
        });
        const { whereClause, params } = this._buildComplexWhereClause(cond);
        const sql = `SELECT MAX(${sort_field_strategy?.field}) as max_sort FROM ${this.table_name} ${whereClause}`;
        const result = await this.dbclient.getOne(sql, params);
        let new_sort_num = sort_field_strategy?.initial_value || 0;
        if (result) {
            new_sort_num = Math.max(new_sort_num, result.max_sort + (sort_field_strategy?.step || 10));
        }
        return new_sort_num;
    }
    async get(id: any, extra_conditions?: any) {
        let conditions = {id: id, ...extra_conditions};
        if (this.entity_schema.multi_tenant) {
            const tenantId = context.getTenantId();
            if (!tenantId) {
                throw new Error('Multi-tenant mode enabled but no tenant_id found in context');
            }
            conditions.tenant_id = tenantId;
        }
        const { whereClause, params } = this._buildComplexWhereClause(conditions);
        let sql = `SELECT * FROM ${this.table_name} ${whereClause}`;
        // let args = [id];
        
        // // 处理多租户
        // if (this.entity_schema.multi_tenant) {
        //     const tenantId = context.getTenantId();
        //     if (!tenantId) {
        //         throw new Error('Multi-tenant mode enabled but no tenant_id found in context');
        //     }
        //     sql += ' AND tenant_id = ?';
        //     args.push(tenantId);
        // }
        
        let data = await this.dbclient.getOne(sql, params);

        // 处理JSON字段
        this._handleJsonFieldAfterLoad(data);

        return data;
    }

    async update(id: any, update_data: any, extra_conditions?: any): Promise<Boolean> {
        let conditions = {id: id, ...extra_conditions};
        const { whereClause, params } = this._buildComplexWhereClause(conditions);
        // 创建更新数据的副本，避免修改原始数据
        const updateData = { ...update_data };
        
        // 处理标准属性
        if (this.entity_schema.standard_properties) {
            updateData.update_date = new Date();
            const currentUserId = context.getUserId();
            if (currentUserId) {
                updateData.update_by = currentUserId;
            }
        }

        // 处理JSON字段
        this._handleJsonFieldBeforeSave(updateData);
        
        // 移除不应该被更新的字段
        delete updateData.id;
        delete updateData.create_date;
        delete updateData.create_by;
        if (this.entity_schema.multi_tenant) {
            delete updateData.tenant_id; // 租户ID不允许更新
        }
        
        const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
        let sql = `UPDATE ${this.table_name} SET ${setClause} ${whereClause}`;
        let args = [...Object.values(updateData), ...params];
        
        const result:any = await this.dbclient.execute(sql, args);
        // 返回更新是否成功
        return result? (result.affectedRows ? result.affectedRows > 0: false) : true;
    }
    async batch_update(ids: any[], update_data: any, extra_conditions?: any): Promise<any> {
        let conditions = {id: {$in: ids}, ...extra_conditions};

        const { whereClause, params } = this._buildComplexWhereClause(conditions);
        // 创建更新数据的副本，避免修改原始数据
        const updateData = { ...update_data };
        // 处理标准属性
        if (this.entity_schema.standard_properties) {
            updateData.update_date = new Date();
            const currentUserId = context.getUserId();
            if (currentUserId) {
                updateData.update_by = currentUserId;
            }
        }

        // 处理JSON字段
        this._handleJsonFieldBeforeSave(updateData);
        // 移除不应该被更新的字段
        delete updateData.id;
        delete updateData.create_date;
        delete updateData.create_by;

        if (this.entity_schema.multi_tenant) {
            delete updateData.tenant_id; // 租户ID不允许更新
        }
        const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
        let sql = `UPDATE ${this.table_name} SET ${setClause} ${whereClause}`;
        let args = [...Object.values(updateData), ...params];
        const result:any = await this.dbclient.execute(sql, args);
        // 返回更新影响的行数
        return result?.affected_rows || 0;
    }
    async remove(id: any, extra_conditions?: any): Promise<any> {
        let conditions = {id: id, ...extra_conditions} 
        if (this.entity_schema.multi_tenant) {
            const tenantId = context.getTenantId();
            if (!tenantId) {
                throw new Error('Multi-tenant mode enabled but no tenant_id found in context');
            }
            conditions.tenant_id = tenantId;
        }

        const { whereClause, params } = this._buildComplexWhereClause(conditions);

        let sql = `DELETE FROM ${this.table_name} ${whereClause}`;
        
        return this.dbclient.execute(sql, params);
    }
    async batch_remove(ids: any[], extra_conditions?: any): Promise<any> {
        let conditions = {id: { $in: ids }, ...extra_conditions} 

        const { whereClause, params } = this._buildComplexWhereClause(conditions);

        let sql = `DELETE FROM ${this.table_name} ${whereClause}`;
        return this.dbclient.execute(sql, params);
    }

    /**
     * 分页查询
     * @param {*} conditions , 查询条件对象，示例 {"field1": "value1", "field2": {"$gt": 10}, "field3": {"$in": ["value1", "value2"]}} 
     * 支持的操作符包括: $gt, $lt, $gte, $lte, $ne, $in, $nin, $like, $daterange, $between
     * @param {*} orders , 排序条件 {"field": "ASC"} 或 {"field": "DESC"}, 多条件时 {"field1": "ASC", "field2": "DESC"}
     * @param {*} limit 
     * @param {*} offset 
     * @return {Promise<PageResult>} 返回查询结果带有总数的分页结果 { total:int , items:Array}
     */
    async query(filter: Filter = {}, limit = 10, offset = 0) : Promise<{ total: number; items: any[] }>{
        
        const { whereClause, params } = this._buildComplexWhereClause(filter.conditions);
        const orderClause = this._buildOrderClause(filter.orders);
        
        // 构建查询SQL
        const sql = `SELECT * FROM ${this.table_name} ${whereClause} ${orderClause}`;
        
        // 使用dbclient的queryWithTotal方法
        return await this.dbclient.queryWithTotal(sql, params, limit, offset);
    }

    async list(filter: Filter = {}, limit = 1000): Promise<any[]> {
        const { whereClause, params } = this._buildComplexWhereClause(filter.conditions);
        const orderClause = this._buildOrderClause(filter.orders);
        
        // 构建查询SQL
        const sql = `SELECT * FROM ${this.table_name} ${whereClause} ${orderClause}`;
        // params.push(limit); // 添加limit参数
        
        // 使用dbclient的query方法
        return await this.dbclient.query(sql, params, limit);
    }

    async findOne(filter: Filter = {}) {
        const { whereClause, params } = this._buildComplexWhereClause(filter.conditions);
        // 构建查询SQL
        const sql = `SELECT * FROM ${this.table_name} ${whereClause} `;
        // 使用dbclient的findOne方法
        let data = await this.dbclient.findOne(sql, params);
        // 处理JSON字段
        if(data) {
            this._handleJsonFieldAfterLoad(data);
        }
        return data;
    }

    async count(filter: Filter = {}) : Promise<number> {
        const { whereClause, params } = this._buildComplexWhereClause(filter.conditions);
        const sql = `SELECT * FROM ${this.table_name} ${whereClause} `;
        return await this.dbclient.count(sql, params);
    }


    /**
     * 构建复杂的WHERE子句，支持多种操作符
     * @param {Object} cond_obj 查询条件对象
     * @returns {Object} {whereClause: string, params: Array}
     */
    _buildComplexWhereClause(cond_obj: any): { whereClause: string; params: any[] } {
        const conditions = [];
        const params = [];

        // 处理多租户：自动添加租户过滤条件
        if (this.entity_schema.multi_tenant) {
            const tenantId = context.getTenantId();
            if (!tenantId) {
                throw new Error('Multi-tenant mode enabled but no tenant_id found in context');
            }
            conditions.push('tenant_id = ?');
            params.push(tenantId);
        }

        // if(!cond_obj || Object.keys(cond_obj).length === 0) {
        //     return { whereClause: '', params: [] };
        // }

        // 处理用户提供的查询条件
        if (cond_obj && Object.keys(cond_obj).length > 0) {
            for (const [field, value] of Object.entries(cond_obj)) {
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    // 处理操作符
                    for (const [operator, operatorValue] of Object.entries(value)) {
                        const { condition, param } = this._buildOperatorCondition(field, operator, operatorValue);
                        if (condition) {
                            conditions.push(condition);
                            if (param !== undefined) {
                                if (Array.isArray(param)) {
                                    params.push(...param);
                                } else {
                                    params.push(param);
                                }
                            }
                        }
                    }
                } else {
                    // 简单相等条件
                    conditions.push(`${field} = ?`);
                    params.push(value);
                }
            }
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        return { whereClause, params };
    }

    /**
     * 构建操作符条件
     * @param {string} field 字段名
     * @param {string} operator 操作符
     * @param {*} value 值
     * @returns {Object} {condition: string, param: any}
     */
    _buildOperatorCondition(field: any, operator: any, value: any) {
        switch (operator) {
            case '$gt':
                return { condition: `${field} > ?`, param: value };
            case '$gte':
                return { condition: `${field} >= ?`, param: value };
            case '$lt':
                return { condition: `${field} < ?`, param: value };
            case '$lte':
                return { condition: `${field} <= ?`, param: value };
            case '$ne':
                return { condition: `${field} != ?`, param: value };
            case '$in':
                if (Array.isArray(value) && value.length > 0) {
                    const placeholders = value.map(() => '?').join(', ');
                    return { condition: `${field} IN (${placeholders})`, param: value };
                }
                return { condition: '1=0', param: undefined }; // 空数组时返回false条件
            case '$nin':
                if (Array.isArray(value) && value.length > 0) {
                    const placeholders = value.map(() => '?').join(', ');
                    return { condition: `${field} NOT IN (${placeholders})`, param: value };
                }
                return { condition: '1=1', param: undefined }; // 空数组时返回true条件
            case '$like':
                return { condition: `${field} LIKE ?`, param: `%${value}%` };
            case '$between':
                if (Array.isArray(value) && value.length === 2) {
                    return { condition: `${field} BETWEEN ? AND ?`, param: value };
                }
                throw new Error('$between operator requires an array with exactly 2 elements');
            case '$daterange':
                if (Array.isArray(value) && value.length === 2) {
                    return { condition: `${field} BETWEEN ? AND ?`, param: value };
                }
                throw new Error('$daterange operator requires an array with exactly 2 elements');
            default:
                throw new Error(`Unsupported operator: ${operator}`);
        }
    }

    /**
     * 构建ORDER BY子句
     * @param {Object} order_obj 排序条件对象
     * @returns {string} ORDER BY子句
     */
    _buildOrderClause(order_obj: any): string {
        if (!order_obj || Object.keys(order_obj).length === 0) {
            return '';
        }

        const orderParts = [];
        for (const [field, direction] of Object.entries(order_obj)) {
            const upperDirection = direction ? direction.toString().toUpperCase() : 'ASC';
            if (upperDirection === 'ASC' || upperDirection === 'DESC') {
                orderParts.push(`${field} ${upperDirection}`);
            } else {
                orderParts.push(`${field} ASC`); // 默认升序
                // TODO: 需要输出一个warning日志
                // throw new Error(`Invalid sort direction: ${direction}. Must be 'ASC' or 'DESC'`);
            }
        }

        return orderParts.length > 0 ? `ORDER BY ${orderParts.join(', ')}` : '';
    }

    /**
     * 生成ID
     * @private
     * @returns {string} 生成的ID
     */
    _generateId() {
        switch (this.entity_schema.id_generator) {
            case ID_GENERATOR.UUID:
                return uuid.v4();
            case ID_GENERATOR.SNOWFLAKE:
                return new_id();
            default:
                throw new Error(`Unsupported ID generator: ${this.entity_schema.id_generator}`);
        }
    }
}
