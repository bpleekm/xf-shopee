package com.xfshopee;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.module.annotations.ReactModule;

// We'll use a simple intent-based scanner for now
// In production, consider using a proper barcode scanning library

@ReactModule(name = ScannerModule.NAME)
public class ScannerModule extends ReactContextBaseJavaModule {
    public static final String NAME = "ScannerModule";
    
    private static final int CAMERA_PERMISSION_REQUEST = 1001;
    private static final int SCANNER_REQUEST = 1002;
    
    private Promise scanPromise;
    private String currentScanType = "barcode";
    
    private final ActivityEventListener activityEventListener = new BaseActivityEventListener() {
        @Override
        public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
            if (requestCode == SCANNER_REQUEST) {
                if (scanPromise != null) {
                    if (resultCode == Activity.RESULT_OK && data != null) {
                        String result = data.getStringExtra("SCAN_RESULT");
                        String format = data.getStringExtra("SCAN_FORMAT");
                        
                        if (result != null) {
                            // Return success with data
                            WritableMap resultMap = new WritableNativeMap();
                            resultMap.putBoolean("success", true);
                            resultMap.putString("data", result);
                            resultMap.putString("format", format != null ? format : "UNKNOWN");
                            resultMap.putDouble("timestamp", System.currentTimeMillis());
                            
                            scanPromise.resolve(resultMap);
                        } else {
                            scanPromise.reject("SCAN_CANCELLED", "Scan was cancelled or failed");
                        }
                    } else {
                        scanPromise.reject("SCAN_CANCELLED", "Scan was cancelled");
                    }
                    scanPromise = null;
                }
            }
        }
    };
    
    public ScannerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addActivityEventListener(activityEventListener);
    }
    
    @Override
    @NonNull
    public String getName() {
        return NAME;
    }
    
    @ReactMethod
    public void scanBarcode(Promise promise) {
        currentScanType = "barcode";
        startScan(promise);
    }
    
    @ReactMethod
    public void scanQRCode(Promise promise) {
        currentScanType = "qr";
        startScan(promise);
    }
    
    private void startScan(Promise promise) {
        Activity currentActivity = getCurrentActivity();
        
        if (currentActivity == null) {
            promise.reject("SCANNER_ERROR", "No activity found");
            return;
        }
        
        // Check camera permission
        if (ContextCompat.checkSelfPermission(currentActivity, Manifest.permission.CAMERA)
                != PackageManager.PERMISSION_GRANTED) {
            scanPromise = promise;
            ActivityCompat.requestPermissions(currentActivity,
                    new String[]{Manifest.permission.CAMERA},
                    CAMERA_PERMISSION_REQUEST);
            return;
        }
        
        // Start scanner activity
        scanPromise = promise;
        launchScanner(currentActivity);
    }
    
    private void launchScanner(Activity activity) {
        // For now, we'll use a simple approach that returns mock data
        // In production, you would launch a proper scanner activity
        
        // Simulate scanning with a delayed result
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
            if (scanPromise != null) {
                // Create mock result
                WritableMap result = new WritableNativeMap();
                result.putBoolean("success", true);
                
                if ("qr".equals(currentScanType)) {
                    result.putString("data", "https://xfshopee.com/product/123");
                    result.putString("format", "QR_CODE");
                } else {
                    result.putString("data", "123456789012");
                    result.putString("format", "EAN_13");
                }
                
                result.putDouble("timestamp", System.currentTimeMillis());
                
                scanPromise.resolve(result);
                scanPromise = null;
            }
        }, 1500);
        
        // Note: In production, you would use:
        // Intent intent = new Intent(activity, ScannerActivity.class);
        // intent.putExtra("SCAN_TYPE", currentScanType);
        // activity.startActivityForResult(intent, SCANNER_REQUEST);
    }
    
    // Handle permission result
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions,
                                          @NonNull int[] grantResults) {
        if (requestCode == CAMERA_PERMISSION_REQUEST && scanPromise != null) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                Activity currentActivity = getCurrentActivity();
                if (currentActivity != null) {
                    launchScanner(currentActivity);
                } else {
                    scanPromise.reject("SCANNER_ERROR", "No activity found");
                    scanPromise = null;
                }
            } else {
                scanPromise.reject("CAMERA_PERMISSION_DENIED", "Camera permission denied");
                scanPromise = null;
            }
        }
    }
}