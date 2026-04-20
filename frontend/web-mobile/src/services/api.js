import axios from 'axios';

// API基础URL配置
// 开发环境: http://localhost:3000/api
// 生产环境: /xfbh/api (通过Nginx代理)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// 创建axios实例
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

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => {
    const data = response.data;
    // 处理统一API响应格式
    if (data && typeof data === 'object') {
      if (data.success === true) {
        // 返回实际数据
        return data.data;
      } else {
        // 业务逻辑错误，抛出错误信息
        const error = new Error(data.message || '请求失败');
        error.code = data.statusCode || 400;
        throw error;
      }
    }
    // 如果响应格式不符合预期，直接返回
    return data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // 未授权，清除token并跳转到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // 触发自定义事件，让App组件处理跳转
      window.dispatchEvent(new CustomEvent('unauthorized', { 
        detail: { status: 401 }
      }));
    }
    // 返回统一的错误格式
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
    api.post('/v1/auth/login', { username, password }),
  
  register: (userData) => 
    api.post('/v1/auth/register', userData),
  
  getCurrentUser: () => 
    api.get('/v1/users/profile'),
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
    api.get('/v1/cart'),
  
  addItem: (productId, quantity) => 
    api.post('/v1/cart/items', { productId, quantity }),
  
  updateItem: (itemId, quantity) => 
    api.put(`/v1/cart/items/${itemId}`, { quantity }),
  
  removeItem: (itemId) => 
    api.delete(`/v1/cart/items/${itemId}`),
  
  clearCart: () => 
    api.delete('/v1/cart'),
  
  checkout: (checkoutData) => 
    api.post('/v1/cart/checkout', checkoutData),
  
  mergeCart: (sessionId) =>
    api.post('/v1/cart/merge', { sessionId }),
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