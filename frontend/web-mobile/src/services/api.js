import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// 专门用于刷新令牌的axios实例（避免拦截器循环）
const refreshApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

// 创建主axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 - 处理错误 + 自动刷新token
api.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (data && typeof data === 'object') {
      if (data.success === true) {
        return data.data;
      } else {
        const error = new Error(data.message || '请求失败');
        error.code = data.statusCode || 400;
        throw error;
      }
    }
    return data;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        window.dispatchEvent(new CustomEvent('unauthorized', { detail: { status: 401 } }));
        const errorData = error.response?.data;
        return Promise.reject(new Error(
          (errorData && errorData.message) || '登录已过期，请重新登录'
        ));
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await refreshApi.post('/v1/auth/refresh', { refreshToken });
        const { token, refreshToken: newRefreshToken } = res.data.data;

        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', newRefreshToken);

        processQueue(null, token);

        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        window.dispatchEvent(new CustomEvent('unauthorized', { detail: { status: 401 } }));
        return Promise.reject(new Error('登录已过期，请重新登录'));
      } finally {
        isRefreshing = false;
      }
    }

    const errorData = error.response?.data;
    if (errorData && typeof errorData === 'object' && errorData.message) {
      return Promise.reject(new Error(errorData.message));
    }
    return Promise.reject(new Error(error.message || '网络请求失败'));
  }
);

// 健康检查API
export const healthApi = {
  check: () => api.get('/health'),
};

// 用户认证API
export const authApi = {
  login: (username, password) => 
    api.post('/v1/users/login', { username, password }),

  register: (userData) => 
    api.post('/v1/users/register', userData),

  getCurrentUser: () => 
    api.get('/v1/users/me'),

  refreshToken: (refreshToken) =>
    refreshApi.post('/v1/auth/refresh', { refreshToken }),

  logout: (refreshToken) => {
    if (refreshToken) {
      api.post('/v1/auth/logout', { refreshToken }).catch(() => {});
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
  },

  getPermissions: () =>
    api.get('/v1/auth/permissions'),

  checkPermissions: (permissions) =>
    api.post('/v1/auth/check', { permissions }),
};

// 用户管理API
export const userApi = {
  getAll: (params) => 
    api.get('/v1/users', { params }),
  
  getById: (id) => 
    api.get(`/v1/users/${id}`),
  
  create: (userData) => 
    api.post('/v1/users', userData),
  
  update: (id, userData) => 
    api.put(`/v1/users/${id}`, userData),
  
  delete: (id) => 
    api.delete(`/v1/users/${id}`),
  
  changePassword: (id, oldPassword, newPassword) =>
    api.put(`/v1/users/${id}/password`, { oldPassword, newPassword }),
};

// 产品管理API
export const productApi = {
  getAll: (params) => 
    api.get('/v1/products', { params }),
  
  getById: (id) => 
    api.get(`/v1/products/${id}`),
  
  getBySKU: (sku) =>
    api.get(`/v1/products/sku/${sku}`),
  
  create: (productData) => 
    api.post('/v1/products', productData),
  
  update: (id, productData) => 
    api.put(`/v1/products/${id}`, productData),
  
  delete: (id) => 
    api.delete(`/v1/products/${id}`),
  
  updateStock: (id, quantity) =>
    api.patch(`/v1/products/${id}/stock`, { quantity }),
  
  getLowStock: (params) =>
    api.get('/v1/products/low-stock', { params }),
  
  batchUpdateStatus: (ids, status) =>
    api.post('/v1/products/batch/status', { ids, status }),
};

// 购物车API
export const cartApi = {
  getCart: () => 
    api.get('/v1/carts'),
  
  addItem: (productId, quantity) => 
    api.post('/v1/carts/items', { productId, quantity }),
  
  updateItem: (itemId, quantity) => 
    api.put(`/v1/carts/items/${itemId}`, { quantity }),
  
  removeItem: (itemId) => 
    api.delete(`/v1/carts/items/${itemId}`),
  
  clearCart: () => 
    api.delete('/v1/carts'),
  
  checkout: (checkoutData) => 
    api.post('/v1/carts/checkout', checkoutData),
  
  mergeCart: (sessionId) =>
    api.post('/v1/carts/merge', { sessionId }),
};

// 订单管理API
export const orderApi = {
  getAll: (params) => 
    api.get('/v1/orders', { params }),
  
  getById: (id) => 
    api.get(`/v1/orders/${id}`),
  
  getByOrderNumber: (orderNumber) =>
    api.get(`/v1/orders/order-number/${orderNumber}`),
  
  create: (orderData) => 
    api.post('/v1/orders', orderData),
  
  updateStatus: (id, status) => 
    api.put(`/v1/orders/${id}/status`, { status }),
  
  updatePaymentStatus: (id, paymentStatus) =>
    api.put(`/v1/orders/${id}/payment-status`, { paymentStatus }),
  
  cancel: (id) =>
    api.post(`/v1/orders/${id}/cancel`),
  
  getStatistics: (params) =>
    api.get('/v1/orders/stats', { params }),
  
  getUserOrders: (userId, params) =>
    api.get(`/v1/orders/user/${userId}`, { params }),
};

// 权限管理API
export const permissionApi = {
  // 角色管理
  getRoles: (params) =>
    api.get('/v1/auth/roles', { params }),
  
  getRoleById: (id) =>
    api.get(`/v1/auth/roles/${id}`),
  
  createRole: (roleData) =>
    api.post('/v1/auth/roles', roleData),
  
  updateRole: (id, roleData) =>
    api.put(`/v1/auth/roles/${id}`, roleData),
  
  deleteRole: (id) =>
    api.delete(`/v1/auth/roles/${id}`),
  
  assignRolePermissions: (roleId, permissionIds) =>
    api.post(`/v1/auth/roles/${roleId}/permissions`, { permissionIds }),
  
  removeRolePermissions: (roleId, permissionIds) =>
    api.delete(`/v1/auth/roles/${roleId}/permissions`, { data: { permissionIds } }),
  
  // 权限管理
  getPermissions: (params) =>
    api.get('/v1/auth/permissions/list', { params }),
  
  getResources: () =>
    api.get('/v1/auth/resources'),
  
  createPermission: (permissionData) =>
    api.post('/v1/auth/permissions', permissionData),
  
  updatePermission: (id, permissionData) =>
    api.put(`/v1/auth/permissions/${id}`, permissionData),
  
  deletePermission: (id) =>
    api.delete(`/v1/auth/permissions/${id}`),
  
  // 用户角色管理
  getUserRoles: (userId) =>
    api.get(`/v1/auth/users/${userId}/roles`),
  
  assignUserRoles: (userId, roleIds) =>
    api.post(`/v1/auth/users/${userId}/roles`, { roleIds }),
  
  removeUserRoles: (userId, roleIds) =>
    api.delete(`/v1/auth/users/${userId}/roles`, { data: { roleIds } }),
};

// 导出所有API
export default {
  health: healthApi,
  auth: authApi,
  users: userApi,
  products: productApi,
  carts: cartApi,
  orders: orderApi,
  permissions: permissionApi,
};