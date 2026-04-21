# 移动端App（原生WebView架构）

## 模块概述
移动端App是为员工提供的移动办公应用，采用纯原生WebView架构。Android/iOS原生应用作为容器，管理多个WebView实例，每个WebView加载对应的H5功能模块（来自`frontend/web-mobile/`），实现模块隔离和性能优化。

## 架构约束
- **架构模式**: 原生容器 + 多WebView堆栈
- **平台技术**: 
  - Android: Kotlin/Java + WebView组件
  - iOS: Swift/Objective-C + WKWebView组件
- **Web技术**: React 18.x H5应用 (位于 `frontend/web-mobile/`)
- **页面加载**: Native管理多个WebView实现不同模块页面按需加载隔离
- **通信机制**: WebView与原生层通过JavaScript Bridge通信
- **原生功能**: 提供存储管理、Cookie注入、扫码等原生能力
- **API调用**: 遵循统一的 API 定义规范，与后端接口保持一致
- **URL规范**: WebView加载 `http://a.b.c/xfbh/mobile/` 路径

## 功能描述

### 核心功能
1. **登录认证**
   - 员工登录（通过H5登录页面）
   - 记住登录状态（Cookie注入）
   - 指纹/面容识别（原生生物识别）

2. **SKU管理**
   - SKU列表查看（H5页面）
   - SKU搜索和筛选
   - 新增/编辑SKU
   - 拍照上传商品图片（原生相机）
   - 删除SKU

3. **订单处理**
   - 订单列表查看
   - 订单详情查看
   - 订单状态推进
   - 订单搜索和筛选

4. **扫码功能**
   - 扫描商品条形码（原生扫码器）
   - 快速查看商品信息
   - 库存盘点、入库、出库操作

5. **消息通知**
   - 新订单提醒（原生推送）
   - 库存预警通知
   - 系统消息

### 移动端特性
- **多WebView管理**: 每个模块独立WebView，实现隔离
- **原生功能集成**: 相机、扫码、存储、推送
- **离线支持**: 关键数据本地缓存
- **性能优化**: WebView预加载和复用
- **安全增强**: 原生安全控制和加密

## 技术要点
- **WebView堆栈管理**: 原生管理多个WebView实例
- **JavaScript桥接**: Web与原生双向通信
- **Cookie同步**: 跨WebView Cookie管理
- **资源本地化**: H5资源打包到应用内
- **性能监控**: WebView内存和性能监控
- **安全配置**: WebView安全策略加固

## 技术栈
### 原生技术栈
- **Android**: Kotlin + Android WebView + Jetpack组件
- **iOS**: Swift + WKWebView + UIKit/SwiftUI
- **原生模块**: 存储管理、扫码、相机、推送、网络监测

### Web技术栈（H5应用）
- **框架**: React 18 + Ant Design Mobile
- **路由**: React Router DOM 6
- **状态管理**: Context API + Hooks
- **构建工具**: Vite
- **部署路径**: `/xfbh/mobile/`

## 架构设计

### WebView堆栈管理
```
主容器 (MainContainer)
├── WebView堆栈管理器 (WebViewStackManager)
│   ├── 活跃WebView池 (Active WebView Pool)
│   │   ├── DashboardWebView (仪表板模块)
│   │   ├── ProductsWebView (产品管理模块)
│   │   ├── OrdersWebView (订单处理模块)
│   │   ├── ScannerWebView (扫码模块)
│   │   └── ProfileWebView (个人中心模块)
│   ├── 闲置WebView池 (Idle WebView Pool)
│   └── WebView配置缓存 (Configuration Cache)
└── 原生导航控制器 (Native Navigation Controller)
```

### 模块URL映射
- **仪表板**: `/xfbh/mobile/#/dashboard`
- **产品管理**: `/xfbh/mobile/#/products`
- **订单处理**: `/xfbh/mobile/#/orders`
- **扫码功能**: `/xfbh/mobile/#/scanner`
- **个人中心**: `/xfbh/mobile/#/profile`

### 原生功能模块
1. **WebView管理器**: WebView创建、配置、生命周期管理
2. **Cookie管理器**: 跨WebView Cookie同步和注入
3. **扫码管理器**: 二维码/条形码扫描，图片识别
4. **存储管理器**: 本地键值存储、文件存储、加密存储
5. **网络管理器**: 网络状态监测、离线支持
6. **推送管理器**: 原生推送通知集成

## 通信协议

### JavaScript桥接接口
```javascript
// Web调用原生功能
window.NativeBridge.callNative('scanner.startScan', { format: 'QR_CODE' })
  .then(result => {
    console.log('扫码结果:', result)
  })

// 原生事件监听
window.NativeBridge.addEventListener('networkChange', event => {
  console.log('网络状态变化:', event.status)
})
```

### 消息格式
```json
{
  "messageId": "unique_message_id",
  "action": "native.action.name",
  "params": {},
  "timestamp": 1234567890,
  "callbackId": "callback_identifier"
}
```

## 性能优化

### 1. WebView预加载策略
- **高频模块预加载**: 仪表板、订单处理模块
- **闲置池管理**: 复用闲置WebView实例
- **内存预警**: 自动清理闲置WebView

### 2. 资源缓存策略
- **H5资源本地化**: 打包到APK/IPA中
- **CDN加速**: 生产环境使用CDN分发
- **增量更新**: 版本管理和增量更新

### 3. 启动优化
- **冷启动优化**: 减少主线程阻塞
- **首屏加速**: 关键模块预加载
- **资源懒加载**: 非关键模块按需加载

## 安全设计

### 1. WebView安全配置
- **危险功能禁用**: 限制文件访问、通用访问
- **安全浏览**: 启用安全浏览保护
- **内容策略**: 严格的内容安全策略

### 2. 通信安全
- **消息签名**: 所有消息签名验证
- **来源验证**: 验证消息来源WebView
- **参数过滤**: 过滤危险参数和脚本

### 3. 数据安全
- **本地加密**: 敏感数据加密存储
- **传输加密**: HTTPS强制启用
- **权限控制**: 严格的原生API权限控制

## 平台适配
- **Android**: Android 8.0+ (API Level 26+)
- **iOS**: iOS 15.0+
- **屏幕适配**: 各种屏幕尺寸和密度
- **权限管理**: 相机、存储、网络等系统权限
- **深色模式**: 支持系统深色模式

## 开发工作流

### 环境要求
- **Android**: Android Studio 2022+, JDK 11+, Android SDK 31+
- **iOS**: Xcode 14+, macOS 13+, iOS 15+ SDK
- **H5开发**: Node.js 18.x (用于 `frontend/web-mobile/`)

### 开发流程
1. **H5开发**: 在 `frontend/web-mobile/` 开发React H5应用
2. **原生开发**: 在 `mobile/android/` 和 `mobile/ios/` 开发原生容器
3. **集成测试**: 测试WebView加载和原生功能调用
4. **构建发布**: 分别构建Android和iOS应用

## 依赖关系
- **依赖模块**: 用户管理、SKU管理、订单管理、权限控制模块的API接口
- **依赖H5应用**: `frontend/web-mobile/` 构建的H5应用
- **提供功能**: 员工移动端操作界面，支持原生设备功能

---

*最后更新: 2026-04-20*
*架构版本: 3.0.0 (原生WebView架构)*

