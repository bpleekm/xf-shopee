package com.xfshopee

import android.annotation.SuppressLint
import android.content.Context
import android.webkit.CookieManager as WebKitCookieManager
import android.webkit.ValueCallback

/**
 * Cookie管理器
 * 
 * 提供统一的Cookie管理功能，支持跨WebView的Cookie同步
 * 封装Android WebKit的CookieManager，提供更友好的API
 */
class CookieManager(private val context: Context) {
    
    companion object {
        // 默认域名
        private const val DEFAULT_DOMAIN = "a.b.c"
        private const val DEFAULT_PATH = "/"
    }
    
    // Android WebKit CookieManager
    private val webKitCookieManager: WebKitCookieManager by lazy {
        WebKitCookieManager.getInstance().apply {
            setAcceptCookie(true)
            setAcceptThirdPartyCookies(null, true)
        }
    }
    
    // 内存中的Cookie缓存（用于快速访问）
    private val cookieCache: MutableMap<String, MutableMap<String, String>> = mutableMapOf()
    
    /**
     * 设置Cookie
     * @param domain 域名（如 "a.b.c"）
     * @param cookieString Cookie字符串（如 "session_token=abc123; path=/; secure"）
     */
    fun setCookie(domain: String, cookieString: String) {
        val url = if (domain.startsWith("http")) domain else "https://$domain"
        
        // 设置到WebKit
        webKitCookieManager.setCookie(url, cookieString)
        
        // 更新缓存
        updateCache(domain, cookieString)
    }
    
    /**
     * 设置Cookie（简化版）
     */
    fun setCookie(name: String, value: String, domain: String = DEFAULT_DOMAIN) {
        val cookieString = "$name=$value; path=$DEFAULT_PATH; domain=$domain"
        setCookie(domain, cookieString)
    }
    
    /**
     * 获取指定域名的所有Cookie
     */
    fun getCookies(domain: String = DEFAULT_DOMAIN): List<String> {
        val url = if (domain.startsWith("http")) domain else "https://$domain"
        val cookies = webKitCookieManager.getCookie(url)
        
        return cookies?.split(";")?.map { it.trim() } ?: emptyList()
    }
    
    /**
     * 获取指定Cookie的值
     */
    fun getCookie(name: String, domain: String = DEFAULT_DOMAIN): String? {
        // 先从缓存查找
        val domainCookies = cookieCache[domain]
        if (domainCookies != null && domainCookies.containsKey(name)) {
            return domainCookies[name]
        }
        
        // 从WebKit获取
        val cookies = getCookies(domain)
        for (cookie in cookies) {
            if (cookie.startsWith("$name=")) {
                val value = cookie.substringAfter("=")
                
                // 更新缓存
                val cache = cookieCache.getOrPut(domain) { mutableMapOf() }
                cache[name] = value
                
                return value
            }
        }
        
        return null
    }
    
    /**
     * 移除指定Cookie
     */
    fun removeCookie(name: String, domain: String = DEFAULT_DOMAIN) {
        // 设置过期时间（过去的时间）来删除Cookie
        val expiredCookie = "$name=; path=$DEFAULT_PATH; domain=$domain; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        setCookie(domain, expiredCookie)
        
        // 从缓存移除
        cookieCache[domain]?.remove(name)
    }
    
    /**
     * 清空指定域名的所有Cookie
     */
    fun clearCookies(domain: String = DEFAULT_DOMAIN) {
        val url = if (domain.startsWith("http")) domain else "https://$domain"
        
        // 获取所有Cookie并逐个删除
        val cookies = getCookies(domain)
        for (cookie in cookies) {
            val name = cookie.substringBefore("=").trim()
            removeCookie(name, domain)
        }
        
        // 清空缓存
        cookieCache.remove(domain)
    }
    
    /**
     * 清空所有Cookie
     */
    @SuppressLint("NewApi")
    fun clearAllCookies() {
        // 清空WebKit Cookie
        webKitCookieManager.removeAllCookies(null)
        webKitCookieManager.flush()
        
        // 清空缓存
        cookieCache.clear()
    }
    
    /**
     * 将Cookie注入到所有WebView
     */
    fun syncToAllWebViews(webViews: List<android.webkit.WebView>) {
        // WebKit CookieManager已经全局管理Cookie
        // 这里只需要确保所有WebView都启用了Cookie
        webViews.forEach { webView ->
            webView.settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
            }
        }
        
