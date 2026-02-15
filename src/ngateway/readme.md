# 概览
ngateway的职责包括：
- 自动注册和处理REST API请求
- 处理请求认证
- 处理请求鉴权


# 开发说明
## restapi.json
ngateway会自动注册`src/nservers/{nserver}/restapi.json`中定义的REST API。