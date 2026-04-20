# XF Shopee ERP 系统

## 项目概述

XF Shopee 是一个完整的部门商店ERP系统，包含后端服务、Web前端购物网站、Web后台管理系统和移动端应用。系统采用微服务架构设计，支持多用户角色、完整的商品管理、购物车、订单处理、库存管理和权限控制。

## 系统架构

```
├── backend/              # 后端API服务 (Node.js/Express/MySQL)
├── frontend/
│   ├── web-front/       # Web前端购物网站 (Vue 3/Element Plus/Pinia)
│   └── web-admin/       # Web后台管理系统 (React/Ant Design)
├── mobile/              # 移动端应用 (React Native Hybrid架构)
└── docs/                # 设计文档和规范
```

## 功能模块

### 1. 用户管理模块
- 用户注册、登录、资料管理
- 角色和权限管理 (超级管理员、经理、员工、用户)
- 登录会话管理和令牌刷新

### 2. SKU管理模块
- 产品分类和属性管理
- 产品CRUD操作
- 库存管理和预警
- 价格和促销管理

### 3. 购物车模块
- 商品添加、删除、数量修改
- 库存实时验证
- 购物车状态持久化
- 游客购物车支持

### 4. 订单管理模块
- 订单创建、支付、发货、完成全流程
- 订单状态跟踪
- 退款和取消处理
- 订单报表和统计

### 5. 权限控制模块
- 基于角色的访问控制 (RBAC)
- 细粒度权限管理
- 操作日志和审计

### 6. Web前端 (客户购物)
- 响应式产品目录和搜索
- 购物车和结算流程
- 用户个人中心和订单跟踪
- 在线支付集成

### 7. Web后台管理 (员工管理)
- 仪表板和统计分析
- 用户、产品、订单管理
- 库存调整和报表
- 系统配置和维护

### 8. 移动端应用 (员工移动办公)
- 混合架构 (原生容器 + WebView)
- 扫码入库和库存查询
- 订单处理和客户服务
- 离线数据同步

## 技术栈

### 后端技术
- **运行时**: Node.js 18.x
- **框架**: Express 4.x
- **数据库**: MySQL 8.0+
- **认证**: JWT + bcrypt
- **数据验证**: Joi + express-validator
- **测试**: Jest + Supertest

### Web前端技术
- **框架**: Vue 3 (Composition API)
- **状态管理**: Pinia
- **UI库**: Element Plus
- **路由**: Vue Router 4
- **构建工具**: Vite
- **HTTP客户端**: Axios

### Web后台管理技术
- **框架**: React 18
- **UI库**: Ant Design 5
- **状态管理**: Context API
- **路由**: React Router 6
- **构建工具**: Vite
- **HTTP客户端**: Axios

### 移动端技术
- **框架**: React Native 0.72.x
- **架构**: Hybrid (原生容器 + WebView)
- **导航**: React Navigation
- **原生模块**: 存储、相机、扫码、通知
- **通信**: JavaScript Bridge

## 快速开始

### 1. 环境要求
- Node.js >= 18.0.0
- MySQL >= 8.0
- npm 或 yarn 包管理器

### 2. 后端服务部署
```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件配置数据库连接

# 初始化数据库
npm run db:migrate

# 启动开发服务器
npm run dev
```

### 3. Web前端部署
```bash
# 进入Web前端目录
cd frontend/web-front

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 4. Web后台管理部署
```bash
# 进入Web后台管理目录
cd frontend/web-admin

# 安装依赖
npm install

# 启动开发服务器
npm start
```

### 5. 移动端应用部署
```bash
# 进入移动端目录
cd mobile

# 安装依赖
npm install

# 启动开发服务器
npm start

# 运行iOS模拟器
npm run ios

# 运行Android模拟器
npm run android
```

## 数据库架构

### 主要数据表
1. **users** - 用户信息
2. **roles** - 角色定义
3. **permissions** - 权限定义
4. **products** - 产品信息
5. **product_categories** - 产品分类
6. **carts** - 购物车
7. **cart_items** - 购物车项
8. **orders** - 订单信息
9. **order_items** - 订单项
10. **inventory_transactions** - 库存变更记录
11. **system_settings** - 系统配置

### 数据库迁移
```bash
# 查看迁移状态
npm run db:status

# 运行所有迁移
npm run db:migrate

# 回滚迁移
npm run db:rollback
```

## API文档

后端API提供完整的RESTful接口：

### 认证API
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/refresh` - 刷新令牌
- `POST /api/v1/auth/logout` - 用户登出

