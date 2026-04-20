import React, { useState, useEffect, useCallback } from 'react';
import {
  List,
  SearchBar,
  Button,
  Tag,
  Card,
  Grid,
  Space,
  Image,
  Dialog,
  Toast,
  InfiniteScroll,
  Empty,
} from 'antd-mobile';
import {
  AddOutline,
  EditSOutline,
  DeleteOutline,
  EyeOutline,
  ScanningOutline,
  FilterOutline,
} from 'antd-mobile-icons';
import { useNavigate } from 'react-router-dom';
import { productApi } from '../services/api';

const ProductsPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const categories = ['电子产品', '服装鞋帽', '家居用品', '食品饮料', '办公用品', '其他'];
  const statusOptions = [
    { value: 'active', label: '上架', color: 'success' },
    { value: 'inactive', label: '下架', color: 'default' },
    { value: 'draft', label: '草稿', color: 'warning' },
  ];

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search: searchText || undefined,
        category: selectedCategory || undefined,
        status: selectedStatus || undefined,
      };

      const result = await productApi.getAll(params);
      
      if (page === 1) {
        setProducts(result.items || []);
      } else {
        setProducts((prev) => [...prev, ...(result.items || [])]);
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
  }, [page, searchText, selectedCategory, selectedStatus, loading, hasMore]);

  useEffect(() => {
    // 重置分页并重新加载
    setPage(1);
    setHasMore(true);
    setProducts([]);
    loadMore();
  }, [searchText, selectedCategory, selectedStatus]);

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleViewDetail = (product) => {
    navigate(`/products/${product.id}`);
  };

  const handleEdit = (product) => {
    navigate(`/products/${product.id}/edit`);
  };

  const handleDelete = async (product) => {
    const result = await Dialog.confirm({
      content: `确定删除产品 "${product.name}" 吗？`,
      confirmText: '删除',
      cancelText: '取消',
    });
    
    if (result) {
      try {
        await productApi.delete(product.id);
        Toast.show({
          content: '删除成功',
          icon: 'success',
        });
        // 重新加载
        setPage(1);
        setProducts([]);
        setHasMore(true);
        loadMore();
      } catch (error) {
        Toast.show({
          content: '删除失败',
          icon: 'fail',
        });
      }
    }
  };

  const handleScan = () => {
    navigate('/scanner');
  };

  const handleAddProduct = () => {
    navigate('/products/new');
  };

  const handleUpdateStock = async (productId, quantity) => {
    try {
      await productApi.updateStock(productId, quantity);
      Toast.show({
        content: '库存更新成功',
        icon: 'success',
      });
      // 更新本地状态
      setProducts(prev =>
        prev.map(p =>
          p.id === productId ? { ...p, stock_quantity: quantity } : p
        )
      );
    } catch (error) {
      Toast.show({
        content: '更新失败',
        icon: 'fail',
      });
    }
  };

  const renderProductItem = (product) => (
    <List.Item
      key={product.id}
      prefix={
        <Image
           src={product.image_url || 'https://img.alicdn.com/imgextra/i1/O1CN01W4qqOL1CQ6wqj9yqI_!!6000000000086-2-tps-100-100.png'}
          width={60}
          height={60}
          fit="cover"
          style={{ borderRadius: '4px' }}
        />
      }
      description={
        <Space direction="vertical" style={{ '--gap': '4px' }}>
          <div>
            <span style={{ color: '#666' }}>SKU: </span>
            <Tag color="primary" fill="outline" size="small">
              {product.sku}
            </Tag>
          </div>
          <div>
            <span style={{ color: '#666' }}>分类: </span>
            <span>{product.category || '未分类'}</span>
          </div>
          <div>
            <span style={{ color: '#666' }}>库存: </span>
            <Tag
               color={product.stock_quantity <= (product.min_stock_level || 10) ? 'danger' : 'success'}
              fill="outline"
              size="small"
            >
               {product.stock_quantity}
            </Tag>
          </div>
          <div>
            <span style={{ color: '#666' }}>价格: </span>
            <span style={{ color: '#ff6b6b', fontWeight: 'bold' }}>
              ¥{product.price}
            </span>
          </div>
        </Space>
      }
      extra={
        <Space direction="vertical" style={{ '--gap': '4px' }}>
          <Button
            size="mini"
            color="primary"
            onClick={() => handleViewDetail(product)}
          >
            查看
          </Button>
          <Button
            size="mini"
            color="warning"
            onClick={() => handleEdit(product)}
          >
            编辑
          </Button>
          <Button
            size="mini"
            color="danger"
            onClick={() => handleDelete(product)}
          >
            删除
          </Button>
        </Space>
      }
      onClick={() => handleViewDetail(product)}
    >
      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
        {product.name}
        <Tag
          color={statusOptions.find(s => s.value === product.status)?.color || 'default'}
          size="small"
          style={{ marginLeft: '8px' }}
        >
          {statusOptions.find(s => s.value === product.status)?.label || '未知'}
        </Tag>
      </div>
    </List.Item>
  );

  return (
    <div style={{ padding: '12px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* 搜索栏 */}
      <div style={{ marginBottom: '12px' }}>
        <SearchBar
          placeholder="搜索产品名称、SKU、描述..."
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
          <Button
            block
            color="primary"
            size="small"
            onClick={handleAddProduct}
            style={{ borderRadius: '20px' }}
          >
            <AddOutline /> 新增
          </Button>
        </Grid.Item>
        <Grid.Item>
          <Button
            block
            color="success"
            size="small"
            onClick={handleScan}
            style={{ borderRadius: '20px' }}
          >
            <ScanningOutline /> 扫码
          </Button>
        </Grid.Item>
        <Grid.Item>
          <Button
            block
            color="default"
            size="small"
            onClick={() => setFilterVisible(true)}
            style={{ borderRadius: '20px' }}
          >
            <FilterOutline /> 筛选
          </Button>
        </Grid.Item>
        <Grid.Item>
          <Button
            block
            color="warning"
            size="small"
            onClick={() => {
              setSelectedCategory('');
              setSelectedStatus('');
              setSearchText('');
            }}
            style={{ borderRadius: '20px' }}
          >
            重置
          </Button>
        </Grid.Item>
      </Grid>

      {/* 筛选弹窗 */}
      <Dialog
        visible={filterVisible}
        title="筛选条件"
        onClose={() => setFilterVisible(false)}
        content={
          <div style={{ padding: '12px 0' }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>分类:</div>
              <Grid columns={3} gap={8}>
                {categories.map((cat) => (
                  <Grid.Item key={cat}>
                    <Button
                      size="small"
                      color={selectedCategory === cat ? 'primary' : 'default'}
                      onClick={() => setSelectedCategory(cat)}
                      style={{ borderRadius: '16px' }}
                    >
                      {cat}
                    </Button>
                  </Grid.Item>
                ))}
              </Grid>
            </div>
            <div>
              <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>状态:</div>
              <Space wrap style={{ '--gap': '8px' }}>
                {statusOptions.map((status) => (
                  <Button
                    key={status.value}
                    size="small"
                    color={selectedStatus === status.value ? 'primary' : 'default'}
                    onClick={() => setSelectedStatus(status.value)}
                    style={{ borderRadius: '16px' }}
                  >
                    {status.label}
                  </Button>
                ))}
              </Space>
            </div>
          </div>
        }
        actions={[
          {
            key: 'cancel',
            text: '取消',
            onClick: () => setFilterVisible(false),
          },
          {
            key: 'confirm',
            text: '应用筛选',
            color: 'primary',
            onClick: () => setFilterVisible(false),
          },
        ]}
      />

      {/* 产品列表 */}
      <Card
        style={{ borderRadius: '8px', marginBottom: '12px' }}
        bodyStyle={{ padding: '0' }}
      >
        {products.length === 0 && !loading ? (
          <Empty
            description="暂无产品数据"
            style={{ padding: '40px 0' }}
          />
        ) : (
          <List>
            {products.map(renderProductItem)}
          </List>
        )}
        
        {/* 无限滚动 */}
        <InfiniteScroll loadMore={loadMore} hasMore={hasMore}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '12px' }}>
              加载中...
            </div>
          )}
        </InfiniteScroll>
      </Card>

      {/* 统计信息 */}
      {products.length > 0 && (
        <Card
          style={{ borderRadius: '8px' }}
          bodyStyle={{ padding: '12px' }}
        >
          <Grid columns={3} gap={8}>
            <Grid.Item>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1677ff' }}>
                  {products.length}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>显示产品</div>
              </div>
            </Grid.Item>
            <Grid.Item>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                  {products.filter(p => p.status === 'active').length}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>上架中</div>
              </div>
            </Grid.Item>
            <Grid.Item>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#faad14' }}>
                  {products.filter(p => p.stock <= 10).length}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>低库存</div>
              </div>
            </Grid.Item>
          </Grid>
        </Card>
      )}
    </div>
  );
};

export default ProductsPage;