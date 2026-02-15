# MinIO OSS 服务集成

## 📦 安装依赖

首先需要安装 MinIO 客户端包：

```bash
npm install minio @types/minio
```

## 🔧 MinIO 服务配置

### 1. 启动 MinIO 服务

如果您已经安装了 MinIO，可以使用以下命令启动：

```bash
# Windows
minio.exe server C:\minio-data --console-address ":9001"

# Linux/macOS
minio server /mnt/data --console-address ":9001"
```

### 2. 访问 MinIO 控制台

- 服务地址：http://localhost:9000
- 控制台地址：http://localhost:9001
- 默认用户名：minioadmin
- 默认密码：minioadmin

## 💻 使用示例

### 基本使用

```typescript
import { createOSS } from './src/nservers/oss';

// 创建 MinIO 服务实例
const oss = createOSS({
    provider: 'minio',
    endpoint: 'localhost',
    port: 9000,
    use_ssl: false,
    access_key_id: 'minioadmin',
    access_key_secret: 'minioadmin',
    bucket: 'my-bucket'
});

// 上传文件
await oss.upload(Buffer.from('Hello World'), {
    key: 'test.txt',
    tenant_id: 'tenant001'
});
```

### 配置参数说明

```typescript
interface MinIOConfig {
    provider: 'minio';
    endpoint: string;        // MinIO 服务地址，如 'localhost'
    port?: number;          // 端口，默认 9000
    use_ssl?: boolean;      // 是否使用 HTTPS，默认 false
    access_key_id: string;  // 访问密钥 ID
    access_key_secret: string; // 访问密钥
    bucket: string;         // 存储桶名称
    region?: string;        // 区域，默认 'us-east-1'
}
```

## 🚀 运行测试

```bash
# 运行 MinIO 示例
npx ts-node src/nservers/oss/minio-example.ts
```

## 🔐 生产环境配置

### 1. 创建专用用户

在 MinIO 控制台中：
1. 访问 http://localhost:9001
2. 登录后进入 "Identity" > "Users"
3. 创建新用户，设置 Access Key 和 Secret Key
4. 分配适当的策略权限

### 2. 配置环境变量

```bash
# .env 文件
MINIO_ENDPOINT=your-minio-server.com
MINIO_PORT=9000
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
MINIO_BUCKET=your-bucket-name
```

### 3. 生产配置示例

```typescript
const productionConfig = {
    provider: 'minio' as const,
    endpoint: process.env.MINIO_ENDPOINT!,
    port: parseInt(process.env.MINIO_PORT || '9000'),
    use_ssl: process.env.MINIO_USE_SSL === 'true',
    access_key_id: process.env.MINIO_ACCESS_KEY!,
    access_key_secret: process.env.MINIO_SECRET_KEY!,
    bucket: process.env.MINIO_BUCKET!
};
```

## 🔍 故障排除

### 常见问题

1. **连接失败**
   - 检查 MinIO 服务是否正在运行
   - 确认端口和地址配置正确
   - 检查防火墙设置

2. **权限错误**
   - 确认 Access Key 和 Secret Key 正确
   - 检查用户是否有 bucket 的读写权限

3. **Bucket 不存在**
   - 服务会自动创建 bucket，如果失败请手动创建
   - 确认用户有创建 bucket 的权限

### 调试模式

可以在代码中添加调试信息：

```typescript
// 开启详细日志
process.env.DEBUG = 'minio*';
```

## 📚 更多功能

- ✅ 多租户存储隔离
- ✅ 预签名 URL 生成（上传/下载）
- ✅ 存储使用量统计
- ✅ 文件元数据管理
- ✅ 批量操作支持
- ✅ 流式上传/下载

完整的 API 文档请参考 `interface.ts` 文件。
