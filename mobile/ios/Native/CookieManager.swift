import UIKit
import WebKit

/**
 * Cookie管理器
 * 
 * 提供统一的Cookie管理功能，支持跨WebView的Cookie同步
 */
class CookieManager: NSObject {
    
    // 单例实例
    static let shared = CookieManager()
    
    // HTTP Cookie存储
    private let httpCookieStorage = HTTPCookieStorage.shared
    
    // 默认域名
    private let defaultDomain = "a.b.c"
    
    private override init() {
        super.init()
        setupCookiePolicy()
    }
    
    /**
     * 设置Cookie策略
     */
    private func setupCookiePolicy() {
        // 允许所有Cookie
        httpCookieStorage.cookieAcceptPolicy = .always
    }
    
    /**
     * 设置Cookie
     */
    func setCookie(_ cookieString: String, for domain: String? = nil) {
        let targetDomain = domain ?? defaultDomain
        
        // 解析Cookie字符串
        let cookieComponents = cookieString.split(separator: ";").map { $0.trimmingCharacters(in: .whitespaces) }
        
        guard !cookieComponents.isEmpty else {
            return
        }
        
        // 第一个组件是name=value
        let nameValue = cookieComponents[0].split(separator: "=", maxSplits: 1)
        guard nameValue.count == 2 else {
            return
        }
        
        let name = String(nameValue[0])
        let value = String(nameValue[1])
        
        // 构建Cookie属性字典
        var properties: [HTTPCookiePropertyKey: Any] = [
            .name: name,
            .value: value,
            .domain: targetDomain,
            .path: "/"
        ]
        
        // 解析其他属性
        for component in cookieComponents.dropFirst() {
            if component.lowercased().hasPrefix("domain=") {
                let domainValue = String(component.dropFirst(7))
                if !domainValue.isEmpty {
                    properties[.domain] = domainValue
                }
            } else if component.lowercased().hasPrefix("path=") {
                let pathValue = String(component.dropFirst(5))
                if !pathValue.isEmpty {
                    properties[.path] = pathValue
                }
            } else if component.lowercased().hasPrefix("expires=") {
                let expiresValue = String(component.dropFirst(8))
                if let date = parseDate(expiresValue) {
                    properties[.expires] = date
                }
            } else if component.lowercased().hasPrefix("max-age=") {
                let maxAgeValue = String(component.dropFirst(8))
                if let maxAge = Int(maxAgeValue) {
                    let expiresDate = Date().addingTimeInterval(TimeInterval(maxAge))
                    properties[.expires] = expiresDate
                }
            } else if component.lowercased() == "secure" {
                properties[.secure] = true
            } else if component.lowercased() == "httponly" {
                properties[.httpOnly] = true
            }
        }
        
        // 创建并存储Cookie
        if let cookie = HTTPCookie(properties: properties) {
            httpCookieStorage.setCookie(cookie)
            synchronizeToWebKit()
        }
    }
    
    /**
     * 设置Cookie (简化版)
     */
    func setCookie(name: String, value: String, domain: String? = nil, path: String = "/") {
        let targetDomain = domain ?? defaultDomain
        
        let properties: [HTTPCookiePropertyKey: Any] = [
            .name: name,
            .value: value,
            .domain: targetDomain,
            .path: path
        ]
        
        if let cookie = HTTPCookie(properties: properties) {
            httpCookieStorage.setCookie(cookie)
            synchronizeToWebKit()
        }
    }
    
    /**
     * 获取指定域名的所有Cookie
     */
    func getCookies(for domain: String? = nil) -> [String] {
        let targetDomain = domain ?? defaultDomain
        let cookies = httpCookieStorage.cookies ?? []
        
        return cookies.filter { $0.domain.contains(targetDomain) }
            .map { "\($0.name)=\($0.value)" }
    }
    
    /**
     * 获取指定Cookie的值
     */
    func getCookie(named name: String, domain: String? = nil) -> String? {
        let targetDomain = domain ?? defaultDomain
        let cookies = httpCookieStorage.cookies ?? []
        
        return cookies.first { $0.name == name && $0.domain.contains(targetDomain) }?.value
    }
    
    /**
     * 移除指定Cookie
     */
    func removeCookie(named name: String, domain: String? = nil) {
        let targetDomain = domain ?? defaultDomain
        let cookies = httpCookieStorage.cookies ?? []
        
        if let cookie = cookies.first(where: { $0.name == name && $0.domain.contains(targetDomain) }) {
            httpCookieStorage.deleteCookie(cookie)
            synchronizeToWebKit()
        }
    }
    
    /**
     * 清空指定域名的所有Cookie
     */
    func clearCookies(for domain: String? = nil) {
        let targetDomain = domain ?? defaultDomain
        let cookies = httpCookieStorage.cookies ?? []
        
        for cookie in cookies where cookie.domain.contains(targetDomain) {
            httpCookieStorage.deleteCookie(cookie)
        }
        
        synchronizeToWebKit()
    }
    
    /**
     * 清空所有Cookie
     */
    func clearAllCookies() {
        let cookies = httpCookieStorage.cookies ?? []
        
        for cookie in cookies {
            httpCookieStorage.deleteCookie(cookie)
        }
        
        synchronizeToWebKit()
        
        // 同时清除WKWebsiteDataStore中的Cookie
        clearWebKitCookies()
    }
    
    /**
     * 将Cookie同步到WebKit (WKWebView)
     */
    func synchronizeToWebKit() {
        // HTTP Cookie存储会自动同步到WebKit
        // 但我们可以强制同步
        httpCookieStorage.cookies?.forEach { cookie in
            WKWebsiteDataStore.default().httpCookieStore.setCookie(cookie)
        }
    }
    
