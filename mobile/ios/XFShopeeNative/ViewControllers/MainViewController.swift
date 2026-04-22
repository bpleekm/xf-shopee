import UIKit
import WebKit

/**
 * 主视图控制器
 * 
 * 包含底部导航栏，管理多个WebView模块的切换
 */
class MainViewController: UIViewController {
    
    // MARK: - UI Components
    
    private let containerView = UIView()
    private let bottomTabBar = UITabBar()
    
    // 当前显示的WebView
    private var currentWebView: WKWebView?
    
    // 当前模块ID
    private var currentModuleId: String = "dashboard"
    
    // 模块配置
    private let moduleConfigs: [String: WebViewConfig] = [
        "dashboard": WebViewConfig(
            id: "dashboard",
            name: "仪表板",
            url: "/xfbh/mobile/#/dashboard",
            preload: true,
            maxInstances: 1,
            keepAlive: true
        ),
        "products": WebViewConfig(
            id: "products",
            name: "产品管理",
            url: "/xfbh/mobile/#/products",
            preload: false,
            maxInstances: 2,
            keepAlive: false
        ),
        "orders": WebViewConfig(
            id: "orders",
            name: "订单处理",
            url: "/xfbh/mobile/#/orders",
            preload: true,
            maxInstances: 3,
            keepAlive: true
        ),
        "scanner": WebViewConfig(
            id: "scanner",
            name: "扫码功能",
            url: "/xfbh/mobile/#/scanner",
            preload: true,
            maxInstances: 1,
            keepAlive: false
        ),
        "profile": WebViewConfig(
            id: "profile",
            name: "个人中心",
            url: "/xfbh/mobile/#/profile",
            preload: false,
            maxInstances: 1,
            keepAlive: true
        )
    ]
    
    // MARK: - Lifecycle
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        setupTabBar()
        setupNotifications()
        
        // 预加载高频模块
        preloadHighFrequencyModules()
        
