import Foundation
import WebKit

/**
 * WebView导航堆栈管理
 * 
 * 管理WebView的导航历史，支持前进、后退操作
 */
class WebViewStack {
    
    // 单例实例
    static let shared = WebViewStack()
    
    // 导航历史：模块ID -> [URL历史]
    private var navigationHistory: [String: [URL]] = [:]
    
    // 当前位置索引：模块ID -> 当前索引
    private var currentIndices: [String: Int] = [:]
    
    // 最大历史记录数
    private let maxHistoryCount = 50
    
    private init() {}
    
    /**
     * 为模块初始化导航历史
     */
    func initializeHistory(for moduleId: String, initialUrl: URL? = nil) {
        if navigationHistory[moduleId] == nil {
            navigationHistory[moduleId] = []
            currentIndices[moduleId] = -1
            
            if let url = initialUrl {
                addToHistory(for: moduleId, url: url)
            }
        }
    }
    
    /**
     * 添加URL到历史记录
     */
    func addToHistory(for moduleId: String, url: URL) {
        guard var history = navigationHistory[moduleId] else {
            initializeHistory(for: moduleId, initialUrl: url)
            return
        }
        
        var currentIndex = currentIndices[moduleId] ?? -1
        
        // 如果当前位置不是最后，则移除当前位置之后的所有记录
        if currentIndex < history.count - 1 {
            let range = (currentIndex + 1)..<history.count
            history.removeSubrange(range)
        }
        
        // 添加到历史
        history.append(url)
        
        // 限制历史记录数量
        if history.count > maxHistoryCount {
            history.removeFirst(history.count - maxHistoryCount)
            currentIndex -= (history.count - maxHistoryCount)
        }
        
        // 更新当前位置
        currentIndex = history.count - 1
        
        // 保存
        navigationHistory[moduleId] = history
        currentIndices[moduleId] = currentIndex
    }
    
    /**
     * 获取当前URL
     */
    func getCurrentUrl(for moduleId: String) -> URL? {
        guard let history = navigationHistory[moduleId],
              let currentIndex = currentIndices[moduleId],
              currentIndex >= 0 && currentIndex < history.count else {
            return nil
        }
        
        return history[currentIndex]
    }
    
    /**
     * 获取前一个URL
     */
    func getPreviousUrl(for moduleId: String) -> URL? {
        guard let history = navigationHistory[moduleId],
              let currentIndex = currentIndices[moduleId],
              currentIndex > 0 else {
            return nil
        }
        
        return history[currentIndex - 1]
    }
    
    /**
     * 获取下一个URL
     */
    func getNextUrl(for moduleId: String) -> URL? {
        guard let history = navigationHistory[moduleId],
              let currentIndex = currentIndices[moduleId],
              currentIndex < history.count - 1 else {
            return nil
        }
        
        return history[currentIndex + 1]
    }
    
    /**
     * 前进到下一个URL
     */
    func goForward(for moduleId: String) -> URL? {
        guard let nextUrl = getNextUrl(for: moduleId) else {
            return nil
        }
        
        if let currentIndex = currentIndices[moduleId] {
            currentIndices[moduleId] = currentIndex + 1
        }
        
        return nextUrl
    }
    
    /**
     * 后退到上一个URL
     */
    func goBack(for moduleId: String) -> URL? {
        guard let previousUrl = getPreviousUrl(for: moduleId) else {
            return nil
        }
        
        if let currentIndex = currentIndices[moduleId] {
            currentIndices[moduleId] = currentIndex - 1
        }
        
        return previousUrl
    }
    
    /**
     * 是否可以前进
     */
    func canGoForward(for moduleId: String) -> Bool {
        guard let history = navigationHistory[moduleId],
              let currentIndex = currentIndices[moduleId] else {
            return false
        }
        
        return currentIndex < history.count - 1
    }
    
    /**
     * 是否可以后退
     */
    func canGoBack(for moduleId: String) -> Bool {
        guard let currentIndex = currentIndices[moduleId] else {
            return false
        }
        
        return currentIndex > 0
    }
    
    /**
     * 获取导航历史
     */
    func getHistory(for moduleId: String) -> [URL] {
        return navigationHistory[moduleId] ?? []
    }
    
    /**
     * 清除导航历史
     */
    func clearHistory(for moduleId: String) {
        navigationHistory.removeValue(forKey: moduleId)
        currentIndices.removeValue(forKey: moduleId)
    }
    
    /**
     * 清除所有导航历史
     */
    func clearAllHistory() {
        navigationHistory.removeAll()
        currentIndices.removeAll()
    }
    
    /**
     * 获取所有模块的历史统计
     */
    func getHistoryStats() -> [String: Int] {
        var stats: [String: Int] = [:]
        
        for (moduleId, history) in navigationHistory {
            stats[moduleId] = history.count
        }
        
        return stats
    }
}

// MARK: - WebView集成扩展
extension WebViewStack {
    
    /**
     * 监听WebView导航并自动更新历史
     */
    func observeWebView(_ webView: WKWebView, for moduleId: String) {
        // 初始化历史
        if let currentUrl = webView.url {
            initializeHistory(for: moduleId, initialUrl: currentUrl)
        }
        
        // 可以通过KVO观察webView.url的变化
        // 实际项目中可以使用更复杂的观察机制
    }
    
    /**
     * 同步WebView当前URL到历史
     */
    func syncCurrentUrl(from webView: WKWebView, for moduleId: String) {
        if let url = webView.url {
            addToHistory(for: moduleId, url: url)
        }
    }
}