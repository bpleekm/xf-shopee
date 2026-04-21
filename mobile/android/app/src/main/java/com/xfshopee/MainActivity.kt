package com.xfshopee

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentContainerView
import com.xfshopee.databinding.ActivityMainBinding

/**
 * 主Activity - 管理多个WebView模块的容器
 * 
 * 采用底部导航栏 + 多WebView堆栈架构
 * 每个功能模块运行在独立的WebView中，实现完全隔离
 */
class MainActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityMainBinding
    private lateinit var webViewManager: WebViewManager
    private lateinit var webViewStack: WebViewStack
    
    // 当前显示的模块ID
    private var currentModuleId: String = "dashboard"
    
    // 模块配置
    private val moduleConfigs = mapOf(
        "dashboard" to WebViewConfig(
            id = "dashboard",
            name = "仪表板",
            url = "/xfbh/mobile/#/dashboard",
            preload = true,
            maxInstances = 1,
            keepAlive = true
        ),
        "products" to WebViewConfig(
            id = "products",
            name = "产品管理",
            url = "/xfbh/mobile/#/products",
            preload = false,
            maxInstances = 2,
            keepAlive = false
        ),
        "orders" to WebViewConfig(
            id = "orders",
            name = "订单处理",
            url = "/xfbh/mobile/#/orders",
            preload = true,
            maxInstances = 3,
            keepAlive = true
        ),
        "scanner" to WebViewConfig(
            id = "scanner",
            name = "扫码功能",
            url = "/xfbh/mobile/#/scanner",
            preload = true,
            maxInstances = 1,
            keepAlive = false
        ),
        "profile" to WebViewConfig(
            id = "profile",
            name = "个人中心",
            url = "/xfbh/mobile/#/profile",
            preload = false,
            maxInstances = 1,
            keepAlive = true
        )
    )
    
    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // 初始化视图绑定
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // 初始化WebView管理器
        webViewManager = WebViewManager(this)
        webViewStack = WebViewStack(this, webViewManager)
        
        // 设置底部导航栏
        setupBottomNavigation()
        
        // 预加载关键模块
        preloadCriticalModules()
        
        // 显示默认模块
        showModule("dashboard")
        
        // 初始化JavaScript桥接
        initJavaScriptBridge()
    }
    
    /**
     * 设置底部导航栏
     */
    private fun setupBottomNavigation() {
        binding.bottomNavigation.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_dashboard -> {
                    showModule("dashboard")
                    true
                }
                R.id.nav_products -> {
                    showModule("products")
                    true
                }
                R.id.nav_orders -> {
                    showModule("orders")
                    true
                }
                R.id.nav_scanner -> {
                    showModule("scanner")
                    true
                }
                R.id.nav_profile -> {
                    showModule("profile")
                    true
                }
                else -> false
            }
        }
    }
    
    /**
     * 显示指定模块
     */
    private fun showModule(moduleId: String) {
        if (moduleId == currentModuleId) {
            return // 已经是当前模块
        }
        
        val config = moduleConfigs[moduleId]
        if (config == null) {
            Toast.makeText(this, "模块不存在: $moduleId", Toast.LENGTH_SHORT).show()
            return
        }
        
        // 获取或创建WebView
        val webView = webViewManager.getOrCreateWebView(config)
        
        // 显示WebView
        binding.webviewContainer.removeAllViews()
        binding.webviewContainer.addView(webView)
        
        // 更新当前模块ID
        currentModuleId = moduleId
        
        // 添加到WebView堆栈
        webViewStack.push(moduleId, webView)
    }
    
    /**
     * 预加载关键模块
     */
    private fun preloadCriticalModules() {
        // 预加载仪表板和订单处理模块
        val dashboardConfig = moduleConfigs["dashboard"]
        val ordersConfig = moduleConfigs["orders"]
        val scannerConfig = moduleConfigs["scanner"]
        
        if (dashboardConfig != null && dashboardConfig.preload) {
            webViewManager.preloadWebView(dashboardConfig)
        }
        
        if (ordersConfig != null && ordersConfig.preload) {
            webViewManager.preloadWebView(ordersConfig)
        }
        
        if (scannerConfig != null && scannerConfig.preload) {
            webViewManager.preloadWebView(scannerConfig)
        }
    }
    
    /**
     * 初始化JavaScript桥接
     */
    private fun initJavaScriptBridge() {
        // JavaScript桥接已经在WebViewManager中注入
        // 这里可以注册全局事件监听器
    }
    
    /**
     * 处理返回键
     */
    override fun onBackPressed() {
        // 如果WebView可以返回，则优先让WebView处理
        val currentWebView = webViewManager.getWebView(currentModuleId)
        if (currentWebView?.canGoBack() == true) {
            currentWebView.goBack()
        } else if (webViewStack.size > 1) {
            // WebView堆栈中有多个页面，返回上一个
            webViewStack.pop()
            val prevModule = webViewStack.peek()
            if (prevModule != null) {
                showModule(prevModule)
            }
        } else {
            // 退出应用
            super.onBackPressed()
        }
    }
    
    /**
     * 保存WebView状态
     */
    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        // 保存当前模块ID
        outState.putString("currentModuleId", currentModuleId)
        // 保存WebView状态
        webViewManager.saveWebViewStates()
    }
    
    /**
     * 恢复WebView状态
     */
    override fun onRestoreInstanceState(savedInstanceState: Bundle) {
        super.onRestoreInstanceState(savedInstanceState)
        val savedModuleId = savedInstanceState.getString("currentModuleId")
        if (savedModuleId != null && savedModuleId != currentModuleId) {
            showModule(savedModuleId)
        }
    }
    
    /**
     * 清理资源
     */
    override fun onDestroy() {
        super.onDestroy()
        webViewManager.destroyAll()
    }
}

/**
 * WebView配置数据类
 */
data class WebViewConfig(
    val id: String,
    val name: String,
    val url: String,
    val preload: Boolean = false,
    val maxInstances: Int = 1,
    val keepAlive: Boolean = false
)