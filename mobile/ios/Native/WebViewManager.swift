import UIKit
import WebKit

/**
 * WebView配置结构体
 */
struct WebViewConfig {
    let id: String
    let name: String
    let url: String
    let preload: Bool
    let maxInstances: Int
    let keepAlive: Bool
    
    var fullUrl: String {
        if url.hasPrefix("http") {
            return url
        } else {
            return "http://a.b.c\(url)"
        }
    }
}

/**
 * WebView管理器
 * 
 * 管理多个WKWebView实例，实现池化和复用
 */
class WebViewManager: NSObject {
    
    // 单例实例
    static let shared = WebViewManager()
    
    // WebView池：模块ID -> [WKWebView]
    private var webViewPool: [String: [WKWebView]] = [:]
    
    // 活跃WebView：模块ID -> 当前活跃的WKWebView
    private var activeWebViews: [String: WKWebView] = [:]
    
    // WebView配置缓存
    private var configCache: [String: WebViewConfig] = [:]
    
    // 闲置WebView计时器
    private var idleTimers: [String: Timer] = [:]
    
    // JavaScript桥接
    private let javascriptBridge = JavaScriptBridge()
    
    // Cookie管理器
    private let cookieManager = CookieManager()
    
    // 最大闲置WebView数量
    private let maxIdleWebViews = 3
    
    // 闲置超时时间（秒）
    private let idleTimeout: TimeInterval = 5 * 60 // 5分钟
    
    private override init() {
        super.init()
        setupNotifications()
    }
    
    /**
     * 获取或创建WebView
     */
    func getOrCreateWebView(config: WebViewConfig) -> WKWebView {
        // 缓存配置
        configCache[config.id] = config
        
        // 检查是否有可复用的闲置WebView
        let webView = getFromIdlePool(moduleId: config.id) ?? createNewWebView(config: config)
        
        // 标记为活跃
        activeWebViews[config.id] = webView
        
        // 注入Cookie
        injectCookies(to: webView, config: config)
        
        return webView
    }
    
    /**
     * 预加载WebView
     */
    func preloadWebView(config: WebViewConfig) {
        if configCache[config.id] != nil {
            return // 已经预加载
        }
        
        // 创建WebView但不添加到活跃池
        let webView = createNewWebView(config: config)
        
        // 添加到闲置池
        addToIdlePool(moduleId: config.id, webView: webView)
        
        // 缓存配置
        configCache[config.id] = config
        
        // 设置闲置超时
        scheduleIdleTimeout(moduleId: config.id, webView: webView)
    }
    
    /**
     * 获取指定模块的WebView（如果存在）
     */
    func getWebView(moduleId: String) -> WKWebView? {
        return activeWebViews[moduleId]
    }
    
    /**
     * 创建新的WebView实例
     */
    private func createNewWebView(config: WebViewConfig) -> WKWebView {
        // 创建WebView配置
        let webViewConfig = WKWebViewConfiguration()
        webViewConfig.allowsInlineMediaPlayback = true
        webViewConfig.preferences.javaScriptEnabled = true
        webViewConfig.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        
        // 创建WebView
        let webView = WKWebView(frame: .zero, configuration: webViewConfig)
        
        // 设置委托
        webView.navigationDelegate = self
        webView.uiDelegate = self
        
        // 注入JavaScript桥接
        javascriptBridge.inject(to: webView)
        
        // 加载URL
        if let url = URL(string: config.fullUrl) {
            let request = URLRequest(url: url)
            webView.load(request)
        }
        
        return webView
    }
    
    /**
     * 从闲置池获取WebView
     */
    private func getFromIdlePool(moduleId: String) -> WKWebView? {
        guard var idleList = webViewPool[moduleId], !idleList.isEmpty else {
            return nil
        }
        
        // 移除并返回第一个闲置WebView
        let webView = idleList.removeFirst()
        webViewPool[moduleId] = idleList
        
        // 取消闲置超时计时器
        idleTimers[moduleId]?.invalidate()
        idleTimers.removeValue(forKey: moduleId)
        
        return webView
    }
    
    /**
     * 添加到闲置池
     */
    private func addToIdlePool(moduleId: String, webView: WKWebView) {
        var idleList = webViewPool[moduleId] ?? []
        
        // 检查闲置池大小
        if idleList.count >= maxIdleWebViews {
            // 移除最旧的闲置WebView
            let oldest = idleList.removeFirst()
            destroyWebView(oldest)
        }
        
        // 添加到闲置池
        idleList.append(webView)
        webViewPool[moduleId] = idleList
    }
    
    /**
     * 将WebView标记为闲置
     */
    func markAsIdle(moduleId: String, webView: WKWebView) {
        // 从活跃池移除
        activeWebViews.removeValue(forKey: moduleId)
        
        // 添加到闲置池
        addToIdlePool(moduleId: moduleId, webView: webView)
        
        // 设置闲置超时
        scheduleIdleTimeout(moduleId: moduleId, webView: webView)
    }
    
