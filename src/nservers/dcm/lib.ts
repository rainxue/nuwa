

import  * as base  from '../../nsdk/base';

export class LibType extends base.StandardEntityBase {
    name?: string;      // 类型名称
    description?: string; // 类型描述
    status?: base.Status;
    config?: any; // 类型配置，JSON字符串或JSON对象
}

export class LibTypeDao extends base.DaoBase {
    constructor() {
        super('dcm_lib_type','dcm',{id_generator: base.ID_GENERATOR.NONE,multi_tenant: false, json_fields: ['config']});
    }
}

export class LibTypeService extends base.ServiceBase<LibType> {
    constructor() {
        super(new LibTypeDao());
    }
}

export class Lib extends base.TenantStandardEntityBase {
    publisher_id?: string;
    lib_type?: string;
    name?: string;      // 库名称
    code?: string;      // 库编码，若不为空，在同一个租户内唯一
    description?: string; // 库描述
    status?: base.Status;
    config?: any; // 库配置，JSON字符串或JSON对象
}

export class LibDao extends base.DaoBase {
    constructor() {
        super('dcm_lib','dcm',{id_generator: base.ID_GENERATOR.SNOWFLAKE, json_fields: ['config']});
    }
}

export class LibService extends base.ServiceBase<Lib> {
    constructor() {
        super(new LibDao());
    }
    async needAudit(lib_id: number): Promise<boolean> {
        // 后续需要增加缓存优化
        let lib = await this.dao.get(lib_id);
        if(lib?.config?.need_audit) {
            return true;
        }
        return false;
    }
}