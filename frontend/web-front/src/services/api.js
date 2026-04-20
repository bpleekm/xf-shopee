import axios from 'axios'

// API基础URL配置
// 开发环境: http://localhost:3000/api
// 生产环境: /xfbh/api (通过Nginx代理)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器 - 添加token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // 未授权，清除token并跳转到首页
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/'
    }
    return Promise.reject(error.response?.data || error.message)
  }
)

// 健康检查API
export const healthApi = {
  check: () => api.get('/health'),
}

// 用户认证API
export const authApi = {
  login: (username, password) => 
    api.post('/v1/users/login', { username, password }),
  
  register: (userData) => 
    api.post('/v1/users/register', userData),
  
  getCurrentUser: () => 
    api.get('/v1/users/me'),
  
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },
  
  updateProfile: (userData) =>
    api.put('/v1/users/me', userData),
  
  changePassword: (oldPassword, newPassword) =>
    api.put('/v1/users/me/password', { oldPassword, newPassword }),
}

// 用户管理API（游客使用，部分需要管理员权限）
export const userApi = {
  getById: (id) => 
    api.get(`/v1/users/${id}`),
  
  update: (id, userData) => 
    api.put(`/v1/users/${id}`, userData),
}

// 产品管理API
export const productApi = {
  getAll: (params) => 
    api.get('/v1/products', { params }),
  
  getById: (id) => 
    api.get(`/v1/products/${id}`),
  
  getBySKU: (sku) =>
    api.get(`/v1/products/sku/${sku}`),
  
  getByCategory: (category) =>
    api.get(`/v1/products/category/${category}`),
  
  search: (query) =>
    api.get(`/v1/products/search?q=${query}`),
}

// 购物车API（需要登录）
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
}

// 订单管理API（需要登录）
export const orderApi = {
  getAll: (params) => 
    api.get('/v1/orders', { params }),
  
  getById: (id) => 
    api.get(`/v1/orders/${id}`),
  
  getByOrderNumber: (orderNumber) =>
    api.get(`/v1/orders/order-number/${orderNumber}`),
  
  create: (orderData) => 
    api.post('/v1/orders', orderData),
  
  cancel: (id) =>
    api.post(`/v1/orders/${id}/cancel`),
  
  getUserOrders: (userId, params) =>
    api.get(`/v1/orders/user/${userId}`, { params }),
}

// 导出所有API
export default {
  health: healthApi,
  auth: authApi,
  users: userApi,
  products: productApi,
  carts: cartApi,
  orders: orderApi,
}