import WebKit

extension WKWebView {
    
    // MARK: - JavaScript Evaluation
    
    /// 安全执行JavaScript代码
    func safeEvaluateJavaScript(_ javaScriptString: String, completionHandler: ((Any?, Error?) -> Void)? = nil) {
        DispatchQueue.main.async {
            self.evaluateJavaScript(javaScriptString, completionHandler: completionHandler)
        }
    }
    
    /// 注入JavaScript Bridge脚本
    func injectJavaScriptBridge() {
        let bridgeScript = """
        // 原生桥接接口
        window.NativeBridge = {
            // 存储原生回调
            _callbacks: {},
            _callbackId: 0,
            
            // 调用原生方法
            callNative: function(action, params = {}) {
                return new Promise((resolve, reject) => {
                    const callbackId = 'callback_' + (++this._callbackId);
                    this._callbacks[callbackId] = { resolve, reject };
                    
                    // 发送消息到原生层
                    const message = {
                        messageId: 'msg_' + Date.now(),
                        action: action,
                        params: params,
                        callbackId: callbackId,
                        timestamp: Date.now()
                    };
                    
                    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.nativeBridge) {
                        window.webkit.messageHandlers.nativeBridge.postMessage(message);
                    } else {
                        console.error('Native bridge not available');
                        reject(new Error('Native bridge not available'));
                    }
                });
            },
            
            // 添加事件监听器
            addEventListener: function(eventName, callback) {
                if (!this._eventListeners) this._eventListeners = {};
                if (!this._eventListeners[eventName]) this._eventListeners[eventName] = [];
                this._eventListeners[eventName].push(callback);
            },
            
            // 移除事件监听器
            removeEventListener: function(eventName, callback) {
                if (!this._eventListeners || !this._eventListeners[eventName]) return;
                const index = this._eventListeners[eventName].indexOf(callback);
                if (index > -1) this._eventListeners[eventName].splice(index, 1);
            },
            
            // 触发事件（由原生层调用）
            _triggerEvent: function(eventName, eventData) {
                if (!this._eventListeners || !this._eventListeners[eventName]) return;
                this._eventListeners[eventName].forEach(callback => {
                    try {
                        callback(eventData);
                    } catch (error) {
                        console.error('Error in event listener:', error);
                    }
                });
            },
            
            // 处理原生响应（由原生层调用）
            _handleNativeResponse: function(response) {
                const callback = this._callbacks[response.callbackId];
                if (callback) {
                    if (response.success) {
                        callback.resolve(response.data);
                    } else {
                        callback.reject(new Error(response.error?.message || 'Unknown error'));
                    }
                    delete this._callbacks[response.callbackId];
                }
            },
            
            // 设备信息
            getDeviceInfo: function() {
                return this.callNative('device.getInfo');
            },
            
            // 存储API
            storage: {
                setItem: function(key, value) {
                    return window.NativeBridge.callNative('storage.setItem', { key, value });
                },
                getItem: function(key) {
                    return window.NativeBridge.callNative('storage.getItem', { key });
                },
                removeItem: function(key) {
                    return window.NativeBridge.callNative('storage.removeItem', { key });
                },
                clear: function() {
                    return window.NativeBridge.callNative('storage.clear');
                }
            },
            
            // 扫码API
            scanner: {
                startScan: function(options = {}) {
                    return window.NativeBridge.callNative('scanner.startScan', options);
                },
                scanFromImage: function(imageData) {
                    return window.NativeBridge.callNative('scanner.scanFromImage', { imageData });
                }
            },
            
            // 网络API
            network: {
                getStatus: function() {
                    return window.NativeBridge.callNative('network.getStatus');
                }
            },
            
            // Cookie API
            cookie: {
                set: function(name, value, options = {}) {
                    return window.NativeBridge.callNative('cookie.set', { name, value, options });
                },
                get: function(name) {
                    return window.NativeBridge.callNative('cookie.get', { name });
                },
                remove: function(name) {
                    return window.NativeBridge.callNative('cookie.remove', { name });
                },
                getAll: function() {
                    return window.NativeBridge.callNative('cookie.getAll');
                }
            },
            
            // 导航API
            navigation: {
                goBack: function() {
                    return window.NativeBridge.callNative('navigation.goBack');
                },
                goForward: function() {
                    return window.NativeBridge.callNative('navigation.goForward');
                },
                reload: function() {
                    return window.NativeBridge.callNative('navigation.reload');
                },
                openExternal: function(url) {
                    return window.NativeBridge.callNative('navigation.openExternal', { url });
                }
            }
        };
        
        // 注入完成后通知
        console.log('NativeBridge injected successfully');
        """
        
        // 创建用户脚本
        let script = WKUserScript(
            source: bridgeScript,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        )
        
        configuration.userContentController.addUserScript(script)
        
        // 添加消息处理器
        configuration.userContentController.add(JavaScriptBridge.shared, name: "nativeBridge")
    }
    
