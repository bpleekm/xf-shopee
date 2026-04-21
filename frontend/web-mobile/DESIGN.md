# 移动端H5应用设计文档

## 概述
XF Shopee ERP系统的移动端H5应用，为员工提供移动办公功能，支持SKU管理、订单处理、扫码操作等核心业务。应用可通过 `/xfbh/mobile/index.html` 访问，也支持嵌入原生移动应用的WebView中。

## 架构设计
- **前端框架**: React 18.x
- **构建工具**: Vite 5.x
- **UI组件库**: Ant Design Mobile 5.x
- **状态管理**: React Context + Hooks
- **路由管理**: React Router DOM 6.x
- **部署路径**: `/xfbh/mobile/` (遵循项目URL规范)

## 目录结构
```
web-mobile/
├── src/
│   ├── pages/             # 页面组件
│   │   ├── DashboardPage.jsx    # 仪表板页面
│   │   ├── ProductsPage.jsx     # 产品管理页面
│   │   ├── OrdersPage.jsx       # 订单处理页面
│   │   ├── ScannerPage.jsx      # 扫码功能页面
│   │   ├── ProfilePage.jsx      # 个人中心页面
│   │   ├── LoginPage.jsx        # 登录页面
│   │   └── RegisterPage.jsx     # 注册页面
│   ├── components/        # 可复用组件
│   │   ├── common/        # 通用组件
│   │   ├── business/      # 业务组件
│   │   └── layout/        # 布局组件
│   ├── contexts/          # React Context
│   │   └── AuthContext.jsx # 认证上下文
│   ├── services/          # API服务层
│   │   └── api.js         # 统一API客户端
│   ├── hooks/             # 自定义Hooks
│   │   ├── useAuth.js     # 认证相关Hook
│   │   └── useProducts.js # 产品相关Hook
│   ├── layouts/           # 布局组件
│   │   ├── MainLayout.jsx # 主布局
│   │   └── AuthLayout.jsx # 认证布局
│   ├── utils/             # 工具函数
│   │   ├── constants.js   # 常量定义
│   │   ├── validators.js  # 验证函数
│   │   └── formatters.js  # 格式化函数
│   ├── assets/            # 静态资源
│   │   ├── images/        # 图片资源
│   │   └── styles/        # 样式文件
│   ├── App.jsx            # 根组件
│   ├── main.jsx           # 应用入口
│   └── index.css          # 全局样式
├── public/                # 公共资源
│   └── index.html         # HTML入口文件
├── dist/                  # 构建输出目录
├── .env.example           # 环境变量模板
├── README.md              # 项目说明文档
├── package.json          # 依赖配置
├── vite.config.js        # Vite构建配置
└── DESIGN.md             # 本设计文档
```

## 技术栈
- **React 18**: 函数式组件 + Hooks
- **Ant Design Mobile**: 移动端UI组件库
- **React Router DOM 6**: 客户端路由管理
- **Axios**: HTTP客户端，支持拦截器和错误处理
- **Vite**: 现代构建工具，支持热更新和快速构建
- **CSS Modules**: 样式隔离和模块化

## 页面设计

### 1. 仪表板页面 (DashboardPage)
- **功能**: 数据概览统计、快捷操作入口、低库存预警
- **组件**: 卡片统计、图表展示、通知栏、快捷菜单
- **数据**: 产品总数、订单总数、待处理订单、低库存产品

### 2. 产品管理页面 (ProductsPage)
- **功能**: 产品列表浏览、搜索筛选、库存调整、产品状态管理
- **组件**: 产品列表、搜索框、筛选器、操作按钮
- **操作**: 查看详情、编辑产品、调整库存、上架/下架

### 3. 订单处理页面 (OrdersPage)
- **功能**: 订单列表查看、状态筛选、订单详情、状态推进
- **组件**: 订单列表、状态标签、操作菜单、筛选面板
- **操作**: 查看订单详情、更新订单状态、取消订单、导出数据

### 4. 扫码功能页面 (ScannerPage)
- **功能**: 模拟扫码界面、手动输入SKU、库存操作、扫描历史
- **组件**: 扫码界面、输入面板、操作按钮、历史记录
- **操作**: 扫码识别、手动输入、库存盘点、批量提交

### 5. 个人中心页面 (ProfilePage)
- **功能**: 用户信息管理、应用设置、密码修改、登录登出
- **组件**: 用户信息卡片、设置列表、操作按钮
- **操作**: 查看个人信息、修改密码、更新设置、退出登录

### 6. 登录页面 (LoginPage)
- **功能**: 用户登录、记住密码、找回密码
- **组件**: 登录表单、验证码、记住我选项
- **验证**: 用户名/密码验证、表单校验

### 7. 注册页面 (RegisterPage)
- **功能**: 新用户注册、表单验证、注册成功跳转
- **组件**: 注册表单、验证输入、提交按钮
- **验证**: 必填字段验证、密码强度、重复密码匹配

## API集成

### API配置
- **基础URL**: `/xfbh/api` (通过Nginx代理到后端服务)
- **响应格式**: 统一JSON格式
  ```json
  {
    "success": true,
    "data": {},
    "message": "操作成功",
    "timestamp": "2023-01-01T00:00:00Z"
  }
  ```
