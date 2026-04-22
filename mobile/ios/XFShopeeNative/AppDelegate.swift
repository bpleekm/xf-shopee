import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // 创建主窗口
        window = UIWindow(frame: UIScreen.main.bounds)
        window?.backgroundColor = .white
        
        // 设置根视图控制器
        let mainViewController = MainViewController()
        let navigationController = UINavigationController(rootViewController: mainViewController)
        navigationController.navigationBar.isHidden = true
        
        window?.rootViewController = navigationController
        window?.makeKeyAndVisible()
        
        // 初始化原生管理器
        initializeNativeManagers()
        
        return true
    }
    
    private func initializeNativeManagers() {
        // 初始化WebView管理器
        _ = WebViewManager.shared
        
        // 初始化其他管理器
        _ = StorageManager.shared
        _ = ScannerManager.shared
        _ = CookieManager.shared
        
        // 配置默认设置
        configureDefaultSettings()
    }
    
    private func configureDefaultSettings() {
        // 配置UserDefaults默认值
        let defaults = UserDefaults.standard
        defaults.register(defaults: [
            "webViewCacheEnabled": true,
            "offlineMode": false,
            "theme": "light"
        ])
    }
    
    func applicationWillResignActive(_ application: UIApplication) {
        // 应用即将进入非活动状态
    }
    
    func applicationDidEnterBackground(_ application: UIApplication) {
        // 应用进入后台
        saveApplicationState()
    }
    
    func applicationWillEnterForeground(_ application: UIApplication) {
        // 应用即将进入前台
    }
    
    func applicationDidBecomeActive(_ application: UIApplication) {
        // 应用变为活动状态
    }
    
    func applicationWillTerminate(_ application: UIApplication) {
        // 应用即将终止
        saveApplicationState()
    }
    
    private func saveApplicationState() {
        // 保存应用状态
        UserDefaults.standard.synchronize()
    }
}