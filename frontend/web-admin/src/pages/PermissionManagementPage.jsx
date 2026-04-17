import { useState, useEffect } from 'react'
import { Table, Button, Space, Input, Modal, Form, Tag, Select, Card, Tabs, message } from 'antd'
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined, UserOutlined } from '@ant-design/icons'
import api from '../services/api'

const { Search } = Input
const { Option } = Select
const { TabPane } = Tabs

function PermissionManagementPage() {
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('roles')
  const [roleModalVisible, setRoleModalVisible] = useState(false)
  const [permissionModalVisible, setPermissionModalVisible] = useState(false)
  const [assignRoleModalVisible, setAssignRoleModalVisible] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [form] = Form.useForm()
  const [permissionForm] = Form.useForm()
  const [assignForm] = Form.useForm()

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'roles') {
        const response = await api.permissions.getRoles({ page: 1, limit: 50 })
        setRoles(response.data.roles || [])
      } else if (activeTab === 'permissions') {
        const response = await api.permissions.getPermissions({ page: 1, limit: 100 })
        setPermissions(response.data.permissions || [])
      } else if (activeTab === 'users') {
        const response = await api.users.getAll({ page: 1, limit: 50 })
        setUsers(response.data.users || [])
      }
    } catch (error) {
      message.error(`Failed to fetch ${activeTab}`)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRole = () => {
    form.validateFields().then(async (values) => {
      try {
        await api.permissions.createRole(values)
        message.success('Role created successfully')
        setRoleModalVisible(false)
        form.resetFields()
        fetchData()
      } catch (error) {
        message.error('Failed to create role')
        console.error(error)
      }
    })
  }

  const handleCreatePermission = () => {
    permissionForm.validateFields().then(async (values) => {
      try {
        await api.permissions.createPermission(values)
        message.success('Permission created successfully')
        setPermissionModalVisible(false)
        permissionForm.resetFields()
        fetchData()
      } catch (error) {
        message.error('Failed to create permission')
        console.error(error)
      }
    })
  }

  const handleDeleteRole = (roleId) => {
    Modal.confirm({
      title: 'Delete Role',
      content: 'Are you sure you want to delete this role?',
      onOk: async () => {
        try {
          await api.permissions.deleteRole(roleId)
          message.success('Role deleted successfully')
          fetchData()
        } catch (error) {
          message.error('Failed to delete role')
          console.error(error)
        }
      },
    })
  }

  const handleDeletePermission = (permissionId) => {
    Modal.confirm({
      title: 'Delete Permission',
      content: 'Are you sure you want to delete this permission?',
      onOk: async () => {
        try {
          await api.permissions.deletePermission(permissionId)
          message.success('Permission deleted successfully')
          fetchData()
        } catch (error) {
          message.error('Failed to delete permission')
          console.error(error)
        }
      },
    })
  }

  const handleAssignRole = () => {
    assignForm.validateFields().then(async (values) => {
      try {
        await api.permissions.assignUserRoles(selectedUser, [values.roleId])
        message.success('Role assigned successfully')
        setAssignRoleModalVisible(false)
        assignForm.resetFields()
        fetchData()
      } catch (error) {
        message.error('Failed to assign role')
        console.error(error)
      }
    })
  }

  const roleColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (perms) => (
        <div>
          {perms?.slice(0, 3).map(p => (
            <Tag key={p.id} color="blue" style={{ marginBottom: '4px' }}>{p.code}</Tag>
          ))}
          {perms?.length > 3 && <Tag>+{perms.length - 3} more</Tag>}
        </div>
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
            onClick={() => message.info(`Edit role ${record.id}`)}
          />
          <Button 
            type="primary" 
            danger 
            size="small" 
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteRole(record.id)}
          />
        </Space>
      ),
    },
  ]

  const permissionColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Resource',
      dataIndex: 'resource',
      key: 'resource',
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
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
            onClick={() => message.info(`Edit permission ${record.id}`)}
          />
          <Button 
            type="primary" 
            danger 
            size="small" 
            icon={<DeleteOutlined />}
            onClick={() => handleDeletePermission(record.id)}
          />
        </Space>
      ),
    },
  ]

  const userColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Roles',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles) => (
        <div>
          {roles?.map(r => (
            <Tag key={r.id} color="green" style={{ marginBottom: '4px' }}>{r.name}</Tag>
          ))}
        </div>
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
            icon={<KeyOutlined />}
            onClick={() => {
              setSelectedUser(record.id)
              setAssignRoleModalVisible(true)
            }}
          >
            Assign Role
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <h1 style={{ marginBottom: '24px' }}>Permission Management</h1>
      
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Roles" key="roles">
          <Card>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
              <Search
                placeholder="Search roles"
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                style={{ width: 300 }}
              />
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                size="large"
                onClick={() => setRoleModalVisible(true)}
              >
                Create Role
              </Button>
            </div>
            <Table
              columns={roleColumns}
              dataSource={roles}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 20 }}
            />
          </Card>
        </TabPane>
        <TabPane tab="Permissions" key="permissions">
          <Card>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
              <Search
                placeholder="Search permissions"
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                style={{ width: 300 }}
              />
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                size="large"
                onClick={() => setPermissionModalVisible(true)}
              >
                Create Permission
              </Button>
            </div>
            <Table
              columns={permissionColumns}
              dataSource={permissions}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 20 }}
              scroll={{ x: 1200 }}
            />
          </Card>
        </TabPane>
        <TabPane tab="User Roles" key="users">
          <Card>
            <div style={{ marginBottom: '24px' }}>
              <Search
                placeholder="Search users"
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                style={{ width: 300 }}
              />
            </div>
            <Table
              columns={userColumns}
              dataSource={users}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 20 }}
              scroll={{ x: 1200 }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Create Role Modal */}
      <Modal
        title="Create New Role"
        open={roleModalVisible}
        onCancel={() => {
          setRoleModalVisible(false)
          form.resetFields()
        }}
        onOk={handleCreateRole}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Role Name"
            rules={[{ required: true, message: 'Please input role name' }]}
          >
            <Input placeholder="Enter role name" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={3} placeholder="Enter role description" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Permission Modal */}
      <Modal
        title="Create New Permission"
        open={permissionModalVisible}
        onCancel={() => {
          setPermissionModalVisible(false)
          permissionForm.resetFields()
        }}
        onOk={handleCreatePermission}
        width={600}
      >
        <Form form={permissionForm} layout="vertical">
          <Form.Item
            name="code"
            label="Permission Code"
            rules={[{ required: true, message: 'Please input permission code' }]}
          >
            <Input placeholder="e.g., user:create" />
          </Form.Item>
          <Form.Item
            name="name"
            label="Display Name"
            rules={[{ required: true, message: 'Please input display name' }]}
          >
            <Input placeholder="e.g., Create User" />
          </Form.Item>
          <Form.Item
            name="resource"
            label="Resource"
          >
            <Input placeholder="e.g., user" />
          </Form.Item>
          <Form.Item
            name="action"
            label="Action"
          >
            <Select placeholder="Select action">
              <Option value="create">Create</Option>
              <Option value="read">Read</Option>
              <Option value="update">Update</Option>
              <Option value="delete">Delete</Option>
              <Option value="manage">Manage</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={3} placeholder="Enter permission description" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Assign Role Modal */}
      <Modal
        title={`Assign Role to User #${selectedUser}`}
        open={assignRoleModalVisible}
        onCancel={() => {
          setAssignRoleModalVisible(false)
          assignForm.resetFields()
        }}
        onOk={handleAssignRole}
        width={400}
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item
            name="roleId"
            label="Select Role"
            rules={[{ required: true, message: 'Please select a role' }]}
          >
            <Select placeholder="Select a role">
              {roles.map(role => (
                <Option key={role.id} value={role.id}>{role.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default PermissionManagementPage