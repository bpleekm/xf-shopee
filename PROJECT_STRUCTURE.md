# XF Shopee ERP 系统 - 项目结构文档

## 项目概述
XF Shopee 是一个完整的部门商店ERP系统，包含后端服务、Web前端购物网站、Web后台管理系统、移动端原生应用和移动端H5应用。系统采用微服务架构设计，支持多用户角色、完整的商品管理、购物车、订单处理、库存管理和权限控制。

## 整体项目结构

```
xf-shopee/
├── backend/                      # 后端API服务 (Node.js/Express/MySQL)
├── frontend/                     # Web前端代码
│   ├── web-admin/                # Web后台管理系统 (React/Ant Design)
│   ├── web-front/                # Web前台购物网站 (Vue 3/Element Plus)
│   └── web-mobile/               # 移动端H5应用 (React/Ant Design Mobile)
├── mobile/                       # 移动端原生应用 (Android/iOS WebView容器)
├── docs/                         # 项目文档和设计规范
├── scripts/                      # 构建和部署脚本 (待创建)
├── config/                       # 配置文件 (待创建)
├── AGENTS.md                     # OpenCode Agent指令
├── PROJECT.md                    # 项目概述和架构规范
├── README.md                     # 项目主README文档
├── PROJECT_STRUCTURE.md          # 本项目结构文档
└── LICENSE                       # MIT许可证
```

## 模块详细结构

### 1. 后端服务 (backend/)
```
backend/
├── src/                          # 源代码
│   ├── config/                   # 配置文件
│   │   └── database.js           # 数据库连接配置
│   ├── controllers/              # 控制器
│   │   ├── userController.js     # 用户控制器
│   │   ├── productController.js  # 产品控制器
│   │   ├── cartController.js     # 购物车控制器
│   │   ├── orderController.js    # 订单控制器
│   │   └── authController.js     # 认证控制器
│   ├── middleware/               # 中间件
│   │   └── authMiddleware.js     # 认证中间件
│   ├── models/                   # 数据模型
│   │   ├── User.js               # 用户模型
│   │   ├── Product.js            # 产品模型
│   │   ├── Cart.js               # 购物车模型
│   │   ├── Order.js              # 订单模型
│   │   ├── Role.js               # 角色模型
│   │   └── Permission.js         # 权限模型
│   ├── routes/                   # API路由
│   │   ├── userRoutes.js         # 用户路由
│   │   ├── productRoutes.js      # 产品路由
│   │   ├── cartRoutes.js         # 购物车路由
│   │   ├── orderRoutes.js        # 订单路由
│   │   └── authRoutes.js         # 认证路由
│   ├── utils/                    # 工具函数
│   │   ├── response.js           # 统一响应格式
│   │   └── auth.js               # 认证工具
│   └── index.js                  # 应用入口文件
├── database/                     # 数据库相关
│   ├── migrations/               # 数据库迁移文件
│   │   └── 001_initial_schema.sql # 初始数据库架构
│   ├── migrate.js                # 迁移脚本
│   ├── schema.sql                # 数据库架构
│   └── seed.sql                  # 种子数据
├── tests/                        # 测试文件
│   ├── integration/              # 集成测试
│   │   ├── auth.test.js          # 认证测试
│   │   ├── products.test.js      # 产品测试
│   │   └── cart.test.js          # 购物车测试
│   ├── jest.config.js            # Jest配置
│   ├── setup.js                  # 测试设置
│   └── teardown.js               # 测试清理
├── DESIGN.md                     # 后端设计规范
├── README.md                     # 后端使用说明
├── DEPLOYMENT.md                 # 部署指南
├── package.json                  # 依赖配置
└── .env(.test)                   # 环境变量
```

**文件统计**: 17个JavaScript源代码文件

### 2. Web后台管理系统 (frontend/web-admin/)
```
frontend/web-admin/
├── src/                          # 源代码
│   ├── pages/                    # 页面组件
│   ├── components/               # 可复用组件
│   ├── contexts/                 # React Context
│   ├── services/                 # API服务
│   ├── App.jsx                   # 主应用组件
│   ├── App.css                   # 应用样式
│   ├── main.jsx                  # 应用入口
│   └── index.css                 # 全局样式
├── public/                       # 公共资源
├── dist/                         # 构建输出
│   └── assets/                   # 静态资源
├── DESIGN.md                     # 设计规范
├── README.md                     # 使用说明
├── package.json                  # 依赖配置
└── vite.config.js                # Vite配置
```