### 用户管理API
- `GET /api/v1/users` - 获取用户列表
- `GET /api/v1/users/:id` - 获取用户详情
- `POST /api/v1/users` - 创建用户
- `PUT /api/v1/users/:id` - 更新用户
- `DELETE /api/v1/users/:id` - 删除用户

### 产品管理API
- `GET /api/v1/products` - 获取产品列表
- `GET /api/v1/products/:id` - 获取产品详情
- `POST /api/v1/products` - 创建产品
- `PUT /api/v1/products/:id` - 更新产品
- `DELETE /api/v1/products/:id` - 删除产品

### 订单管理API
- `GET /api/v1/orders` - 获取订单列表
- `GET /api/v1/orders/:id` - 获取订单详情
- `POST /api/v1/orders` - 创建订单
- `PUT /api/v1/orders/:id/status` - 更新订单状态

详细API文档请参考 [backend/README.md](backend/README.md)

## 测试

### 单元测试
```bash
cd backend
npm test
```

### 集成测试
```bash
cd backend
npm run test:e2e
```

### 测试覆盖率
```bash
cd backend
npm run test:coverage
```

详细测试指南请参考 [docs/SYSTEM_INTEGRATION_TEST.md](docs/SYSTEM_INTEGRATION_TEST.md)

## 部署指南

### 生产环境要求
- Ubuntu 20.04 LTS 或 CentOS 8+
- Node.js 18.x LTS
- MySQL 8.0+
- Nginx 作为反向代理
- PM2 进程管理
- SSL/TLS 证书

### 部署步骤
详细部署步骤请参考 [backend/DEPLOYMENT.md](backend/DEPLOYMENT.md)

### 监控和维护
- 应用日志: PM2日志管理
- 数据库监控: MySQL性能监控
- 系统监控: 服务器资源监控
- 错误追踪: 应用错误监控

## 开发规范

### 代码规范
- 后端: Airbnb JavaScript规范
- 前端: ESLint + Prettier配置
- 提交信息: Conventional Commits规范
- 分支管理: Git Flow工作流

### 安全规范
- 密码加密: bcrypt (12轮)
- 令牌管理: JWT + 刷新令牌
- 输入验证: 所有用户输入验证
- SQL防护: 参数化查询防止注入
- CORS配置: 严格来源控制

## 项目状态

### ✅ 已完成
1. **后端服务**
   - 完整的RESTful API设计
   - 数据库模型和关系定义
   - 认证和授权中间件
   - 错误处理和日志记录
   - 数据库迁移脚本
   - 集成测试框架

2. **Web前端 (购物网站)**
   - Vue 3项目结构搭建
   - 所有核心页面开发
   - 产品列表和详情页
   - 购物车和结算流程
   - 用户认证和个人中心
   - 响应式设计适配

3. **Web后台管理**
   - React项目结构搭建
   - 管理员登录和认证
   - 仪表板和数据统计
   - 基础管理页面框架
   - 权限控制组件

4. **移动端应用**
   - React Native混合架构
   - 原生桥接模块设计
   - WebView管理系统
   - 底部导航和路由
   - 扫码和存储功能
   - iOS/Android项目结构

5. **文档和指南**
   - 系统集成测试文档
   - 数据库设计和迁移指南
   - 部署和运维指南
   - 各个组件README文档

### 🔄 进行中
1. **移动端原生模块实现**
   - iOS原生模块具体实现
   - Android原生模块具体实现
   - 跨平台代码统一和优化

2. **端到端集成测试**
   - 所有组件联合测试
   - 业务流程完整性验证
   - 性能和负载测试

### 📋 下一步计划
1. **生产环境部署**
   - 多服务器负载均衡配置
   - 数据库主从复制设置
   - 缓存层集成 (Redis)
   - CDN和静态资源优化

2. **高级功能开发**
   - 实时通知系统
   - 数据分析和大屏展示
   - 第三方支付集成
   - 多语言国际化支持

3. **监控和运维**
   - 应用性能监控 (APM)
   - 日志集中管理
   - 自动化备份和恢复
   - 持续集成/持续部署流水线

## 贡献指南

1. Fork项目仓库
2. 创建功能分支: `git checkout -b feature/your-feature`
3. 提交更改: `git commit -m 'Add some feature'`
4. 推送到分支: `git push origin feature/your-feature`
5. 创建Pull Request

### 提交信息规范
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具变动

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