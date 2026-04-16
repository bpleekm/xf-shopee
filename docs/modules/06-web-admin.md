# Web后台管理系统

## 模块概述
Web后台管理系统是面向管理员和员工的管理平台，提供完整的ERP功能，包括用户管理、商品管理、订单处理等核心业务功能。

## 架构约束
- 前端框架不限（推荐 React / Vue）
- 需遵循统一的 API 定义规范，与后端接口保持一致
- 响应式设计，支持 PC 和移动端访问
- 采用组件化开发，确保代码复用性和可维护性
- UI 库推荐使用 Ant Design 或 Element UI

## 功能描述

### 核心页面
1. **登录页面**
   - 管理员/员工登录
   - 记住密码
   - 找回密码

2. **首页/Dashboard**
   - 数据概览（订单数、销售额、库存预警等）
   - 快捷操作入口
   - 待办事项提醒

3. **用户管理页面**（管理员）
   - 员工列表
   - 添加/删除员工
   - 员工权限配置

4. **SKU管理页面**
   - SKU列表（支持分页、搜索、筛选）
   - 新增SKU
   - 编辑SKU
   - SKU详情查看
   - 库存管理

5. **订单管理页面**
   - 订单列表
   - 订单详情
   - 订单状态变更
   - 订单筛选和搜索
   - 订单导出

6. **系统设置页面**
   - 个人信息设置
   - 密码修改
   - 系统参数配置

### UI/UX特性
- 响应式布局
- 侧边导航菜单
- 面包屑导航
- 数据表格组件
- 表单验证
- 操作反馈（Loading、Toast、Modal）

## 技术要点
- 前端框架（React/Vue/Angular）
- UI组件库（Ant Design/Element UI）
- 状态管理（Redux/Vuex）
- 路由管理
- HTTP请求封装
- 权限路由守卫
- 表单处理
- 表格分页

## 技术栈建议
- **框架**: React 18+ / Vue 3+
- **UI库**: Ant Design / Element Plus
- **状态管理**: Redux Toolkit / Pinia
- **路由**: React Router / Vue Router
- **HTTP**: Axios
- **构建工具**: Vite / Webpack

## 页面路由
- /login - 登录页
- /dashboard - 首页
- /users - 用户管理
- /sku - SKU管理
- /sku/create - 新增SKU
- /sku/:id/edit - 编辑SKU
- /orders - 订单管理
- /orders/:id - 订单详情
- /settings - 设置

## 依赖关系
- 依赖：所有后端业务模块的API接口
- 提供：管理员和员工的操作界面

