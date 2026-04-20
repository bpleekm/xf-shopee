# 移动端H5应用

## 模块概述
移动端H5应用是为员工提供的移动办公Web应用，支持随时随地管理SKU商品和处理订单，提供与Web后台和原生移动应用相同的核心功能。该应用可通过 `/xfbh/mobile/index.html` 访问，也可嵌入原生移动应用的WebView中。

## 架构特点
- **技术栈**: React 18 + Ant Design Mobile + Vite
- **访问路径**: `/xfbh/mobile/` (遵循项目URL规范)
- **API集成**: 通过 `/xfbh/api` 前缀调用后端API
- **响应式设计**: 适配各种移动设备屏幕尺寸
- **移动优化**: 触控友好界面、移动手势支持
- **认证方式**: JWT令牌认证，支持持久登录

## URL规范
- **开发环境**: `http://localhost:3003`
- **生产环境**: `http://a.b.c/xfbh/mobile/index.html`
- **API请求**: `xfbh/api/xxx.json` (支持.json扩展名)
- **静态资源**: 由Nginx直接处理

## 功能描述

### 核心功能
1. **仪表板**
   - 数据概览统计
   - 快捷操作入口
   - 低库存预警
   - 待处理订单提醒

2. **产品管理**
   - 产品列表浏览和搜索
   - 按分类、状态筛选
   - 产品详情查看
   - 库存数量调整
   - 产品状态管理（上架/下架）

3. **订单处理**
   - 订单列表查看
   - 按状态、时间筛选订单
   - 订单详情查看
   - 订单状态推进（待处理→处理中→已发货→已送达→已完成）
   - 订单取消功能

4. **扫码功能**
   - 模拟扫码界面
   - 手动输入SKU
   - 库存盘点、入库、出库操作
   - 扫描历史记录
   - 批量提交功能

5. **个人中心**
   - 用户信息管理
   - 应用设置配置
   - 密码修改
   - 登录/登出功能

### 移动端特性
- **触控优化**: 大按钮、适合手指操作
- **手势支持**: 下拉刷新、滑动操作
- **离线支持**: 本地缓存数据
- **扫码集成**: 支持摄像头扫码（需设备授权）
- **消息推送**: Web Push通知（可选）

## 技术要点

### 项目结构
```
web-mobile/
├── src/
│   ├── pages/             # 页面组件
│   │   ├── DashboardPage.jsx    # 仪表板
│   │   ├── ProductsPage.jsx     # 产品管理
│   │   ├── OrdersPage.jsx       # 订单处理
│   │   ├── ScannerPage.jsx      # 扫码功能
│   │   ├── ProfilePage.jsx      # 个人中心
│   │   ├── LoginPage.jsx        # 登录页面
│   │   └── RegisterPage.jsx     # 注册页面
│   ├── components/        # 可复用组件
│   ├── contexts/          # React Context
│   │   └── AuthContext.jsx # 认证上下文
│   ├── services/          # API服务
│   │   └── api.js         # 统一API客户端
│   ├── utils/             # 工具函数
│   ├── layouts/           # 布局组件
│   ├── hooks/             # 自定义Hooks
│   ├── assets/            # 静态资源
│   ├── App.jsx            # 主应用组件
│   ├── main.jsx           # 应用入口
│   └── index.css          # 全局样式
├── public/                # 公共资源
├── package.json          # 依赖配置
├── vite.config.js       # 构建配置
├── .env.example         # 环境变量模板
└── README.md            # 项目文档
```

### API集成
- **基础URL**: `/xfbh/api` (通过Nginx代理)
- **响应格式**: `{success: boolean, data: any, message: string, timestamp: string}`
- **错误处理**: 统一拦截器处理401未授权、网络错误等
- **认证方式**: Bearer Token (JWT)

### 状态管理
- **全局状态**: React Context API (认证状态)
- **本地状态**: React useState/useReducer
- **持久化**: localStorage (token, 用户设置)
- **缓存策略**: 内存缓存API响应数据

### 路由设计
- **路由守卫**: 保护需要认证的路由
- **底部导航**: Dashboard, Products, Orders, Scanner, Profile
- **公开路由**: Login, Register
- **错误页面**: 404页面处理

## 技术栈详细说明

### 核心依赖
- **React 18**: 前端框架
- **React Router DOM 6**: 路由管理
- **Ant Design Mobile 5**: UI组件库
- **Axios**: HTTP客户端
- **Vite**: 构建工具和开发服务器

### 开发工具
- **ESLint**: 代码检查
- **Prettier**: 代码格式化
- **TypeScript**: 类型检查（可选）
- **Jest**: 单元测试
- **React Testing Library**: 组件测试

