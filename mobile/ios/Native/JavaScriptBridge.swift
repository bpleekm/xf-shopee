import UIKit
import WebKit

/**
 * JavaScript桥接
 * 
 * 提供原生功能给WebView中的JavaScript调用
 */
class JavaScriptBridge: NSObject {
    
    // 单例实例
    static let shared = JavaScriptBridge()
    
    // 事件监听器：eventName -> 监听器列表
    private var eventListeners: [String: [(Any) -> Void]] = [:]
    
    // 存储管理器
    private let storageManager = StorageManager.shared
    
    // 扫码管理器
    private let scannerManager = ScannerManager.shared
    
    // Cookie管理器
    private let cookieManager = CookieManager.shared
    
    private override init() {
        super.init()
    }
    
    /**
     * 注入JavaScript桥接到WebView
     */
    func inject(to webView: WKWebView) {
        // 创建用户脚本
        let bridgeScript = WKUserScript(
            source: injectionScript,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        )
        
        webView.configuration.userContentController.addUserScript(bridgeScript)
        
        // 添加消息处理器
        webView.configuration.userContentController.add(self, name: "nativeBridge")
    }
    
    /**
     * JavaScript注入脚本
     */
    private var injectionScript: String {
        return """
        (function() {
            // 创建NativeBridge对象
            window.NativeBridge = {
                // 调用原生方法
                callNative: function(message) {
                    return new Promise((resolve, reject) => {
                        const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                        
                        // 发送消息到原生
                        window.webkit.messageHandlers.nativeBridge.postMessage({
                            ...message,
                            messageId: messageId
                        });
                        
                        // 设置回调
                        window['__native_callback_' + messageId] = { resolve, reject };
                        
                        // 超时处理
                        setTimeout(() => {
                            if (window['__native_callback_' + messageId]) {
                                delete window['__native_callback_' + messageId];
                                reject(new Error('Timeout'));
                            }
                        }, 30000);
                    });
                },
                
                // 添加事件监听器
                addEventListener: function(eventName, callback) {
                    if (!window.__native_event_listeners) {
                        window.__native_event_listeners = {};
                    }
                    if (!window.__native_event_listeners[eventName]) {
                        window.__native_event_listeners[eventName] = [];
                    }
                    window.__native_event_listeners[eventName].push(callback);
                },
                
                // 移除事件监听器
                removeEventListener: function(eventName, callback) {
                    if (!window.__native_event_listeners || !window.__native_event_listeners[eventName]) {
                        return;
                    }
                    const index = window.__native_event_listeners[eventName].indexOf(callback);
                    if (index !== -1) {
                        window.__native_event_listeners[eventName].splice(index, 1);
                    }
                }
            };
            
            // 触发事件给JavaScript
            window.dispatchNativeEvent = function(eventName, data) {
                if (!window.__native_event_listeners || !window.__native_event_listeners[eventName]) {
                    return;
                }
                window.__native_event_listeners[eventName].forEach(callback => {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error('Error in event listener:', error);
                    }
                });
            };
            
            console.log('Native Bridge injected');
        })();
        """
    }
    
    /**
     * 发送事件到JavaScript
     */
    func sendEvent(to webView: WKWebView, eventName: String, data: Any) {
        let script = """
        if (window.dispatchNativeEvent) {
            window.dispatchNativeEvent('\(eventName)', \(jsonString(from: data)));
        }
        """
        
        webView.evaluateJavaScript(script) { result, error in
            if let error = error {
                print("Failed to send event to JavaScript: \(error)")
            }
        }
    }
    
    /**
     * 处理来自JavaScript的消息
     */
    private func handleMessage(_ message: [String: Any], completion: @escaping (Any) -> Void) {
        guard let action = message["action"] as? String else {
            completion(createErrorResponse(messageId: message["messageId"] as? String, error: "Missing action"))
            return
        }
        
        let params = message["params"] as? [String: Any] ?? [:]
        let messageId = message["messageId"] as? String ?? ""
        
        // 处理动作
        let result: Any
        switch action {
        case "storage.set":
            result = handleStorageSet(params)
        case "storage.get":
            result = handleStorageGet(params)
        case "storage.remove":
            result = handleStorageRemove(params)
        case "storage.clear":
            result = handleStorageClear(params)
        case "scanner.startScan":
            result = handleScannerStart(params)
        case "scanner.scanFromImage":
            result = handleScanFromImage(params)
        case "cookie.get":
            result = handleCookieGet(params)
        case "cookie.set":
            result = handleCookieSet(params)
        case "cookie.clear":
            result = handleCookieClear(params)
        case "device.getInfo":
            result = handleDeviceInfo(params)
        case "device.getNetworkStatus":
            result = handleNetworkStatus(params)
        case "app.getConfig":
            result = handleAppConfig(params)
        default:
            result = createErrorResponse(messageId: messageId, error: "Unsupported action: \(action)")
        }
        
        completion(result)
    }
    
    /**
     * 存储：设置值
     */
    private func handleStorageSet(_ params: [String: Any]) -> [String: Any] {
        guard let key = params["key"] as? String,
              let value = params["value"] as? String else {
            return ["success": false, "error": "Missing key or value"]
        }
        
        storageManager.setString(key: key, value: value)
        return ["success": true]
    }
    
    /**
     * 存储：获取值
     */
    private func handleStorageGet(_ params: [String: Any]) -> [String: Any] {
        guard let key = params["key"] as? String else {
            return ["success": false, "error": "Missing key"]
        }
        
        let defaultValue = params["defaultValue"] as? String ?? ""
        let value = storageManager.getString(key: key, defaultValue: defaultValue)
        
        return ["success": true, "value": value]
    }
    
