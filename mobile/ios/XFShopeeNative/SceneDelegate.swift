import UIKit

@available(iOS 13.0, *)
class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = (scene as? UIWindowScene) else { return }
        
        // 创建主窗口
        window = UIWindow(windowScene: windowScene)
        window?.frame = windowScene.coordinateSpace.bounds
        window?.backgroundColor = .white
        
        // 设置根视图控制器
        let mainViewController = MainViewController()
        let navigationController = UINavigationController(rootViewController: mainViewController)
        navigationController.navigationBar.isHidden = true
        
        window?.rootViewController = navigationController
        window?.makeKeyAndVisible()
        
        // 处理深度链接
        if let url = connectionOptions.urlContexts.first?.url {
            handleDeepLink(url)
        }
    }
    
    func sceneDidDisconnect(_ scene: UIScene) {
        // 场景已断开连接
    }
    
    func sceneDidBecomeActive(_ scene: UIScene) {
        // 场景变为活动状态
    }
    
    func sceneWillResignActive(_ scene: UIScene) {
        // 场景即将进入非活动状态
    }
    
    func sceneWillEnterForeground(_ scene: UIScene) {
        // 场景即将进入前台
    }
    
    func sceneDidEnterBackground(_ scene: UIScene) {
        // 场景进入后台
        saveApplicationState()
    }
    
    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        // 处理URL打开
        guard let url = URLContexts.first?.url else { return }
        handleDeepLink(url)
    }
    
    private func handleDeepLink(_ url: URL) {
        // 处理深度链接
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: true) else { return }
        
        // 解析URL路径，跳转到对应模块
        if components.path.contains("/dashboard") {
            NotificationCenter.default.post(name: .deepLinkToDashboard, object: nil)
        } else if components.path.contains("/products") {
            NotificationCenter.default.post(name: .deepLinkToProducts, object: nil)
        } else if components.path.contains("/orders") {
            NotificationCenter.default.post(name: .deepLinkToOrders, object: nil)
        }
    }
    
    private func saveApplicationState() {
        // 保存应用状态
        UserDefaults.standard.synchronize()
    }
}

// 深度链接通知扩展
extension Notification.Name {
    static let deepLinkToDashboard = Notification.Name("deepLinkToDashboard")
    static let deepLinkToProducts = Notification.Name("deepLinkToProducts")
    static let deepLinkToOrders = Notification.Name("deepLinkToOrders")
    static let deepLinkToScanner = Notification.Name("deepLinkToScanner")
    static let deepLinkToProfile = Notification.Name("deepLinkToProfile")
}