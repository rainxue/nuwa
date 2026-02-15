'use strict';

import { 
    AreaManager,
    OrgManager,
    SchoolManager,
} from "./service";


import { di_container } from "../../nsdk/common";

export function register_nserver_services() {
    console.log("注册 org 模块下相关服务到 DI 容器");
    // di_container.register('org.AreaManager', area_manager);
    // di_container.register('org.OrgManager', org_manager);
    // di_container.register('org.SchoolManager', school_manager);
}

export {
    AreaManager, 
    OrgManager, 
    SchoolManager 
};