package com.xfshopee

import android.annotation.SuppressLint
import android.content.Context
import android.webkit.*
import android.widget.Toast
import java.util.*
import kotlin.collections.HashMap

/**
 * WebView管理器
 * 
 * 负责WebView实例的创建、配置、复用和销毁
 * 实现WebView池化策略，优化内存使用
 */
class WebViewManager(private val context: Context) {
    
    companion object {
        // 基础URL配置
        private const val BASE_URL = "http://a.b.c"
        private const val LOCAL_FALLBACK_URL = "file:///android_asset/web-mobile/index.html"
        
        // WebView池配置
        private const val MAX_IDLE_WEBVIEWS = 3
        private const val IDLE_TIMEOUT_MS = 5 * 60 * 1000L // 5分钟
    }
    
    // WebView池：模块ID -> WebView实例列表
    private val webViewPool: MutableMap<String, MutableList<WebView>> = HashMap()
    
    // 活跃WebView：模块ID -> 当前活跃的WebView
    private val activeWebViews: MutableMap<String, WebView> = HashMap()
    
    // WebView配置缓存
    private val configCache: MutableMap<String, WebViewConfig> = HashMap()
    
    // 闲置WebView计时器
    private val idleTimers: MutableMap<String, Timer> = HashMap()
    
    // Cookie管理器
    private val cookieManager: CookieManager by lazy {
        CookieManager.getInstance().apply {
            setAcceptCookie(true)
            setAcceptThirdPartyCookies(null, true)
        }
    }
    
    // JavaScript桥接
    private val javascriptBridge: JavaScriptBridge by lazy {
        JavaScriptBridge(context, this)
    }
    
    /**
     * 获取或创建WebView
     */
    fun getOrCreateWebView(config: WebViewConfig): WebView {
        // 缓存配置
        configCache[config.id] = config
        
        // 检查是否有可复用的闲置WebView
        val webView = getFromIdlePool(config.id) ?: createNewWebView(config)
        
        // 标记为活跃
        activeWebViews[config.id] = webView
        
        // 注入Cookie
        injectCookies(webView, config)
        
        return webView
    }
    
    /**
     * 预加载WebView
     */
    fun preloadWebView(config: WebViewConfig) {
        if (config.id in configCache) {
            return // 已经预加载
        }
        
        // 创建WebView但不添加到活跃池
        val webView = createNewWebView(config)
        
        // 添加到闲置池
        addToIdlePool(config.id, webView)
        
        // 缓存配置
        configCache[config.id] = config
        
        // 设置闲置超时
        scheduleIdleTimeout(config.id, webView)
    }
    
    /**
     * 获取指定模块的WebView（如果存在）
     */
    fun getWebView(moduleId: String): WebView? {
        return activeWebViews[moduleId]
    }
    
    /**
     * 创建新的WebView实例
     */
    @SuppressLint("SetJavaScriptEnabled")
    private fun createNewWebView(config: WebViewConfig): WebView {
        return WebView(context).apply {
            // 基础配置
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                allowFileAccess = false
                allowContentAccess = false
                allowFileAccessFromFileURLs = false
                allowUniversalAccessFromFileURLs = false
                mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
                cacheMode = WebSettings.LOAD_DEFAULT
                mediaPlaybackRequiresUserGesture = false
                
                // 启用WebView安全功能
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    safeBrowsingEnabled = true
                }
            }
            
            // 设置WebView客户端
            webViewClient = object : WebViewClient() {
                override fun onReceivedError(
                    view: WebView?,
                    request: WebResourceRequest?,
                    error: WebResourceError?
                ) {
                    super.onReceivedError(view, request, error)
                    
                    // 网络错误时回退到本地资源
                    if (request?.isForMainFrame == true) {
                        loadUrl(LOCAL_FALLBACK_URL)
                    }
                }
                
                override fun shouldOverrideUrlLoading(
                    view: WebView?,
                    request: WebResourceRequest?
                ): Boolean {
                    // 处理URL跳转
                    val url = request?.url.toString()
                    return handleUrlNavigation(url)
                }
            }
            
