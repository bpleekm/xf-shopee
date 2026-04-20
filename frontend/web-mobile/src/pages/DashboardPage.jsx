import React, { useState, useEffect } from 'react';
import { Grid, Card, List, Space, Tag, Button, NoticeBar, Swiper, Image } from 'antd-mobile';
import { AppOutline, ShopbagOutline, UnorderedListOutline, ScanOutline } from 'antd-mobile-icons';
import { useNavigate } from 'react-router-dom';
import { productApi, orderApi } from '../services/api';

const colors = ['#1677ff', '#ff7a45', '#52c41a', '#faad14'];

const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // 获取产品统计
      const productsRes = await productApi.getAll({ page: 1, limit: 1 });
      const lowStockRes = await productApi.getLowStock({ limit: 5 });
      
      // 获取订单统计
      const ordersRes = await orderApi.getAll({ page: 1, limit: 1 });
      const pendingRes = await orderApi.getAll({ status: 'pending', limit: 5 });
      
      // 处理低库存响应格式
      const lowStockItems = lowStockRes?.products || lowStockRes?.items || [];
      const lowStockTotal = lowStockRes?.total || lowStockItems.length;
      
      setStats({
        totalProducts: productsRes?.total || 0,
        totalOrders: ordersRes?.total || 0,
        pendingOrders: pendingRes?.total || 0,
        lowStockProducts: lowStockTotal,
      });

      setLowStockItems(lowStockItems);
      setRecentOrders(pendingRes?.items || []);
    } catch (error) {
      console.error('获取仪表板数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      key: 'products',
      title: '产品管理',
      icon: <UnorderedListOutline fontSize={24} />,
      color: colors[0],
      path: '/products',
    },
    {
      key: 'orders',
      title: '订单处理',
      icon: <ShopbagOutline fontSize={24} />,
      color: colors[1],
      path: '/orders',
    },
    {
      key: 'scanner',
      title: '扫码入库',
      icon: <ScanOutline fontSize={24} />,
      color: colors[2],
      path: '/scanner',
    },
    {
      key: 'profile',
      title: '个人中心',
      icon: <AppOutline fontSize={24} />,
      color: colors[3],
      path: '/profile',
    },
  ];

  const banners = [
    { id: 1, image: 'https://img.alicdn.com/imgextra/i2/O1CN01w7U1Q21Jq7t0GQgUk_!!6000000001068-2-tps-750-200.png', url: '/products' },
    { id: 2, image: 'https://img.alicdn.com/imgextra/i1/O1CN01pGgm9e1ZnYbq3ahpI_!!6000000003240-2-tps-750-200.png', url: '/orders' },
    { id: 3, image: 'https://img.alicdn.com/imgextra/i3/O1CN01zNc8lA1H2hGC3MyoI_!!6000000000706-2-tps-750-200.png', url: '/scanner' },
  ];

  const handleQuickAction = (path) => {
    navigate(path);
  };

  return (
    <div style={{ padding: '12px', background: '#f5f5f5', minHeight: '100vh' }}>
      <NoticeBar
        content="欢迎使用 XF Shopee 移动端管理系统"
        color="info"
        style={{ marginBottom: '12px', borderRadius: '8px' }}
      />

      {/* 轮播图 */}
      <Swiper
        style={{
          '--border-radius': '8px',
          '--height': '100px',
          marginBottom: '16px',
        }}
        autoplay
        loop
      >
        {banners.map((banner) => (
          <Swiper.Item key={banner.id}>
            <div
              style={{
                height: '100px',
                background: `url(${banner.image}) no-repeat center/cover`,
                borderRadius: '8px',
              }}
              onClick={() => navigate(banner.url)}
            />
          </Swiper.Item>
        ))}
      </Swiper>

      {/* 统计卡片 */}
      <Grid columns={2} gap={8} style={{ marginBottom: '16px' }}>
        <Grid.Item>
          <Card
            style={{ borderRadius: '8px', textAlign: 'center' }}
            bodyStyle={{ padding: '12px' }}
          >
            <Space direction="vertical" align="center" style={{ '--gap': '4px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors[0] }}>
                {stats.totalProducts}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>总产品数</div>
            </Space>
          </Card>
        </Grid.Item>
        <Grid.Item>
          <Card
            style={{ borderRadius: '8px', textAlign: 'center' }}
            bodyStyle={{ padding: '12px' }}
          >
            <Space direction="vertical" align="center" style={{ '--gap': '4px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors[1] }}>
                {stats.totalOrders}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>总订单数</div>
            </Space>
          </Card>
        </Grid.Item>
        <Grid.Item>
          <Card
            style={{ borderRadius: '8px', textAlign: 'center' }}
            bodyStyle={{ padding: '12px' }}
          >
            <Space direction="vertical" align="center" style={{ '--gap': '4px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors[2] }}>
                {stats.pendingOrders}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>待处理订单</div>
            </Space>
          </Card>
        </Grid.Item>
        <Grid.Item>
          <Card
            style={{ borderRadius: '8px', textAlign: 'center' }}
            bodyStyle={{ padding: '12px' }}
          >
            <Space direction="vertical" align="center" style={{ '--gap': '4px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors[3] }}>
                {stats.lowStockProducts}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>低库存产品</div>
            </Space>
          </Card>
        </Grid.Item>
      </Grid>

      {/* 快捷操作 */}
      <Card
        title="快捷操作"
        style={{ borderRadius: '8px', marginBottom: '16px' }}
        bodyStyle={{ padding: '12px' }}
      >
        <Grid columns={4} gap={8}>
          {quickActions.map((action) => (
            <Grid.Item key={action.key}>
              <div
                style={{
                  textAlign: 'center',
                  padding: '8px 0',
                  cursor: 'pointer',
                }}
                onClick={() => handleQuickAction(action.path)}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '20px',
                    background: action.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 8px',
                  }}
                >
                  {React.cloneElement(action.icon, { color: '#fff' })}
                </div>
                <div style={{ fontSize: '12px', color: '#333' }}>{action.title}</div>
              </div>
            </Grid.Item>
          ))}
        </Grid>
      </Card>

      {/* 低库存预警 */}
      {lowStockItems.length > 0 && (
        <Card
          title="低库存预警"
          extra={
            <Button
              color="danger"
              size="mini"
              onClick={() => navigate('/products')}
            >
              查看全部
            </Button>
          }
          style={{ borderRadius: '8px', marginBottom: '16px' }}
        >
          <List>
            {lowStockItems.slice(0, 3).map((item) => (
              <List.Item
                key={item.id}
                 description={`当前库存: ${item.stock_quantity} | 预警线: ${item.min_stock_level || 10}`}
                extra={
                  <Tag color="danger" fill="outline">
                    需补货
                  </Tag>
                }
              >
                {item.name}
              </List.Item>
            ))}
          </List>
        </Card>
      )}

      {/* 待处理订单 */}
      {recentOrders.length > 0 && (
        <Card
          title="待处理订单"
          extra={
            <Button
              color="primary"
              size="mini"
              onClick={() => navigate('/orders')}
            >
              查看全部
            </Button>
          }
          style={{ borderRadius: '8px' }}
        >
          <List>
            {recentOrders.slice(0, 3).map((order) => (
              <List.Item
                key={order.id}
                 description={`订单号: ${order.order_number} | 金额: ¥${order.total_amount}`}
                extra={
                  <Tag color="warning" fill="outline">
                    {order.status}
                  </Tag>
                }
              >
                 {order.customer_name || '匿名用户'}
              </List.Item>
            ))}
          </List>
        </Card>
      )}

      {/* 底部提示 */}
      <div style={{ textAlign: 'center', marginTop: '20px', color: '#999', fontSize: '12px' }}>
        <p>XF Shopee ERP 移动端管理系统 v1.0</p>
        <p>技术支持: IT Department | 最后更新: 2026-04-20</p>
      </div>
    </div>
  );
};

export default DashboardPage;