### 环境配置
```env
# 基础路径配置
VITE_BASE_PATH=/xfbh/mobile/
VITE_API_BASE_URL=/xfbh/api

# 应用配置
VITE_APP_TITLE=XF Shopee Mobile
VITE_DEBUG=false
VITE_DEFAULT_LANG=zh-CN

# 移动端特性
VITE_ENABLE_TOUCH_GESTURES=true
VITE_ENABLE_OFFLINE_CACHE=false
```

## 部署配置

### Nginx配置示例
```nginx
location /xfbh/mobile/ {
    alias /opt/xf-shopee/frontend/web-mobile/dist/;
    index index.html;
    try_files $uri $uri/ /xfbh/mobile/index.html;
    
    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 构建命令
```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build

# 预览构建结果
npm run preview
```

## 与原生应用集成

### WebView嵌入
```javascript
// React Native WebView示例
<WebView
  source={{ uri: 'http://a.b.c/xfbh/mobile/index.html' }}
  injectedJavaScript={`
    // 注入原生桥接代码
    window.NativeBridge = {
      getStorage: (key) => window.ReactNativeWebView.postMessage(
        JSON.stringify({type: 'getStorage', key})
      ),
      setStorage: (key, value) => window.ReactNativeWebView.postMessage(
        JSON.stringify({type: 'setStorage', key, value})
      ),
      scanBarcode: () => window.ReactNativeWebView.postMessage(
        JSON.stringify({type: 'scanBarcode'})
      )
    };
  `}
  onMessage={handleWebViewMessage}
/>
```

### 桥接通信
- **Web → Native**: `window.ReactNativeWebView.postMessage()`
- **Native → Web**: `WebView.injectJavaScript()`
- **数据格式**: JSON字符串，包含type和payload

## 性能优化

### 加载性能
- **代码分割**: React.lazy()动态导入
- **图片优化**: 懒加载、WebP格式、响应式图片
- **字体优化**: 字体子集、本地字体缓存
- **资源预加载**: 关键资源提前加载

### 运行时性能
- **虚拟列表**: 长列表优化
- **记忆化**: React.memo, useMemo, useCallback
- **防抖节流**: 搜索、滚动等高频操作
- **内存管理**: 及时清理事件监听器、定时器

### 网络优化
- **请求合并**: 批量API请求
- **缓存策略**: 内存缓存、localStorage缓存
- **离线支持**: Service Worker（可选）
- **重试机制**: 失败请求自动重试

## 安全性考虑

### 认证安全
- **Token存储**: localStorage + 内存缓存
- **Token刷新**: 自动刷新过期token
- **XSS防护**: 输入验证、输出编码
- **CSRF防护**: SameSite Cookie、自定义头部

### 数据传输
- **HTTPS强制**: 生产环境强制HTTPS
- **敏感数据**: 不存储密码、信用卡信息
- **API安全**: 请求签名、频率限制

## 测试策略

### 单元测试
- **组件测试**: 渲染、交互、状态
- **工具函数**: 纯函数测试
- **API服务**: Mock网络请求

### 集成测试
- **页面流程**: 用户完整操作流程
- **API集成**: 真实API调用测试
- **路由测试**: 导航、守卫逻辑

### E2E测试
- **用户场景**: 真实用户操作模拟
- **跨平台**: 不同浏览器、设备测试
- **性能测试**: 加载时间、响应时间

## 浏览器兼容性
- **Chrome 80+**: 推荐
- **Safari 12+**: 支持
- **Firefox 75+**: 支持
- **Edge 80+**: 支持
- **移动浏览器**: iOS Safari, Android Chrome

## 维护和监控

### 错误监控
- **前端错误**: 全局错误边界
- **API错误**: 统一错误处理
- **性能监控**: 关键指标收集

### 日志记录
- **用户操作**: 关键操作日志
- **错误日志**: 错误上下文信息
- **性能日志**: 页面加载、API响应时间

### 更新策略
- **版本管理**: Semantic Versioning
- **灰度发布**: 逐步推送更新
- **回滚机制**: 快速回滚错误版本

## 依赖关系
- **依赖**: 用户管理、SKU管理、订单管理、权限控制模块的API接口
- **提供**: 员工移动端H5操作界面
- **集成**: 可嵌入原生移动应用WebView

## 扩展方向

### 功能扩展
- **实时通知**: WebSocket实时订单通知
- **离线模式**: Service Worker离线缓存
- **多语言**: 国际化支持
- **主题切换**: 深色/浅色主题

### 技术升级
- **PWA**: 渐进式Web应用
- **TypeScript**: 全面类型支持
- **微前端**: 模块化独立部署
- **Serverless**: 无服务器架构

---

*文档最后更新: 2026年4月*