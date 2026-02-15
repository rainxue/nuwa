import { ServiceBase, DaoBase, TenantStandardEntityBase, ID_GENERATOR, Status } from "@/nsdk/base";

/** 分类类型 */
export enum TagType {
    /** 字典类型 */
    DICT = 'dict',
    /** 树形结构类型 */
    TREE = 'tree'
}

/**
 * 标签实体
 */
export class Tag extends TenantStandardEntityBase {
    /** 关联的供应商ID，可以为 0 */
    publisher_id?: number;
    /** 关联的内容库ID，可以为 0 */
    lib_id?: number;
    /** 标签名称 */
    name?: string;
    /** 标签编码，租户内唯一，用于被其他业务引用，比如学科、学段等 */
    code?: string;
    /** 标签类型，如dict、tree等 */
    type?: TagType;
    /** 标签描述 */
    description?: string;
    /** 标签配置，JSON字符串或JSON对象 */
    config?: any;
    /** 状态 */
    status?: Status;
}

export class TagDao extends DaoBase {
    constructor() {
        super('dcm_tag', 'dcm', {
            id_generator: ID_GENERATOR.SNOWFLAKE,
            json_fields: ['config']
        });
    }
}

export class TagService extends ServiceBase<Tag> {
    constructor() {
        super(new TagDao());
    }
}

/**
 * 标签视图实体
 */
export class TagView extends TenantStandardEntityBase {
    /** 关联的供应商ID，可以为 0 */
    publisher_id?: number;
    /** 关联的内容库ID，可以为 0 */
    lib_id?: number;
    /** 视图名称 */
    name?: string;
    /** 视图编码，租户内唯一 */
    code?: string;
    /** 视图描述 */
    description?: string;
    /** 视图配置，JSON字符串或JSON对象 */
    config?: any;
    /** 状态 */
    status?: Status;
}

export class TagViewDao extends DaoBase {
    constructor() {
        super('dcm_tag_view', 'dcm', {
            id_generator: ID_GENERATOR.SNOWFLAKE,
            json_fields: ['config']
        });
    }
}

export class TagViewService extends ServiceBase<TagView> {
    constructor() {
        super(new TagViewDao());
    }
}
