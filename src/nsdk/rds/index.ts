
require('dotenv').config();
import { DBClient } from './interface';
import { MySQLDBClient } from './rdsdbclient_mysql';
import { getConfigValue } from '../common'

const rdsdbclients: Record<string, DBClient> = {};

function getAliasDatasource(datasource:string) {
    try {
        const alias = getConfigValue(`rds.datasource_alias.${datasource}`);
        if(alias) {
            return alias;
        }
    } catch (error) {
        // 无别名配置，直接返回原始数据源名称
        return datasource;
    }
    return datasource;
}
function getRDSDBClient(datasource:string = "default") {
    // 先进行别名转换
    const alias = getAliasDatasource(datasource);

    if (!rdsdbclients[alias]) {
        // 从环境变量获取指定数据源的配置
        try {
            const ds = getConfigValue(`rds.datasource.${alias}`);
            const dsConfig = {
                // type: process.env[`RDS_DS_TYPE_${datasource}`] || 'mysql',
                // host: process.env[`RDS_DS_HOST_${datasource}`],
                // port: parseInt(process.env[`RDS_DS_PORT_${datasource}`] || "3306"),
                // user: process.env[`RDS_DS_USER_${datasource}`],
                // password: process.env[`RDS_DS_PASSWORD_${datasource}`],
                // database: process.env[`RDS_DS_DATABASE_${datasource}`],
                // charset: process.env[`RDS_DS_CHARSET_${datasource}`] || 'utf8mb4',
                // connectionLimit: parseInt(process.env[`RDS_DS_CONNECTION_LIMIT_${datasource}`] || "100"),
                type: ds.type || 'mysql',
                host: ds.host,
                port: ds.port || 3306,
                user: ds.username,
                password: ds.password,
                database: ds.database,
                charset: ds.charset || 'utf8mb4',
                connectionLimit: ds.connection_limit
            };
            // 根据数据库类型选择实例化对应的客户端
            const dbType = dsConfig.type;
            
            if (dbType === 'mysql') {
                rdsdbclients[alias] = new MySQLDBClient(dsConfig);
            } else {
                throw new Error(`Unsupported database type: ${dbType}. Only 'mysql' is currently supported.`);
            }
        } catch (error) {
            console.error(`Error initializing DB client for datasource ${alias}:`, error);
            throw error;
        }
    }
    return rdsdbclients[alias];
}

export { getRDSDBClient, DBClient };