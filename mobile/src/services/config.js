/**
 * Application Configuration
 */

// Backend API configuration
// Development: http://localhost:3000/api
// Production: https://your-domain.com/xfbh/api
export const API_CONFIG = {
  BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000/api',
  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// Web Admin URLs (for WebView loading)
// Development: http://localhost:3001
// Production: https://your-domain.com/xfbh/admin
export const WEB_ADMIN_URLS = {
  BASE: process.env.WEB_ADMIN_BASE_URL || 'http://localhost:3001',
  DASHBOARD: process.env.WEB_ADMIN_DASHBOARD_URL || '/dashboard',
  SKU_MANAGEMENT: process.env.WEB_ADMIN_SKU_URL || '/products',
  ORDER_MANAGEMENT: process.env.WEB_ADMIN_ORDER_URL || '/orders',
  USER_MANAGEMENT: process.env.WEB_ADMIN_USER_URL || '/users',
  LOGIN: process.env.WEB_ADMIN_LOGIN_URL || '/login',
  PROFILE: process.env.WEB_ADMIN_PROFILE_URL || '/profile',
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