/**
 * Application Configuration
 */

// Backend API configuration
export const API_CONFIG = {
  BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000/api',
  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// Web Admin URLs (for WebView loading)
export const WEB_ADMIN_URLS = {
  DASHBOARD: process.env.WEB_ADMIN_DASHBOARD_URL || 'http://localhost:3001/dashboard',
  SKU_MANAGEMENT: process.env.WEB_ADMIN_SKU_URL || 'http://localhost:3001/products',
  ORDER_MANAGEMENT: process.env.WEB_ADMIN_ORDER_URL || 'http://localhost:3001/orders',
  USER_MANAGEMENT: process.env.WEB_ADMIN_USER_URL || 'http://localhost:3001/users',
  LOGIN: process.env.WEB_ADMIN_LOGIN_URL || 'http://localhost:3001/login',
};

// Mobile App Configuration
export const APP_CONFIG = {
  NAME: 'XF Shopee Mobile',
  VERSION: '1.0.0',
  ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
};

// Storage Keys
export const STORAGE_KEYS = {
  USER_TOKEN: 'user_token',
  USER_INFO: 'user_info',
  SETTINGS: 'app_settings',
  CACHE: 'app_cache',
};

// Feature Flags
export const FEATURES = {
  ENABLE_SCANNER: true,
  ENABLE_OFFLINE_MODE: false,
  ENABLE_PUSH_NOTIFICATIONS: false,
};

export default {
  API_CONFIG,
  WEB_ADMIN_URLS,
  APP_CONFIG,
  STORAGE_KEYS,
  FEATURES,
};