- **认证方式**: Bearer Token (JWT)，自动从localStorage获取

### 错误处理
- **401未授权**: 自动跳转到登录页面
- **网络错误**: 显示友好错误提示
- **服务器错误**: 显示服务器错误信息
- **请求超时**: 显示超时提示并提供重试选项

### 拦截器配置
```javascript
// 请求拦截器 - 添加认证token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 统一错误处理
api.interceptors.response.use(
  (response) => {
    // 统一处理成功响应
    return response.data;
  },
  (error) => {
    // 统一处理错误响应
    if (error.response?.status === 401) {
      // 跳转到登录页
      window.location.href = '/xfbh/mobile/#/login';
    }
    return Promise.reject(error);
  }
);
```

## 状态管理

### 认证状态 (AuthContext)
- **用户信息**: 当前登录用户数据
- **登录状态**: 是否已登录
- **Token管理**: JWT令牌存储和刷新
- **权限信息**: 用户角色和权限

### 全局状态
- **主题设置**: 浅色/深色模式
- **语言设置**: 中英文切换
- **网络状态**: 在线/离线检测
- **通知设置**: 消息通知偏好

## 路由设计

### 路由结构
```javascript
const routes = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: '', element: <DashboardPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'scanner', element: <ScannerPage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
  {
    path: '/login',
    element: <AuthLayout />,
    children: [
      { path: '', element: <LoginPage /> },
    ],
  },
  {
    path: '/register',
    element: <AuthLayout />,
    children: [
      { path: '', element: <RegisterPage /> },
    ],
  },
];
```

### 路由守卫
- **认证检查**: 访问受保护路由时验证登录状态
- **权限验证**: 根据用户角色限制页面访问
- **路由重定向**: 未登录用户重定向到登录页
- **路由回退**: 登录后返回原访问页面

## 样式设计

### 设计原则
- **移动优先**: 优先适配移动端屏幕，逐步增强
- **响应式布局**: 适配不同屏幕尺寸和设备
- **触控友好**: 按钮大小适中，间距合理
- **性能优化**: 减少重绘回流，优化渲染性能

### 样式方案
- **CSS Modules**: 组件样式隔离，避免冲突
- **Flex布局**: 灵活的响应式布局方案
- **REM单位**: 适配不同屏幕尺寸
- **主题变量**: 支持主题切换和自定义

## 性能优化

### 代码优化
- **代码分割**: 按路由动态加载组件
- **懒加载**: 图片和资源懒加载
- **缓存策略**: API响应缓存和本地存储
- **防抖节流**: 搜索和滚动事件优化

### 构建优化
- **Tree Shaking**: 移除未使用代码
- **代码压缩**: 减小包体积
- **资源优化**: 图片压缩和格式优化
- **预加载**: 关键资源预加载

## 移动端特性

### 设备适配
- **屏幕适配**: 适配不同分辨率和像素密度
- **横竖屏**: 支持横竖屏切换
- **安全区域**: 适配刘海屏和安全区域
- **手势支持**: 滑动、长按等手势操作

### 原生功能
- **扫码集成**: 调用设备摄像头扫码
- **文件上传**: 支持拍照和相册选择
- **推送通知**: Web Push通知集成
- **离线存储**: 本地数据缓存和同步

## 部署配置

### 环境变量
```env
# 基础路径配置
VITE_BASE_PATH=/xfbh/mobile/

# API基础URL
VITE_API_BASE_URL=/xfbh/api

# 构建配置
VITE_SOURCE_MAP=false
VITE_APP_TITLE=XF Shopee Mobile
```

### Vite配置
```javascript
export default defineConfig({
  base: env.VITE_BASE_PATH || './',
  server: {
    port: 3003,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/xfbh/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/xfbh\/api/, '/api')
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
```

## 测试策略

### 单元测试
- **组件测试**: 测试组件渲染和交互
- **工具函数测试**: 测试工具函数逻辑
- **Hook测试**: 测试自定义Hook行为

### 集成测试
- **页面测试**: 测试页面完整功能
- **API测试**: 测试API调用和响应处理
- **路由测试**: 测试路由跳转和守卫

### E2E测试
- **用户流程测试**: 测试完整用户操作流程
- **跨平台测试**: 测试不同设备和浏览器兼容性
- **性能测试**: 测试页面加载和响应性能

## 开发规范

### 代码规范
- **组件规范**: 函数式组件，使用Hooks
- **命名规范**: 组件使用帕斯卡命名，文件使用连字符分隔
- **注释规范**: 公共组件和复杂逻辑添加注释
- **导入规范**: 分组导入，React相关导入在前

### 提交规范
- **提交类型**: feat, fix, docs, style, refactor, test, chore
- **提交信息**: 简明扼要，说明变更内容
- **提交范围**: 使用`web-mobile`作为提交范围前缀

## 更新日志

### v1.0.0 (2026-04-20)
- **初始版本**: 创建移动端H5应用
- **核心功能**: 仪表板、产品管理、订单处理、扫码、个人中心
- **技术栈**: React 18 + Ant Design Mobile + Vite
- **部署路径**: 支持 `/xfbh/mobile/` 访问路径
- **API集成**: 统一API客户端，支持 `/xfbh/api` 前缀

---
*设计文档最后更新: 2026-04-20*  
*版本: 1.0.0*
