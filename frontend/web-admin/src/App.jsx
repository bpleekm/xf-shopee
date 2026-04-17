import { useState } from 'react'
import { Layout, Menu, Dropdown, Avatar, Badge } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  LogoutOutlined,
  BellOutlined,
  SettingOutlined,
  KeyOutlined,
} from '@ant-design/icons'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import './App.css'
import PrivateRoute from './components/PrivateRoute'
import DashboardPage from './pages/DashboardPage'
import UserManagementPage from './pages/UserManagementPage'
import ProductManagementPage from './pages/ProductManagementPage'
import OrderManagementPage from './pages/OrderManagementPage'
import LoginPage from './pages/LoginPage'
import PermissionManagementPage from './pages/PermissionManagementPage'
import { useAuth } from './contexts/AuthContext'

const { Header, Sider, Content } = Layout

function App() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, user } = useAuth()

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/users', icon: <UserOutlined />, label: 'User Management' },
    { key: '/products', icon: <ShoppingOutlined />, label: 'SKU Management' },
    { key: '/orders', icon: <FileTextOutlined />, label: 'Order Management' },
    { key: '/permissions', icon: <KeyOutlined />, label: 'Permission Management' },
  ]

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: 'Profile' },
    { key: 'settings', icon: <SettingOutlined />, label: 'Settings' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: handleLogout },
  ]

  const selectedKey = location.pathname

  // If user is not authenticated and not on login page, redirect to login
  if (!user && location.pathname !== '/login') {
    return <Navigate to="/login" replace />
  }

  // If user is authenticated and on login page, redirect to dashboard
  if (user && location.pathname === '/login') {
    return <Navigate to="/dashboard" replace />
  }

  // Login page layout (no sidebar/header)
  if (location.pathname === '/login') {
    return <LoginPage />
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        theme="dark" 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        width={220}
      >
        <div style={{ padding: '16px', color: 'white', textAlign: 'center' }}>
          <h2 style={{ color: 'white', margin: 0, fontSize: collapsed ? '16px' : '20px' }}>
            {collapsed ? 'XF' : 'XF Shopee'}
          </h2>
          {!collapsed && <p style={{ color: '#aaa', fontSize: '12px' }}>Admin Dashboard</p>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{ margin: 0 }}>
            {menuItems.find(item => item.key === selectedKey)?.label || 'Dashboard'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Badge count={5}>
              <BellOutlined style={{ fontSize: '18px', cursor: 'pointer' }} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>{user?.username || 'Admin'}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: '24px', overflow: 'initial' }}>
          <PrivateRoute requirePermissions={[]} requireRoles={[]}>
            <Routes>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/users" element={<UserManagementPage />} />
              <Route path="/products" element={<ProductManagementPage />} />
              <Route path="/orders" element={<OrderManagementPage />} />
              <Route path="/permissions" element={<PermissionManagementPage />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </PrivateRoute>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App