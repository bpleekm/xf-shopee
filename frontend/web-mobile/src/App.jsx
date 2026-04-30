import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { TabBar, Dialog } from 'antd-mobile'
import {
  AppOutline,
  UnorderedListOutline,
  ShopbagOutline,
  UserOutline,
  ScanningOutline,
} from 'antd-mobile-icons'

// 导入页面组件
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/ProductsPage'
import OrdersPage from './pages/OrdersPage'
import ScannerPage from './pages/ScannerPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// 路由守卫组件
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  
  if (!token) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

const tabs = [
  {
    key: '/dashboard',
    title: '首页',
    icon: <AppOutline />,
  },
  {
    key: '/products',
    title: '产品',
    icon: <UnorderedListOutline />,
  },
  {
    key: '/orders',
    title: '订单',
    icon: <ShopbagOutline />,
  },
  {
    key: '/scanner',
    title: '扫码',
    icon: <ScanningOutline />,
  },
  {
    key: '/profile',
    title: '我的',
    icon: <UserOutline />,
  },
]

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeKey, setActiveKey] = useState(location.pathname || '/dashboard')
  const [showTabs, setShowTabs] = useState(true)

  // 检查是否需要显示底部标签栏
  useEffect(() => {
    const hideTabPaths = ['/login', '/register']
    setShowTabs(!hideTabPaths.includes(location.pathname))
    setActiveKey(location.pathname)
  }, [location.pathname])

  const handleTabChange = (key) => {
    setActiveKey(key)
    navigate(key)
  }

  // 处理未授权访问
  useEffect(() => {
    const handleUnauthorized = (event) => {
      if (event.detail?.status === 401) {
        Dialog.alert({
          content: '登录已过期，请重新登录',
          confirmText: '确定',
          onConfirm: () => {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            localStorage.removeItem('refreshToken')
            navigate('/login')
          },
        })
      }
    }

    window.addEventListener('unauthorized', handleUnauthorized)
    return () => window.removeEventListener('unauthorized', handleUnauthorized)
  }, [navigate])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Routes>
          {/* 公开路由 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* 受保护的路由 */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          } />
          <Route path="/products" element={
            <PrivateRoute>
              <ProductsPage />
            </PrivateRoute>
          } />
          <Route path="/orders" element={
            <PrivateRoute>
              <OrdersPage />
            </PrivateRoute>
          } />
          <Route path="/scanner" element={
            <PrivateRoute>
              <ScannerPage />
            </PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          } />
          
          {/* 默认重定向 */}
          <Route path="/" element={
            <PrivateRoute>
              <Navigate to="/dashboard" replace />
            </PrivateRoute>
          } />
          
          {/* 404 页面 */}
          <Route path="*" element={
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <h1>404</h1>
              <p>页面未找到</p>
              <button
                onClick={() => navigate('/dashboard')}
                style={{
                  marginTop: '20px',
                  padding: '8px 16px',
                  background: '#1677ff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                返回首页
              </button>
            </div>
          } />
        </Routes>
      </div>
      
      {/* 底部标签栏 */}
      {showTabs && (
        <TabBar
          activeKey={activeKey}
          onChange={handleTabChange}
          style={{ borderTop: '1px solid #eee' }}
        >
          {tabs.map(item => (
            <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
          ))}
        </TabBar>
      )}
    </div>
  )
}

export default App