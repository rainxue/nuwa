import path from 'path';
import fs from 'fs';

interface Permission {
    id: number;
    ac_mode: string;        // 访问控制模式
    category?: string;      // 分类
    sub_category?: string;  // 子分类
    name: string;           // 名称
    description?: string;   // 描述
}

interface UriPermission {
    permission: number; // 权限ID
    method: string;     // HTTP方法
    uri: string;        // 资源URI
}

class AccessControlService {
    permission_list: Permission[] = []; // 存储权限列表
    permissions: Record<number, Permission> = {}  // 存储权限配置

    uri_permission_list: UriPermission[] = [] // 存储URI权限列表
    uri_permissions: Record<string, number[]> = {}; // 存储URI权限列表
    constructor() {
        // 初始化服务
        this.load_permissions();
        this.load_uri_permissions();
    }

    load_permissions() {
        try {
            // 从当前文件夹的 permissions.json 文件加载权限配置
            const permissionsPath = path.join(__dirname, 'permissions.json');
            if (!fs.existsSync(permissionsPath)) {
                throw new Error(`权限配置文件不存在: ${permissionsPath}`);
            }

            const permissionsContent = fs.readFileSync(permissionsPath, 'utf8');
            const permissions = JSON.parse(permissionsContent);
            if (!Array.isArray(permissions)) {
                throw new Error('权限配置文件格式错误，应该是一个数组');
            }
            this.permission_list = permissions;
            this.permissions = Object.fromEntries(
                permissions.map(permission => [permission.id, permission])
            ) as Record<number, Permission>;
            console.log(`加载权限数据完成，共${permissions.length}条`);
        } catch (error) {
            console.error('加载权限失败:', error);
            throw error;
        }
    }
    // 获取ac_mode
    getAcMode(permission_id: number): string | null {
        const permission = this.permissions[permission_id];
        return permission ? permission.ac_mode : null;
    }
    load_uri_permissions() {
        try {
            // 从当前文件夹的 uri_permissions.json 文件加载权限配置
            const uriPermissionsPath = path.join(__dirname, 'uri_permissions.json');
            if (!fs.existsSync(uriPermissionsPath)) {
                throw new Error(`URI权限配置文件不存在: ${uriPermissionsPath}`);
            }

            const uriPermissionsContent = fs.readFileSync(uriPermissionsPath, 'utf8');
            const uri_permissions = JSON.parse(uriPermissionsContent);
            if (!Array.isArray(uri_permissions)) {
                throw new Error('URI权限配置文件格式错误，应该是一个数组');
            }
            this.uri_permission_list = uri_permissions;
            uri_permissions.forEach((item: UriPermission) => {
                const key = `${item.method.toUpperCase()}_${item.uri}`;
                if (!this.uri_permissions[key]) {
                    this.uri_permissions[key] = [];
                }
                this.uri_permissions[key].push(item.permission);
            });
            console.log(`加载URI权限关系数据完成，共${uri_permissions.length}条`);
        } catch (error) {
            console.error('加载URI权限失败:', error);
            throw error;
        }
    }
    getUriPermissions(method: string, uri: string): number[] {
        const key = `${method.toUpperCase()}_${uri}`;
        return this.uri_permissions[key] || [];
    }
    getUriPermissionAcModes(method: string, uri: string): string[] {
        const permissions = this.getUriPermissions(method, uri);
        // 获取每个权限的ac_mode, 过滤掉ac_mode为null的数据，并去重
        if (permissions.length === 0) {
            return [];
        }
        const acModes = permissions.map(permissionId => this.getAcMode(permissionId)).filter(mode => mode !== null);
        return Array.from(new Set(acModes));
    }

}

const ac_service = new AccessControlService();
export {
    ac_service
};