package com.xfshopee;

import android.content.Context;
import android.content.SharedPreferences;
import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

import java.util.HashMap;
import java.util.Map;

@ReactModule(name = StorageModule.NAME)
public class StorageModule extends ReactContextBaseJavaModule {
    public static final String NAME = "StorageModule";
    
    private static final String PREFS_NAME = "xfshopee_storage";
    private SharedPreferences sharedPreferences;
    
    public StorageModule(ReactApplicationContext reactContext) {
        super(reactContext);
        sharedPreferences = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }
    
    @Override
    @NonNull
    public String getName() {
        return NAME;
    }
    
    @ReactMethod
    public void setItem(String key, String value, Promise promise) {
        try {
            SharedPreferences.Editor editor = sharedPreferences.edit();
            editor.putString(key, value);
            boolean success = editor.commit();
            if (success) {
                promise.resolve(true);
            } else {
                promise.reject("STORAGE_ERROR", "Failed to store value");
            }
        } catch (Exception e) {
            promise.reject("STORAGE_ERROR", e.getMessage(), e);
        }
    }
    
    @ReactMethod
    public void getItem(String key, Promise promise) {
        try {
            String value = sharedPreferences.getString(key, null);
            promise.resolve(value);
        } catch (Exception e) {
            promise.reject("STORAGE_ERROR", e.getMessage(), e);
        }
    }
    
    @ReactMethod
    public void removeItem(String key, Promise promise) {
        try {
            SharedPreferences.Editor editor = sharedPreferences.edit();
            editor.remove(key);
            boolean success = editor.commit();
            if (success) {
                promise.resolve(true);
            } else {
                promise.reject("STORAGE_ERROR", "Failed to remove item");
            }
        } catch (Exception e) {
            promise.reject("STORAGE_ERROR", e.getMessage(), e);
        }
    }
    
    @ReactMethod
    public void clear(Promise promise) {
        try {
            SharedPreferences.Editor editor = sharedPreferences.edit();
            editor.clear();
            boolean success = editor.commit();
            if (success) {
                promise.resolve(true);
            } else {
                promise.reject("STORAGE_ERROR", "Failed to clear storage");
            }
        } catch (Exception e) {
            promise.reject("STORAGE_ERROR", e.getMessage(), e);
        }
    }
}