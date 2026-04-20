/**
 * Base WebView Component
 * 
 * Provides common WebView functionality with bridge communication.
 */

import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import WebView from 'react-native-webview';
import Bridge from '../native/BridgeModule';

const BaseWebView = ({
  source,
  onMessage,
  onLoadStart,
  onLoadEnd,
  onError,
  injectedJavaScript,
  style,
  ...props
}) => {
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle loading states
  const handleLoadStart = () => {
    setLoading(true);
    setError(null);
    onLoadStart?.();
  };

  const handleLoadEnd = () => {
    setLoading(false);
    onLoadEnd?.();
  };

  const handleError = (event) => {
    setLoading(false);
    setError(event.nativeEvent.description);
    console.error('WebView error:', event.nativeEvent);
    onError?.(event);
  };

  // Handle messages from WebView
  const handleMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('Received message from WebView:', message);
      onMessage?.(message);
    } catch (error) {
      console.error('Failed to parse WebView message:', error);
    }
  };

  // Send message to WebView
  const sendMessage = (message) => {
    if (webViewRef.current) {
      const messageStr = JSON.stringify(message);
      webViewRef.current.injectJavaScript(`
        (function() {
          window.dispatchEvent(new MessageEvent('message', {
            data: ${messageStr}
          }));
        })();
      `);
    }
  };

  // Inject cookies before loading
  const injectCookies = async () => {
    try {
      // Get stored authentication cookies
      const token = await Bridge.getStorageItem('user_token');
      if (token) {
        const cookies = [
          `session_token=${token}; path=/; secure`,
          'user_role=employee; path=/',
        ];
        await Bridge.injectCookies(cookies);
      }
    } catch (error) {
      console.error('Failed to inject cookies:', error);
    }
  };

  // Inject bridge API into WebView
  const getInjectedJavaScript = () => {
    const bridgeScript = `
      // Native Bridge API
      window.nativeBridge = {
        setStorage: (key, value) => {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'SET_STORAGE',
            data: { key, value }
          }));
        },
        getStorage: (key) => {
          const callbackId = Date.now().toString();
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'GET_STORAGE',
            data: { key, callbackId }
          }));
          return new Promise(resolve => {
            window['callback_' + callbackId] = resolve;
          });
        },
        scanBarcode: () => {
          const callbackId = Date.now().toString();
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'SCAN_BARCODE',
            data: { callbackId }
          }));
          return new Promise(resolve => {
            window['callback_' + callbackId] = resolve;
          });
        },
        scanQRCode: () => {
          const callbackId = Date.now().toString();
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'SCAN_QRCODE',
            data: { callbackId }
          }));
          return new Promise(resolve => {
            window['callback_' + callbackId] = resolve;
          });
        },
        getPlatform: () => {
          return '${Bridge.platform}';
        },
        isNativeAvailable: ${JSON.stringify(Bridge.isNativeAvailable)}
      };

      // Notify that bridge is ready
      window.dispatchEvent(new Event('nativeBridgeReady'));
      console.log('Native Bridge injected');

      // Existing injected JavaScript
      ${injectedJavaScript || ''}
    `;

    return bridgeScript;
  };

  // Handle initial load
  useEffect(() => {
    injectCookies();
  }, []);

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={source}
        style={styles.webview}
        onMessage={handleMessage}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        injectedJavaScript={getInjectedJavaScript()}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1890ff" />
          </View>
        )}
        {...props}
      />
      {loading && !error && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#1890ff" />
        </View>
      )}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load content</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    margin: 16,
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
  },
});

export default BaseWebView;
export { BaseWebView };