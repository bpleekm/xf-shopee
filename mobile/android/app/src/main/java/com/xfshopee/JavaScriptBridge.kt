package com.xfshopee

import android.annotation.SuppressLint
import android.content.Context
import android.webkit.JavascriptInterface
import android.webkit.WebView
import org.json.JSONObject
import java.util.*

/**
 * JavaScript桥接接口
 * 
 * 提供原生功能给WebView中的JavaScript调用
 * 双向通信：JavaScript调用原生方法，原生发送事件到JavaScript
 */
@SuppressLint("JavascriptInterface")
class JavaScriptBridge(
    private val context: Context,
    private val webViewManager: WebViewManager
) {
    
    companion object {
        // 消息ID生成器
        private var messageIdCounter = 0
            get() {
                field++
                return field
            }
        
        // 回调映射：callbackId -> 回调函数
        private val callbacks: MutableMap<String, (String) -> Unit> = mutableMapOf()
    }
    
    // 事件监听器：eventName -> 监听器列表
    private val eventListeners: MutableMap<String, MutableList<(JSONObject) -> Unit>> = mutableMapOf()
    
    // 存储管理器
    private val storageManager: StorageManager by lazy {
        StorageManager(context)
    }
    
    // 扫码管理器
    private val scannerManager: ScannerManager by lazy {
        ScannerManager(context)
    }
    
    // Cookie管理器
    private val cookieManager: CookieManager by lazy {
        com.xfshopee.CookieManager(context)
    }
    
    /**
     * JavaScript调用原生方法的主入口
     */
    @JavascriptInterface
    fun callNative(messageJson: String): String {
        return try {
            val message = JSONObject(messageJson)
            val messageId = message.optString("messageId", "")
            val action = message.optString("action", "")
            val params = message.optJSONObject("params") ?: JSONObject()
            val callbackId = message.optString("callbackId", "")
            
            // 处理请求
            val result = handleAction(action, params)
            
            // 构建响应
            val response = JSONObject().apply {
                put("messageId", messageId)
                put("success", true)
                put("data", result)
                put("error", JSONObject.NULL)
                put("timestamp", System.currentTimeMillis())
            }
            
            response.toString()
        } catch (e: Exception) {
            // 错误响应
            val errorResponse = JSONObject().apply {
                put("messageId", "error_${System.currentTimeMillis()}")
                put("success", false)
                put("data", JSONObject.NULL)
                put("error", JSONObject().apply {
                    put("code", "BRIDGE_ERROR")
                    put("message", e.message ?: "Unknown error")
                    put("details", JSONObject())
                })
                put("timestamp", System.currentTimeMillis())
            }
            
            errorResponse.toString()
        }
    }
    
    /**
     * 处理具体动作
     */
    private fun handleAction(action: String, params: JSONObject): JSONObject {
        return when (action) {
            // 存储相关
            "storage.set" -> handleStorageSet(params)
            "storage.get" -> handleStorageGet(params)
            "storage.remove" -> handleStorageRemove(params)
            "storage.clear" -> handleStorageClear(params)
            
            // 扫码相关
            "scanner.startScan" -> handleScannerStart(params)
            "scanner.scanFromImage" -> handleScanFromImage(params)
            
            // Cookie相关
            "cookie.get" -> handleCookieGet(params)
            "cookie.set" -> handleCookieSet(params)
            "cookie.clear" -> handleCookieClear(params)
            
            // 设备信息
            "device.getInfo" -> handleDeviceInfo(params)
            "device.getNetworkStatus" -> handleNetworkStatus(params)
            
            // 应用功能
            "app.getConfig" -> handleAppConfig(params)
            "app.openModule" -> handleOpenModule(params)
            "app.closeModule" -> handleCloseModule(params)
            
            // 文件操作
            "file.read" -> handleFileRead(params)
            "file.write" -> handleFileWrite(params)
            "file.delete" -> handleFileDelete(params)
            
            // 其他
            else -> JSONObject().apply {
                put("error", "ACTION_NOT_SUPPORTED")
                put("action", action)
            }
        }
    }
    
    /**
     * 存储：设置值
     */
    private fun handleStorageSet(params: JSONObject): JSONObject {
        val key = params.optString("key", "")
        val value = params.optString("value", "")
        
        if (key.isNotEmpty()) {
            storageManager.setString(key, value)
        }
        
        return JSONObject().apply {
            put("success", true)
        }
    }
    
    /**
     * 存储：获取值
     */
    private fun handleStorageGet(params: JSONObject): JSONObject {
        val key = params.optString("key", "")
        val defaultValue = params.optString("defaultValue", "")
        
        val value = if (key.isNotEmpty()) {
            storageManager.getString(key, defaultValue)
        } else {
            defaultValue
        }
        
        return JSONObject().apply {
            put("value", value)
            put("success", true)
        }
    }
    
    /**
     * 存储：移除值
     */
    private fun handleStorageRemove(params: JSONObject): JSONObject {
        val key = params.optString("key", "")
        
        if (key.isNotEmpty()) {
            storageManager.remove(key)
        }
        
        return JSONObject().apply {
            put("success", true)
        }
    }
    
    /**
     * 存储：清空
     */
    private fun handleStorageClear(params: JSONObject): JSONObject {
        storageManager.clear()
        return JSONObject().apply {
            put("success", true)
        }
    }
    
    /**
     * 扫码：开始扫描
     */
    private fun handleScannerStart(params: JSONObject): JSONObject {
        val format = params.optString("format", "QR_CODE")
        
        return try {
            val result = scannerManager.scan(format)
            JSONObject().apply {
                put("success", true)
                put("data", result.data)
                put("format", result.format)
                put("timestamp", result.timestamp)
            }
        } catch (e: Exception) {
            JSONObject().apply {
                put("success", false)
                put("error", e.message ?: "Scan failed")
            }
        }
    }
    
    /**
     * 扫码：从图片扫描
     */
    private fun handleScanFromImage(params: JSONObject): JSONObject {
        val imageData = params.optString("imageData", "")
        
        if (imageData.isEmpty()) {
            return JSONObject().apply {
                put("success", false)
                put("error", "No image data provided")
            }
        }
        
        return try {
            val result = scannerManager.scanFromImage(imageData)
            JSONObject().apply {
                put("success", true)
                put("data", result.data)
                put("format", result.format)
                put("timestamp", result.timestamp)
            }
        } catch (e: Exception) {
            JSONObject().apply {
                put("success", false)
                put("error", e.message ?: "Image scan failed")
            }
        }
    }
    
    /**
     * Cookie：获取
     */
    private fun handleCookieGet(params: JSONObject): JSONObject {
        val domain = params.optString("domain", "a.b.c")
        val cookies = cookieManager.getCookies(domain)
        
        return JSONObject().apply {
            put("success", true)
            put("cookies", cookies.joinToString("; "))
        }
    }
    
    /**
     * Cookie：设置
     */
    private fun handleCookieSet(params: JSONObject): JSONObject {
        val cookieString = params.optString("cookie", "")
        val domain = params.optString("domain", "a.b.c")
        
        if (cookieString.isNotEmpty()) {
            cookieManager.setCookie(domain, cookieString)
        }
        
        return JSONObject().apply {
            put("success", true)
        }
    }
    
    /**
     * Cookie：清空
     */
    private fun handleCookieClear(params: JSONObject): JSONObject {
        val domain = params.optString("domain", "")
        
        if (domain.isNotEmpty()) {
            cookieManager.clearCookies(domain)
        } else {
            cookieManager.clearAllCookies()
        }
        
        return JSONObject().apply {
            put("success", true)
        }
    }
    
    /**
     * 设备：获取信息
     */
    private fun handleDeviceInfo(params: JSONObject): JSONObject {
        return JSONObject().apply {
            put("platform", "Android")
            put("osVersion", android.os.Build.VERSION.RELEASE)
            put("deviceModel", android.os.Build.MODEL)
            put("appVersion", "1.0.0")
            put("screenWidth", context.resources.displayMetrics.widthPixels)
            put("screenHeight", context.resources.displayMetrics.heightPixels)
            put("success", true)
        }
    }
    
    /**
     * 设备：获取网络状态
     */
    private fun handleNetworkStatus(params: JSONObject): JSONObject {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as android.net.ConnectivityManager
        val networkInfo = connectivityManager.activeNetworkInfo
        
        return JSONObject().apply {
            put("connected", networkInfo?.isConnected == true)
            put("type", networkInfo?.typeName ?: "UNKNOWN")
            put("success", true)
        }
    }
    
    /**
     * 应用：获取配置
     */
    private fun handleAppConfig(params: JSONObject): JSONObject {
        return JSONObject().apply {
            put("baseUrl", "http://a.b.c")
            put("apiPrefix", "/xfbh/api/v1")
            put("mobilePrefix", "/xfbh/mobile")
            put("environment", "production")
            put("success", true)
        }
    }
    
    /**
     * 应用：打开模块
     */
    private fun handleOpenModule(params: JSONObject): JSONObject {
        val moduleId = params.optString("moduleId", "")
        // 实际打开模块的逻辑在MainActivity中处理
        // 这里只是返回成功
        return JSONObject().apply {
            put("success", true)
            put("moduleId", moduleId)
        }
    }
    
    /**
     * 应用：关闭模块
     */
    private fun handleCloseModule(params: JSONObject): JSONObject {
        val moduleId = params.optString("moduleId", "")
        // 实际关闭模块的逻辑在WebViewManager中处理
        return JSONObject().apply {
            put("success", true)
            put("moduleId", moduleId)
        }
    }
    
    /**
     * 文件：读取
     */
    private fun handleFileRead(params: JSONObject): JSONObject {
        // 简化实现
        return JSONObject().apply {
            put("success", false)
            put("error", "Not implemented")
        }
    }
    
    /**
     * 文件：写入
     */
    private fun handleFileWrite(params: JSONObject): JSONObject {
        // 简化实现
        return JSONObject().apply {
            put("success", false)
            put("error", "Not implemented")
        }
    }
    
    /**
     * 文件：删除
     */
    private fun handleFileDelete(params: JSONObject): JSONObject {
        // 简化实现
        return JSONObject().apply {
            put("success", false)
            put("error", "Not implemented")
        }
    }
    
    /**
     * 发送事件到JavaScript
     */
    fun sendEventToJavaScript(webView: WebView, eventName: String, data: JSONObject) {
        val eventMessage = JSONObject().apply {
            put("type", "event")
            put("event", eventName)
            put("data", data)
            put("timestamp", System.currentTimeMillis())
        }
        
        val javascript = """
            (function() {
                if (window.nativeBridge && window.nativeBridge.onEvent) {
                    window.nativeBridge.onEvent(${eventMessage.toString()});
                }
                window.dispatchEvent(new CustomEvent('nativeEvent', {
                    detail: ${eventMessage.toString()}
                }));
            })();
        """.trimIndent()
        
        // 在主线程执行
        webView.post {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
                webView.evaluateJavascript(javascript, null)
            } else {
                webView.loadUrl("javascript:$javascript")
            }
        }
    }
    
    /**
     * 注册事件监听器
     */
    fun addEventListener(eventName: String, listener: (JSONObject) -> Unit) {
        val listeners = eventListeners.getOrPut(eventName) { mutableListOf() }
        listeners.add(listener)
    }
    
    /**
     * 移除事件监听器
     */
    fun removeEventListener(eventName: String, listener: (JSONObject) -> Unit) {
        eventListeners[eventName]?.remove(listener)
    }
    
    /**
     * 触发事件
     */
    fun triggerEvent(eventName: String, data: JSONObject) {
        eventListeners[eventName]?.forEach { listener ->
            listener(data)
        }
    }
}

/**
 * 扫码结果数据类
 */
data class ScanResult(
    val success: Boolean,
    val data: String,
    val format: String,
    val timestamp: Long = System.currentTimeMillis()
)