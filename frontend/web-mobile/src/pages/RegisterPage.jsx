import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Toast,
  Space,
  Stepper,
} from 'antd-mobile';
import {
  UserOutline,
  LockOutline,
  PhonebookOutline,
  MailOutline,
  TeamOutline,
  LeftOutline,
} from 'antd-mobile-icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const onFinish = async (values) => {
    setLoading(true);
    const result = await register(values);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    }
  };

  const steps = [
    {
      title: '账户信息',
      fields: ['username', 'password', 'confirmPassword'],
    },
    {
      title: '个人信息',
      fields: ['email', 'phone', 'department'],
    },
    {
      title: '确认信息',
      fields: [],
    },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' },
              ]}
            >
              <Input placeholder="请输入用户名" prefix={<UserOutline />} />
            </Form.Item>
            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码长度至少6位' },
              ]}
            >
              <Input
                placeholder="请输入密码"
                type="password"
                prefix={<LockOutline />}
              />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="确认密码"
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
              <Input
                placeholder="请再次输入密码"
                type="password"
                prefix={<LockOutline />}
              />
            </Form.Item>
          </>
        );
      case 1:
        return (
          <>
            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input placeholder="请输入邮箱" prefix={<MailOutline />} />
            </Form.Item>
            <Form.Item
              name="phone"
              label="手机号"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
              ]}
            >
              <Input placeholder="请输入手机号" prefix={<PhonebookOutline />} />
            </Form.Item>
            <Form.Item name="department" label="部门">
              <Input placeholder="请输入部门" prefix={<TeamOutline />} />
            </Form.Item>
          </>
        );
      case 2:
        return (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }}>
              ✓
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
              确认注册信息
            </div>
            <div style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
              请确认您的注册信息是否正确，点击提交完成注册
            </div>
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'left',
              marginBottom: '24px',
            }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>用户名:</strong> <span id="review-username"></span>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>邮箱:</strong> <span id="review-email"></span>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>手机号:</strong> <span id="review-phone"></span>
              </div>
              <div>
                <strong>部门:</strong> <span id="review-department"></span>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const handleNext = () => {
    // 验证当前步骤的字段
    const form = document.querySelector('.adm-form');
    if (form) {
      const inputs = form.querySelectorAll('input');
      let isValid = true;
      
      inputs.forEach(input => {
        if (input.required && !input.value.trim()) {
          isValid = false;
          Toast.show({
            content: `请填写${input.placeholder || '该字段'}`,
            icon: 'fail',
          });
        }
      });
      
      if (isValid) {
        if (currentStep === 1) {
          // 更新确认信息预览
          const formData = new FormData(form);
          document.getElementById('review-username').textContent = formData.get('username') || '';
          document.getElementById('review-email').textContent = formData.get('email') || '';
          document.getElementById('review-phone').textContent = formData.get('phone') || '';
          document.getElementById('review-department').textContent = formData.get('department') || '未填写';
        }
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    const form = document.querySelector('.adm-form');
    if (form) {
      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) submitBtn.click();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: '450px',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
        bodyStyle={{ padding: '24px' }}
      >
        {/* 标题和返回按钮 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <Button
            color="default"
            fill="none"
            onClick={() => navigate('/login')}
            style={{ marginRight: '12px' }}
          >
            <LeftOutline />
          </Button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              用户注册
            </div>
            <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
              创建您的 XF Shopee 账户
            </div>
          </div>
          <div style={{ width: '48px' }}></div>
        </div>

        {/* 步骤指示器 */}
        <Stepper
          current={currentStep}
          style={{ marginBottom: '32px' }}
        >
          {steps.map((step, index) => (
            <Stepper.Step
              key={index}
              title={step.title}
              description={index === currentStep ? '进行中' : ''}
            />
          ))}
        </Stepper>

        {/* 表单 */}
        <Form
          layout="vertical"
          onFinish={onFinish}
          style={{ marginBottom: '24px' }}
        >
          {renderStepContent()}
          
          {/* 隐藏的提交按钮 */}
          <button type="submit" style={{ display: 'none' }}></button>
        </Form>

        {/* 操作按钮 */}
        <Space direction="vertical" style={{ '--gap': '12px', width: '100%' }}>
          {currentStep < steps.length - 1 ? (
            <Button
              block
              color="primary"
              size="large"
              onClick={handleNext}
              style={{ borderRadius: '8px' }}
            >
              下一步
            </Button>
          ) : (
            <Button
              block
              color="success"
              size="large"
              loading={loading}
              onClick={handleSubmit}
              style={{ borderRadius: '8px' }}
            >
              提交注册
            </Button>
          )}
          
          {currentStep > 0 && (
            <Button
              block
              color="default"
              fill="outline"
              size="large"
              onClick={handlePrev}
              style={{ borderRadius: '8px' }}
            >
              上一步
            </Button>
          )}
          
          <Button
            block
            color="default"
            fill="none"
            size="small"
            onClick={() => navigate('/login')}
          >
            已有账户？立即登录
          </Button>
        </Space>

        {/* 服务条款 */}
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: '#999' }}>
          <p>
            注册即代表您同意
            <a href="#" style={{ color: '#52c41a', margin: '0 4px' }}>服务条款</a>
            和
            <a href="#" style={{ color: '#52c41a', marginLeft: '4px' }}>隐私政策</a>
          </p>
          <p style={{ marginTop: '8px' }}>
            技术支持热线: 400-123-4567 | 工作时间: 9:00-18:00
          </p>
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage;