# XF Shopee - 移动端原生应用 (纯原生WebView架构)

本项目是 XF Shopee ERP 系统的移动端原生应用，采用纯原生 WebView 架构。Android 应用使用 Kotlin + WebView，iOS 应用使用 Swift + WKWebView。每个功能模块运行在独立的 WebView 实例中，实现完全隔离。

## 架构概述

- **纯原生容器**: Android (Kotlin/Java) + iOS (Swift/Obj-C) 原生应用
- **多WebView架构**: 每个功能模块使用独立 WebView，实现内存和状态隔离
- **H5业务逻辑**: 业务功能在 `frontend/web-mobile/` 的 React H5 应用中实现
- **原生功能**: 存储、扫码、Cookie 管理、推送通知等原生能力
- **双向通信**: JavaScript Bridge 实现原生与 H5 的双向通信

## 项目结构 (重构后)

```
mobile/
├── android/                      # Android原生项目 (Kotlin)
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/com/xfshopee/
│   │   │   │   ├── MainActivity.kt          # 主Activity
│   │   │   │   ├── WebViewManager.kt        # WebView管理器
│   │   │   │   ├── WebViewStack.kt          # WebView堆栈管理
│   │   │   │   ├── JavaScriptBridge.kt      # JavaScript桥接
│   │   │   │   ├── StorageManager.kt        # 存储管理
│   │   │   │   ├── ScannerManager.kt        # 扫码功能
│   │   │   │   └── CookieManager.kt         # Cookie管理
│   │   │   ├── res/                         # 资源文件
│   │   │   └── AndroidManifest.xml          # 清单文件
│   │   └── build.gradle                     # 构建配置
│   └── gradle.properties
├── ios/                          # iOS原生项目 (Swift + WKWebView)
│   ├── XFShopeeNative/            # 原生iOS应用主目录
│   │   ├── AppDelegate.swift      # 应用委托
│   │   ├── SceneDelegate.swift    # 场景委托
│   │   ├── ViewControllers/       # 视图控制器
│   │   │   ├── MainViewController.swift     # 主视图控制器
│   │   ├── Models/                # 数据模型
│   │   ├── Extensions/            # 扩展类
│   │   │   └── WKWebView+Extension.swift    # WebView扩展
│   │   ├── Resources/             # 资源文件
│   │   │   └── Info.plist         # 应用配置
│   ├── Native/                    # 核心原生模块
│   │   ├── WebViewManager.swift   # WebView管理器
│   │   ├── JavaScriptBridge.swift # JavaScript桥接
│   │   ├── StorageManager.swift   # 存储管理器
│   │   ├── ScannerManager.swift   # 扫码管理器
│   │   └── CookieManager.swift    # Cookie管理器
│   ├── XFShopee/                  # (保留现有React Native代码)
│   ├── Podfile                    # React Native依赖配置
│   └── Podfile.native             # 原生依赖配置
├── src/                          # (保留现有React Native代码)
├── DESIGN.md                     # 详细设计文档 (已更新)
└── README.md                     # 本文件
```

## 核心架构详解

### 1. 多WebView堆栈管理
每个功能模块运行在独立的 WebView 实例中：

| 模块 | 模块ID | URL路径 | 预加载 | 最大实例数 |
|------|--------|---------|--------|-----------|
| 仪表板 | dashboard | `/xfbh/mobile/#/dashboard` | 是 | 1 |
| 产品管理 | products | `/xfbh/mobile/#/products` | 否 | 2 |
| 订单处理 | orders | `/xfbh/mobile/#/orders` | 是 | 3 |
| 扫码功能 | scanner | `/xfbh/mobile/#/scanner` | 是 | 1 |
| 个人中心 | profile | `/xfbh/mobile/#/profile` | 否 | 1 |

### 2. JavaScript桥接API
H5应用通过 `window.NativeBridge` 调用原生功能：