        // 显示默认模块
        showModule(moduleId: "dashboard")
    }
    
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        
        // 更新容器和标签栏的frame
        let tabBarHeight: CGFloat = 60
        let safeAreaBottom = view.safeAreaInsets.bottom
        
        containerView.frame = CGRect(
            x: 0,
            y: 0,
            width: view.bounds.width,
            height: view.bounds.height - tabBarHeight - safeAreaBottom
        )
        
        bottomTabBar.frame = CGRect(
            x: 0,
            y: view.bounds.height - tabBarHeight - safeAreaBottom,
            width: view.bounds.width,
            height: tabBarHeight + safeAreaBottom
        )
        
        // 更新当前WebView的frame
        currentWebView?.frame = containerView.bounds
    }
    
    // MARK: - UI Setup
    
    private func setupUI() {
        view.backgroundColor = .white
        
        // 容器视图
        containerView.backgroundColor = .clear
        view.addSubview(containerView)
        
        // 底部标签栏
        bottomTabBar.delegate = self
        bottomTabBar.backgroundColor = .white
        bottomTabBar.tintColor = UIColor(red: 0.2, green: 0.6, blue: 1.0, alpha: 1.0)
        view.addSubview(bottomTabBar)
        
        // 添加阴影
        bottomTabBar.layer.shadowColor = UIColor.black.cgColor
        bottomTabBar.layer.shadowOpacity = 0.1
        bottomTabBar.layer.shadowOffset = CGSize(width: 0, height: -2)
        bottomTabBar.layer.shadowRadius = 4
    }
    
    private func setupTabBar() {
        // 创建标签项
        var tabBarItems: [UITabBarItem] = []
        
        let modules: [(id: String, title: String, icon: String)] = [
            ("dashboard", "仪表板", "house.fill"),
            ("products", "产品", "cube.fill"),
            ("scanner", "扫码", "qrcode.viewfinder"),
            ("orders", "订单", "doc.text.fill"),
            ("profile", "我的", "person.fill")
        ]
        
        for module in modules {
            let icon = UIImage(systemName: module.icon)
            let item = UITabBarItem(title: module.title, image: icon, tag: getTagForModule(module.id))
            tabBarItems.append(item)
        }
        
        bottomTabBar.setItems(tabBarItems, animated: false)
        
        // 默认选中第一个
        bottomTabBar.selectedItem = tabBarItems.first
    }
    
    private func getTagForModule(_ moduleId: String) -> Int {
        switch moduleId {
        case "dashboard": return 0
        case "products": return 1
        case "scanner": return 2
        case "orders": return 3
        case "profile": return 4
        default: return 0
        }
    }
    
    private func getModuleIdForTag(_ tag: Int) -> String {
        switch tag {
        case 0: return "dashboard"
        case 1: return "products"
        case 2: return "scanner"
        case 3: return "orders"
        case 4: return "profile"
        default: return "dashboard"
        }
    }
    
    // MARK: - Module Management
    
    private func showModule(moduleId: String) {
        guard let config = moduleConfigs[moduleId] else {
            print("未找到模块配置: \(moduleId)")
            return
        }
        
        // 更新当前模块ID
        currentModuleId = moduleId
        
        // 移除当前WebView
        currentWebView?.removeFromSuperview()
        
        // 从WebViewManager获取或创建WebView
        let webView = WebViewManager.shared.getOrCreateWebView(config: config)
        
        // 设置frame并添加到容器
        webView.frame = containerView.bounds
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        containerView.addSubview(webView)
        
        currentWebView = webView
        
        // 更新标签栏选中状态
        updateTabBarSelection(moduleId: moduleId)
    }
    
    private func updateTabBarSelection(moduleId: String) {
        let tag = getTagForModule(moduleId)
        if let items = bottomTabBar.items, tag < items.count {
            bottomTabBar.selectedItem = items[tag]
        }
    }
    
    private func preloadHighFrequencyModules() {
        // 预加载高频模块
        let highFrequencyModules = ["dashboard", "orders"]
        
        for moduleId in highFrequencyModules {
            if let config = moduleConfigs[moduleId], config.preload {
                WebViewManager.shared.preloadWebView(config: config)
            }
        }
    }
    
    // MARK: - Navigation
    
    func navigateToModule(moduleId: String) {
        if moduleId != currentModuleId {
            showModule(moduleId: moduleId)
        }
    }
    
    func navigateBack() {
        // WebView内部导航回退
        currentWebView?.goBack()
    }
    
    func navigateForward() {
        // WebView内部导航前进
        currentWebView?.goForward()
    }
    
    func reloadCurrentPage() {
        currentWebView?.reload()
    }
    
    // MARK: - Notifications
    
    private func setupNotifications() {
        // 监听深度链接
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleDeepLinkNotification(_:)),
            name: .deepLinkToDashboard,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleDeepLinkNotification(_:)),
            name: .deepLinkToProducts,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleDeepLinkNotification(_:)),
            name: .deepLinkToOrders,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleDeepLinkNotification(_:)),
            name: .deepLinkToScanner,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleDeepLinkNotification(_:)),
            name: .deepLinkToProfile,
            object: nil
        )
        
        // 监听网络状态变化
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleNetworkStatusChange(_:)),
            name: .networkStatusChanged,
            object: nil
        )
    }
    
    @objc private func handleDeepLinkNotification(_ notification: Notification) {
        var moduleId = ""
        
        switch notification.name {
        case .deepLinkToDashboard:
            moduleId = "dashboard"
        case .deepLinkToProducts:
            moduleId = "products"
        case .deepLinkToOrders:
            moduleId = "orders"
        case .deepLinkToScanner:
            moduleId = "scanner"
        case .deepLinkToProfile:
            moduleId = "profile"
        default:
            return
        }
        
        DispatchQueue.main.async {
            self.navigateToModule(moduleId: moduleId)
        }
    }
    
    @objc private func handleNetworkStatusChange(_ notification: Notification) {
        DispatchQueue.main.async {
            if let isOnline = notification.userInfo?["isOnline"] as? Bool, !isOnline {
                self.showOfflineAlert()
            }
        }
    }
    
    private func showOfflineAlert() {
        let alert = UIAlertController(
            title: "网络连接断开",
            message: "当前网络不可用，部分功能可能受限",
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "确定", style: .default, handler: nil))
        present(alert, animated: true, completion: nil)
    }
    
    // MARK: - Memory Management
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        
        // 内存紧张时清理当前非活跃模块的WebView
        for (moduleId, _) in moduleConfigs {
            if moduleId != currentModuleId {
                // 标记非活跃模块的WebView为闲置
                if let webView = WebViewManager.shared.getWebView(moduleId: moduleId) {
                    WebViewManager.shared.markAsIdle(moduleId: moduleId, webView: webView)
                }
            }
        }
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}

// MARK: - UITabBarDelegate
extension MainViewController: UITabBarDelegate {
    func tabBar(_ tabBar: UITabBar, didSelect item: UITabBarItem) {
        let moduleId = getModuleIdForTag(item.tag)
        navigateToModule(moduleId: moduleId)
    }
}

// MARK: - Network Status Notification
extension Notification.Name {
    static let networkStatusChanged = Notification.Name("networkStatusChanged")
}