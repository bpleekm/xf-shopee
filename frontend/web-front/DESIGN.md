# Web前台系统设计文档

## 概述
XF Shopee ERP系统的Web前台购物网站，面向游客和注册用户，提供商品浏览、购物车、订单下单等功能。

## 架构设计
- **前端框架**: Vue 3.x (组合式API)
- **构建工具**: Vite 5.x
- **UI组件库**: Element Plus 2.x
- **状态管理**: Pinia 2.x
- **路由管理**: Vue Router 4.x

## 目录结构
```
web-front/
├── src/
│   ├── components/     # 可复用组件
│   │   ├── common/    # 通用组件
│   │   ├── layout/    # 布局组件
│   │   └── product/   # 商品相关组件
│   ├── views/         # 页面组件
│   │   ├── HomeView.vue      # 首页
│   │   ├── ProductsView.vue  # 商品列表
│   │   ├── CartView.vue      # 购物车
│   │   ├── OrdersView.vue    # 订单管理
│   │   └── CheckoutView.vue  # 结算页面
│   ├── router/        # 路由配置
│   ├── stores/        # Pinia状态管理
│   │   ├── cart.js    # 购物车状态
│   │   ├── user.js    # 用户状态
│   │   └── product.js # 商品状态
│   ├── services/      # API服务层
│   ├── utils/         # 工具函数
│   ├── assets/        # 静态资源
│   ├── App.vue        # 根组件
│   └── main.js        # 应用入口
├── public/            # 静态资源
├── package.json
├── vite.config.js    # Vite配置
└── DESIGN.md         # 本设计文档
```

## 技术栈
- **Vue 3**: 组合式API + `<script setup>`
- **Element Plus**: 基于Vue 3的UI组件库
- **Pinia**: Vue官方状态管理库
- **Vue Router**: 客户端路由
- **Axios**: HTTP客户端
- **Vite**: 构建工具和开发服务器

## 页面设计
### 1. 首页 (Home)
- 欢迎横幅、特色商品展示
- 分类导航、促销信息
- 系统状态显示（后端健康检查）

### 2. 商品列表页 (Products)
- 商品网格/列表视图
- 分类筛选、搜索功能
- 排序、分页功能
- 商品卡片（图片、名称、价格、添加购物车）

### 3. 购物车页 (Cart)
- 购物车商品列表
- 数量修改、删除商品
- 价格计算（小计、运费、税费、总计）
- 结算按钮

### 4. 订单页 (Orders)
- 订单历史列表
- 订单状态跟踪
- 订单详情查看
- 重新下单功能

### 5. 结算页 (Checkout) - 待实现
- 收货地址填写
- 支付方式选择
- 订单确认
- 支付流程

## 组件设计原则
1. **组合式API**: 使用 `<script setup>` 语法
2. **Props设计**: 明确的props类型定义
3. **事件通信**: `emits` 定义明确的事件
4. **插槽使用**: 灵活的插槽设计
5. **样式作用域**: `<style scoped>` 或 CSS Modules

## 状态管理策略
- **Pinia Store**: 模块化状态管理
- **购物车状态**: `cart` store (已实现)
- **用户状态**: `user` store (待实现)
- **商品状态**: `product` store (待实现)
- **持久化**: localStorage 或 sessionStorage

## 样式方案
- **Element Plus 主题**: 自定义主题色
- **CSS 变量**: 设计令牌统一管理
- **响应式设计**: 移动端优先，断点适配
- **动画效果**: 过渡动画增强用户体验

## API集成规范
1. **服务封装**: `services/` 目录统一管理API调用
2. **请求拦截**: Axios 请求/响应拦截器
3. **错误处理**: 统一错误提示和重试机制
4. **加载状态**: 全局加载状态管理

## 用户流程
1. **游客流程**: 浏览商品 → 添加购物车 → 创建订单
2. **注册用户**: 登录 → 浏览 → 下单 → 查看订单历史
3. **员工流程**: 登录后台管理系统 (web-admin)

## 性能优化
1. **路由懒加载**: 页面组件动态导入
2. **图片懒加载**: Intersection Observer API
3. **虚拟滚动**: 长列表性能优化
4. **代码分割**: 按路由分割代码包
5. **缓存策略**: API响应缓存、本地存储

## 安全考虑
1. **XSS防护**: Vue自动转义，避免 `v-html` 滥用
2. **CSRF令牌**: API请求携带CSRF令牌
3. **输入验证**: 表单输入验证
4. **HTTPS**: 生产环境强制HTTPS

## 开发工作流
1. **本地开发**: `npm run dev` (端口3002)
2. **代码检查**: ESLint + Prettier (待配置)
3. **类型检查**: Vue 3 TypeScript支持 (可选)
4. **构建部署**: `npm run build` + 静态部署

## 浏览器兼容性
- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90
- 移动端浏览器主流版本

## SEO优化
1. **服务端渲染**: Vue SSR (可选)
2. **元标签**: 动态meta标签管理
3. **结构化数据**: JSON-LD 商品信息
4. **站点地图**: 自动生成站点地图

---
*本设计文档需随项目演进持续更新，确保与实际代码保持一致。*