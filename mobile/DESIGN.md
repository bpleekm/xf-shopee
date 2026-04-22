# 移动端App设计文档（原生WebView架构）

## 概述
XF Shopee ERP系统的移动端应用程序，采用纯原生WebView架构，为员工提供移动办公功能。原生Android/iOS应用作为容器，管理多个WebView实例，每个WebView加载对应的H5功能模块，实现模块隔离和性能优化。

## 架构设计
- **架构模式**: 原生容器 + 多WebView堆栈
- **平台技术**: 
  - Android: Kotlin/Java + WebView组件
  - iOS: Swift/Objective-C + WKWebView组件
- **Web技术**: React 18.x H5应用 (位于 `frontend/web-mobile/`)
- **原生模块**: WebView管理、存储、扫码、推送通知
- **部署路径**: WebView加载 `http://a.b.c/xfbh/mobile/` 或本地H5资源

## 目录结构
```
mobile/
├── android/                      # Android原生项目
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/com/xfshopee/
│   │   │   │   ├── MainActivity.kt          # 主Activity
│   │   │   │   ├── WebViewManager.kt        # WebView管理器
│   │   │   │   ├── WebViewStack.kt          # WebView堆栈管理
│   │   │   │   ├── WebViewFragment.kt       # WebView Fragment
│   │   │   │   ├── CookieManager.kt         # Cookie管理
│   │   │   │   ├── ScannerManager.kt        # 扫码功能
│   │   │   │   ├── StorageManager.kt        # 本地存储
│   │   │   │   └── BridgeInterface.kt       # JavaScript桥接
│   │   │   ├── res/                         # 资源文件
│   │   │   └── AndroidManifest.xml          # 清单文件
│   │   └── build.gradle                     # 构建配置
│   └── gradle.properties
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
│   │   ├── Models/
│   │   │   └── WebViewConfig.swift          # WebView配置模型
│   │   ├── Extensions/
│   │   │   └── WKWebView+Extension.swift    # WebView扩展
│   │   ├── Resources/                       # 资源文件
│   │   └── Info.plist                       # 配置文件
│   └── Podfile                             # 依赖管理
├── src/                          # 共享配置和桥接代码
│   ├── webview-config/           # WebView统一配置
│   │   ├── module-urls.json      # 模块URL配置
│   │   ├── bridge-protocol.md    # 桥接协议文档
│   │   └── native-apis.md        # 原生API文档
│   ├── assets/                   # 共享资源
│   │   └── icons/                # 应用图标
│   └── scripts/                  # 构建脚本
├── docs/                         # 开发文档
│   ├── android-guide.md          # Android开发指南
│   ├── ios-guide.md              # iOS开发指南
│   └── deployment.md             # 部署指南
├── DESIGN.md                     # 本设计文档
└── README.md                     # 项目说明
```

## 技术栈
### Android技术栈
- **开发语言**: Kotlin (首选) 或 Java
- **WebView组件**: Android WebView (API 21+)
- **架构组件**: ViewModel, LiveData, Navigation
- **依赖注入**: Dagger/Hilt (可选)
- **网络通信**: OkHttp, Retrofit (可选)
- **本地存储**: Room/SQLite, SharedPreferences

### iOS技术栈
- **开发语言**: Swift (首选) 或 Objective-C
- **WebView组件**: WKWebView (iOS 8.0+)
- **架构模式**: MVC/MVVM
- **依赖管理**: CocoaPods 或 Swift Package Manager
- **网络通信**: URLSession
- **本地存储**: Core Data, UserDefaults

### 共享Web技术
- **H5应用**: `frontend/web-mobile/` 构建的输出
- **框架**: React 18 + Ant Design Mobile
- **路由**: React Router DOM 6
- **通信**: JavaScript Bridge

## 核心架构详解

### 1. 多WebView堆栈管理
每个功能模块运行在独立的WebView实例中，实现完全隔离：

