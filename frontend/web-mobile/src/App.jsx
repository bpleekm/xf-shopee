import React, { useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { TabBar } from 'antd-mobile'
import {
  AppOutline,
  UnorderedListOutline,
  ShopbagOutline,
  UserOutline,
  ScanOutline,
} from 'antd-mobile-icons'

// Placeholder page components
const DashboardPage = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h1>仪表板</h1>
    <p>欢迎使用 XF Shopee 移动端</p>
  </div>
)

const ProductsPage = () => (
  <div style={{ padding: '20px' }}>
    <h1>产品管理</h1>
    <p>产品列表、搜索、详情</p>
  </div>
)

const OrdersPage = () => (
  <div style={{ padding: '20px' }}>
    <h1>订单处理</h1>
    <p>订单列表、状态跟踪</p>
  </div>
)

const ScannerPage = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h1>扫码功能</h1>
    <p>扫码入库、库存查询</p>
  </div>
)

const ProfilePage = () => (
  <div style={{ padding: '20px' }}>
    <h1>个人中心</h1>
    <p>用户信息、设置</p>
  </div>
)

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
    icon: <ScanOutline />,
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

  const handleTabChange = (key) => {
    setActiveKey(key)
    navigate(key)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/scanner" element={<ScannerPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/" element={<DashboardPage />} />
        </Routes>
      </div>
      <TabBar
        activeKey={activeKey}
        onChange={handleTabChange}
        style={{ borderTop: '1px solid #eee' }}
      >
        {tabs.map(item => (
          <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
        ))}
      </TabBar>
    </div>
  )
}

export default App