    /**
     * 存储：移除值
     */
    private func handleStorageRemove(_ params: [String: Any]) -> [String: Any] {
        guard let key = params["key"] as? String else {
            return ["success": false, "error": "Missing key"]
        }
        
        storageManager.remove(key: key)
        return ["success": true]
    }
    
    /**
     * 存储：清空
     */
    private func handleStorageClear(_ params: [String: Any]) -> [String: Any] {
        storageManager.clear()
        return ["success": true]
    }
    
    /**
     * 扫码：开始扫描
     */
    private func handleScannerStart(_ params: [String: Any]) -> [String: Any] {
        let format = params["format"] as? String ?? "QR_CODE"
        
        // 注意：这里需要在实际应用中实现扫码逻辑
        // 暂时返回模拟数据
        return [
            "success": true,
            "data": format == "QR_CODE" ? "https://xfshopee.com/product/123" : "123456789012",
            "format": format,
            "timestamp": Int(Date().timeIntervalSince1970 * 1000)
        ]
    }
    
    /**
     * 扫码：从图片扫描
     */
    private func handleScanFromImage(_ params: [String: Any]) -> [String: Any] {
        guard let imageData = params["imageData"] as? String else {
            return ["success": false, "error": "Missing image data"]
        }
        
        // 注意：这里需要在实际应用中实现图片扫码逻辑
        return [
            "success": false,
            "error": "Not implemented"
        ]
    }
    
    /**
     * Cookie：获取
     */
    private func handleCookieGet(_ params: [String: Any]) -> [String: Any] {
        let domain = params["domain"] as? String ?? "a.b.c"
        let cookies = cookieManager.getCookies(for: domain)
        
        return [
            "success": true,
            "cookies": cookies.joined(separator: "; ")
        ]
    }
    
    /**
     * Cookie：设置
     */
    private func handleCookieSet(_ params: [String: Any]) -> [String: Any] {
        guard let cookie = params["cookie"] as? String else {
            return ["success": false, "error": "Missing cookie"]
        }
        
        let domain = params["domain"] as? String ?? "a.b.c"
        cookieManager.setCookie(cookie, for: domain)
        
        return ["success": true]
    }
    
    /**
     * Cookie：清空
     */
    private func handleCookieClear(_ params: [String: Any]) -> [String: Any] {
        let domain = params["domain"] as? String
        
        if let domain = domain {
            cookieManager.clearCookies(for: domain)
        } else {
            cookieManager.clearAllCookies()
        }
        
        return ["success": true]
    }
    
    /**
     * 设备：获取信息
     */
    private func handleDeviceInfo(_ params: [String: Any]) -> [String: Any] {
        let device = UIDevice.current
        let screen = UIScreen.main
        
        return [
            "success": true,
            "platform": "iOS",
            "osVersion": device.systemVersion,
            "deviceModel": device.model,
            "appVersion": Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0",
            "screenWidth": Int(screen.bounds.width * screen.scale),
            "screenHeight": Int(screen.bounds.height * screen.scale)
        ]
    }
    
    /**
     * 设备：获取网络状态
     */
    private func handleNetworkStatus(_ params: [String: Any]) -> [String: Any] {
        // 注意：需要导入SystemConfiguration框架
        // 暂时返回模拟数据
        return [
            "success": true,
            "connected": true,
            "type": "wifi"
        ]
    }
    
    /**
     * 应用：获取配置
     */
    private func handleAppConfig(_ params: [String: Any]) -> [String: Any] {
        return [
            "success": true,
            "baseUrl": "http://a.b.c",
            "apiPrefix": "/xfbh/api/v1",
            "mobilePrefix": "/xfbh/mobile",
            "environment": "production"
        ]
    }
    
    /**
     * 创建错误响应
     */
    private func createErrorResponse(messageId: String?, error: String) -> [String: Any] {
        return [
            "messageId": messageId ?? "",
            "success": false,
            "data": NSNull(),
            "error": [
                "code": "BRIDGE_ERROR",
                "message": error,
                "details": [:]
            ],
            "timestamp": Int(Date().timeIntervalSince1970 * 1000)
        ]
    }
    
    /**
     * 转换为JSON字符串
     */
    private func jsonString(from object: Any) -> String {
        do {
            let data = try JSONSerialization.data(withJSONObject: object, options: [])
            return String(data: data, encoding: .utf8) ?? "null"
        } catch {
            return "null"
        }
    }
}

// MARK: - WKScriptMessageHandler
extension JavaScriptBridge: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "nativeBridge",
              let messageBody = message.body as? [String: Any] else {
            return
        }
        
        // 处理消息
        handleMessage(messageBody) { result in
            // 发送响应回JavaScript
            if let webView = message.webView {
                self.sendResponse(to: webView, messageId: messageBody["messageId"] as? String, result: result)
            }
        }
    }
    
    /**
     * 发送响应回JavaScript
     */
    private func sendResponse(to webView: WKWebView, messageId: String?, result: Any) {
        var response: [String: Any] = [
            "messageId": messageId ?? "",
            "success": true,
            "data": result,
            "error": NSNull(),
            "timestamp": Int(Date().timeIntervalSince1970 * 1000)
        ]
        
        // 如果result本身已经包含错误信息，调整响应
        if let resultDict = result as? [String: Any],
           resultDict["success"] as? Bool == false {
            response["success"] = false
            response["data"] = NSNull()
            response["error"] = resultDict
        }
        
        let script = """
        if (window['__native_callback_\(messageId ?? "")']) {
            const callback = window['__native_callback_\(messageId ?? "")'];
            delete window['__native_callback_\(messageId ?? "")'];
            
            callback.resolve(\(jsonString(from: response)));
        }
        """
        
        webView.evaluateJavaScript(script) { _, error in
            if let error = error {
                print("Failed to send response to JavaScript: \(error)")
            }
        }
    }
}