# MySQL 数据库客户端测试

这个目录包含了 MySQL 数据库客户端的集成测试和单元测试。

## 测试文件说明

### 集成测试 (`mysqldbclient_test.ts`)

**位置**: `tests/integration/nsdk/mysqldbclient_test.ts`

这个文件包含了真实的数据库集成测试，测试以下功能：

1. **数据库连接测试**
   - 基本连接验证
   - 数据库版本查询

2. **insert() 方法测试**
   - 单条记录插入
   - 多条记录插入
   - 不同数据类型处理
   - 重复键错误处理

3. **execute() 方法测试**
   - 带参数的 SELECT 查询
   - UPDATE 操作
   - DELETE 操作
   - 复杂查询
   - 空结果处理

4. **exists() 方法测试**
   - 存在记录检查
   - 不存在记录检查
   - 复杂条件检查

5. **错误处理测试**
   - SQL 语法错误
   - 无效表名
   - 无效列名
   - 数据类型错误

6. **性能测试**
   - 并发操作
   - 大数据集操作

7. **事务类操作**
   - 数据一致性验证

### 单元测试 (`tests/unit/nsdk/mysqldbclient_test.ts`)

**位置**: `tests/unit/nsdk/mysqldbclient_test.ts`

这个文件包含了模拟数据库连接的单元测试，测试：

1. **构造函数和连接池初始化**
2. **execute() 方法的逻辑**
3. **exists() 方法的逻辑**
4. **insert() 方法的逻辑**
5. **错误处理逻辑**

## 运行测试前的准备

### 1. 配置数据库

确保你有一个可用的 MySQL 数据库实例，并在项目根目录的 `.env` 文件中配置连接信息：

\`\`\`env
# MySQL 数据库连接配置
RDS_DS_TYPE_default=mysql
RDS_DS_HOST_default=localhost
RDS_DS_PORT_default=3306
RDS_DS_USER_default=your_username
RDS_DS_PASSWORD_default=your_password
RDS_DS_DATABASE_default=nuwa_test
RDS_DS_CONNECTION_LIMIT_default=10
RDS_DS_CHARSET_default=utf8mb4
\`\`\`

### 2. 创建测试数据库

在 MySQL 中创建一个专门用于测试的数据库：

\`\`\`sql
CREATE DATABASE nuwa_test;
\`\`\`

### 3. 安装依赖

确保所有必要的依赖都已安装：

\`\`\`bash
npm install
\`\`\`

## 运行测试

### 运行所有测试
\`\`\`bash
npm test
\`\`\`

### 只运行集成测试
\`\`\`bash
npm run test:integration
\`\`\`

### 只运行单元测试
\`\`\`bash
npm run test:unit
\`\`\`

### 监听模式运行测试
\`\`\`bash
npm run test:watch
\`\`\`

### 生成覆盖率报告
\`\`\`bash
npm run test:coverage
\`\`\`

## 测试特点

### 集成测试特点

1. **真实数据库操作**: 使用真实的 MySQL 数据库
2. **自动表管理**: 测试开始时创建测试表，结束时清理
3. **数据隔离**: 每个测试用例前清空测试数据
4. **完整流程**: 测试从连接到操作的完整流程

### 单元测试特点

1. **Mock 依赖**: 模拟 mysql2 连接池
2. **快速执行**: 不依赖外部数据库
3. **逻辑验证**: 专注于业务逻辑测试
4. **错误模拟**: 模拟各种错误场景

## 注意事项

1. **数据库权限**: 确保测试用户有创建/删除表的权限
2. **连接配置**: 测试会创建和删除 \`test_users\` 表
3. **并发测试**: 某些测试包含并发操作，确保数据库支持
4. **性能测试**: 大数据集测试可能需要较长时间

## 故障排除

### 常见问题

1. **连接失败**: 检查数据库是否运行，配置是否正确
2. **权限错误**: 确保测试用户有足够的数据库权限
3. **超时错误**: 可能需要调整测试超时设置

### 调试技巧

1. 设置环境变量 \`LOG_LEVEL=debug\` 查看详细日志
2. 单独运行失败的测试用例
3. 检查数据库连接配置是否正确

## 测试覆盖范围

- ✅ 数据库连接管理
- ✅ SQL 执行 (SELECT, INSERT, UPDATE, DELETE)
- ✅ 参数化查询
- ✅ 错误处理
- ✅ 数据类型处理
- ✅ 并发操作
- ✅ 性能测试
- ✅ 边界条件测试
