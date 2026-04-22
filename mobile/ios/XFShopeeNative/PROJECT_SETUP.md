# XF Shopee iOS原生应用项目设置指南

## 项目创建步骤

### 1. 创建Xcode项目
1. 打开Xcode，选择 "Create New Project"
2. 选择 "App" 模板
3. 配置项目信息：
   - **Product Name**: XFShopeeNative
   - **Team**: 选择你的开发团队
   - **Organization Identifier**: com.xfshopee
   - **Interface**: Storyboard (或 SwiftUI 根据偏好)
   - **Language**: Swift
   - **Include Tests**: 勾选 Unit Tests 和 UI Tests
4. 选择项目保存位置

### 2. 复制项目文件
将本目录中的文件复制到Xcode项目中：
- `AppDelegate.swift` → 替换自动生成的AppDelegate
- `SceneDelegate.swift` → 添加到项目
- `ViewControllers/` → 添加到项目
- `Extensions/` → 添加到项目
- `Resources/Info.plist` → 替换项目中的Info.plist

### 3. 复制Native模块
将 `../Native/` 目录中的核心模块添加到项目：
- `WebViewManager.swift`
- `JavaScriptBridge.swift`
- `StorageManager.swift`
- `ScannerManager.swift`
- `CookieManager.swift`

### 4. 配置依赖 (CocoaPods)
1. 在项目根目录创建 `Podfile` (或使用提供的 `Podfile.native`)
2. 运行 `pod install`
3. 关闭 `.xcodeproj`，打开 `.xcworkspace`

### 5. 项目配置

#### 5.1 构建设置
在Xcode中配置以下构建设置：

**General Tab:**
- **Deployment Target**: iOS 15.0
- **Main Interface**: Main (或留空使用代码)
- **Device Orientation**: Portrait only
- **Status Bar Style**: Default

**Signing & Capabilities:**
- **Team**: 选择你的开发团队
- **Bundle Identifier**: com.xfshopee.erp
- **Signing Certificate**: Automatic

**Build Settings:**
- **Always Embed Swift Standard Libraries**: Yes
- **Enable Bitcode**: No
- **Swift Language Version**: Swift 5

#### 5.2 权限配置
在Info.plist中添加以下权限描述（已包含在提供的Info.plist中）：
- **Privacy - Camera Usage Description**
- **Privacy - Photo Library Usage Description**
- **Privacy - Location When In Use Usage Description** (可选)

#### 5.3 应用传输安全
确保Info.plist包含ATS例外配置，允许加载本地开发服务器。

### 6. 添加H5资源
1. 构建H5应用：
   ```bash
   cd ../../../frontend/web-mobile
   npm run build
   ```

2. 将构建输出添加到Xcode项目：
   - 在Xcode中，右键点击项目导航器
   - 选择 "Add Files to 'XFShopeeNative'..."
   - 选择 `dist/` 目录
   - 确保勾选 "Create folder references" 和 "Add to targets"

3. 或者，将资源复制到 `Resources/web-mobile/` 目录

### 7. 配置URL Scheme
在Info.plist中添加URL Scheme以支持深度链接：
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>xfshopee</string>
        </array>
    </dict>
</array>
```

### 8. 测试配置

#### 8.1 运行单元测试
```bash
xcodebuild test -scheme XFShopeeNative -destination 'platform=iOS Simulator,name=iPhone 15'
```

#### 8.2 构建应用
```bash
xcodebuild build -scheme XFShopeeNative -destination generic/platform=iOS
```

#### 8.3 归档应用
```bash
xcodebuild archive -scheme XFShopeeNative -archivePath build/XFShopeeNative.xcarchive
```

## 开发工作流

### 1. 本地开发
1. 启动H5开发服务器：
   ```bash
   cd ../../../frontend/web-mobile
   npm run dev
   ```

2. 配置WebView加载开发服务器：
   - 修改 `WebViewManager.swift` 中的 `baseUrl`
   - 使用 `http://localhost:5173` (iOS模拟器)
   - 或使用实际IP地址

3. 运行iOS应用：
   - 选择模拟器或真机
   - 点击运行按钮 (⌘+R)

### 2. 调试工具
- **WebView调试**: Safari Develop菜单 → 选择模拟器 → 调试WebView
- **网络调试**: 使用Charles Proxy或Proxyman
- **性能分析**: Xcode Instruments (Time Profiler, Memory Graph)

### 3. 代码签名
- **开发证书**: 使用Xcode自动管理
- **分发证书**: 创建App Store分发证书
- **Provisioning Profile**: 使用自动配置文件

## 常见问题

### 1. CocoaPods安装失败
```bash
# 更新CocoaPods
sudo gem install cocoapods
pod repo update

# 清理并重新安装
pod deintegrate
pod install
```

### 2. WebView加载空白
- 检查网络权限配置
- 验证ATS例外配置
- 确认URL是否正确

### 3. JavaScript桥接不工作
- 检查 `WKUserScript` 注入时机
- 验证消息处理器注册
- 查看Safari控制台输出

### 4. 相机权限被拒绝
- 确认Info.plist包含相机使用描述
- 检查权限请求时机
- 在设置中重置位置和隐私

## 生产部署

### 1. 应用商店准备
1. **应用图标**: 准备所有尺寸的应用图标
2. **截图**: 准备5.5英寸、6.5英寸设备的截图
3. **元数据**: 准备应用描述、关键词、分类
4. **年龄分级**: 完成年龄分级问卷

### 2. 构建归档
1. 选择 "Generic iOS Device" 作为目标
2. Product → Archive
3. 验证归档文件
4. 分发到App Store Connect

### 3. 测试飞行
1. 在App Store Connect中添加测试员
2. 通过TestFlight分发测试版本
3. 收集反馈并修复问题

### 4. 提交审核
1. 填写所有元数据
2. 上传构建版本
3. 提交审核
4. 跟踪审核状态

## 持续集成

### GitHub Actions配置
创建 `.github/workflows/ios.yml`:
```yaml
name: iOS CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: macos-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Install CocoaPods
      run: pod install
      
    - name: Build
      run: |
        xcodebuild build -scheme XFShopeeNative \
          -destination 'platform=iOS Simulator,name=iPhone 15' \
          CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO
          
    - name: Test
      run: |
        xcodebuild test -scheme XFShopeeNative \
          -destination 'platform=iOS Simulator,name=iPhone 15' \
          CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO
```

## 版本管理

### 语义化版本控制
- **主版本**: 不兼容的API更改
- **次版本**: 向后兼容的功能添加
- **修订版本**: 向后兼容的错误修复

### 更新日志
维护 `CHANGELOG.md` 文件，记录每个版本的变更。

---

*最后更新: 2026-04-22*
*文档版本: 1.0.0*