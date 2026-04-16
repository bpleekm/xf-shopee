# 移动端App设计文档

## 概述
XF Shopee ERP系统的移动端应用程序，采用Hybrid（混合）架构，为员工提供移动办公功能，支持SKU管理、订单处理等核心业务操作。

## 架构设计
- **架构模式**: Hybrid (原生容器 + WebView)
- **跨平台框架**: React Native 0.72.x
- **Web技术**: React 18.x (WebView内)
- **原生模块**: 存储管理、相机、扫码、推送通知
- **构建工具**: Metro Bundler

## 目录结构
```
mobile/
├── ios/                   # iOS原生项目文件
├── android/               # Android原生项目文件
├── web/                   # Web构建输出 (React Native Web)
├── src/
│   ├── native/           # 原生桥接模块
│   │   ├── BridgeModule.js     # 桥接接口定义
│   │   ├── StorageModule.js    # 存储管理
│   │   ├── ScannerModule.js    # 扫码功能
│   │   └── CookieModule.js     # Cookie注入
│   ├── components/       # React Native原生组件
│   ├── screens/         # 原生屏幕 (可选)
│   ├── webviews/        # WebView管理模块
│   │   ├── DashboardWebView.js   # 仪表板WebView
│   │   ├── SKUWebView.js         # SKU管理WebView
│   │   ├── OrderWebView.js       # 订单处理WebView
│   │   └── ScannerWebView.js     # 扫码界面WebView
│   ├── services/        # API服务层
│   ├── utils/          # 工具函数
│   ├── App.js          # 主应用入口
│   └── index.js        # 应用注册入口
├── package.json
├── app.json           # React Native配置
├── babel.config.js    # Babel配置
└── DESIGN.md         # 本设计文档
```

## 技术栈
- **React Native**: 跨平台移动应用框架
- **React Native Web**: Web平台支持
- **原生模块**: 设备功能访问 (iOS/Android)
- **WebView**: 系统WebView组件
- **Axios**: HTTP客户端
- **AsyncStorage**: 本地数据存储

## Hybrid架构详解
### 原生层职责
1. **设备功能访问**
   - 相机、扫码器调用
   - 本地文件存储
   - 推送通知管理
   - 网络状态监测

2. **WebView管理**
   - 多个WebView实例创建和管理
   - Cookie注入和同步
   - 页面加载性能优化
   - 内存管理（WebView复用）

3. **桥接通信**
   - JavaScript与原生代码双向通信
   - 事件传递、数据序列化
   - 安全验证和权限控制

### Web层职责
1. **业务逻辑实现**
   - 用户界面渲染 (React组件)
   - 业务状态管理
   - API通信和数据获取
   - 路由导航 (React Router)

2. **UI一致性**
   - 与Web后台管理系统保持一致的设计语言
   - 响应式布局适配移动端
   - 触摸友好的交互设计

### 模块隔离策略
每个核心功能模块运行在独立的WebView中：
- **优势**: 内存隔离、独立加载、错误隔离
- **模块划分**:
  1. 仪表板模块 (Dashboard)
  2. SKU管理模块 (SKU Management)
  3. 订单处理模块 (Order Processing)
  4. 扫码模块 (Barcode Scanner)
  5. 个人中心模块 (Profile)

## 原生功能实现
### 1. 存储管理
```javascript
// 原生存储接口
NativeModules.StorageModule.setItem('user_token', 'abc123')
NativeModules.StorageModule.getItem('user_token')
```

### 2. 扫码功能
```javascript
// 调用原生扫码器
NativeModules.ScannerModule.scanBarcode()
  .then(result => {
    // 处理扫码结果
    webView.postMessage({ type: 'SCAN_RESULT', data: result })
  })
```

### 3. Cookie注入
```javascript
// 原生Cookie管理
NativeModules.CookieModule.injectCookies([
  'session_id=abc123; path=/; secure',
  'user_role=employee; path=/'
])
```

### 4. 网络状态监测
```javascript
// 网络状态变化监听
NativeModules.NetworkModule.addListener('networkChange', status => {
  // 更新WebView网络状态
})
```

## 通信协议
### WebView消息格式
```json
{
  "type": "ACTION_TYPE",
  "data": {},
  "timestamp": 1234567890,
  "callbackId": "unique_callback_id"
}
```

### 原生响应格式
```json
{
  "type": "RESPONSE_TYPE",
  "data": {},
  "success": true,
  "error": null,
  "callbackId": "matching_callback_id"
}
```

## 性能优化策略
1. **WebView预加载**: 高频使用模块预加载
2. **资源缓存**: 静态资源本地缓存
3. **懒加载**: 模块按需加载
4. **内存管理**: WebView复用和销毁策略
5. **离线支持**: 关键数据本地存储

## 安全考虑
1. **WebView安全**: 禁用危险API，限制访问域
2. **通信安全**: 消息验证、来源确认
3. **数据安全**: 敏感数据加密存储
4. **代码安全**: 代码混淆、反调试保护

## 开发工作流
### 环境要求
- Node.js >= 16.0.0
- React Native CLI环境
- iOS: Xcode 14+ (macOS only)
- Android: Android Studio, JDK 11+

### 开发命令
```bash
# 安装依赖
npm install

# 启动开发服务器
npm start

# 运行iOS模拟器
npm run ios

# 运行Android模拟器
npm run android

# 运行Web版本
npm run web
```

### 调试工具
- React Native Debugger
- Chrome Developer Tools (WebView)
- iOS/Android原生调试工具

## 部署发布
### App Store发布
1. **iOS**: 构建发布包，提交App Store审核
2. **Android**: 构建APK/AAB，提交Google Play商店

### OTA更新 (可选)
- 使用CodePush进行热更新
- 更新Web层内容无需重新提交App Store
- 版本控制和回滚机制

## 测试策略
1. **单元测试**: Jest测试业务逻辑
2. **集成测试**: 桥接通信测试
3. **E2E测试**: Detox或Appium
4. **性能测试**: 内存使用、启动时间、响应速度

## 兼容性要求
- **iOS**: iOS 13.0+
- **Android**: Android 8.0+ (API Level 26+)
- **屏幕适配**: 各种屏幕尺寸和分辨率

---
*本设计文档需随项目演进持续更新，确保与实际代码保持一致。*