**文件统计**: 11个React组件文件

### 3. Web前台购物网站 (frontend/web-front/)
```
frontend/web-front/
├── src/                          # 源代码
│   ├── views/                    # 页面视图
│   ├── components/               # 可复用组件
│   ├── stores/                   # Pinia状态管理
│   ├── router/                   # Vue路由
│   ├── services/                 # API服务
│   ├── assets/                   # 静态资源
│   ├── App.vue                   # 主应用组件
│   └── main.js                   # 应用入口
├── public/                       # 公共资源
├── dist/                         # 构建输出
│   └── assets/                   # 静态资源
├── DESIGN.md                     # 设计规范
├── README.md                     # 使用说明
├── package.json                  # 依赖配置
└── vite.config.js                # Vite配置
```

**文件统计**: 20个Vue组件和JavaScript文件

### 4. 移动端H5应用 (frontend/web-mobile/)
```
frontend/web-mobile/
├── src/                          # 源代码
│   ├── pages/                    # 页面组件 (7个页面)
│   │   ├── DashboardPage.jsx     # 仪表板页面
│   │   ├── ProductsPage.jsx      # 产品管理页面
│   │   ├── OrdersPage.jsx        # 订单处理页面
│   │   ├── ScannerPage.jsx       # 扫码功能页面
│   │   ├── ProfilePage.jsx       # 个人中心页面
│   │   ├── LoginPage.jsx         # 登录页面
│   │   └── RegisterPage.jsx      # 注册页面
│   ├── components/               # 可复用组件
│   ├── contexts/                 # React Context
│   │   └── AuthContext.jsx       # 认证上下文
│   ├── hooks/                    # 自定义Hooks
│   ├── layouts/                  # 布局组件
│   ├── services/                 # API服务
│   │   └── api.js                # 统一API客户端
│   ├── utils/                    # 工具函数
│   ├── assets/                   # 静态资源
│   ├── App.jsx                   # 主应用组件
│   ├── main.jsx                  # 应用入口
│   └── index.css                 # 全局样式
├── public/                       # 公共资源
│   └── index.html                # HTML入口
├── dist/                         # 构建输出
│   └── assets/                   # 静态资源
├── .env.example                  # 环境变量模板
├── README.md                     # 使用说明
├── package.json                  # 依赖配置
└── vite.config.js                # Vite配置
```

**关键特性**:
- 支持 `/xfbh/mobile/` 访问路径
- API请求使用 `/xfbh/api` 前缀
- 适配移动端触控操作
- 响应式设计，支持各种屏幕尺寸
- 集成扫码、订单处理等核心功能

**文件统计**: 11个React组件文件 (7个页面 + 4个服务/上下文文件)

### 5. 移动端原生应用 (mobile/) - 原生WebView容器
```
mobile/
├── android/                      # Android原生项目
│   ├── app/src/main/
│   │   ├── java/com/xfshopee/    # Java/Kotlin源代码
│   │   │   ├── MainActivity.kt          # 主Activity
│   │   │   ├── WebViewManager.kt        # WebView管理器
│   │   │   ├── WebViewStack.kt          # WebView堆栈管理
│   │   │   ├── CookieManager.kt         # Cookie管理
│   │   │   ├── ScannerManager.kt        # 扫码功能
│   │   │   ├── StorageManager.kt        # 本地存储
│   │   │   └── BridgeInterface.kt       # JavaScript桥接
│   │   ├── res/                         # 资源文件
│   │   └── AndroidManifest.xml          # 清单文件
│   └── build.gradle                     # 构建配置
├── ios/                          # iOS原生项目
│   ├── XFShopee/
│   │   ├── AppDelegate.swift                # 应用代理
│   │   ├── SceneDelegate.swift              # 场景代理
│   │   ├── ViewControllers/
│   │   │   ├── MainViewController.swift     # 主视图控制器
│   │   │   ├── WebViewViewController.swift  # WebView控制器
│   │   │   ├── WebViewStackManager.swift    # WebView堆栈管理
│   │   │   ├── CookieManager.swift          # Cookie管理
│   │   │   ├── ScannerManager.swift         # 扫码功能
│   │   │   └── StorageManager.swift         # 本地存储
│   │   ├── Models/WebViewConfig.swift       # WebView配置模型
│   │   ├── Resources/                       # 资源文件
│   │   └── Info.plist                       # 配置文件
│   └── Podfile                             # 依赖管理
├── src/                          # 共享配置和桥接代码
│   ├── webview-config/module-urls.json      # 模块URL配置
│   ├── webview-config/bridge-protocol.md    # 桥接协议文档
│   └── assets/icons/                        # 应用图标
├── DESIGN.md                     # 设计规范（原生WebView架构）
└── README.md                     # 项目说明
```

