import { beforeAll } from 'vitest';
import path from 'path';

// 加载环境变量
require('dotenv').config();

beforeAll(() => {
  console.log('🧪 Setting up test environment...');
  console.log('📊 Database host:', process.env.RDS_DS_HOST_default || 'localhost');
  console.log('📊 Database name:', process.env.RDS_DS_DATABASE_default || 'test');
});