```javascript
// 存储功能
window.NativeBridge.callNative('storage.set', { key: 'token', value: 'abc123' })
window.NativeBridge.callNative('storage.get', { key: 'token' })

// 扫码功能
window.NativeBridge.callNative('scanner.startScan', { format: 'QR_CODE' })

// 设备信息
window.NativeBridge.callNative('device.getInfo', {})

// Cookie管理
window.NativeBridge.callNative('cookie.set', { 
  name: 'session', 
  value: 'token123',
  domain: 'a.b.c'
})
```

### 3. 原生功能模块

#### 存储管理器 (StorageManager)
- 安全本地存储 (SharedPreferences)
- 加密存储 (Android KeyStore + EncryptedSharedPreferences)
- 键值对存储，支持多种数据类型

#### 扫码管理器 (ScannerManager)
- 二维码/条形码扫描 (ML Kit Barcode Scanning)
- 支持实时相机扫描和图片识别
- 权限管理和错误处理

#### Cookie管理器 (CookieManager)
- 统一Cookie管理
- 跨WebView Cookie同步
- 安全Cookie注入

#### WebView管理器 (WebViewManager)
- WebView实例池化和复用
- 预加载和闲置超时机制
- 内存管理和泄漏预防

## 快速开始

### 环境要求
- **Android开发**: Android Studio 2022+, JDK 11+, Android SDK 34+
- **iOS开发**: Xcode 14+, macOS 13+, iOS 15+ SDK, CocoaPods
- **H5开发**: Node.js 18.x (用于构建 `web-mobile` 应用)
- **后端API**: 运行中的 XF Shopee 后端服务

### 构建H5应用
```bash
cd frontend/web-mobile
npm install
npm run build
# 构建输出在 dist/ 目录
```

### 配置Android应用
1. 将H5构建输出复制到 Android 资产目录：
   ```bash
   mkdir -p mobile/android/app/src/main/assets/web-mobile
   cp -r frontend/web-mobile/dist/* mobile/android/app/src/main/assets/web-mobile/
   ```

2. 使用 Android Studio 打开 `mobile/android/` 目录

3. 同步 Gradle 并构建项目

4. 运行到设备或模拟器

### 配置iOS应用
1. 将H5构建输出复制到 iOS 资源目录：
   ```bash
   mkdir -p mobile/ios/XFShopeeNative/Resources/web-mobile
   cp -r frontend/web-mobile/dist/* mobile/ios/XFShopeeNative/Resources/web-mobile/
   ```

2. 安装CocoaPods依赖：
   ```bash
   cd mobile/ios
   cp Podfile.native Podfile  # 使用原生配置
   pod install
   ```

3. 使用 Xcode 打开 `XFShopeeNative.xcworkspace`

4. 选择目标设备，构建并运行应用

### 开发服务器 (热重载)
1. 启动 H5 开发服务器：
   ```bash
   cd frontend/web-mobile
   npm run dev
   ```

2. 配置移动应用使用开发服务器：
   - **Android**: 修改 `WebViewManager.kt` 中的 `BASE_URL` 为 `http://10.0.2.2:5173` (Android模拟器)
   - **iOS**: 修改 `WebViewManager.swift` 中的 `baseUrl` 为 `http://localhost:5173` (iOS模拟器)
   - 或使用实际IP地址

3. 重新构建并运行移动应用

## 模块隔离策略

### 优势
1. **内存隔离**: 一个模块崩溃不会影响其他模块
2. **独立加载**: 每个模块可以独立加载和缓存
3. **状态隔离**: 模块间JavaScript状态完全隔离
4. **性能优化**: 高频模块预加载，低频模块按需加载

### WebView池管理
- **活跃池**: 当前正在显示的 WebView
- **闲置池**: 预加载但未显示的 WebView
- **清理策略**: 闲置超过5分钟的 WebView 自动销毁

## 通信协议

### 消息格式 (Web → Native)
```json
{
  "messageId": "unique_id",
  "action": "storage.set",
  "params": {
    "key": "token",
    "value": "abc123"
  },
  "callbackId": "callback_123",
  "timestamp": 1234567890
}
```

### 响应格式 (Native → Web)
```json
{
  "messageId": "unique_id",
  "success": true,
  "data": {
    "result": "success"
  },
  "error": null,
  "timestamp": 1234567891
}
```