    // MARK: - Cookie Management
    
    /// 获取所有Cookie
    func getAllCookies(completion: @escaping ([HTTPCookie]) -> Void) {
        configuration.websiteDataStore.httpCookieStore.getAllCookies { cookies in
            completion(cookies)
        }
    }
    
    /// 设置Cookie
    func setCookie(_ cookie: HTTPCookie, completion: (() -> Void)? = nil) {
        configuration.websiteDataStore.httpCookieStore.setCookie(cookie) {
            completion?()
        }
    }
    
    /// 清除所有Cookie
    func clearCookies(completion: (() -> Void)? = nil) {
        let websiteDataStore = configuration.websiteDataStore
        websiteDataStore.fetchDataRecords(ofTypes: WKWebsiteDataStore.allWebsiteDataTypes()) { records in
            websiteDataStore.removeData(ofTypes: WKWebsiteDataStore.allWebsiteDataTypes(),
                                       for: records) {
                completion?()
            }
        }
    }
    
    // MARK: - Cache Management
    
    /// 清除缓存
    func clearCache(completion: (() -> Void)? = nil) {
        if #available(iOS 11.3, *) {
            let websiteDataStore = configuration.websiteDataStore
            websiteDataStore.removeData(ofTypes: [WKWebsiteDataTypeDiskCache,
                                                 WKWebsiteDataTypeMemoryCache,
                                                 WKWebsiteDataTypeOfflineWebApplicationCache],
                                       modifiedSince: Date(timeIntervalSince1970: 0)) {
                completion?()
            }
        } else {
            URLCache.shared.removeAllCachedResponses()
            completion?()
        }
    }
    
    // MARK: - Screenshot
    
    /// 截取WebView截图
    func takeScreenshot(completion: @escaping (UIImage?) -> Void) {
        let config = WKSnapshotConfiguration()
        config.rect = CGRect(origin: .zero, size: self.scrollView.contentSize)
        
        if #available(iOS 13.0, *) {
            self.takeSnapshot(with: config) { image, error in
                completion(image)
            }
        } else {
            // iOS 13以下版本使用旧方法
            UIGraphicsBeginImageContextWithOptions(self.scrollView.contentSize, false, 0)
            self.scrollView.layer.render(in: UIGraphicsGetCurrentContext()!)
            let image = UIGraphicsGetImageFromCurrentImageContext()
            UIGraphicsEndImageContext()
            completion(image)
        }
    }
    
    // MARK: - URL Loading
    
    /// 安全加载URL
    func safeLoadURL(_ urlString: String, timeout: TimeInterval = 30) {
        guard let url = URL(string: urlString) else {
            print("Invalid URL: \(urlString)")
            return
        }
        
        let request = URLRequest(url: url, timeoutInterval: timeout)
        self.load(request)
    }
    
    /// 加载本地HTML文件
    func loadLocalHTMLFile(named fileName: String, in bundle: Bundle = .main) {
        guard let filePath = bundle.path(forResource: fileName, ofType: "html") else {
            print("HTML file not found: \(fileName)")
            return
        }
        
        let fileURL = URL(fileURLWithPath: filePath)
        self.loadFileURL(fileURL, allowingReadAccessTo: fileURL.deletingLastPathComponent())
    }
    
    // MARK: - JavaScript Dialog Handlers
    
    /// 显示JavaScript警告框
    func showJavaScriptAlert(message: String, from viewController: UIViewController, completion: @escaping () -> Void) {
        let alert = UIAlertController(title: "提示", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "确定", style: .default) { _ in
            completion()
        })
        viewController.present(alert, animated: true, completion: nil)
    }
    
    /// 显示JavaScript确认框
    func showJavaScriptConfirm(message: String, from viewController: UIViewController, completion: @escaping (Bool) -> Void) {
        let alert = UIAlertController(title: "确认", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "确定", style: .default) { _ in
            completion(true)
        })
        alert.addAction(UIAlertAction(title: "取消", style: .cancel) { _ in
            completion(false)
        })
        viewController.present(alert, animated: true, completion: nil)
    }
    
    /// 显示JavaScript输入框
    func showJavaScriptPrompt(message: String, defaultText: String?, from viewController: UIViewController, completion: @escaping (String?) -> Void) {
        let alert = UIAlertController(title: "输入", message: message, preferredStyle: .alert)
        alert.addTextField { textField in
            textField.text = defaultText
        }
        alert.addAction(UIAlertAction(title: "确定", style: .default) { _ in
            let text = alert.textFields?.first?.text
            completion(text)
        })
        alert.addAction(UIAlertAction(title: "取消", style: .cancel) { _ in
            completion(nil)
        })
        viewController.present(alert, animated: true, completion: nil)
    }
}