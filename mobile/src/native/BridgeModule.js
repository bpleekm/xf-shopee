/**
 * Native Bridge Module
 * 
 * Provides a unified interface for native functionality.
 * Falls back to mock implementations when native modules are not available.
 */

import { NativeModules, Platform } from 'react-native';

// Native module references
const { StorageModule, ScannerModule, CookieModule } = NativeModules;

// Mock implementations for development
const mockStorage = {
  setItem: async (key, value) => {
    console.log(`[Mock Storage] setItem: ${key} = ${value}`);
    await localStorage.setItem(key, value);
    return true;
  },
  getItem: async (key) => {
    console.log(`[Mock Storage] getItem: ${key}`);
    return localStorage.getItem(key);
  },
  removeItem: async (key) => {
    console.log(`[Mock Storage] removeItem: ${key}`);
    localStorage.removeItem(key);
    return true;
  },
  clear: async () => {
    console.log('[Mock Storage] clear');
    localStorage.clear();
    return true;
  },
};

const mockScanner = {
  scanBarcode: async () => {
    console.log('[Mock Scanner] scanBarcode');
    // Simulate scanning after 1 second
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: '123456789012',
          format: 'EAN_13',
          timestamp: Date.now(),
        });
      }, 1000);
    });
  },
  scanQRCode: async () => {
    console.log('[Mock Scanner] scanQRCode');
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: 'https://xfshopee.com/product/123',
          format: 'QR_CODE',
          timestamp: Date.now(),
        });
      }, 1000);
    });
  },
};

const mockCookie = {
  injectCookies: async (cookies) => {
    console.log(`[Mock Cookie] injectCookies: ${JSON.stringify(cookies)}`);
    return true;
  },
  getCookies: async (domain) => {
    console.log(`[Mock Cookie] getCookies for domain: ${domain}`);
    return [];
  },
  clearCookies: async () => {
    console.log('[Mock Cookie] clearCookies');
    return true;
  },
};

// Determine if native modules are available
const isNativeAvailable = {
  storage: !!StorageModule,
  scanner: !!ScannerModule,
  cookie: !!CookieModule,
};

// Export the appropriate implementation
export const Bridge = {
  storage: isNativeAvailable.storage ? StorageModule : mockStorage,
  scanner: isNativeAvailable.scanner ? ScannerModule : mockScanner,
  cookie: isNativeAvailable.cookie ? CookieModule : mockCookie,
  platform: Platform.OS,
  isNativeAvailable,
};

// Convenience methods
export const setStorageItem = (key, value) => Bridge.storage.setItem(key, value);
export const getStorageItem = (key) => Bridge.storage.getItem(key);
export const removeStorageItem = (key) => Bridge.storage.removeItem(key);
export const clearStorage = () => Bridge.storage.clear();

export const scanBarcode = () => Bridge.scanner.scanBarcode();
export const scanQRCode = () => Bridge.scanner.scanQRCode();

export const injectCookies = (cookies) => Bridge.cookie.injectCookies(cookies);
export const getCookies = (domain) => Bridge.cookie.getCookies(domain);
export const clearCookies = () => Bridge.cookie.clearCookies();

export default Bridge;