    /**
     * 销毁WebView
     */
    private func destroyWebView(_ webView: WKWebView) {
        webView.stopLoading()
        webView.loadHTMLString("", baseURL: nil)
        webView.navigationDelegate = nil
        webView.uiDelegate = nil
    }
    
    /**
     * 销毁所有WebView
     */
    func destroyAll() {
        // 销毁活跃WebView
        for (_, webView) in activeWebViews {
            destroyWebView(webView)
        }
        activeWebViews.removeAll()
        
        // 销毁闲置WebView
        for (_, webViewList) in webViewPool {
            for webView in webViewList {
                destroyWebView(webView)
            }
        }
        webViewPool.removeAll()
        
        // 取消所有计时器
        for (_, timer) in idleTimers {
            timer.invalidate()
        }
        idleTimers.removeAll()
    }
    
    /**
     * 注入Cookie到WebView
     */
    private func injectCookies(to webView: WKWebView, config: WebViewConfig) {
        // 获取存储的认证Token
        if let token = StorageManager.shared.getString(key: "user_token"), !token.isEmpty {
            let cookie = HTTPCookie(properties: [
                .domain: "a.b.c",
                .path: "/",
                .name: "session_token",
                .value: token,
                .secure: true,
                .httpOnly: true
            ])
            
            if let cookie = cookie {
                webView.configuration.websiteDataStore.httpCookieStore.setCookie(cookie)
            }
        }
    }
    
    /**
     * 调度闲置超时
     */
    private func scheduleIdleTimeout(moduleId: String, webView: WKWebView) {
        let timer = Timer.scheduledTimer(withTimeInterval: idleTimeout, repeats: false) { [weak self] _ in
            // 闲置超时，销毁WebView
            var idleList = self?.webViewPool[moduleId] ?? []
            if let index = idleList.firstIndex(where: { $0 === webView }) {
                idleList.remove(at: index)
                self?.webViewPool[moduleId] = idleList
                self?.destroyWebView(webView)
            }
            
            // 从计时器映射中移除
            self?.idleTimers.removeValue(forKey: moduleId)
        }
        
        idleTimers[moduleId] = timer
    }
    
    /**
     * 设置通知监听
     */
    private func setupNotifications() {
        // 监听内存警告
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleMemoryWarning),
            name: UIApplication.didReceiveMemoryWarningNotification,
            object: nil
        )
        
        // 监听应用进入后台
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleAppDidEnterBackground),
            name: UIApplication.didEnterBackgroundNotification,
            object: nil
        )
    }
    
    /**
     * 处理内存警告
     */
    @objc private func handleMemoryWarning() {
        // 内存紧张时清理所有闲置WebView
        for (_, webViewList) in webViewPool {
            for webView in webViewList {
                destroyWebView(webView)
            }
        }
        webViewPool.removeAll()
    }
    
    /**
     * 处理应用进入后台
     */
    @objc private func handleAppDidEnterBackground() {
        // 应用进入后台时清理部分闲置WebView
        var totalIdleCount = 0
        for (_, webViewList) in webViewPool {
            totalIdleCount += webViewList.count
        }
        
        if totalIdleCount > maxIdleWebViews * 2 {
            // 清理一半的闲置WebView
            for (moduleId, var webViewList) in webViewPool {
                let halfCount = webViewList.count / 2
                for _ in 0..<halfCount {
                    if let webView = webViewList.popLast() {
                        destroyWebView(webView)
                    }
                }
                webViewPool[moduleId] = webViewList
            }
        }
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
        destroyAll()
    }
}

// MARK: - WKNavigationDelegate
extension WebViewManager: WKNavigationDelegate {
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        print("WebView loaded: \(webView.url?.absoluteString ?? "unknown")")
    }
    
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("WebView load failed: \(error.localizedDescription)")
    }
    
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        // 处理URL导航
        guard let url = navigationAction.request.url else {
            decisionHandler(.cancel)
            return
        }
        
        let urlString = url.absoluteString
        
        if urlString.contains("/xfbh/mobile/") || urlString.contains("/xfbh/api/") {
            // 允许加载内部链接
            decisionHandler(.allow)
        } else if urlString.hasPrefix("http://") || urlString.hasPrefix("https://") {
            // 外部链接，用Safari打开
            UIApplication.shared.open(url, options: [:], completionHandler: nil)
            decisionHandler(.cancel)
        } else {
            decisionHandler(.allow)
        }
    }
}

// MARK: - WKUIDelegate
extension WebViewManager: WKUIDelegate {
    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        // 显示原生对话框
        let alert = UIAlertController(title: "提示", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "确定", style: .default) { _ in
            completionHandler()
        })
        
        // 需要从当前视图控制器呈现
        if let rootVC = UIApplication.shared.keyWindow?.rootViewController {
            rootVC.present(alert, animated: true, completion: nil)
        } else {
            completionHandler()
        }
    }
}