import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Avatar,
  Space,
  Button,
  Tag,
  Dialog,
  Toast,
  Modal,
  Input,
  Form,
  Switch,
  Divider,
} from 'antd-mobile';
import {
  UserOutline,
  PhonebookOutline,
  MailOutline,
  EnvironmentOutline,
  AppOutline,
  BellOutline,
  LockOutline,
  CloseCircleOutline,
  EditSOutline,
  TeamOutline,
  CheckShieldOutline,
  QuestionCircleOutline,
} from 'antd-mobile-icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../services/api';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user: authUser, logout: authLogout } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editVisible, setEditVisible] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    autoSync: true,
    scanSound: true,
    vibration: true,
  });

  useEffect(() => {
    if (authUser) {
      setUser(authUser);
      setLoading(false);
    } else {
      fetchUserProfile();
    }
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('加载设置失败:', error);
      }
    }
  }, [authUser]);

  const fetchUserProfile = async () => {
    setLoading(true);
    if (authUser) {
      setUser(authUser);
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  const handleLogout = () => {
    Dialog.confirm({
      content: '确定要退出登录吗？',
      confirmText: '退出',
      cancelText: '取消',
      onConfirm: () => {
        authLogout();
        navigate('/login');
      },
    });
  };

  const handleSaveSettings = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('userSettings', JSON.stringify(newSettings));
    Toast.show({
      content: '设置已保存',
      icon: 'success',
    });
  };

  const handleUpdateProfile = async (values) => {
    try {
      await userApi.update(user.id, values);
      Toast.show({
        content: '个人信息更新成功',
        icon: 'success',
      });
      setEditVisible(false);
      fetchUserProfile();
    } catch (error) {
      Toast.show({
        content: '更新失败',
        icon: 'fail',
      });
    }
  };

  const handleChangePassword = async (values) => {
    try {
      await userApi.changePassword(
        user.id,
        values.oldPassword,
        values.newPassword
      );
      Toast.show({
        content: '密码修改成功',
        icon: 'success',
      });
      setPasswordVisible(false);
    } catch (error) {
      Toast.show({
        content: error.message || '密码修改失败',
        icon: 'fail',
      });
    }
  };

  const menuItems = [
    {
      key: 'notifications',
      title: '消息通知',
      icon: <BellOutline />,
      description: '推送订单、库存等通知',
      type: 'switch',
      value: settings.notifications,
      onChange: (val) => handleSaveSettings('notifications', val),
    },
    {
      key: 'darkMode',
      title: '深色模式',
      icon: <AppOutline />,
      description: '切换深色/浅色主题',
      type: 'switch',
      value: settings.darkMode,
      onChange: (val) => handleSaveSettings('darkMode', val),
    },
    {
      key: 'autoSync',
      title: '自动同步',
      icon: <CheckShieldOutline />,
      description: '自动同步数据到云端',
      type: 'switch',
      value: settings.autoSync,
      onChange: (val) => handleSaveSettings('autoSync', val),
    },
    {
      key: 'scanSound',
      title: '扫码提示音',
      icon: <BellOutline />,
      description: '扫描成功时播放提示音',
      type: 'switch',
      value: settings.scanSound,
      onChange: (val) => handleSaveSettings('scanSound', val),
    },
    {
      key: 'vibration',
      title: '震动反馈',
      icon: <AppOutline />,
      description: '操作成功时震动提示',
      type: 'switch',
      value: settings.vibration,
      onChange: (val) => handleSaveSettings('vibration', val),
    },
  ];

  const actionItems = [
    {
      key: 'edit',
      title: '编辑个人信息',
      icon: <EditSOutline />,
      color: 'primary',
      onClick: () => setEditVisible(true),
    },
    {
      key: 'password',
      title: '修改密码',
      icon: <LockOutline />,
      color: 'warning',
      onClick: () => setPasswordVisible(true),
    },
    {
      key: 'team',
      title: '团队管理',
      icon: <TeamOutline />,
      color: 'success',
      onClick: () => navigate('/team'),
    },
    {
      key: 'help',
      title: '帮助与反馈',
      icon: <QuestionCircleOutline />,
      color: 'default',
      onClick: () => window.open('https://help.xf-shopee.com', '_blank'),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
        加载中...
      </div>
    );
  }

  return (
    <div style={{ padding: '12px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* 用户信息卡片 */}
      <Card
        style={{
          borderRadius: '12px',
          marginBottom: '12px',
          background: 'linear-gradient(135deg, #1677ff 0%, #597ef7 100%)',
          color: '#fff',
        }}
        bodyStyle={{ padding: '20px' }}
      >
        <Space align="center" style={{ '--gap': '16px', width: '100%' }}>
          <Avatar
            src={user?.avatar || 'https://img.alicdn.com/imgextra/i1/O1CN01W4qqOL1CQ6wqj9yqI_!!6000000000086-2-tps-100-100.png'}
            style={{ '--size': '60px', border: '2px solid rgba(255,255,255,0.3)' }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
              {user?.username || '用户'}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>
              {user?.email || '未设置邮箱'}
            </div>
            <Space wrap style={{ '--gap': '4px' }}>
              <Tag
                color="default"
                fill="outline"
                style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}
                size="small"
              >
                {user?.role || '普通用户'}
              </Tag>
              <Tag
                color="success"
                fill="outline"
                style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}
                size="small"
              >
                ID: {user?.id?.slice(0, 8) || 'N/A'}
              </Tag>
            </Space>
          </div>
          <Button
            shape="rounded"
            color="default"
            fill="solid"
            style={{ color: '#1677ff', background: '#fff' }}
            onClick={() => setEditVisible(true)}
          >
            编辑
          </Button>
        </Space>
      </Card>

      {/* 详细信息 */}
      <Card
        style={{ borderRadius: '8px', marginBottom: '12px' }}
        bodyStyle={{ padding: '0' }}
      >
        <List>
          <List.Item prefix={<UserOutline />} description="用户名">
            {user?.username || '未设置'}
          </List.Item>
          <List.Item prefix={<PhonebookOutline />} description="手机号">
            {user?.phone || '未设置'}
          </List.Item>
          <List.Item prefix={<MailOutline />} description="邮箱">
            {user?.email || '未设置'}
          </List.Item>
          <List.Item prefix={<EnvironmentOutline />} description="部门">
            {user?.department || '未设置'}
          </List.Item>
          <List.Item prefix={<TeamOutline />} description="角色">
            <Tag color="primary" fill="outline">
              {user?.role || '普通用户'}
            </Tag>
          </List.Item>
          <List.Item prefix={<CheckShieldOutline />} description="上次登录">
            {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : '从未登录'}
          </List.Item>
        </List>
      </Card>

      {/* 操作按钮 */}
      <Card
        style={{ borderRadius: '8px', marginBottom: '12px' }}
        bodyStyle={{ padding: '12px' }}
      >
        <Grid columns={2} gap={8}>
          {actionItems.map((item) => (
            <Grid.Item key={item.key}>
              <Button
                block
                color={item.color}
                size="small"
                onClick={item.onClick}
                style={{ borderRadius: '20px' }}
              >
                <Space align="center" style={{ '--gap': '4px' }}>
                  {item.icon}
                  {item.title}
                </Space>
              </Button>
            </Grid.Item>
          ))}
        </Grid>
      </Card>

      {/* 设置选项 */}
      <Card
        title="应用设置"
        style={{ borderRadius: '8px', marginBottom: '12px' }}
        bodyStyle={{ padding: '0' }}
      >
        <List>
          {menuItems.map((item) => (
            <List.Item
              key={item.key}
              prefix={item.icon}
              description={item.description}
              extra={
                item.type === 'switch' ? (
                  <Switch
                    checked={item.value}
                    onChange={item.onChange}
                  />
                ) : null
              }
            >
              {item.title}
            </List.Item>
          ))}
        </List>
      </Card>

      {/* 系统信息 */}
      <Card
        style={{ borderRadius: '8px', marginBottom: '12px' }}
        bodyStyle={{ padding: '12px' }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
            系统信息
          </div>
          <Grid columns={3} gap={8}>
            <Grid.Item>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>v1.0.0</div>
                <div style={{ fontSize: '10px', color: '#999' }}>版本</div>
              </div>
            </Grid.Item>
            <Grid.Item>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>H5</div>
                <div style={{ fontSize: '10px', color: '#999' }}>平台</div>
              </div>
            </Grid.Item>
            <Grid.Item>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>2026-04-20</div>
                <div style={{ fontSize: '10px', color: '#999' }}>更新日期</div>
              </div>
            </Grid.Item>
          </Grid>
        </div>
      </Card>

      {/* 退出登录按钮 */}
      <Button
        block
        color="danger"
        fill="solid"
        size="large"
        onClick={handleLogout}
        style={{ borderRadius: '8px' }}
      >
        <Space align="center" style={{ '--gap': '8px' }}>
          <CloseCircleOutline />
          退出登录
        </Space>
      </Button>

      {/* 编辑个人信息弹窗 */}
      <Modal
        visible={editVisible}
        title="编辑个人信息"
        content={
          <Form
            layout="vertical"
            onFinish={handleUpdateProfile}
            initialValues={{
              username: user?.username,
              email: user?.email,
              phone: user?.phone,
              department: user?.department,
            }}
            style={{ padding: '12px 0' }}
          >
            <Form.Item name="username" label="用户名">
              <Input placeholder="请输入用户名" />
            </Form.Item>
            <Form.Item name="email" label="邮箱">
              <Input placeholder="请输入邮箱" type="email" />
            </Form.Item>
            <Form.Item name="phone" label="手机号">
              <Input placeholder="请输入手机号" />
            </Form.Item>
            <Form.Item name="department" label="部门">
              <Input placeholder="请输入部门" />
            </Form.Item>
          </Form>
        }
        actions={[
          {
            key: 'cancel',
            text: '取消',
            onClick: () => setEditVisible(false),
          },
          {
            key: 'submit',
            text: '保存',
            color: 'primary',
            onClick: () => {
              const form = document.querySelector('.adm-form');
              if (form) {
                const submitBtn = form.querySelector('[type="submit"]');
                if (submitBtn) submitBtn.click();
              }
            },
          },
        ]}
        onClose={() => setEditVisible(false)}
      />

      {/* 修改密码弹窗 */}
      <Modal
        visible={passwordVisible}
        title="修改密码"
        content={
          <Form
            layout="vertical"
            onFinish={handleChangePassword}
            style={{ padding: '12px 0' }}
          >
            <Form.Item
              name="oldPassword"
              label="原密码"
              rules={[{ required: true, message: '请输入原密码' }]}
            >
              <Input placeholder="请输入原密码" type="password" />
            </Form.Item>
            <Form.Item
              name="newPassword"
              label="新密码"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码长度至少6位' },
              ]}
            >
              <Input placeholder="请输入新密码" type="password" />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="确认新密码"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: '请确认新密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input placeholder="请再次输入新密码" type="password" />
            </Form.Item>
          </Form>
        }
        actions={[
          {
            key: 'cancel',
            text: '取消',
            onClick: () => setPasswordVisible(false),
          },
          {
            key: 'submit',
            text: '确认修改',
            color: 'primary',
            onClick: () => {
              const form = document.querySelector('.adm-form');
              if (form) {
                const submitBtn = form.querySelector('[type="submit"]');
                if (submitBtn) submitBtn.click();
              }
            },
          },
        ]}
        onClose={() => setPasswordVisible(false)}
      />

      {/* 页脚信息 */}
      <div style={{ textAlign: 'center', marginTop: '20px', color: '#999', fontSize: '12px' }}>
        <p>XF Shopee ERP 移动端管理系统</p>
        <p>© 2026 XF Shopee 版权所有 | 隐私政策 | 服务条款</p>
        <p style={{ marginTop: '8px' }}>
          技术支持: <a href="mailto:support@xf-shopee.com" style={{ color: '#1677ff' }}>
            support@xf-shopee.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default ProfilePage;