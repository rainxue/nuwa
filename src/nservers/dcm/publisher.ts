import { ServiceBase,DaoBase,
    TenantStandardEntityBase, StandardEntityBase,
    ID_GENERATOR, Status } from "@/nsdk/base";
import * as uuid from 'uuid';
import { LibService } from "./lib";

export class PublisherType extends StandardEntityBase {
    name?: string
    description?: string
    status?: Status
    config?: any; // 类型配置，JSON字符串或JSON对象
}

export class PublisherTypeDao extends DaoBase {
    constructor() {
        super('dcm_publisher_type','dcm',{id_generator: ID_GENERATOR.NONE,multi_tenant: false});
    }
}

export class PublisherTypeService extends ServiceBase<PublisherType> {
    constructor() {
        super(new PublisherTypeDao());
    }
}


export class PublisherBase extends TenantStandardEntityBase {
    name?: string;          // 出版社名称
    description?: string;   // 出版社描述
    owner_id?: number;      // 出版社负责人用户ID
    publisher_type?: string;// 出版社类型
    status?: Status;        // 状态
    config?: any;           // 出版社配置，JSON字符串或JSON对象
}

export class PublisherBaseDao extends DaoBase {
    constructor() {
        super('dcm_publisher','dcm',{id_generator: ID_GENERATOR.NONE,multi_tenant: false, json_fields: ['config']});
    }
}

export class PublisherBaseService extends ServiceBase<PublisherBase> {
    constructor() {
        super(new PublisherBaseDao());
    }
}