#### WebView堆栈结构
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
└── 导航控制器 (Navigation Controller)
```

#### 管理策略
1. **预加载策略**: 高频模块预加载到闲置池
2. **内存管理**: 闲置WebView超过阈值时自动销毁
3. **状态保持**: WebView状态保存和恢复
4. **生命周期**: 与应用生命周期同步

### 2. 模块URL映射配置
```json
{
  "modules": [
    {
      "id": "dashboard",
      "name": "仪表板",
      "url": "/xfbh/mobile/#/dashboard",
      "preload": true,
      "maxInstances": 1,
      "keepAlive": true
    },
    {
      "id": "products",
      "name": "产品管理",
      "url": "/xfbh/mobile/#/products",
      "preload": false,
      "maxInstances": 2,
      "keepAlive": false
    },
    {
      "id": "orders",
      "name": "订单处理",
      "url": "/xfbh/mobile/#/orders",
      "preload": true,
      "maxInstances": 3,
      "keepAlive": true
    },
    {
      "id": "scanner",
      "name": "扫码功能",
      "url": "/xfbh/mobile/#/scanner",
      "preload": true,
      "maxInstances": 1,
      "keepAlive": false
    },
    {
      "id": "profile",
      "name": "个人中心",
      "url": "/xfbh/mobile/#/profile",
      "preload": false,
      "maxInstances": 1,
      "keepAlive": true
    }
  ],
  "baseUrl": "http://a.b.c",
  "localFallback": "file:///android_asset/web-mobile/index.html",
  "cacheStrategy": "network_first"
}
```

### 3. 原生功能模块

#### 3.1 WebView管理器 (WebViewManager)
**职责**:
- WebView实例创建和配置
- JavaScript Bridge注入
- 页面加载状态监控
- 错误处理和重试机制

**Android示例 (Kotlin)**:
```kotlin
class WebViewManager(context: Context) {
    private val webViewPool = mutableMapOf<String, WebView>()
    
    fun createWebView(moduleId: String, config: WebViewConfig): WebView {
        return WebView(context).apply {
            // 基础配置
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.cacheMode = WebSettings.LOAD_DEFAULT
            
            // 注入JavaScript Bridge
            addJavascriptInterface(JavaScriptBridge(this), "NativeBridge")
            
            // 加载URL
            loadUrl(config.fullUrl)
            
            // 添加到池中
            webViewPool[moduleId] = this
        }
    }
    
    fun getWebView(moduleId: String): WebView? {
        return webViewPool[moduleId]
    }
    
    fun destroyWebView(moduleId: String) {
        webViewPool[moduleId]?.destroy()
        webViewPool.remove(moduleId)
    }
}
```

**iOS示例 (Swift)**:
```swift
class WebViewManager {
    private var webViewPool: [String: WKWebView] = [:]
    
    func createWebView(moduleId: String, config: WebViewConfig) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.preferences.javaScriptEnabled = true
        
        let webView = WKWebView(frame: .zero, configuration: config)
        
        // 注入JavaScript Bridge
        let bridgeScript = WKUserScript(
            source: JavaScriptBridge.injectionScript,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        )
        webView.configuration.userContentController.addUserScript(bridgeScript)
        
        // 加载URL
        if let url = URL(string: config.fullUrl) {
            let request = URLRequest(url: url)
            webView.load(request)
        }
        
        // 添加到池中
        webViewPool[moduleId] = webView
        return webView
    }
}
```

#### 3.2 JavaScript桥接接口
统一的原生API暴露给Web层：

```javascript
// JavaScript侧调用示例
window.NativeBridge.callNative('scanner.startScan', { format: 'QR_CODE' })
  .then(result => {
    console.log('扫码结果:', result)
  })
  .catch(error => {
    console.error('扫码失败:', error)
  })

// 原生事件监听
window.NativeBridge.addEventListener('networkChange', event => {
  console.log('网络状态变化:', event.status)
})
```

#### 3.3 Cookie管理器 (CookieManager)
**功能**:
- 统一Cookie管理
- 跨WebView Cookie同步
- 安全Cookie存储
- 自动Cookie注入

```kotlin
class CookieManager(private val context: Context) {
    fun injectCookiesToWebView(webView: WebView, cookies: List<Cookie>) {
        val cookieManager = CookieManager.getInstance()
        cookies.forEach { cookie ->
            val cookieString = "${cookie.name}=${cookie.value}; domain=${cookie.domain}; path=${cookie.path}"
            cookieManager.setCookie(cookie.domain, cookieString)
        }
        cookieManager.flush()
    }
    