### 事件格式 (Native → Web)
```json
{
  "type": "event",
  "event": "networkChange",
  "data": {
    "status": "connected",
    "type": "wifi"
  },
  "timestamp": 1234567892
}
```

## 安全设计

### WebView安全配置
```kotlin
webView.settings.apply {
    javaScriptEnabled = true
    allowFileAccess = false
    allowContentAccess = false
    allowFileAccessFromFileURLs = false
    allowUniversalAccessFromFileURLs = false
    mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
    safeBrowsingEnabled = true
}
```

### 通信安全
- 所有消息使用JSON格式，避免脚本注入
- 验证消息来源和参数
- 频率限制防止API滥用

### 数据安全
- 敏感数据使用 Android KeyStore 加密
- HTTPS 强制启用 (生产环境)
- 本地存储数据加密

## 性能优化

### 启动优化
1. **关键模块预加载**: 仪表板、订单处理模块冷启动时预加载
2. **资源本地化**: H5应用打包到 APK 中，减少网络依赖
3. **并行加载**: 多个模块可以并行加载

### 内存优化
1. **WebView池化**: 复用 WebView 实例，减少创建开销
2. **闲置清理**: 闲置 WebView 超时自动销毁
3. **内存监控**: 监控 WebView 内存使用，预防泄漏

### 网络优化
1. **本地回退**: 网络失败时使用本地 H5 资源
2. **缓存策略**: 静态资源缓存和版本管理
3. **增量更新**: H5 资源增量更新，减少下载量

## 测试策略

### 单元测试
- 原生逻辑测试 (JUnit)
- 桥接接口测试 (Mock测试)
- 工具类测试

### 集成测试
- WebView加载测试
- JavaScript桥接通信测试
- 原生功能集成测试

### E2E测试
- 完整用户流程测试
- 跨平台一致性测试
- 性能测试 (启动时间、内存使用)

## 部署发布

### 应用商店发布
1. **Google Play**: 提交 AAB/APK 包
2. **App Store**: 提交 IPA 包 (iOS 版本)
3. **版本管理**: 语义化版本控制 (SemVer)

### H5资源更新
1. **随应用更新**: H5资源打包到应用包中
2. **远程更新**: 从服务器动态加载最新H5资源
3. **版本控制**: H5版本与原生版本对应

### 监控分析
- 应用性能监控 (崩溃率、启动时间)
- 用户行为分析
- 业务指标监控 (订单量、活跃用户)

## 实现状态

### ✅ 已完成
- **Android原生应用**: Kotlin + WebView 完整实现
- **iOS原生应用**: Swift + WKWebView 完整实现
- **核心架构**: 多WebView堆栈管理、JavaScript桥接
- **原生功能**: 存储、扫码、Cookie管理、网络监测
- **项目配置**: 
  - Android: Gradle构建、权限配置、安全配置
  - iOS: CocoaPods依赖、Info.plist配置、Xcode项目
- **文档**: 详细设计文档和开发指南

### 🔄 进行中
- **推送通知**: Firebase Cloud Messaging / Apple Push Notification 集成
- **性能监控**: 应用性能数据收集和分析 (Firebase Performance)
- **CI/CD**: GitHub Actions 自动化构建和测试

### 📋 待完成
- **完整测试**: 单元测试 (JUnit/XCTest)、集成测试、E2E测试
- **应用商店**: Google Play 和 App Store 发布配置 (Fastlane)
- **CDN集成**: H5资源CDN加速和版本管理
- **离线功能**: 完整的离线数据同步机制
- **Analytics**: 用户行为分析和业务指标监控

## 相关文档

- [PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md): 完整项目结构和技术栈
- [DESIGN.md](./DESIGN.md): 移动端详细设计文档
- [web-mobile DESIGN.md](../frontend/web-mobile/DESIGN.md): H5应用设计文档
- [部署指南](../backend/DEPLOYMENT.md): 系统部署指南

---
*最后更新: 2026-04-22*  
*版本: 5.0.0 (Android和iOS原生应用完整实现)*