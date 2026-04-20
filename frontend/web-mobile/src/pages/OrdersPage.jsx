import React, { useState, useEffect, useCallback } from 'react';
import {
  List,
  SearchBar,
  Button,
  Tag,
  Card,
  Grid,
  Space,
  Dialog,
  Toast,
  InfiniteScroll,
  Empty,
  Badge,
  Steps,
  Popover,
} from 'antd-mobile';
import {
  EyeOutline,
  CheckCircleOutline,
  CloseCircleOutline,
  TruckOutline,
  FilterOutline,
  DownloadOutline,
  PrinterOutline,
} from 'antd-mobile-icons';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../services/api';

const statusSteps = {
  pending: 0,
  processing: 1,
  shipped: 2,
  delivered: 3,
  completed: 4,
  cancelled: 5,
};

const statusLabels = {
  pending: '待处理',
  processing: '处理中',
  shipped: '已发货',
  delivered: '已送达',
  completed: '已完成',
  cancelled: '已取消',
};

const statusColors = {
  pending: 'warning',
  processing: 'primary',
  shipped: 'default',
  delivered: 'success',
  completed: 'success',
  cancelled: 'danger',
};

const OrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [dateRange, setDateRange] = useState(['', '']);

  const statusOptions = Object.entries(statusLabels).map(([value, label]) => ({
    value,
    label,
    color: statusColors[value],
  }));

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search: searchText || undefined,
        status: selectedStatus || undefined,
        startDate: dateRange[0] || undefined,
        endDate: dateRange[1] || undefined,
      };

      const result = await orderApi.getAll(params);
      
      if (page === 1) {
        setOrders(result.items || []);
      } else {
        setOrders((prev) => [...prev, ...(result.items || [])]);
      }

      setHasMore(result.items?.length === 10);
      setPage(page + 1);
    } catch (error) {
      Toast.show({
        content: '加载失败',
        icon: 'fail',
      });
    } finally {
      setLoading(false);
    }
  }, [page, searchText, selectedStatus, dateRange, loading, hasMore]);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setOrders([]);
    loadMore();
  }, [searchText, selectedStatus, dateRange]);

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleViewDetail = (order) => {
    navigate(`/orders/${order.id}`);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await orderApi.updateStatus(orderId, newStatus);
      Toast.show({
        content: '状态更新成功',
        icon: 'success',
      });
      
      // 更新本地状态
      setOrders(prev =>
        prev.map(o =>
          o.id === orderId ? { ...o, status: newStatus } : o
        )
      );
    } catch (error) {
      Toast.show({
        content: '更新失败',
        icon: 'fail',
      });
    }
  };

  const handleCancelOrder = async (order) => {
    const result = await Dialog.confirm({
       content: `确定取消订单 "${order.order_number}" 吗？`,
      confirmText: '确认取消',
      cancelText: '再想想',
    });
    
    if (result) {
      try {
        await orderApi.cancel(order.id);
        Toast.show({
          content: '订单已取消',
          icon: 'success',
        });
        setOrders(prev =>
          prev.map(o =>
            o.id === order.id ? { ...o, status: 'cancelled' } : o
          )
        );
      } catch (error) {
        Toast.show({
          content: '取消失败',
          icon: 'fail',
        });
      }
    }
  };

  const handlePrint = (order) => {
    Toast.show({
      content: '打印功能开发中...',
      icon: 'success',
    });
  };

  const handleExport = () => {
    Toast.show({
      content: '导出功能开发中...',
      icon: 'success',
    });
  };

  const renderStatusActions = (order) => {
    const actions = [];
    
    switch (order.status) {
      case 'pending':
        actions.push(
          <Button
            key="process"
            size="mini"
            color="primary"
            onClick={() => handleUpdateStatus(order.id, 'processing')}
          >
            开始处理
          </Button>
        );
        break;
      case 'processing':
        actions.push(
          <Button
            key="ship"
            size="mini"
            color="success"
            onClick={() => handleUpdateStatus(order.id, 'shipped')}
          >
            标记发货
          </Button>
        );
        break;
      case 'shipped':
        actions.push(
          <Button
            key="deliver"
            size="mini"
            color="warning"
            onClick={() => handleUpdateStatus(order.id, 'delivered')}
          >
            确认送达
          </Button>
        );
        break;
      case 'delivered':
        actions.push(
          <Button
            key="complete"
            size="mini"
            color="success"
            onClick={() => handleUpdateStatus(order.id, 'completed')}
          >
            完成订单
          </Button>
        );
        break;
    }

    if (order.status !== 'cancelled' && order.status !== 'completed') {
      actions.push(
        <Button
          key="cancel"
          size="mini"
          color="danger"
          onClick={() => handleCancelOrder(order)}
        >
          取消订单
        </Button>
      );
    }

    return (
      <Space wrap style={{ '--gap': '4px' }}>
        {actions}
      </Space>
    );
  };

  const renderOrderItem = (order) => (
    <List.Item
      key={order.id}
      prefix={
        <Badge
          content={order.itemsCount || 0}
          color={statusColors[order.status]}
          style={{ '--right': '-8px', '--top': '-8px' }}
        >
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '25px',
              background: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TruckOutline fontSize={24} color="#666" />
          </div>
        </Badge>
      }
      description={
        <Space direction="vertical" style={{ '--gap': '4px' }}>
          <div>
            <span style={{ color: '#666' }}>客户: </span>
            <span style={{ fontWeight: 'bold' }}>
               {order.customer_name || '匿名用户'}
            </span>
          </div>
          <div>
            <span style={{ color: '#666' }}>电话: </span>
             <span>{order.customer_phone || '未提供'}</span>
          </div>
          <div>
            <span style={{ color: '#666' }}>金额: </span>
            <span style={{ color: '#ff6b6b', fontWeight: 'bold' }}>
               ¥{order.total_amount}
            </span>
          </div>
          <div>
            <span style={{ color: '#666' }}>创建时间: </span>
            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
        </Space>
      }
      extra={
        <Space direction="vertical" style={{ '--gap': '8px' }}>
          <Tag
            color={statusColors[order.status]}
            fill="outline"
            style={{ minWidth: '60px', textAlign: 'center' }}
          >
            {statusLabels[order.status] || order.status}
          </Tag>
          {renderStatusActions(order)}
          <Space style={{ '--gap': '4px' }}>
            <Button
              size="mini"
              color="default"
              onClick={() => handleViewDetail(order)}
            >
              <EyeOutline />
            </Button>
            <Button
              size="mini"
              color="default"
              onClick={() => handlePrint(order)}
            >
              <PrinterOutline />
            </Button>
          </Space>
        </Space>
      }
      onClick={() => handleViewDetail(order)}
    >
      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
         {order.order_number}
      </div>
    </List.Item>
  );

  return (
    <div style={{ padding: '12px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* 搜索栏 */}
      <div style={{ marginBottom: '12px' }}>
        <SearchBar
          placeholder="搜索订单号、客户姓名、电话..."
          value={searchText}
          onChange={handleSearch}
          showCancelButton
          onCancel={() => setSearchText('')}
          style={{
            '--background': '#fff',
            '--border-radius': '20px',
            '--height': '36px',
          }}
        />
      </div>

      {/* 操作按钮 */}
      <Grid columns={4} gap={8} style={{ marginBottom: '12px' }}>
        <Grid.Item>
          <Popover
            content={
              <div style={{ padding: '12px', width: '200px' }}>
                <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>快速筛选:</div>
                <Space direction="vertical" style={{ '--gap': '8px', width: '100%' }}>
                  {statusOptions.map((status) => (
                    <Button
                      key={status.value}
                      size="small"
                      color={selectedStatus === status.value ? 'primary' : 'default'}
                      onClick={() => {
                        setSelectedStatus(status.value);
                      }}
                      block
                    >
                      {status.label}
                    </Button>
                  ))}
                  <Button
                    size="small"
                    color="default"
                    onClick={() => setSelectedStatus('')}
                    block
                  >
                    全部状态
                  </Button>
                </Space>
              </div>
            }
            placement="bottom-start"
            trigger="click"
          >
            <Button
              block
              color="primary"
              size="small"
              style={{ borderRadius: '20px' }}
            >
              <FilterOutline /> 状态筛选
            </Button>
          </Popover>
        </Grid.Item>
        <Grid.Item>
          <Button
            block
            color="success"
            size="small"
            onClick={() => setDateRange(['', ''])}
            style={{ borderRadius: '20px' }}
          >
            全部日期
          </Button>
        </Grid.Item>
        <Grid.Item>
          <Button
            block
            color="warning"
            size="small"
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              setDateRange([today, today]);
            }}
            style={{ borderRadius: '20px' }}
          >
            今日订单
          </Button>
        </Grid.Item>
        <Grid.Item>
          <Button
            block
            color="default"
            size="small"
            onClick={handleExport}
            style={{ borderRadius: '20px' }}
          >
            <DownloadOutline /> 导出
          </Button>
        </Grid.Item>
      </Grid>

      {/* 订单列表 */}
      <Card
        style={{ borderRadius: '8px', marginBottom: '12px' }}
        bodyStyle={{ padding: '0' }}
      >
        {orders.length === 0 && !loading ? (
          <Empty
            description="暂无订单数据"
            style={{ padding: '40px 0' }}
          />
        ) : (
          <List>
            {orders.map(renderOrderItem)}
          </List>
        )}
        
        <InfiniteScroll loadMore={loadMore} hasMore={hasMore}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '12px' }}>
              加载中...
            </div>
          )}
        </InfiniteScroll>
      </Card>

      {/* 订单状态统计 */}
      {orders.length > 0 && (
        <Card
          style={{ borderRadius: '8px' }}
          bodyStyle={{ padding: '12px' }}
        >
          <Grid columns={3} gap={8}>
            {statusOptions.map((status) => {
              const count = orders.filter(o => o.status === status.value).length;
              if (count === 0) return null;
              
              return (
                <Grid.Item key={status.value}>
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '8px',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: `var(--adm-color-${status.color})`,
                      }}
                    >
                      {count}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {status.label}
                    </div>
                  </div>
                </Grid.Item>
              );
            })}
          </Grid>
        </Card>
      )}

      {/* 订单处理进度说明 */}
      <Card
        title="订单处理流程"
        style={{ borderRadius: '8px', marginTop: '12px' }}
        bodyStyle={{ padding: '12px' }}
      >
        <Steps current={2} direction="vertical">
          <Steps.Step
            title="待处理"
            description="新创建的订单，等待处理"
            icon={<span style={{ color: '#faad14' }}>①</span>}
          />
          <Steps.Step
            title="处理中"
            description="订单正在处理中，准备发货"
            icon={<span style={{ color: '#1677ff' }}>②</span>}
          />
          <Steps.Step
            title="已发货"
            description="订单已发出，运输中"
            icon={<span style={{ color: '#666' }}>③</span>}
          />
          <Steps.Step
            title="已送达"
            description="订单已送达客户"
            icon={<span style={{ color: '#52c41a' }}>④</span>}
          />
          <Steps.Step
            title="已完成"
            description="订单已完成全部流程"
            icon={<span style={{ color: '#52c41a' }}>⑤</span>}
          />
        </Steps>
      </Card>
    </div>
  );
};

export default OrdersPage;