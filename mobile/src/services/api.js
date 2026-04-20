/**
 * API Service
 * 
 * Handles all HTTP requests to the backend API.
 */

import axios from 'axios';
import Bridge from '../native/BridgeModule';
import { API_CONFIG, STORAGE_KEYS } from './config';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
});

// Request interceptor to add authentication token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await Bridge.getStorageItem(STORAGE_KEYS.USER_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to get auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh token
        const refreshToken = await Bridge.getStorageItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          
          const { token, refreshToken: newRefreshToken } = response.data;
          
          // Store new tokens
          await Bridge.setStorageItem(STORAGE_KEYS.USER_TOKEN, token);
          await Bridge.setStorageItem('refresh_token', newRefreshToken);
          
          // Update authorization header
          originalRequest.headers.Authorization = `Bearer ${token}`;
          
          // Retry original request
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Redirect to login
        // TODO: Implement navigation to login screen
      }
    }
    
    // Handle other errors
    return Promise.reject(error);
  }
);

// API endpoints
const api = {
  // Auth
  auth: {
    login: (credentials) => apiClient.post('/auth/login', credentials),
    logout: () => apiClient.post('/auth/logout'),
    refresh: (refreshToken) => apiClient.post('/auth/refresh', { refreshToken }),
    getCurrentUser: () => apiClient.get('/auth/me'),
  },
  
  // SKU Management
  sku: {
    getAll: (params) => apiClient.get('/sku', { params }),
    getById: (id) => apiClient.get(`/sku/${id}`),
    create: (data) => apiClient.post('/sku', data),
    update: (id, data) => apiClient.put(`/sku/${id}`, data),
    delete: (id) => apiClient.delete(`/sku/${id}`),
    search: (query) => apiClient.get('/sku/search', { params: { q: query } }),
    byCategory: (category) => apiClient.get(`/sku/category/${category}`),
  },
  
  // Order Management
  order: {
    getAll: (params) => apiClient.get('/orders', { params }),
    getById: (id) => apiClient.get(`/orders/${id}`),
    create: (data) => apiClient.post('/orders', data),
    updateStatus: (id, status) => apiClient.patch(`/orders/${id}/status`, { status }),
    search: (query) => apiClient.get('/orders/search', { params: { q: query } }),
    getByUser: (userId) => apiClient.get(`/orders/user/${userId}`),
  },
  
  // User Management (for employee profiles)
  user: {
    getProfile: () => apiClient.get('/users/profile'),
    updateProfile: (data) => apiClient.put('/users/profile', data),
    changePassword: (data) => apiClient.post('/users/change-password', data),
  },
  
  // Inventory
  inventory: {
    getStock: (skuId) => apiClient.get(`/inventory/${skuId}`),
    updateStock: (skuId, data) => apiClient.put(`/inventory/${skuId}`, data),
    getLowStock: () => apiClient.get('/inventory/low-stock'),
  },
  
  // Scanner
  scanner: {
    lookupBarcode: (barcode) => apiClient.get(`/scanner/lookup/${barcode}`),
    batchLookup: (barcodes) => apiClient.post('/scanner/batch-lookup', { barcodes }),
  },
};

export default api;