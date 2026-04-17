import { useState, useEffect } from 'react'
import { Table, Button, Space, Input, Modal, Tag, Select, message } from 'antd'
import { SearchOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import api from '../services/api'

const { Search } = Input
const { Option } = Select

function OrderManagementPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const response = await api.orders.getAll({ page: 1, limit: 50 })
      setOrders(response.data.orders || [])
    } catch (error) {
      message.error('Failed to fetch orders')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value) => {
    setSearchText(value)
  }

  const handleViewDetails = (order) => {
    setSelectedOrder(order)
    setDetailModalVisible(true)
  }

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.orders.updateStatus(orderId, newStatus)
      message.success('Order status updated successfully')
      fetchOrders()
    } catch (error) {
      message.error('Failed to update order status')
      console.error(error)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'orange'
      case 'processing': return 'blue'
      case 'shipped': return 'purple'
      case 'delivered': return 'green'
      case 'cancelled': return 'red'
      default: return 'default'
    }
  }

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: 'User',
      dataIndex: 'user_id',
      key: 'user_id',
      render: (userId) => `User #${userId}`,
    },
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount) => `$${parseFloat(amount).toFixed(2)}`,
    },
    {
      title: 'Items',
      dataIndex: 'item_count',
      key: 'item_count',
      render: (_, record) => record.items?.length || 0,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="primary" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            Details
          </Button>
          {record.status === 'pending' && (
            <Button 
              type="primary" 
              size="small" 
              icon={<CheckCircleOutlined />}
              onClick={() => handleUpdateStatus(record.id, 'processing')}
            >
              Process
            </Button>
          )}
          {record.status === 'processing' && (
            <Button 
              type="primary" 
              size="small" 
              icon={<CheckCircleOutlined />}
              onClick={() => handleUpdateStatus(record.id, 'shipped')}
            >
              Ship
            </Button>
          )}
          {record.status === 'pending' && (
            <Button 
              type="primary" 
              danger 
              size="small" 
              icon={<CloseCircleOutlined />}
              onClick={() => handleUpdateStatus(record.id, 'cancelled')}
            >
              Cancel
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const filteredOrders = orders.filter(order =>
    order.id.toString().includes(searchText) ||
    order.user_id.toString().includes(searchText) ||
    order.status.toLowerCase().includes(searchText.toLowerCase())
  )

  return (
    <div>
      <h1 style={{ marginBottom: '24px' }}>Order Management</h1>
      
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
        <Search
          placeholder="Search orders by ID, user ID, or status"
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          style={{ width: 400 }}
          onSearch={handleSearch}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredOrders}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 1300 }}
      />

      <Modal
        title={`Order Details - #${selectedOrder?.id}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedOrder && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h3>Order Information</h3>
              <p><strong>Order ID:</strong> {selectedOrder.id}</p>
              <p><strong>User ID:</strong> {selectedOrder.user_id}</p>
              <p><strong>Total Amount:</strong> ${parseFloat(selectedOrder.total_amount).toFixed(2)}</p>
              <p><strong>Status:</strong> <Tag color={getStatusColor(selectedOrder.status)}>{selectedOrder.status.toUpperCase()}</Tag></p>
              <p><strong>Created At:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>
              <p><strong>Updated At:</strong> {new Date(selectedOrder.updated_at).toLocaleString()}</p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h3>Shipping Address</h3>
              <p><strong>Full Name:</strong> {selectedOrder.shipping_full_name || 'N/A'}</p>
              <p><strong>Phone:</strong> {selectedOrder.shipping_phone || 'N/A'}</p>
              <p><strong>Address:</strong> {selectedOrder.shipping_address || 'N/A'}</p>
              <p><strong>City:</strong> {selectedOrder.shipping_city || 'N/A'}</p>
              <p><strong>Postal Code:</strong> {selectedOrder.shipping_postal_code || 'N/A'}</p>
            </div>

            <div>
              <h3>Order Items</h3>
              <Table
                dataSource={selectedOrder.items || []}
                rowKey="id"
                pagination={false}
                columns={[
                  { title: 'Product', dataIndex: 'product_name', key: 'product_name' },
                  { title: 'SKU', dataIndex: 'sku', key: 'sku' },
                  { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
                  { title: 'Price', dataIndex: 'price', key: 'price', render: (price) => `$${parseFloat(price).toFixed(2)}` },
                  { title: 'Subtotal', key: 'subtotal', render: (_, item) => `$${(parseFloat(item.price) * item.quantity).toFixed(2)}` },
                ]}
              />
            </div>

            <div style={{ marginTop: '16px' }}>
              <h3>Update Status</h3>
              <Select
                value={selectedOrder.status}
                style={{ width: 200 }}
                onChange={(value) => handleUpdateStatus(selectedOrder.id, value)}
              >
                <Option value="pending">Pending</Option>
                <Option value="processing">Processing</Option>
                <Option value="shipped">Shipped</Option>
                <Option value="delivered">Delivered</Option>
                <Option value="cancelled">Cancelled</Option>
              </Select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default OrderManagementPage