        // 刷新Cookie
        webKitCookieManager.flush()
    }
    
    /**
     * 从WebView同步Cookie到管理器
     */
    fun syncFromWebView(webView: android.webkit.WebView, domain: String = DEFAULT_DOMAIN) {
        // WebKit CookieManager是全局的，无需手动同步
        // 但可以更新缓存
        val url = webView.url ?: return
        if (url.contains(domain)) {
            val cookies = webKitCookieManager.getCookie(url)
            if (cookies != null) {
                updateCache(domain, cookies)
            }
        }
    }
    
    /**
     * 导出所有Cookie（用于调试或备份）
     */
    fun exportAllCookies(): Map<String, List<String>> {
        val result = mutableMapOf<String, List<String>>()
        
        // 导出缓存中的所有域名
        cookieCache.keys.forEach { domain ->
            result[domain] = getCookies(domain)
        }
        
        return result
    }
    
    /**
     * 导入Cookie（用于恢复）
     */
    fun importCookies(cookies: Map<String, List<String>>) {
        cookies.forEach { (domain, cookieList) ->
            cookieList.forEach { cookieString ->
                setCookie(domain, cookieString)
            }
        }
    }
    
    /**
     * 检查Cookie是否已设置
     */
    fun hasCookie(name: String, domain: String = DEFAULT_DOMAIN): Boolean {
        return getCookie(name, domain) != null
    }
    
    /**
     * 获取Cookie的过期时间（如果设置）
     */
    fun getCookieExpiry(name: String, domain: String = DEFAULT_DOMAIN): Long? {
        // 简化实现：返回null表示会话Cookie
        // 在实际应用中，需要解析Cookie字符串中的expires/max-age属性
        return null
    }
    
    /**
     * 设置安全Cookie（HTTPS only）
     */
    fun setSecureCookie(name: String, value: String, domain: String = DEFAULT_DOMAIN) {
        val cookieString = "$name=$value; path=$DEFAULT_PATH; domain=$domain; secure"
        setCookie(domain, cookieString)
    }
    
    /**
     * 设置HttpOnly Cookie
     * 注意：Android WebKit不支持通过JavaScript设置HttpOnly标志
     * 这个标志通常在服务器设置
     */
    fun setHttpOnlyCookie(name: String, value: String, domain: String = DEFAULT_DOMAIN) {
        val cookieString = "$name=$value; path=$DEFAULT_PATH; domain=$domain; httponly"
        setCookie(domain, cookieString)
    }
    
    /**
     * 设置带过期时间的Cookie
     */
    fun setCookieWithExpiry(
        name: String,
        value: String,
        expirySeconds: Long,
        domain: String = DEFAULT_DOMAIN
    ) {
        val expiryDate = java.util.Date(System.currentTimeMillis() + expirySeconds * 1000)
        val expiryString = java.text.SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss z", java.util.Locale.US).format(expiryDate)
        
        val cookieString = "$name=$value; path=$DEFAULT_PATH; domain=$domain; expires=$expiryString"
        setCookie(domain, cookieString)
    }
    
    /**
     * 更新缓存
     */
    private fun updateCache(domain: String, cookieString: String) {
        val cookies = cookieString.split(";")
        val cache = cookieCache.getOrPut(domain) { mutableMapOf() }
        
        cookies.forEach { cookie ->
            if (cookie.contains("=")) {
                val parts = cookie.split("=", limit = 2)
                if (parts.size == 2) {
                    val name = parts[0].trim()
                    val value = parts[1].trim()
                    
                    // 检查是否是删除操作（值为空）
                    if (value.isEmpty() || cookie.contains("expires=Thu, 01 Jan 1970")) {
                        cache.remove(name)
                    } else {
                        cache[name] = value
                    }
                }
            }
        }
    }
    
    /**
     * 打印所有Cookie（调试用）
     */
    fun printAllCookies() {
        println("=== All Cookies ===")
        cookieCache.forEach { (domain, cookies) ->
            println("Domain: $domain")
            cookies.forEach { (name, value) ->
                println("  $name=$value")
            }
        }
        println("===================")
    }
    
    /**
     * 清除过期Cookie
     */
    fun clearExpiredCookies() {
        // 简化实现：清除所有Cookie中过期的
        // 在实际应用中，需要检查每个Cookie的expires属性
        val now = System.currentTimeMillis()
        
        cookieCache.forEach { (domain, cookies) ->
            // 这里可以添加逻辑检查Cookie是否过期
            // 暂时不清除，因为Android WebKit会自动管理
        }
    }
}