            // 设置Chrome客户端（用于JavaScript对话框等）
            webChromeClient = object : WebChromeClient() {
                override fun onJsAlert(
                    view: WebView?,
                    url: String?,
                    message: String?,
                    result: JsResult
                ): Boolean {
                    // 显示原生对话框
                    android.app.AlertDialog.Builder(context)
                        .setTitle("提示")
                        .setMessage(message)
                        .setPositiveButton("确定") { _, _ -> result.confirm() }
                        .setCancelable(false)
                        .show()
                    return true
                }
                
                override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                    consoleMessage?.let {
                        println("WebView Console [${it.messageLevel()}] ${it.sourceId()}:${it.lineNumber()} ${it.message()}")
                    }
                    return true
                }
            }
            
            // 注入JavaScript桥接
            addJavascriptInterface(javascriptBridge, "NativeBridge")
            
            // 构建完整URL
            val fullUrl = if (config.url.startsWith("http")) {
                config.url
            } else {
                "$BASE_URL${config.url}"
            }
            
            // 加载URL
            loadUrl(fullUrl)
        }
    }
    
    /**
     * 从闲置池获取WebView
     */
    private fun getFromIdlePool(moduleId: String): WebView? {
        val idleList = webViewPool[moduleId]
        if (idleList.isNullOrEmpty()) {
            return null
        }
        
        // 移除并返回第一个闲置WebView
        val webView = idleList.removeAt(0)
        
        // 取消闲置超时计时器
        idleTimers[moduleId]?.cancel()
        idleTimers.remove(moduleId)
        
        return webView
    }
    
    /**
     * 添加到闲置池
     */
    private fun addToIdlePool(moduleId: String, webView: WebView) {
        val idleList = webViewPool.getOrPut(moduleId) { mutableListOf() }
        
        // 检查闲置池大小
        if (idleList.size >= MAX_IDLE_WEBVIEWS) {
            // 移除最旧的闲置WebView
            val oldest = idleList.removeAt(0)
            destroyWebView(oldest)
        }
        
        // 添加到闲置池
        idleList.add(webView)
    }
    
    /**
     * 将WebView标记为闲置
     */
    fun markAsIdle(moduleId: String, webView: WebView) {
        // 从活跃池移除
        activeWebViews.remove(moduleId)
        
        // 添加到闲置池
        addToIdlePool(moduleId, webView)
        
        // 设置闲置超时
        scheduleIdleTimeout(moduleId, webView)
    }
    
    /**
     * 销毁WebView
     */
    private fun destroyWebView(webView: WebView) {
        webView.stopLoading()
        webView.loadDataWithBaseURL(null, "", "text/html", "UTF-8", null)
        webView.clearHistory()
        webView.clearCache(true)
        webView.destroy()
    }
    
    /**
     * 销毁所有WebView
     */
    fun destroyAll() {
        // 销毁活跃WebView
        activeWebViews.values.forEach { destroyWebView(it) }
        activeWebViews.clear()
        
        // 销毁闲置WebView
        webViewPool.values.forEach { list ->
            list.forEach { destroyWebView(it) }
            list.clear()
        }
        webViewPool.clear()
        
        // 取消所有计时器
        idleTimers.values.forEach { it.cancel() }
        idleTimers.clear()
    }
    
    /**
     * 保存WebView状态
     */
    fun saveWebViewStates() {
        // 保存Cookie
        cookieManager.flush()
        
        // 可以扩展：保存WebView的滚动位置、表单数据等
    }
    
    /**
     * 注入Cookie到WebView
     */
    private fun injectCookies(webView: WebView, config: WebViewConfig) {
        // 获取存储的认证Token
        val token = StorageManager(context).getString("user_token")
        if (token.isNotEmpty()) {
            val cookieString = "session_token=$token; path=/; domain=a.b.c"
            cookieManager.setCookie(BASE_URL, cookieString)
            cookieManager.flush()
        }
    }
    
    /**
     * 处理URL导航
     */
    private fun handleUrlNavigation(url: String): Boolean {
        // 检查是否是内部链接
        return when {
            url.contains("/xfbh/mobile/") -> {
                // 允许加载移动端H5页面
                false
            }
            url.contains("/xfbh/api/") -> {
                // 允许API调用
                false
            }
            url.startsWith("http://") || url.startsWith("https://") -> {
                // 外部链接，用浏览器打开
                try {
                    val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url))
                    context.startActivity(intent)
                } catch (e: Exception) {
                    Toast.makeText(context, "无法打开链接", Toast.LENGTH_SHORT).show()
                }
                true
            }
            else -> {
                false
            }
        }
    }
    
    /**
     * 调度闲置超时
     */
    private fun scheduleIdleTimeout(moduleId: String, webView: WebView) {
        val timer = Timer()
        timer.schedule(object : TimerTask() {
            override fun run() {
                // 闲置超时，销毁WebView
                val idleList = webViewPool[moduleId]
                idleList?.remove(webView)
                destroyWebView(webView)
                
                // 从计时器映射中移除
                idleTimers.remove(moduleId)
            }
        }, IDLE_TIMEOUT_MS)
        
        idleTimers[moduleId] = timer
    }
}