import { useState, useEffect } from 'react'
import { Table, Button, Space, Input, Modal, Form, InputNumber, Upload, message } from 'antd'
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import api from '../services/api'

const { Search } = Input
const { TextArea } = Input

function ProductManagementPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const response = await api.products.getAll({ page: 1, limit: 50 })
      setProducts(response.data.products || [])
    } catch (error) {
      message.error('Failed to fetch products')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value) => {
    setSearchText(value)
  }

  const handleCreateProduct = () => {
    form.validateFields().then(async (values) => {
      try {
        await api.products.create(values)
        message.success('Product created successfully')
        setModalVisible(false)
        form.resetFields()
        fetchProducts()
      } catch (error) {
        message.error('Failed to create product')
        console.error(error)
      }
    })
  }

  const handleDeleteProduct = (productId) => {
    Modal.confirm({
      title: 'Delete Product',
      content: 'Are you sure you want to delete this product?',
      onOk: async () => {
        try {
          await api.products.delete(productId)
          message.success('Product deleted successfully')
          fetchProducts()
        } catch (error) {
          message.error('Failed to delete product')
          console.error(error)
        }
      },
    })
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `$${parseFloat(price).toFixed(2)}`,
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock) => (
        <span style={{ color: stock > 0 ? 'green' : 'red', fontWeight: 'bold' }}>
          {stock}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span style={{ color: status === 'active' ? 'green' : 'red' }}>
          {status === 'active' ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="primary" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => message.info(`Edit product ${record.id}`)}
          />
          <Button 
            type="primary" 
            danger 
            size="small" 
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteProduct(record.id)}
          />
        </Space>
      ),
    },
  ]

  const filteredProducts = products.filter(product =>
    product.sku.toLowerCase().includes(searchText.toLowerCase()) ||
    product.name.toLowerCase().includes(searchText.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchText.toLowerCase())
  )

  return (
    <div>
      <h1 style={{ marginBottom: '24px' }}>Product Management</h1>
      
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
        <Search
          placeholder="Search products by SKU, name, or category"
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          style={{ width: 400 }}
          onSearch={handleSearch}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          size="large"
          onClick={() => setModalVisible(true)}
        >
          Create Product
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={filteredProducts}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title="Create New Product"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
        }}
        onOk={handleCreateProduct}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="sku"
            label="SKU"
            rules={[{ required: true, message: 'Please input SKU' }]}
          >
            <Input placeholder="Enter SKU code" />
          </Form.Item>
          <Form.Item
            name="name"
            label="Product Name"
            rules={[{ required: true, message: 'Please input product name' }]}
          >
            <Input placeholder="Enter product name" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} placeholder="Enter product description" />
          </Form.Item>
          <Form.Item
            name="category"
            label="Category"
          >
            <Input placeholder="Enter category" />
          </Form.Item>
          <Form.Item
            name="price"
            label="Price"
            rules={[{ required: true, message: 'Please input price' }]}
          >
            <InputNumber 
              min={0} 
              step={0.01} 
              style={{ width: '100%' }} 
              placeholder="Enter price"
              prefix="$"
            />
          </Form.Item>
          <Form.Item
            name="stock"
            label="Stock"
            rules={[{ required: true, message: 'Please input stock quantity' }]}
          >
            <InputNumber 
              min={0} 
              style={{ width: '100%' }} 
              placeholder="Enter stock quantity"
            />
          </Form.Item>
          <Form.Item
            name="image_url"
            label="Image URL"
          >
            <Input placeholder="Enter image URL" />
          </Form.Item>
          <Form.Item
            name="status"
            label="Status"
            initialValue="active"
          >
            <Input placeholder="Status (active/inactive)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ProductManagementPage