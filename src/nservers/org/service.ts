import { DaoBase, ServiceBase,ID_GENERATOR } from '../../nsdk/base';

class AreaDao extends DaoBase {
    constructor() {
        super('org_area','org',{id_generator: ID_GENERATOR.SNOWFLAKE, sort_field_strategy: {condition_fields: ['pid']}});
    }
}
class OrgDao extends DaoBase {
    constructor() {
        super('org_org','org',{id_generator: ID_GENERATOR.SNOWFLAKE, sort_field_strategy: {condition_fields: ['pid']}});
    }
}
class SchoolDao extends DaoBase {
    constructor() {
        super('org_school','org',{id_generator: ID_GENERATOR.SNOWFLAKE, sort_field_strategy: {condition_fields: ['pid']}});
    }
}

class AreaManager extends ServiceBase<any> {
    constructor() {
        super(new AreaDao());
    }
}

class OrgManager extends ServiceBase<any> {
    constructor() {
        super(new OrgDao());
    }
}

class SchoolManager extends ServiceBase<any> {
    constructor() {
        super(new SchoolDao());
    }
}

// const area_manager = new AreaManager(new AreaDao());
// const org_manager = new OrgManager(new OrgDao());
// const school_manager = new SchoolManager(new SchoolDao());

export { 
    AreaManager,
    OrgManager,
    SchoolManager
};

// interface ClassService {
//     // 获取我的班级
//     my(): Promise<any[]>;
//     // 我创建的班级
//     myCreated(): Promise<any[]>;

//     // 获取班级信息
//     get(id: number): Promise<any>;

//     // 获取班级成员
//     members(id: number, filter_roles:string[]): Promise<any[]>;
// }

// enum ClassMemberRole {
//     Student = 'student', // 学生
//     Teacher = 'teacher', // 教师
//     Assistant = 'assistant', // 助教
//     Owner = 'owner' // 班级所有者
// }

// class ClassServiceImpl implements ClassService {
//     async my(): Promise<any[]> {
//         // 实现获取我的班级的逻辑
//         return [];
//     }

//     async myCreated(): Promise<any[]> {
//         // 实现获取我创建的班级的逻辑
//         return [];
//     }

//     async get(id: number): Promise<any> {
//         // 实现获取班级信息的逻辑
//         const class_obj : DynamicData = {
//             id: 1,
//             create_date: new Date(),
//             update_date: new Date(),
//             create_by: 1,
//             update_by: 1,
//             name: "Class A.........",
//             description: "This is a class description"
//         }
//         console.log(`获取班级信息: ${class_obj.description}`);
//         return class_obj;
//     }

//     async members(id: number, filter_roles: string[]): Promise<any[]> {
//         // 实现获取班级成员的逻辑
//         return [];
//     }
// }

// export const class_service: ClassService = new ClassServiceImpl();