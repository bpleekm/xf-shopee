import React, { createContext, useState, useContext, useEffect } from 'react';
// import { authApi } from '../services/api';
import { Toast } from 'antd-mobile';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth必须在AuthProvider内部使用');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 初始化：检查本地存储的token和用户信息
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          // 验证token有效性
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setIsAuthenticated(true);
          
          // 获取用户权限
          await loadPermissions();
        } catch (error) {
          console.error('初始化认证失败:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // 加载用户权限
  const loadPermissions = async () => {
    try {
      // TODO: 实现权限加载
      // const result = await authApi.getPermissions();
      // setPermissions(result.permissions || []);
      // setRoles(result.roles || []);
      setPermissions([]);
      setRoles([]);
    } catch (error) {
      console.error('加载权限失败:', error);
    }
  };

  // 登录
  const login = async (username, password) => {
    try {
      setLoading(true);
      // TODO: 实现API调用
      // const response = await authApi.login(username, password);
      
      // 模拟成功响应
      const mockUser = {
        id: 1,
        username,
        fullName: '测试用户',
        email: `${username}@example.com`,
        role: 'staff'
      };
      const mockToken = 'mock.jwt.token';
      
      // 保存token和用户信息
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      // 更新状态
      setUser(mockUser);
      setIsAuthenticated(true);
      
      // 加载权限
      await loadPermissions();
      
      Toast.show({
        icon: 'success',
        content: '登录成功',
      });
      return { success: true, data: mockUser };
    } catch (error) {
      const errorMsg = error.message || '登录失败，请检查用户名和密码';
      Toast.show({
        icon: 'fail',
        content: errorMsg,
      });
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // 注册
  const register = async (userData) => {
    try {
      setLoading(true);
      // TODO: 实现API调用
      // const response = await authApi.register(userData);
      
      const mockUser = {
        id: Date.now(),
        username: userData.username,
        fullName: userData.fullName || userData.username,
        email: userData.email,
        role: 'user'
      };
      const mockToken = 'mock.jwt.token';
      
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      setUser(mockUser);
      setIsAuthenticated(true);
      await loadPermissions();
      
      Toast.show({
        icon: 'success',
        content: '注册成功',
      });
      return { success: true, data: mockUser };
    } catch (error) {
      const errorMsg = error.message || '注册失败';
      Toast.show({
        icon: 'fail',
        content: errorMsg,
      });
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // 注销
  const logout = () => {
    // authApi.logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setPermissions([]);
    setRoles([]);
    setIsAuthenticated(false);
    Toast.show({
      icon: 'success',
      content: '已退出登录',
    });
  };

  // 检查权限
  const hasPermission = (permissionCode) => {
    if (!permissions || permissions.length === 0) return false;
    return permissions.some(perm => perm.code === permissionCode);
  };

  // 检查角色
  const hasRole = (roleName) => {
    if (!roles || roles.length === 0) return false;
    return roles.some(role => role.name === roleName);
  };

  // 检查多个权限中的任意一个
  const hasAnyPermission = (permissionCodes) => {
    if (!permissions || permissions.length === 0) return false;
    return permissionCodes.some(code => hasPermission(code));
  };

  // 检查多个角色中的任意一个
  const hasAnyRole = (roleNames) => {
    if (!roles || roles.length === 0) return false;
    return roleNames.some(name => hasRole(name));
  };

  // 刷新用户信息
  const refreshUser = async () => {
    try {
      // TODO: 实现API调用
      // const response = await authApi.getCurrentUser();
      // const userData = response.data;
      // localStorage.setItem('user', JSON.stringify(userData));
      // setUser(userData);
      // return userData;
      return user;
    } catch (error) {
      console.error('刷新用户信息失败:', error);
      return null;
    }
  };

  const value = {
    user,
    permissions,
    roles,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAnyRole,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;