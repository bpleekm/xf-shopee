import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, message } from 'antd'
import {
  UserOutlined,
  ShoppingOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import api from '../services/api'

function DashboardPage() {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.health.check()
      .then(data => {
        setHealth(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch health:', err)
        message.error('Cannot connect to backend API')
        setLoading(false)
      })
  }, [])

  return (
    <div>
      <h1 style={{ marginBottom: '24px' }}>Dashboard Overview</h1>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Total Orders" value={1254} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Total Revenue" value={56890} prefix="$" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Active Users" value={342} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="SKU Count" value={1567} prefix={<ShoppingOutlined />} />
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col span={24}>
          <Card title="System Health" loading={loading}>
            {health && (
              <div>
                <p><strong>Status:</strong> <span style={{ color: 'green' }}>{health.status}</span></p>
                <p><strong>Service:</strong> {health.service}</p>
                <p><strong>Version:</strong> {health.version}</p>
                <p><strong>Timestamp:</strong> {new Date(health.timestamp).toLocaleString()}</p>
              </div>
            )}
            {!health && !loading && <p style={{ color: 'red' }}>Unable to connect to backend</p>}
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col span={24}>
          <Card title="Quick Actions">
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card size="small" hoverable onClick={() => message.info('Navigate to User Management')}>
                  <UserOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                  <p>Manage Users</p>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" hoverable onClick={() => message.info('Navigate to SKU Management')}>
                  <ShoppingOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                  <p>Manage Products</p>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" hoverable onClick={() => message.info('Navigate to Order Management')}>
                  <FileTextOutlined style={{ fontSize: '24px', color: '#fa8c16' }} />
                  <p>Process Orders</p>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default DashboardPage