    /**
     * 清除WebKit中的Cookie
     */
    private func clearWebKitCookies() {
        let dataStore = WKWebsiteDataStore.default()
        
        dataStore.fetchDataRecords(ofTypes: WKWebsiteDataStore.allWebsiteDataTypes()) { records in
            dataStore.removeData(ofTypes: WKWebsiteDataStore.allWebsiteDataTypes(),
                                for: records) {
                print("WebKit cookies cleared")
            }
        }
    }
    
    /**
     * 注入Cookie到WebView
     */
    func injectCookies(to webView: WKWebView, domain: String? = nil) {
        let targetDomain = domain ?? defaultDomain
        let cookies = httpCookieStorage.cookies ?? []
        
        for cookie in cookies where cookie.domain.contains(targetDomain) {
            webView.configuration.websiteDataStore.httpCookieStore.setCookie(cookie)
        }
    }
    
    /**
     * 从WebView同步Cookie
     */
    func syncFromWebView(_ webView: WKWebView, domain: String? = nil) {
        let targetDomain = domain ?? defaultDomain
        let cookieStore = webView.configuration.websiteDataStore.httpCookieStore
        
        cookieStore.getAllCookies { cookies in
            for cookie in cookies where cookie.domain.contains(targetDomain) {
                self.httpCookieStorage.setCookie(cookie)
            }
        }
    }
    
    /**
     * 导出所有Cookie (用于调试或备份)
     */
    func exportAllCookies() -> [String: [String]] {
        let cookies = httpCookieStorage.cookies ?? []
        var result: [String: [String]] = [:]
        
        for cookie in cookies {
            var cookieStrings = result[cookie.domain] ?? []
            cookieStrings.append("\(cookie.name)=\(cookie.value)")
            result[cookie.domain] = cookieStrings
        }
        
        return result
    }
    
    /**
     * 导入Cookie (用于恢复)
     */
    func importCookies(_ cookies: [String: [String]]) {
        for (domain, cookieStrings) in cookies {
            for cookieString in cookieStrings {
                setCookie(cookieString, for: domain)
            }
        }
    }
    
    /**
     * 检查Cookie是否已设置
     */
    func hasCookie(named name: String, domain: String? = nil) -> Bool {
        return getCookie(named: name, domain: domain) != nil
    }
    
    /**
     * 获取Cookie的过期时间
     */
    func getCookieExpiry(named name: String, domain: String? = nil) -> Date? {
        let targetDomain = domain ?? defaultDomain
        let cookies = httpCookieStorage.cookies ?? []
        
        return cookies.first { $0.name == name && $0.domain.contains(targetDomain) }?.expiresDate
    }
    
    /**
     * 设置安全Cookie (HTTPS only)
     */
    func setSecureCookie(name: String, value: String, domain: String? = nil) {
        let targetDomain = domain ?? defaultDomain
        
        let properties: [HTTPCookiePropertyKey: Any] = [
            .name: name,
            .value: value,
            .domain: targetDomain,
            .path: "/",
            .secure: true
        ]
        
        if let cookie = HTTPCookie(properties: properties) {
            httpCookieStorage.setCookie(cookie)
            synchronizeToWebKit()
        }
    }
    
    /**
     * 设置HttpOnly Cookie
     */
    func setHttpOnlyCookie(name: String, value: String, domain: String? = nil) {
        let targetDomain = domain ?? defaultDomain
        
        let properties: [HTTPCookiePropertyKey: Any] = [
            .name: name,
            .value: value,
            .domain: targetDomain,
            .path: "/",
            .httpOnly: true
        ]
        
        if let cookie = HTTPCookie(properties: properties) {
            httpCookieStorage.setCookie(cookie)
            synchronizeToWebKit()
        }
    }
    
    /**
     * 设置带过期时间的Cookie
     */
    func setCookieWithExpiry(name: String, value: String, expirySeconds: TimeInterval, domain: String? = nil) {
        let targetDomain = domain ?? defaultDomain
        let expiryDate = Date().addingTimeInterval(expirySeconds)
        
        let properties: [HTTPCookiePropertyKey: Any] = [
            .name: name,
            .value: value,
            .domain: targetDomain,
            .path: "/",
            .expires: expiryDate
        ]
        
        if let cookie = HTTPCookie(properties: properties) {
            httpCookieStorage.setCookie(cookie)
            synchronizeToWebKit()
        }
    }
    
    /**
     * 解析日期字符串
     */
    private func parseDate(_ dateString: String) -> Date? {
        let formatters = [
            "EEE, dd MMM yyyy HH:mm:ss zzz",
            "EEEE, dd-MMM-yy HH:mm:ss zzz",
            "EEE MMM dd HH:mm:ss yyyy"
        ]
        
        for format in formatters {
            let formatter = DateFormatter()
            formatter.dateFormat = format
            formatter.locale = Locale(identifier: "en_US_POSIX")
            formatter.timeZone = TimeZone(secondsFromGMT: 0)
            
            if let date = formatter.date(from: dateString) {
                return date
            }
        }
        
        return nil
    }
    
    /**
     * 打印所有Cookie (调试用)
     */
    func printAllCookies() {
        let cookies = httpCookieStorage.cookies ?? []
        
        print("=== All Cookies (\(cookies.count) items) ===")
        for cookie in cookies {
            print("Domain: \(cookie.domain)")
            print("  Name: \(cookie.name)")
            print("  Value: \(cookie.value)")
            print("  Path: \(cookie.path)")
            print("  Secure: \(cookie.isSecure)")
            print("  HTTPOnly: \(cookie.isHTTPOnly)")
            if let expires = cookie.expiresDate {
                print("  Expires: \(expires)")
            }
            print("---")
        }
        print("========================================")
    }
}