
const fp = require('fastify-plugin')
import { context_manager } from '../nsdk/common';
import { AccessTokenService,TokenInfo } from '@/nservers/iam/access_token_service';

const access_token_service = new AccessTokenService();
export async function middleware_auth(request: any, reply: any) {
    // 输出路由地址
    console.log(`请求的路由地址: ${request.routerPath}`);

    // 输出请求的URI
    const uri = request.url;
    console.log(`请求的URI: ${request.url}`);

    // 如果uri以  /api/p/ 开头，表示是公开接口，无需认证
    // 如果uri以  /api/m/ 开头，表示是管理台接口，需要MAC双因素认证（即校验token有效性且token等级为双因素）
    // 如果uri以  /api/c/ 开头，表示是客户端接口，需要MAC单因素认证（即校验token有效性即可）

    if(uri.startsWith('/api/p/')) {
        console.log(`公开接口，无需认证`);
        return;
    } else if(uri.startsWith('/api/c/') || uri.startsWith('/api/m/')) {
        // 需要认证
        const authHeader = request.headers['authorization'];
        if (!authHeader) {
            reply.status(401).send({ error: '缺少 Authorization 头' });
            return;
        } else {
            const tk = await access_token_service.verifyAccessToken(authHeader)
            const user_id = tk?.payload?.user_id
            if(user_id) {
                console.log(`认证通过，用户ID: ${user_id}`);
                context_manager.setUserId(user_id);
            }
        }
        // const tokenMatch = authHeader.match(/^Bearer (.+)$/);
        // if (!tokenMatch) {
        //     reply.status(401).send({ error: '无效的 Authorization 头格式' });
        //     return;
        // }
        // const token = tokenMatch[1];
        // // 验证 token 的有效性
        // const tokenInfo = await context_manager.verifyToken(token);
        // if (!tokenInfo || !tokenInfo.valid) {
        //     reply.status(401).send({ error: '无效的 token' });
        //     return;
        // }
        // // 如果是管理台接口，还需要验证 token 等级为双因素
        // if(uri.startsWith('/api/m/') && tokenInfo.level !== '2fa') {
        //     reply.status(403).send({ error: '需要双因素认证的 token' });
        //     return;
        // }
        // // 设置上下文中的用户信息
        // context_manager.setUserId(tokenInfo.user_id);
        // context_manager.setTenantId(tokenInfo.tenant_id);
        // console.log(`认证通过，用户ID: ${tokenInfo.user_id}, 租户ID: ${tokenInfo.tenant_id}`);
        // return;

    }

}
