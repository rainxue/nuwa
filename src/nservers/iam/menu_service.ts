import { DaoBase, ServiceBase, TenantStandardEntityBase,ID_GENERATOR } from '../../nsdk/base';

export interface Menu extends TenantStandardEntityBase {
    pid: number;               // 父菜单ID，一级菜单为0
    name: string;              // 菜单名称
    type: string;              // 菜单类型，如目录、菜单、按钮等
    path: string;              // 菜单路径
    icon?: string;             // 菜单图标
    sort_num?: number;         // 菜单排序号，越小越靠前
    status: string;            // 菜单状态，如启用、禁用等
}

export class MenuDao extends DaoBase {
    constructor() {
        super('iam_menu','default',{id_generator: ID_GENERATOR.SNOWFLAKE, sort_field_strategy: {condition_fields: ['pid']}});
    }
}

export class MenuService extends ServiceBase<Menu> {
    constructor() {
        super(new MenuDao());
    }
}