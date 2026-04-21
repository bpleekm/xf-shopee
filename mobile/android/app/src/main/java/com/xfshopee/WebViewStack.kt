package com.xfshopee

import android.webkit.WebView
import java.util.*

/**
 * WebView堆栈管理器
 * 
 * 管理WebView的导航堆栈，支持前进/后退导航
 * 类似浏览器的历史记录，但针对每个模块独立管理
 */
class WebViewStack(
    private val context: android.content.Context,
    private val webViewManager: WebViewManager
) {
    
    // 主堆栈：存储模块ID序列
    private val stack: Stack<String> = Stack()
    
    // 模块历史记录：模块ID -> 该模块的URL历史堆栈
    private val moduleHistories: MutableMap<String, Stack<String>> = mutableMapOf()
    
    // 最大堆栈深度
    private val maxStackDepth = 50
    
    /**
     * 获取堆栈大小
     */
    val size: Int
        get() = stack.size
    
    /**
     * 推入新模块
     */
    fun push(moduleId: String, webView: WebView) {
        // 检查堆栈深度
        if (stack.size >= maxStackDepth) {
            // 移除最旧的条目
            stack.removeAt(0)
        }
        
        // 推入新模块
        if (stack.isEmpty() || stack.peek() != moduleId) {
            stack.push(moduleId)
        }
        
        // 记录当前URL到模块历史
        val currentUrl = webView.url ?: ""
        if (currentUrl.isNotEmpty()) {
            val history = moduleHistories.getOrPut(moduleId) { Stack() }
            
            // 避免重复记录相同的URL
            if (history.isEmpty() || history.peek() != currentUrl) {
                if (history.size >= maxStackDepth) {
                    history.removeAt(0)
                }
                history.push(currentUrl)
            }
        }
    }
    
    /**
     * 弹出当前模块
     * @return 弹出的模块ID，如果堆栈为空则返回null
     */
    fun pop(): String? {
        return if (stack.size > 1) {
            stack.pop() // 移除当前模块
            stack.peek() // 返回上一个模块
        } else {
            null
        }
    }
    
    /**
     * 查看栈顶模块
     */
    fun peek(): String? {
        return if (stack.isNotEmpty()) stack.peek() else null
    }
    
    /**
     * 清空堆栈
     */
    fun clear() {
        stack.clear()
        moduleHistories.clear()
    }
    
    /**
     * 获取模块的URL历史
     */
    fun getModuleHistory(moduleId: String): List<String> {
        return moduleHistories[moduleId]?.toList() ?: emptyList()
    }
    
    /**
     * 模块内后退
     * @return 是否可以后退
     */
    fun canGoBackInModule(moduleId: String): Boolean {
        val history = moduleHistories[moduleId]
        return history != null && history.size > 1
    }
    
    /**
     * 模块内后退
     * @return 后退后的URL，如果无法后退则返回null
     */
    fun goBackInModule(moduleId: String): String? {
        val history = moduleHistories[moduleId] ?: return null
        
        if (history.size > 1) {
            history.pop() // 移除当前URL
            return history.peek() // 返回上一个URL
        }
        
        return null
    }
    
    /**
     * 模块内前进
     * @return 是否可以前进
     */
    fun canGoForwardInModule(moduleId: String): Boolean {
        // 简化实现：使用WebView自带的前进功能
        val webView = webViewManager.getWebView(moduleId)
        return webView?.canGoForward() == true
    }
    
    /**
     * 模块内前进
     */
    fun goForwardInModule(moduleId: String) {
        val webView = webViewManager.getWebView(moduleId)
        webView?.goForward()
    }
    
    /**
     * 获取堆栈快照（用于调试）
     */
    fun getStackSnapshot(): List<String> {
        return stack.toList()
    }
    
    /**
     * 保存堆栈状态
     */
    fun saveState(): Bundle {
        return android.os.Bundle().apply {
            // 保存主堆栈
            putStringArrayList("stack", ArrayList(stack))
            
            // 保存模块历史
            val historyBundle = android.os.Bundle()
            moduleHistories.forEach { (moduleId, urls) ->
                historyBundle.putStringArrayList(moduleId, ArrayList(urls))
            }
            putBundle("moduleHistories", historyBundle)
        }
    }
    
    /**
     * 恢复堆栈状态
     */
    fun restoreState(savedInstanceState: Bundle?) {
        savedInstanceState ?: return
        
        // 恢复主堆栈
        val savedStack = savedInstanceState.getStringArrayList("stack")
        savedStack?.let {
            stack.clear()
            stack.addAll(it)
        }
        
        // 恢复模块历史
        val historyBundle = savedInstanceState.getBundle("moduleHistories")
        historyBundle?.let { bundle ->
            moduleHistories.clear()
            bundle.keySet().forEach { moduleId ->
                val urls = bundle.getStringArrayList(moduleId)
                if (urls != null) {
                    val urlStack = Stack<String>()
                    urlStack.addAll(urls)
                    moduleHistories[moduleId] = urlStack
                }
            }
        }
    }
    
    /**
     * 打印堆栈状态（调试用）
     */
    fun printStack() {
        println("=== WebView Stack (${stack.size} items) ===")
        stack.forEachIndexed { index, moduleId ->
            val history = moduleHistories[moduleId]
            val currentUrl = history?.peek() ?: "No URL"
            println("[$index] $moduleId: $currentUrl (${history?.size ?: 0} history items)")
        }
        println("=======================================")
    }
}