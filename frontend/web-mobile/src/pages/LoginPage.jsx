import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Space,
  Toast,
  Divider,
  Grid,
} from 'antd-mobile';
import {
  UserOutline,
  LockOutline,
  EyeInvisibleOutline,
  EyeOutline,
} from 'antd-mobile-icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    const result = await login(values.username, values.password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    }
  };

  const handleDemoLogin = (role) => {
    const demoAccounts = {
      admin: { username: 'admin', password: 'admin123' },
      manager: { username: 'manager', password: 'manager123' },
      staff: { username: 'staff', password: 'staff123' },
    };
    
    const account = demoAccounts[role];
    if (account) {
      onFinish(account);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1677ff 0%, #597ef7 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: '400px',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
        bodyStyle={{ padding: '24px' }}
      >
        {/* 标题 */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '40px',
            background: 'linear-gradient(135deg, #1677ff 0%, #597ef7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <UserOutline fontSize={40} color="#fff" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
            XF Shopee ERP
          </div>
          <div style={{ color: '#666', fontSize: '14px' }}>
            移动端管理系统登录
          </div>
        </div>

        {/* 登录表单 */}
        <Form
          layout="vertical"
          onFinish={onFinish}
          footer={
            <Button
              block
              type="submit"
              color="primary"
              size="large"
              loading={loading}
              style={{ borderRadius: '8px', marginTop: '24px' }}
            >
              登录
            </Button>
          }
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              placeholder="请输入用户名"
              prefix={<UserOutline />}
              clearable
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input
              placeholder="请输入密码"
              type={showPassword ? 'text' : 'password'}
              prefix={<LockOutline />}
              suffix={
                <div onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer' }}>
                  {showPassword ? <EyeOutline /> : <EyeInvisibleOutline />}
                </div>
              }
              clearable
            />
          </Form.Item>

          <div style={{ textAlign: 'right', marginBottom: '16px' }}>
            <Button
              size="small"
              color="primary"
              fill="none"
              onClick={() => navigate('/register')}
            >
              注册账号
            </Button>
          </div>
        </Form>

        {/* 演示账号登录 */}
        <Divider style={{ margin: '24px 0' }}>演示账号</Divider>
        
        <Space wrap style={{ '--gap': '8px', justifyContent: 'center', width: '100%' }}>
          <Button
            color="primary"
            fill="outline"
            size="small"
            onClick={() => handleDemoLogin('admin')}
          >
            管理员
          </Button>
          <Button
            color="success"
            fill="outline"
            size="small"
            onClick={() => handleDemoLogin('manager')}
          >
            经理
          </Button>
          <Button
            color="warning"
            fill="outline"
            size="small"
            onClick={() => handleDemoLogin('staff')}
          >
            员工
          </Button>
        </Space>

        {/* 其他登录方式 */}
        <Divider style={{ margin: '24px 0' }}>其他方式</Divider>
        
        <Grid columns={2} gap={8}>
          <Grid.Item>
            <Button
              block
              color="default"
              fill="outline"
              size="small"
              onClick={() => Toast.show({ content: '扫码登录功能开发中', icon: 'success' })}
            >
              扫码登录
            </Button>
          </Grid.Item>
          <Grid.Item>
            <Button
              block
              color="default"
              fill="outline"
              size="small"
              onClick={() => Toast.show({ content: '指纹登录功能开发中', icon: 'success' })}
            >
              指纹登录
            </Button>
          </Grid.Item>
        </Grid>

        {/* 服务条款 */}
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: '#999' }}>
          <p>
            登录即代表您同意
            <a href="#" style={{ color: '#1677ff', margin: '0 4px' }}>服务条款</a>
            和
            <a href="#" style={{ color: '#1677ff', marginLeft: '4px' }}>隐私政策</a>
          </p>
          <p style={{ marginTop: '8px' }}>
            技术支持: IT Department | 版本: v1.0.0
          </p>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;