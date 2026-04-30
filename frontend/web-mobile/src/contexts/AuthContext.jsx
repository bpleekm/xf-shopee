import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';
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

  const doLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setPermissions([]);
    setRoles([]);
    setIsAuthenticated(false);
  }, []);

  const loadPermissions = useCallback(async () => {
    try {
      const result = await authApi.getPermissions();
      setPermissions(result.permissions || []);
      setRoles(result.roles || []);
    } catch (error) {
      console.error('加载权限失败:', error);
    }
  }, []);

  const initAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const userData = await authApi.getCurrentUser();
      setUser(userData.user);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(userData.user));
      await loadPermissions();
    } catch (error) {
      console.error('Token无效，请重新登录:', error);
      doLogout();
    } finally {
      setLoading(false);
    }
  }, [doLogout, loadPermissions]);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (username, password) => {
    try {
      setLoading(true);
      const result = await authApi.login(username, password);

      localStorage.setItem('token', result.token);
      localStorage.setItem('refreshToken', result.refreshToken);
      localStorage.setItem('user', JSON.stringify(result.user));

      setUser(result.user);
      setIsAuthenticated(true);

      await loadPermissions();

      Toast.show({
        icon: 'success',
        content: '登录成功',
      });
      return { success: true, data: result.user };
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

  const register = async (userData) => {
    try {
      setLoading(true);
      const result = await authApi.register(userData);

      localStorage.setItem('token', result.token);
      localStorage.setItem('refreshToken', result.refreshToken);
      localStorage.setItem('user', JSON.stringify(result.user));

      setUser(result.user);
      setIsAuthenticated(true);
      await loadPermissions();

      Toast.show({
        icon: 'success',
        content: '注册成功',
      });
      return { success: true, data: result.user };
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

  const logout = () => {
    const refreshToken = localStorage.getItem('refreshToken');
    authApi.logout(refreshToken);
    doLogout();
    Toast.show({
      icon: 'success',
      content: '已退出登录',
    });
  };

  const hasPermission = (permissionCode) => {
    if (!permissions || permissions.length === 0) return false;
    return permissions.some(perm => perm.code === permissionCode);
  };

  const hasRole = (roleName) => {
    if (!roles || roles.length === 0) return false;
    return roles.some(role => role.name === roleName);
  };

  const hasAnyPermission = (permissionCodes) => {
    if (!permissions || permissions.length === 0) return false;
    return permissionCodes.some(code => hasPermission(code));
  };

  const hasAnyRole = (roleNames) => {
    if (!roles || roles.length === 0) return false;
    return roleNames.some(name => hasRole(name));
  };

  const refreshUser = async () => {
    try {
      const result = await authApi.getCurrentUser();
      const userData = result.user;
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