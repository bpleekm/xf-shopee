import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Space, Divider, message } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, UserAddOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const LoginPage = () => {
  const [form] = Form.useForm();
  const [loginForm] = Form.useForm();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const result = await login(values.username, values.password);
      if (result.success) {
        message.success('登录成功！');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('登录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values) => {
    setLoading(true);
    try {
      const result = await register(values);
      if (result.success) {
        message.success('注册成功！');
        setIsRegister(false);
        loginForm.resetFields();
        form.resetFields();
      }
    } catch (error) {
      console.error('注册失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    form.resetFields();
    loginForm.resetFields();
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 12,
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        }}
        bodyStyle={{ padding: 40 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 60,
            height: 60,
            margin: '0 auto 16px',
            background: '#1890ff',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            color: 'white',
          }}>
            <UserOutlined />
          </div>
          <Title level={3} style={{ marginBottom: 8 }}>
            {isRegister ? '注册账户' : 'XF Shopee 管理后台'}
          </Title>
          <Text type="secondary">
            {isRegister ? '创建新的管理员账户' : '请登录以访问管理后台'}
          </Text>
        </div>

        {isRegister ? (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleRegister}
            autoComplete="off"
          >
            <Form.Item
              label="用户名"
              name="username"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' },
                { max: 50, message: '用户名最多50个字符' },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="请输入用户名"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="邮箱"
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="请输入邮箱"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="密码"
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入密码"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="确认密码"
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请确认密码"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="全名"
              name="full_name"
              rules={[
                { required: true, message: '请输入全名' },
                { max: 100, message: '全名最多100个字符' },
              ]}
            >
              <Input
                placeholder="请输入全名"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="角色"
              name="role"
              initialValue="employee"
            >
              <Input
                placeholder="请输入角色"
                size="large"
                disabled
                value="employee"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                block
                icon={<UserAddOutlined />}
              >
                注册
              </Button>
            </Form.Item>

            <Divider>
              <Text type="secondary">或</Text>
            </Divider>

            <div style={{ textAlign: 'center' }}>
              <Button type="link" onClick={toggleMode}>
                已有账户？立即登录
              </Button>
            </div>
          </Form>
        ) : (
          <Form
            form={loginForm}
            layout="vertical"
            onFinish={handleLogin}
            autoComplete="off"
          >
            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="请输入用户名"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="密码"
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入密码"
                size="large"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                block
                icon={<LoginOutlined />}
              >
                登录
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'right', marginBottom: 24 }}>
              <Link to="/forgot-password">
                <Text type="secondary">忘记密码？</Text>
              </Link>
            </div>

            <Divider>
              <Text type="secondary">或</Text>
            </Divider>

            <div style={{ textAlign: 'center' }}>
              <Space direction="vertical">
                <Text type="secondary">还没有账户？</Text>
                <Button type="link" onClick={toggleMode}>
                  立即注册
                </Button>
              </Space>
            </div>
          </Form>
        )}

        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            默认管理员账户: admin / admin123
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;