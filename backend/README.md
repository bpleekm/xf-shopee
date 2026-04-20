# XF Shopee - 后端服务

这是XF Shopee ERP系统的后端服务，基于Node.js和Express构建，提供RESTful API接口。

## 系统架构
- **框架**: Express 4.x
- **数据库**: MySQL 8.0+ (使用mysql2驱动)
- **认证**: JWT令牌 (访问令牌 + 刷新令牌)
- **数据验证**: Joi + express-validator
- **密码加密**: bcrypt (12轮加密)
- **进程管理**: PM2 (生产环境推荐)
- **API文档**: OpenAPI/Swagger (计划中)

## 项目结构
```
backend/
├── src/
│   ├── index.js              # 应用入口点
│   ├── config/              # 配置管理
│   │   └── database.js      # 数据库配置
│   ├── models/              # 数据库模型
│   │   ├── User.js          # 用户模型
│   │   ├── Product.js       # 产品模型
│   │   ├── Order.js         # 订单模型
│   │   ├── Cart.js          # 购物车模型
│   │   ├── Permission.js    # 权限模型
│   │   └── Role.js          # 角色模型
│   ├── controllers/         # 控制器
│   │   ├── userController.js    # 用户控制器
│   │   ├── productController.js # 产品控制器
│   │   └── orderController.js   # 订单控制器
│   ├── routes/              # 路由定义
│   │   ├── authRoutes.js    # 认证路由
│   │   ├── userRoutes.js    # 用户路由
│   │   ├── productRoutes.js # 产品路由
│   │   ├── cartRoutes.js    # 购物车路由
│   │   └── orderRoutes.js   # 订单路由
│   ├── middleware/          # 中间件
│   │   ├── authMiddleware.js # 认证中间件
│   │   └── errorMiddleware.js # 错误处理中间件
│   └── utils/               # 工具函数
│       ├── auth.js          # 认证工具
│       └── response.js      # 响应格式化
├── database/                # 数据库相关
│   ├── schema.sql          # 数据库架构
│   ├── seed.sql            # 初始数据
│   ├── migrations/         # 数据库迁移
│   └── migrate.js          # 迁移脚本
├── tests/                  # 测试文件
│   ├── integration/        # 集成测试
│   ├── jest.config.js      # Jest配置
│   ├── setup.js           # 测试环境配置
│   └── teardown.js        # 测试环境清理
├── package.json            # 依赖和脚本
├── .env                   # 环境变量 (本地开发)
├── .env.test              # 测试环境变量
├── .env.example           # 环境变量示例
└── README.md              # 本文档
```

## 快速开始

### 先决条件
- Node.js >= 18.0.0
- MySQL 8.0+
- npm 或 yarn 包管理器

### 安装依赖
```bash
cd backend
npm install
```

### 环境变量配置
复制 `.env.example` 文件为 `.env` 并配置相应值：
```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
# 应用配置
PORT=3000
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=xf_shopee

# JWT配置
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# 安全配置
BCRYPT_ROUNDS=12
CORS_ORIGIN=http://localhost:3001,http://localhost:3002

# 日志配置
LOG_LEVEL=info
```

### 数据库初始化
1. 创建数据库：
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS xf_shopee CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

2. 运行数据库迁移：
```bash
# 初始化数据库架构
npm run db:migrate

# 查看迁移状态
npm run db:status
```

### 运行应用
```bash
# 开发模式 (使用nodemon自动重启)
npm run dev

# 生产模式
npm start

# 运行测试
npm test

# 生成测试覆盖率报告
npm run test:coverage
```

## API端点

### 认证相关
```
POST   /api/v1/auth/register      # 用户注册
POST   /api/v1/auth/login         # 用户登录  
POST   /api/v1/auth/refresh       # 刷新访问令牌
POST   /api/v1/auth/logout        # 用户登出
GET    /api/v1/auth/profile       # 获取当前用户信息
PUT    /api/v1/auth/profile       # 更新用户信息
```

### 用户管理
```
GET    /api/v1/users              # 获取用户列表 (管理员)
GET    /api/v1/users/:id          # 获取用户详情
POST   /api/v1/users              # 创建用户 (管理员)
PUT    /api/v1/users/:id          # 更新用户信息
DELETE /api/v1/users/:id          # 删除用户
PUT    /api/v1/users/:id/role     # 更新用户角色
```

### 产品管理
```
GET    /api/v1/products           # 获取产品列表 (支持分页、筛选、排序)
GET    /api/v1/products/:id       # 获取产品详情
POST   /api/v1/products           # 创建产品
PUT    /api/v1/products/:id       # 更新产品信息
DELETE /api/v1/products/:id       # 删除产品
GET    /api/v1/products/:id/stock # 获取产品库存信息
PUT    /api/v1/products/:id/stock # 调整产品库存
```

### 购物车管理
```
GET    /api/v1/cart               # 获取当前用户购物车
POST   /api/v1/cart/items         # 添加商品到购物车
PUT    /api/v1/cart/items/:itemId # 更新购物车商品数量
DELETE /api/v1/cart/items/:itemId # 从购物车删除商品
DELETE /api/v1/cart               # 清空购物车
```

### 订单管理
```
GET    /api/v1/orders             # 获取订单列表
GET    /api/v1/orders/:id         # 获取订单详情
POST   /api/v1/orders             # 创建订单
PUT    /api/v1/orders/:id/status  # 更新订单状态
GET    /api/v1/orders/:id/items   # 获取订单项列表
```

