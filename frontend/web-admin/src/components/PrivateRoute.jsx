import React from 'react';
import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ children, requirePermissions = [], requireRoles = [] }) => {
  const { isAuthenticated, loading, hasAnyPermission, hasAnyRole } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 检查权限
  if (requirePermissions.length > 0 && !hasAnyPermission(requirePermissions)) {
    return <Navigate to="/dashboard" replace />;
  }

  // 检查角色
  if (requireRoles.length > 0 && !hasAnyRole(requireRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PrivateRoute;