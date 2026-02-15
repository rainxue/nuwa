import * as fs from 'fs';
import * as path from 'path';

async function load_nservers() {
    // 遍历 nservers 目录下的所有子目录
    const nserversPath = __dirname; // path.join(__dirname, 'nservers');
    if (!fs.existsSync(nserversPath)) {
        console.error('nservers 目录不存在:', nserversPath);
        return;
    }

    const nservers = fs.readdirSync(nserversPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    // 输出所有 nservers 的名称
    for (const nserver of nservers) {
        console.log('加载 nserver:', nserver);
        // 这里可以添加更多的逻辑来处理每个 nserver，例如加载配置文件等
        const module = await import(`./${nserver}`);
        
        if (typeof module.register_nserver_services === 'function') {
            module.register_nserver_services();
        } else {
            console.warn(`register_nserver_services not found in ${nserver}`);
        }
    }
    console.log('加载的 nservers:', nservers);
    
    // 返回 nservers 列表
    return nservers;
}

export { load_nservers };