### 系统管理
```
GET    /api/v1/health            # 健康检查
GET    /api/v1/metrics           # 系统指标
GET    /api/v1/system/settings   # 获取系统设置
PUT    /api/v1/system/settings   # 更新系统设置
```

### 权限管理
```
GET    /api/v1/roles             # 获取角色列表
GET    /api/v1/permissions       # 获取权限列表
POST   /api/v1/roles/:id/permissions # 为角色分配权限
```

## API文档
完整的API文档可通过以下方式访问：
1. **Swagger UI**: 启动服务后访问 `http://localhost:3000/api-docs`
2. **OpenAPI规范**: `http://localhost:3000/api-docs.json`
3. **Postman集合**: 项目根目录下的 `XF_Shopee_API.postman_collection.json`

## 请求/响应示例

### 用户注册
**请求**:
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Password123!",
  "fullName": "测试用户"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "fullName": "测试用户",
    "role": "user",
    "createdAt": "2024-04-20T10:30:00.000Z"
  },
  "message": "用户注册成功"
}
```

### 用户登录
**请求**:
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "Password123!"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "role": "user"
    }
  },
  "message": "登录成功"
}
```

## 开发指南

### 代码规范
- 使用ES6+语法
- 遵循Airbnb JavaScript代码规范
- 使用async/await处理异步操作
- 错误处理使用try-catch块
- 重要操作添加日志记录

### 数据库操作
- 使用参数化查询防止SQL注入
- 复杂查询使用事务保证数据一致性
- 数据库操作添加适当的索引
- 定期备份重要数据

### 安全实践
- 所有用户输入进行验证和清理
- 密码使用bcrypt加密存储
- JWT令牌设置合理的过期时间
- 敏感信息不记录在日志中
- API访问进行速率限制

### 测试开发
```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- tests/integration/auth.test.js

# 监视模式运行测试
npm run test:watch

# 生成测试覆盖率报告
npm run test:coverage
```

## 数据库迁移

### 创建新迁移
```bash
# 创建新的迁移文件
cp database/migrations/001_initial_schema.sql database/migrations/002_add_new_feature.sql

# 编辑迁移文件后运行
npm run db:migrate
```

### 迁移管理
```bash
# 查看迁移状态
npm run db:status

# 回滚最近一批迁移
npm run db:rollback

# 回滚指定批次迁移
npm run db:rollback 2
```

## 部署指南

### 生产环境要求
- **服务器**: Ubuntu 20.04 LTS 或 CentOS 8+
- **Node.js**: 18.x LTS 版本
- **MySQL**: 8.0+ 版本
- **Nginx**: 作为反向代理
- **PM2**: 进程管理
- **防火墙**: 仅开放必要端口

### 部署步骤
详细部署步骤请参考 [DEPLOYMENT.md](DEPLOYMENT.md) 文件。

### 快速部署脚本
```bash
# 1. 克隆代码库
git clone https://github.com/your-org/xf-shopee.git
cd xf-shopee/backend

# 2. 安装依赖
npm install --production

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件配置生产环境值

# 4. 运行数据库迁移
npm run db:migrate

# 5. 使用PM2启动应用
npm install -g pm2
pm2 start src/index.js --name "xf-shopee-backend" --env production

# 6. 设置PM2开机自启
pm2 startup
pm2 save
```

### 监控和维护
```bash
# 查看应用状态
pm2 status
pm2 logs xf-shopee-backend

# 监控系统资源
pm2 monit

# 重启应用
pm2 restart xf-shopee-backend

# 停止应用
pm2 stop xf-shopee-backend

# 删除应用
pm2 delete xf-shopee-backend
```

## 故障排除

### 常见问题
1. **数据库连接失败**
   - 检查MySQL服务是否运行: `sudo systemctl status mysql`
   - 验证连接配置: 检查 `.env` 文件中的数据库配置
   - 检查防火墙设置: `sudo ufw status`

2. **端口被占用**
   ```bash
   # 查看占用3000端口的进程
   sudo lsof -i :3000
   
   # 终止进程
   sudo kill -9 <PID>
   ```

3. **内存泄漏**
   - 使用Node.js内存分析工具: `node --inspect`
   - 监控PM2内存使用: `pm2 monit`
   - 设置内存限制: `pm2 start app.js --max-memory-restart 500M`

4. **性能问题**
   - 检查数据库查询性能: 使用EXPLAIN分析慢查询
   - 启用查询日志: 识别瓶颈
   - 添加适当索引: 优化查询性能

### 日志位置
- **应用日志**: `~/.pm2/logs/xf-shopee-backend-out.log`
- **错误日志**: `~/.pm2/logs/xf-shopee-backend-error.log`
- **访问日志**: Nginx日志目录 (`/var/log/nginx/`)
- **数据库日志**: MySQL日志目录 (`/var/log/mysql/`)

## 贡献指南

1. Fork项目仓库
2. 创建功能分支: `git checkout -b feature/your-feature`
3. 提交更改: `git commit -m 'Add some feature'`
4. 推送到分支: `git push origin feature/your-feature`
5. 创建Pull Request

### 提交信息规范
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式调整
- refactor: 代码重构
- test: 测试相关
- chore: 构建过程或辅助工具变动

## 许可证

本项目采用MIT许可证。详情请参阅 [LICENSE](LICENSE) 文件。

## 技术支持

- **问题反馈**: GitHub Issues
- **文档**: 项目docs目录
- **邮件**: support@xfshopee.com
- **紧急联系人**: 系统管理员

---

*最后更新: 2024-04-20*
*版本: 2.0.0*