**架构特点**:
- 纯原生WebView容器架构（Android/iOS）
- 多WebView堆栈管理，每个模块独立WebView实例
- 加载 `frontend/web-mobile/` H5应用模块
- 原生功能：扫码、存储、相机、推送、网络监测
- JavaScript Bridge双向通信
- 支持 `/xfbh/mobile/` URL路径规范

### 6. 文档目录 (docs/)
```
docs/
├── modules/                      # 模块详细设计文档
│   ├── README.md                 # 模块概述和依赖关系
│   ├── 01-user-management.md     # 用户管理模块
│   ├── 02-sku-management.md      # SKU商品管理模块
│   ├── 03-shopping-cart.md       # 购物车模块
│   ├── 04-order-management.md     # 订单管理模块
│   ├── 05-permission-control.md  # 权限控制模块
│   ├── 06-web-admin.md           # Web后台管理系统
│   ├── 07-web-frontend.md        # Web前台系统
│   ├── 08-mobile-app.md          # 移动端原生App
│   └── 09-web-mobile.md          # 移动端H5应用 (新增)
└── SYSTEM_INTEGRATION_TEST.md    # 系统集成测试文档
```

## 技术栈汇总

### 后端技术栈
- **运行时**: Node.js 18.x
- **框架**: Express 4.x
- **数据库**: MySQL 8.0+
- **认证**: JWT + bcrypt
- **数据验证**: Joi + express-validator
- **测试**: Jest + Supertest

### Web前端技术栈 (web-front)
- **框架**: Vue 3 (Composition API)
- **状态管理**: Pinia
- **UI库**: Element Plus
- **路由**: Vue Router 4
- **构建工具**: Vite
- **HTTP客户端**: Axios

### Web后台技术栈 (web-admin)
- **框架**: React 18
- **UI库**: Ant Design 5
- **状态管理**: Context API
- **路由**: React Router 6
- **构建工具**: Vite
- **HTTP客户端**: Axios

### 移动端H5技术栈 (web-mobile)
- **框架**: React 18
- **UI库**: Ant Design Mobile
- **路由**: React Router DOM 6
- **构建工具**: Vite
- **HTTP客户端**: Axios
- **部署路径**: `/xfbh/mobile/`

### 移动端原生技术栈
- **Android**: Kotlin/Java + Android WebView + Jetpack组件
- **iOS**: Swift/Objective-C + WKWebView + UIKit/SwiftUI
- **架构**: 原生WebView容器 + 多WebView堆栈
- **原生模块**: 存储管理、扫码、相机、推送、网络监测
- **通信**: JavaScript Bridge双向通信
- **H5集成**: 加载 `frontend/web-mobile/` React H5应用

## URL规范

所有URL必须遵循 `xfbh` 前缀规范：

### 开发环境
- **管理后台**: `http://localhost:3002/xfbh/admin/index.html`
- **购物网站**: `http://localhost:3001/xfbh/shop/`
- **移动端H5**: `http://localhost:3003/xfbh/mobile/`
- **API请求**: `http://localhost:3000/xfbh/api/xxx.json`

### 生产环境
- **管理后台**: `http://a.b.c/xfbh/admin/index.html`
- **购物网站**: `http://a.b.c/xfbh/shop/`
- **移动端H5**: `http://a.b.c/xfbh/mobile/index.html`
- **API请求**: `xfbh/api/xxx.json`
- **静态资源**: 由Nginx直接拦截处理

## 开发状态

### ✅ 已完成功能
1. **后端服务**: 完整的RESTful API，包含所有核心业务模块
2. **Web前端**: Vue 3购物网站，支持产品浏览、购物车、下单
3. **Web后台**: React管理系统，支持用户、产品、订单管理
4. **移动端原生**: Android/iOS原生WebView容器架构，支持多WebView堆栈管理
5. **移动端H5**: React移动应用，支持扫码、订单处理等核心功能
6. **文档系统**: 完整的设计文档和API文档

