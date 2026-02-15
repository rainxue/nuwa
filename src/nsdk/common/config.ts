
import fs from 'fs';
import YAML from 'yaml';

// 定义动态配置类型（不完整定义结构）
type DynamicConfig = Record<string, any>;

// 读取并解析YAML文件
function loadYamlConfig(path: string): DynamicConfig {
    try {
        const file = fs.readFileSync(path, 'utf8');
        return YAML.parse(file);
    } catch (err) {
        throw new Error(`YAML解析失败: ${(err as any).message}`);
    }
}


// 示例使用
const config = loadYamlConfig(`config.${process.env.NODE_ENV}.yml`);

// 安全访问嵌套配置
export function getConfigValue(path: string, cfg: DynamicConfig = config): any {
    let _cfg = cfg || config;
    return path.split('.').reduce((obj, key) => obj?.[key], _cfg);
}

// console.log(getConfigValue('database.mysql.master.host'));
// console.log(getConfigValue('services.payment.timeout'));
