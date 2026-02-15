import * as fs from 'fs';
import * as path from 'path';
import { getConfigValue } from './config';
interface NHostConfig {
    host: string;
    nservers: string;
    // 其他属性
}
export interface NHost {
    name: string;
    host: string;
    nservers: string[];
}
export class NHostService {
    current_nhost_name: string;
    nhosts: Record<string, NHost> = {};
    constructor() {
        this.current_nhost_name = process.env["CURRENT_NHOST_NAME"] || "default";
        this.init();
        console.log('NHostService 构造完成', this.nhosts);
    }
    init() {
        console.log('NHostService 初始化');
        let nhosts_str = getConfigValue('clusters.nhosts') || "default";
        let nhosts_arr = nhosts_str.split(',').map((item: string) => item.trim());
        nhosts_arr.forEach((nhost_name: string) => {
            const nhost_config:NHostConfig = getConfigValue(`clusters.${nhost_name}`);
            const nhost: NHost = nhost_config.nservers === "all" ? {
                name: nhost_name,
                host: nhost_config.host,
                nservers: this.get_all_nservers()
            } : {
                name: nhost_name,
                host: nhost_config.host,
                nservers: nhost_config.nservers ? nhost_config.nservers.split(',').map((item: string) => item.trim()) : []
            };
            this.nhosts[nhost.name] = nhost;
        });
    }
    get_all_nservers(): string[] {
        // 遍历 nservers 下所有模块的 restapi.json 配置文件，并调用load_configs
        const nservers: string[] = [];
        
        try {
            // 构建 nservers 目录路径
            const nserversPath = path.join(__dirname, '../..', 'nservers');
            
            // 检查 nservers 目录是否存在
            if (fs.existsSync(nserversPath)) {
                // 读取目录下的所有项目
                const items = fs.readdirSync(nserversPath, { withFileTypes: true });
                
                // 筛选出所有子目录
                const directories = items
                    .filter(item => item.isDirectory())
                    .map(item => item.name);
                
                nservers.push(...directories);
                console.log('nservers:', nservers);
            }
        } catch (error) {
            console.error('读取 nservers 目录失败:', error);
        }
        return nservers;
    }
    get_current_nhost(): NHost {
        return this.nhosts[this.current_nhost_name];
    }
    get_remote_service(nservice: string, nserver: string): any {
        const current_nhost = this.get_current_nhost();
        if (!current_nhost) {
            throw new Error(`Current NHost not found.`);
        }
        if (!current_nhost.nservers.includes(nserver)) {
            throw new Error(`NServer ${nserver} not found in current NHost.`);
        }
        // 远程服务逻辑
        return null;
    }
}
export const nhost_service:NHostService = new NHostService();
