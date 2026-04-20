const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { errorHandler } = require('./utils/response');
const { testConnection, initializeDatabase } = require('./config/database');

// 导入路由
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// API版本前缀
const API_PREFIX = '/api/v1';
const XFBH_API_PREFIX = '/xfbh/api/v1';

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'xf-shopee-backend',
      version: '1.0.0',
      api_paths: ['/api/v1', '/xfbh/api/v1']
    },
    message: '服务运行正常',
    timestamp: new Date().toISOString()
  });
});

// 兼容 xfbh 前缀的健康检查
app.get('/xfbh/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'xf-shopee-backend',
      version: '1.0.0',
      api_path: '/xfbh/api/v1'
    },
    message: '服务运行正常',
    timestamp: new Date().toISOString()
  });
});

// 注册路由 - 标准API路径
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/carts`, cartRoutes);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/auth`, authRoutes);

// 注册路由 - xfbh API路径 (兼容性)
app.use(`${XFBH_API_PREFIX}/users`, userRoutes);
app.use(`${XFBH_API_PREFIX}/products`, productRoutes);
app.use(`${XFBH_API_PREFIX}/carts`, cartRoutes);
app.use(`${XFBH_API_PREFIX}/orders`, orderRoutes);
app.use(`${XFBH_API_PREFIX}/auth`, authRoutes);

// 404处理器
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    message: '接口不存在',
    timestamp: new Date().toISOString()
  });
});

// 错误处理器
app.use(errorHandler);

// 启动服务器
async function startServer() {
  try {
    // 测试数据库连接
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ 无法连接到数据库，请检查数据库配置');
      process.exit(1);
    }

    // 初始化数据库表
    await initializeDatabase();
    console.log('✅ 数据库初始化完成');

    // 启动Express服务器
    app.listen(PORT, () => {
      console.log(`✅ XF Shopee Backend 服务启动成功`);
      console.log(`📡 监听端口: ${PORT}`);
      console.log(`🌐 标准API路径:`);
      console.log(`  健康检查: http://localhost:${PORT}/api/health`);
      console.log(`  用户注册: POST http://localhost:${PORT}/api/v1/users/register`);
      console.log(`  用户登录: POST http://localhost:${PORT}/api/v1/users/login`);
      console.log(`  商品列表: GET http://localhost:${PORT}/api/v1/products`);
      console.log(`  订单列表: GET http://localhost:${PORT}/api/v1/orders (需要登录)`);
      console.log(`🌐 xfbh API路径 (Nginx代理):`);
      console.log(`  健康检查: http://localhost:${PORT}/xfbh/api/health`);
      console.log(`  用户注册: POST http://localhost:${PORT}/xfbh/api/v1/users/register`);
      console.log(`  用户登录: POST http://localhost:${PORT}/xfbh/api/v1/users/login`);
      console.log(`  商品列表: GET http://localhost:${PORT}/xfbh/api/v1/products`);
      console.log(`  订单列表: GET http://localhost:${PORT}/xfbh/api/v1/orders (需要登录)`);
      console.log('\n默认管理员账户:');
      console.log('👑 用户名: admin');
      console.log('🔑 密码: admin123');
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务器...');
  process.exit(0);
});

// 启动服务器
startServer();

module.exports = app;