    fun syncCookiesAcrossWebViews(webViews: List<WebView>) {
        // 同步所有WebView的Cookie
    }
}
```

#### 3.4 扫码管理器 (ScannerManager)
**功能**:
- 二维码/条形码扫描
- 图片识别
- 扫描结果回调
- 权限管理

```swift
class ScannerManager: NSObject {
    func startScan(presenter: UIViewController, completion: @escaping (String?) -> Void) {
        // 检查相机权限
        // 打开扫码界面
        // 返回扫码结果
    }
    
    func scanFromImage(image: UIImage) -> String? {
        // 从图片识别二维码
        return nil
    }
}
```

#### 3.5 存储管理器 (StorageManager)
**功能**:
- 键值对存储
- 文件存储
- 加密存储
- 数据同步

```kotlin
class StorageManager(private val context: Context) {
    private val sharedPrefs = context.getSharedPreferences("xfshopee", Context.MODE_PRIVATE)
    
    fun setString(key: String, value: String) {
        sharedPrefs.edit().putString(key, value).apply()
    }
    
    fun getString(key: String, defaultValue: String = ""): String {
        return sharedPrefs.getString(key, defaultValue) ?: defaultValue
    }
    
    fun encryptAndStore(key: String, value: String) {
        // 加密后存储
    }
}
```

## 通信协议

### WebView消息格式
```json
{
  "messageId": "unique_message_id",
  "action": "native.action.name",
  "params": {
    "key1": "value1",
    "key2": "value2"
  },
  "timestamp": 1234567890,
  "callbackId": "callback_identifier"
}
```

### 原生响应格式
```json
{
  "messageId": "unique_message_id",
  "success": true,
  "data": {
    "result": "operation_result"
  },
  "error": null,
  "timestamp": 1234567891
}
```

### 错误处理
```json
{
  "messageId": "unique_message_id",
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  },
  "timestamp": 1234567891
}
```

## 性能优化策略

### 1. WebView预加载和复用
- **高频模块预加载**: 仪表板、订单处理等模块预加载
- **WebView复用池**: 复用闲置WebView实例
- **内存预警**: 内存紧张时自动清理闲置WebView

### 2. 资源缓存策略
- **H5资源本地化**: 将H5应用打包到APK/IPA中
- **CDN加速**: 生产环境使用CDN分发H5资源
- **缓存更新**: 增量更新和版本管理

### 3. 启动优化
- **冷启动优化**: 减少主线程阻塞
- **首屏加速**: 关键模块预加载
- **资源懒加载**: 非关键模块按需加载

### 4. 内存管理
- **WebView内存监控**: 监控WebView内存使用
- **泄漏检测**: 定期检查内存泄漏
- **自动清理**: 后台时清理闲置资源

## 安全设计

### 1. WebView安全配置
**Android**:
```kotlin
webView.settings.apply {
    // 禁用危险功能
    javaScriptEnabled = true
    allowFileAccess = false
    allowContentAccess = false
    allowFileAccessFromFileURLs = false
    allowUniversalAccessFromFileURLs = false
    
    // 启用安全设置
    mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
    safeBrowsingEnabled = true
}
```

**iOS**:
```swift
// 配置安全策略
webView.configuration.apply {
    mediaTypesRequiringUserActionForPlayback = .all
    ignoresViewportScaleLimits = false
    allowsInlineMediaPlayback = false
    allowsPictureInPictureMediaPlayback = false
    
    // 内容安全策略
    defaultWebpagePreferences?.allowsContentJavaScript = true
}
```

### 2. 通信安全
- **消息签名**: 所有消息增加签名验证
- **来源验证**: 验证消息来源WebView
- **参数过滤**: 过滤危险参数和脚本
- **频率限制**: 防止API滥用

### 3. 数据安全
- **本地加密**: 敏感数据加密存储
- **传输加密**: HTTPS强制启用
- **权限控制**: 严格的原生API权限控制
- **日志脱敏**: 日志中的敏感信息脱敏

## 开发工作流

### 环境要求
- **Android**: Android Studio 2022+, JDK 11+, Android SDK 31+
- **iOS**: Xcode 14+, macOS 13+, iOS 15+ SDK
- **Node.js**: 18.x (用于H5构建)

### 项目设置

#### Android项目配置
```gradle
// app/build.gradle
android {
    compileSdk 33
    defaultConfig {
        applicationId "com.xfshopee"
        minSdk 21
        targetSdk 33
        versionCode 1
        versionName "1.0.0"
    }
    
    buildFeatures {
        viewBinding true
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.10.1'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.9.0'
    implementation 'androidx.webkit:webkit:1.7.0'
    implementation 'androidx.lifecycle:lifecycle-viewmodel-ktx:2.6.1'
}
```

#### iOS项目配置
```ruby
# Podfile
platform :ios, '15.0'
use_frameworks!

target 'XFShopee' do
  pod 'Alamofire', '~> 5.7'
  pod 'SnapKit', '~> 5.6'
end
```

### 开发命令
```bash
# Android开发
./gradlew assembleDebug      # 构建Debug版本
./gradlew installDebug       # 安装到设备

# iOS开发
pod install                  # 安装依赖
xcodebuild build             # 构建项目

# H5开发 (独立项目)
cd ../frontend/web-mobile
npm run dev                  # 启动H5开发服务器
npm run build                # 构建H5生产版本
```

### 调试工具
- **Android**: Chrome DevTools, Android Studio Profiler
- **iOS**: Safari Web Inspector, Xcode Instruments
- **网络调试**: Charles Proxy, Wireshark
- **性能分析**: Android Profiler, Instruments

## 测试策略

### 1. 单元测试
- **原生逻辑测试**: JUnit (Android), XCTest (iOS)
- **桥接接口测试**: Mock测试JavaScript调用
- **工具类测试**: 独立工具函数测试

### 2. 集成测试
- **WebView加载测试**: 页面加载和渲染测试
- **原生功能测试**: 扫码、存储等功能测试
- **桥接通信测试**: JavaScript与原生通信测试

### 3. E2E测试
- **用户流程测试**: 完整业务操作流程
- **跨平台测试**: Android和iOS一致性测试
- **性能测试**: 启动时间、内存使用、响应速度

### 4. 兼容性测试
- **Android版本**: 21-33 (重点测试26+)
- **iOS版本**: 15.0-17.0
- **设备类型**: 手机、平板、折叠屏
- **屏幕尺寸**: 各种分辨率适配

## 部署发布

### 1. 应用商店发布
- **Google Play**: 提交APK/AAB包，通过审核后发布
- **App Store**: 提交IPA包，通过审核后发布
- **版本管理**: 语义化版本控制 (SemVer)

### 2. H5资源更新
- **本地包更新**: 随应用版本更新H5资源
- **远程更新**: 从服务器动态加载H5资源
- **版本控制**: H5版本与原生版本对应

### 3. 监控和分析
- **应用监控**: 崩溃报告、性能指标
- **用户分析**: 用户行为、功能使用统计
- **业务监控**: 订单量、活跃用户等业务指标

## 兼容性要求
- **Android**: Android 8.0+ (API Level 26+)
- **iOS**: iOS 15.0+
- **WebView引擎**: 
  - Android: Chrome WebView 100+
  - iOS: WebKit (Safari引擎)
- **屏幕适配**: 支持各种屏幕尺寸和密度

## 与现有系统集成

### 1. 与H5应用集成
- **URL规范**: 使用 `/xfbh/mobile/` 路径前缀
- **API调用**: 通过 `/xfbh/api` 调用后端API
- **认证共享**: Cookie/JWT令牌共享

### 2. 与后端集成
- **统一认证**: 使用相同的JWT认证机制
- **API一致性**: 使用相同的API接口定义
- **数据格式**: 统一的数据格式和错误处理

### 3. 与其他前端集成
- **设计一致性**: 与Web后台、Web前台保持设计一致
- **业务逻辑共享**: 核心业务逻辑在H5中实现
- **代码复用**: 组件和工具函数复用

## 实现状态

### Android原生应用已实现
已完成以下核心组件的Kotlin实现：

1. **主架构组件**:
   - `MainActivity.kt`: 主容器Activity，管理底部导航和模块切换
   - `WebViewManager.kt`: WebView实例管理，支持池化和预加载
   - `WebViewStack.kt`: WebView导航堆栈管理，支持前进/后退
   - `WebViewConfig.kt`: WebView配置数据类

2. **JavaScript桥接**:
   - `JavaScriptBridge.kt`: 核心桥接接口，提供原生API给H5调用
   - 支持存储、扫码、Cookie、设备信息等API
   - 双向事件通信机制

3. **原生功能模块**:
   - `StorageManager.kt`: 安全存储管理，支持加密存储
   - `ScannerManager.kt`: 二维码/条形码扫描，支持相机和图库
   - `CookieManager.kt`: Cookie统一管理，跨WebView同步
   - 网络状态监测、文件操作等基础功能

4. **项目配置**:
   - 更新`build.gradle`: 纯原生Android配置，移除React Native依赖
   - 更新`AndroidManifest.xml`: 添加必要权限和安全配置
   - 创建`network_security_config.xml`: 网络安全配置
   - 创建`activity_main.xml`: 主界面布局
   - 创建`bottom_nav_menu.xml`: 底部导航菜单

### iOS原生应用已实现
已完成以下核心组件的Swift实现：

1. **主架构组件**:
   - `AppDelegate.swift`: 应用委托，初始化原生管理器
   - `SceneDelegate.swift`: 场景委托（iOS 13+），处理深度链接
   - `MainViewController.swift`: 主视图控制器，管理底部导航和WebView切换
   - `WebViewManager.swift`: WebView实例管理，支持池化和预加载
   - `WebViewConfig.swift`: WebView配置结构体

2. **JavaScript桥接**:
   - `JavaScriptBridge.swift`: 核心桥接接口，提供原生API给H5调用
   - 完整的消息协议和回调机制
   - 支持存储、扫码、Cookie、导航等原生API

3. **原生功能模块**:
   - `StorageManager.swift`: 安全存储管理，支持Keychain加密存储
   - `ScannerManager.swift`: 二维码/条形码扫描，集成AVFoundation
   - `CookieManager.swift`: Cookie统一管理，支持WKHTTPCookieStore
   - `WKWebView+Extension.swift`: WebView扩展，提供便捷方法和JavaScript注入

4. **项目配置**:
   - `Info.plist`: 应用配置文件，包含权限描述和ATS设置
   - `Podfile.native`: 原生依赖配置（CocoaPods）
   - 完整的Xcode项目结构：`XFShopeeNative/`目录

### 技术特性
- **多WebView隔离**: 每个功能模块运行在独立WebView中
- **内存优化**: WebView池化和闲置超时机制
- **安全存储**: 使用iOS Keychain加密敏感数据
- **扫码功能**: 集成AVFoundation二维码扫描
- **Cookie同步**: 跨WebView Cookie自动同步
- **离线支持**: 本地H5资源回退机制
- **深度链接**: 支持URL Scheme和Universal Links

### Android使用方式
1. 构建H5应用: `cd frontend/web-mobile && npm run build`
2. 将构建输出复制到`android/app/src/main/assets/web-mobile/`
3. 使用Android Studio打开`mobile/android/`项目
4. 构建并运行应用到设备或模拟器

### iOS使用方式
1. 构建H5应用: `cd frontend/web-mobile && npm run build`
2. 将构建输出复制到`ios/XFShopeeNative/Resources/web-mobile/`
3. 安装CocoaPods依赖: `cd mobile/ios && pod install`
4. 使用Xcode打开`XFShopeeNative.xcworkspace`
5. 选择目标设备，构建并运行应用

### 待完成事项
- 推送通知集成（Firebase/APNs）
- 性能监控和优化（Instruments，Firebase Performance）
- 完整的单元测试和集成测试（XCTest）
- 应用商店发布配置（App Store Connect）
- CI/CD流水线配置（GitHub Actions，Fastlane）

---

*本设计文档描述了纯原生WebView架构的移动端实现方案。*
*最后更新: 2026-04-22*
*版本: 4.0.0 (Android和iOS实现完成)*