### 🔄 进行中
1. **端到端集成测试**: 所有组件联合测试
2. **生产环境部署**: 多服务器配置和负载均衡
3. **性能优化**: 数据库查询优化和前端资源懒加载

### 📋 下一步计划
1. **高级功能**: 实时通知、数据分析、第三方支付集成
2. **监控运维**: 应用性能监控、日志集中管理
3. **安全加固**: 输入验证、SQL注入防护、CORS配置

## 代码统计

| 模块 | 文件类型 | 数量 | 说明 |
|------|----------|------|------|
| 后端 | JavaScript | 17 | 控制器、模型、路由、工具 |
| Web后台 | React组件 | 11 | 页面、组件、上下文 |
| Web前台 | Vue组件/JS | 20 | 视图、组件、状态管理 |
| 移动端H5 | React组件 | 11 | 7个页面 + 4个服务/上下文 |
| 移动端原生 | Android/iOS原生 | - | WebView容器架构，管理多WebView实例 |
| 文档 | Markdown | 13 | 设计文档、API文档、指南 |

## 变更历史

### 最新变更 (2026-04-20)
1. **重新实现移动端原生架构**
   - 从React Native Hybrid架构改为纯原生WebView容器
   - Android/iOS原生应用管理多个WebView实例
   - 每个WebView加载 `frontend/web-mobile/` H5模块
   - 原生功能：扫码、存储、相机、推送、网络监测
   - 更新 `mobile/DESIGN.md` 和 `docs/modules/08-mobile-app.md` 设计文档

2. **新增移动端H5应用模块** (`frontend/web-mobile/`)
   - 完整实现React + Ant Design Mobile应用
   - 包含7个核心页面：仪表板、产品管理、订单处理、扫码、个人中心、登录、注册
   - 配置Vite构建工具，支持 `/xfbh/mobile/` 基础路径
   - 更新API服务层，适配后端统一响应格式

3. **文档更新**
   - 更新 `PROJECT.md`: 添加web-mobile模块说明
   - 更新 `README.md`: 完善项目概述和技术栈
   - 创建 `docs/modules/09-web-mobile.md`: 详细设计文档
   - 更新 `docs/modules/README.md`: 添加模块依赖关系

3. **API适配**
   - 前端API响应格式统一处理
   - 字段名使用snake_case约定 (`stock_quantity`, `order_number`)
   - 错误拦截和401自动跳转处理

### 近期变更
- **后端API**: 支持双路径前缀 `/api/v1` 和 `/xfbh/api/v1`
- **数据库**: 完整的迁移脚本和种子数据
- **测试**: 集成测试框架(Jest + Supertest)
- **部署**: Nginx配置指南和PM2进程管理

## 项目规范

### 代码规范
- **命名**: 后端使用连字符分隔，前端使用帕斯卡命名法
- **目录结构**: 不超过3级深度，按功能模块组织
- **文档**: 所有公共API必须有文档注释
- **测试**: 单元测试覆盖率不低于70%

### 提交规范
- 使用Conventional Commits规范
- 提交信息格式: `type(scope): description`
- 类型包括: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### 安全规范
- 密码加密: bcrypt (12轮)
- 令牌管理: JWT + 刷新令牌
- 输入验证: 所有用户输入验证
- SQL防护: 参数化查询防止注入

## 快速开始指南

### 1. 后端启动
```bash
cd backend
npm install
cp .env.example .env  # 配置数据库
npm run db:migrate
npm run dev
```

### 2. Web前台启动
```bash
cd frontend/web-front
npm install
npm run dev
```

### 3. Web后台启动
```bash
cd frontend/web-admin
npm install
npm start
```

### 4. 移动端H5启动
```bash
cd frontend/web-mobile
npm install
npm run dev
```

### 5. 移动端原生启动
```bash
cd mobile
npm install
npm start
# 另开终端运行 iOS/Android
npm run ios  # 或 npm run android
```

## 联系与支持

- **问题反馈**: GitHub Issues
- **文档参考**: `docs/` 目录
- **紧急联系人**: 系统管理员
- **许可证**: MIT (详见 LICENSE 文件)

---
*文档最后更新: 2026-04-20*  
*版本: 2.1.0*  
*生成工具: OpenCode Agent*
