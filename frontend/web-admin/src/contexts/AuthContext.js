import React, { createContext, useState, useContext, useEffect } from 'react';
import { authApi } from '../services/api';
import { message } from 'antd';

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
      const result = await authApi.getPermissions();
      setPermissions(result.permissions || []);
      setRoles(result.roles || []);
    } catch (error) {
      console.error('加载权限失败:', error);
    }
  };

  // 登录
  const login = async (username, password) => {
    try {
      setLoading(true);
      const response = await authApi.login(username, password);
      
      // 保存token和用户信息
      const { token, user: userData } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // 更新状态
      setUser(userData);
      setIsAuthenticated(true);
      
      // 加载权限
      await loadPermissions();
      
      message.success('登录成功');
      return { success: true, data: userData };
    } catch (error) {
      const errorMsg = error.message || '登录失败，请检查用户名和密码';
      message.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // 注册
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authApi.register(userData);
      
      const { token, user: newUser } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      setUser(newUser);
      setIsAuthenticated(true);
      await loadPermissions();
      
      message.success('注册成功');
      return { success: true, data: newUser };
    } catch (error) {
      const errorMsg = error.message || '注册失败';
      message.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // 注销
  const logout = () => {
    authApi.logout();
    setUser(null);
    setPermissions([]);
    setRoles([]);
    setIsAuthenticated(false);
    message.success('已退出登录');
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
      const response = await authApi.getCurrentUser();
      const userData = response.data;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
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