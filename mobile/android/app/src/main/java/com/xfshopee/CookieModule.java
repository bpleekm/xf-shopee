package com.xfshopee;

import android.webkit.CookieManager;
import android.webkit.ValueCallback;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.module.annotations.ReactModule;

import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@ReactModule(name = CookieModule.NAME)
public class CookieModule extends ReactContextBaseJavaModule {
    public static final String NAME = "CookieModule";
    
    private final CookieManager cookieManager;
    
    public CookieModule(ReactApplicationContext reactContext) {
        super(reactContext);
        cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(null, true);
    }
    
    @Override
    @NonNull
    public String getName() {
        return NAME;
    }
    
    @ReactMethod
    public void injectCookies(List<String> cookieStrings, Promise promise) {
        try {
            if (cookieStrings == null || cookieStrings.isEmpty()) {
                promise.resolve(true);
                return;
            }
            
            for (String cookieString : cookieStrings) {
                // Parse cookie string (format: "name=value; path=/; secure; domain=.example.com")
                String[] parts = cookieString.split(";");
                if (parts.length == 0) {
                    continue;
                }
                
                String nameValue = parts[0].trim();
                String[] nameValueParts = nameValue.split("=");
                if (nameValueParts.length != 2) {
                    continue;
                }
                
                String name = nameValueParts[0].trim();
                String value = nameValueParts[1].trim();
                
                // Extract domain and path
                String domain = "xfshopee.com";
                String path = "/";
                boolean secure = false;
                boolean httpOnly = false;
                
                for (int i = 1; i < parts.length; i++) {
                    String part = parts[i].trim().toLowerCase();
                    if (part.startsWith("domain=")) {
                        domain = part.substring(7).trim();
                        if (domain.startsWith(".")) {
                            domain = domain.substring(1);
                        }
                    } else if (part.startsWith("path=")) {
                        path = part.substring(5).trim();
                    } else if (part.equals("secure")) {
                        secure = true;
                    } else if (part.equals("httponly")) {
                        httpOnly = true;
                    }
                }
                
                // Build cookie string for CookieManager
                StringBuilder cookieBuilder = new StringBuilder();
                cookieBuilder.append(name).append("=").append(value);
                cookieBuilder.append("; domain=").append(domain);
                cookieBuilder.append("; path=").append(path);
                if (secure) {
                    cookieBuilder.append("; secure");
                }
                if (httpOnly) {
                    cookieBuilder.append("; httponly");
                }
                
                String url = "https://" + domain + path;
                cookieManager.setCookie(url, cookieBuilder.toString());
            }
            
            // Flush cookies
            cookieManager.flush();
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("COOKIE_ERROR", e.getMessage(), e);
        }
    }
    
    @ReactMethod
    public void getCookies(String domain, Promise promise) {
        try {
            String url = "https://" + (domain != null ? domain : "xfshopee.com");
            String cookies = cookieManager.getCookie(url);
            
            List<String> cookieList = new ArrayList<>();
            if (cookies != null && !cookies.isEmpty()) {
                String[] cookieArray = cookies.split(";");
                for (String cookie : cookieArray) {
                    cookieList.add(cookie.trim());
                }
            }
            
            // Convert to React Native array
            WritableArray cookieArray = new WritableNativeArray();
            for (String cookie : cookieList) {
                cookieArray.pushString(cookie);
            }
            
            promise.resolve(cookieArray);
        } catch (Exception e) {
            promise.reject("COOKIE_ERROR", e.getMessage(), e);
        }
    }
    
    @ReactMethod
    public void clearCookies(Promise promise) {
        try {
            cookieManager.removeAllCookies(new ValueCallback<Boolean>() {
                @Override
                public void onReceiveValue(Boolean value) {
                    cookieManager.flush();
                    promise.resolve(value);
                }
            });
        } catch (Exception e) {
            promise.reject("COOKIE_ERROR", e.getMessage(), e);
        }
    }
}