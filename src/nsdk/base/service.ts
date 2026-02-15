
import { DaoBase,Filter } from "./dao";

export class ServiceBase<T> {
    dao: DaoBase;

    constructor(dao: DaoBase) {
        this.dao = dao;
    }

    async add(data: T): Promise<{result: boolean, id?: any}> {
        const result = await this.dao.insert(data);
        if(result && result.affected_rows) 
            return { result: true, id: result.insert_id };
        else
            return { result: false };
    }

    async update(id: any, data: T): Promise<any> {
        const ret = await this.dao.update(id, data);
        return {result: ret};
    }
    async batch_update(ids: any[], data: T): Promise<any> {
        return this.dao.batch_update(ids, data);
    }
    async remove(id: any): Promise<any> {
        return this.dao.remove(id);
    }
    async batch_remove(ids: any[]): Promise<any> {
        return this.dao.batch_remove(ids);
    }

    async get(id: any): Promise<T> {
        return this.dao.get(id);
    }

    async findOne(filter: any): Promise<T> {
        return this.dao.findOne(filter);
    }

    async query(filter: Filter, limit: number = 10, offset: number = 0): Promise<{total: number; items: T[]}> {
        return this.dao.query(filter, limit, offset);
    }
    async list(filter: Filter, limit: number = 1000): Promise<T[]> {
        return this.dao.list(filter, limit);
    }
    async count(filter: any): Promise<number> {
        return this.dao.count(filter);
    }

    async tree(filter: Filter, id_field: string = 'id', parent_id_field: string = 'pid', root_parent_id: any = 0): Promise<T[]> {
        const items = await this.dao.list(filter);
        const tree = this.buildTree(items, id_field, parent_id_field, root_parent_id);
        return tree;
    }

    private buildTree(items: any[], id_field: string, parent_id_field: string, root_parent_id: any): any[] {
        const itemMap: Map<any, any> = new Map();
        const tree: any[] = [];
        
        // 第一遍：建立映射表，并初始化 children 数组
        items.forEach(item => {
            item.children = [];
            itemMap.set(item[id_field], item);
        });
        
        // 第二遍：构建树形结构
        items.forEach(item => {
            const parentId = item[parent_id_field];
            
            // 使用类型转换确保比较的一致性
            if (this.isEqual(parentId, root_parent_id)) {
                tree.push(item);
            } else {
                const parent = itemMap.get(parentId);
                if (parent) {
                    parent.children.push(item);
                } else {
                    // 如果找不到父节点，将其作为根节点处理（可选）
                    console.warn(`Parent node with id ${parentId} not found for item ${item[id_field]}`);
                    // tree.push(item); // 可选：将孤立节点添加到根级别
                }
            }
        });
        
        return tree;
    }
    
    /**
     * 比较两个值是否相等，处理类型转换问题
     */
    private isEqual(value1: any, value2: any): boolean {
        // 如果类型相同，直接比较
        if (value1 === value2) {
            return true;
        }
        
        // 处理数字和字符串的转换比较
        if ((typeof value1 === 'number' || typeof value1 === 'string') && 
            (typeof value2 === 'number' || typeof value2 === 'string')) {
            return String(value1) === String(value2);
        }
        
        // 处理 null、undefined 和 0 的特殊情况
        if ((value1 == null && value2 == null) || 
            (value1 == null && value2 === 0) || 
            (value1 === 0 && value2 == null)) {
            return true;
        }
        
        return false;
    }
}
