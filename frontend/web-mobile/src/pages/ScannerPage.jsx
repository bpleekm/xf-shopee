import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Card,
  Grid,
  Space,
  Dialog,
  Toast,
  List,
  Tag,
  Input,
  NumberKeyboard,
  Modal,
} from 'antd-mobile';
import {
  ScanOutline,
  PlusOutline,
  MinusOutline,
  CheckCircleOutline,
  CloseCircleOutline,
  HistoryOutline,
  CameraOutline,
} from 'antd-mobile-icons';
import { useNavigate } from 'react-router-dom';
import { productApi } from '../services/api';

const ScannerPage = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [manualInputVisible, setManualInputVisible] = useState(false);
  const [manualSku, setManualSku] = useState('');
  const [scannedItems, setScannedItems] = useState([]);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [operationType, setOperationType] = useState('check'); // check, in, out
  const [historyVisible, setHistoryVisible] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);

  const operationTypes = [
    { value: 'check', label: '库存盘点', color: 'primary' },
    { value: 'in', label: '入库操作', color: 'success' },
    { value: 'out', label: '出库操作', color: 'warning' },
  ];

  // 模拟扫描历史数据
  useEffect(() => {
    // 从localStorage加载扫描历史
    const savedHistory = localStorage.getItem('scanHistory');
    if (savedHistory) {
      try {
        setScanHistory(JSON.parse(savedHistory).slice(0, 10));
      } catch (error) {
        console.error('加载扫描历史失败:', error);
      }
    }
  }, []);

  const saveToHistory = (item) => {
    const newHistory = [
      {
        ...item,
        timestamp: new Date().toISOString(),
        operation: operationType,
      },
      ...scanHistory,
    ].slice(0, 20); // 保留最近20条
    
    setScanHistory(newHistory);
    localStorage.setItem('scanHistory', JSON.stringify(newHistory));
  };

  const handleScan = async (sku) => {
    try {
      Toast.show({
        content: '正在查询产品...',
        icon: 'loading',
        duration: 1000,
      });

      const product = await productApi.getBySKU(sku);
      
      if (!product) {
        Dialog.alert({
          content: `未找到 SKU: ${sku} 对应的产品`,
          confirmText: '确定',
        });
        return;
      }

      setCurrentProduct(product);
      
      // 添加到扫描列表
      const existingIndex = scannedItems.findIndex(item => item.sku === sku);
      
      if (existingIndex >= 0) {
        // 如果已存在，更新数量
        const updatedItems = [...scannedItems];
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: updatedItems[existingIndex].quantity + quantity,
          lastScanned: new Date().toISOString(),
        };
        setScannedItems(updatedItems);
      } else {
        // 新增项目
        const newItem = {
          id: product.id,
          sku: product.sku,
          name: product.name,
          currentStock: product.stock_quantity,
          quantity: quantity,
          price: product.price,
          category: product.category,
          image: product.image_url,
          lastScanned: new Date().toISOString(),
        };
        setScannedItems([newItem, ...scannedItems]);
      }

      // 保存到历史
      saveToHistory({
        sku: product.sku,
        name: product.name,
        quantity,
        operation: operationType,
      });

      // 根据操作类型执行相应动作
      switch (operationType) {
        case 'in':
          await handleStockIn(product.id, quantity);
          break;
        case 'out':
          await handleStockOut(product.id, quantity);
          break;
        default:
          // 盘点操作只记录不修改库存
          break;
      }

      Toast.show({
        content: `已扫描: ${product.name}`,
        icon: 'success',
      });

      // 重置数量
      setQuantity(1);
    } catch (error) {
      console.error('扫描失败:', error);
      Dialog.alert({
        content: `扫描失败: ${error.message || '未知错误'}`,
        confirmText: '确定',
      });
    }
  };

  const handleStockIn = async (productId, qty) => {
    try {
      await productApi.updateStock(productId, qty);
      Toast.show({
        content: '入库成功',
        icon: 'success',
      });
    } catch (error) {
      console.error('入库失败:', error);
    }
  };

  const handleStockOut = async (productId, qty) => {
    try {
      await productApi.updateStock(productId, -qty);
      Toast.show({
        content: '出库成功',
        icon: 'success',
      });
    } catch (error) {
      console.error('出库失败:', error);
    }
  };

  const handleManualInput = () => {
    if (!manualSku.trim()) {
      Toast.show({
        content: '请输入SKU',
        icon: 'fail',
      });
      return;
    }

    handleScan(manualSku.trim());
    setManualSku('');
    setManualInputVisible(false);
  };

  const handleClearAll = () => {
    Dialog.confirm({
      content: '确定清空所有扫描记录吗？',
      confirmText: '清空',
      cancelText: '取消',
      onConfirm: () => {
        setScannedItems([]);
        Toast.show({
          content: '已清空',
          icon: 'success',
        });
      },
    });
  };

  const handleSubmitBatch = async () => {
    if (scannedItems.length === 0) {
      Toast.show({
        content: '请先扫描至少一个产品',
        icon: 'fail',
      });
      return;
    }

    try {
      // 批量更新库存（如果是入库或出库操作）
      if (operationType === 'in' || operationType === 'out') {
        const updates = scannedItems.map(item => ({
          productId: item.id,
          quantity: operationType === 'in' ? item.quantity : -item.quantity,
        }));

        // 这里可以调用批量更新API
        // await productApi.batchUpdateStock(updates);
        
        Toast.show({
          content: `批量${operationType === 'in' ? '入库' : '出库'}成功`,
          icon: 'success',
        });
      }

      // 保存为盘点记录
      const inventoryRecord = {
        type: operationType,
        items: scannedItems,
        totalItems: scannedItems.length,
        totalQuantity: scannedItems.reduce((sum, item) => sum + item.quantity, 0),
        timestamp: new Date().toISOString(),
      };

      // 保存到本地历史
      const records = JSON.parse(localStorage.getItem('inventoryRecords') || '[]');
      records.unshift(inventoryRecord);
      localStorage.setItem('inventoryRecords', JSON.stringify(records.slice(0, 50)));

      Dialog.alert({
        content: `操作完成！\n扫描项目: ${scannedItems.length}\n总数量: ${inventoryRecord.totalQuantity}`,
        confirmText: '确定',
        onConfirm: () => {
          setScannedItems([]);
        },
      });
    } catch (error) {
      Toast.show({
        content: '提交失败',
        icon: 'fail',
      });
    }
  };

  const renderScannedItem = (item, index) => (
    <List.Item
      key={`${item.sku}-${index}`}
      prefix={
        <div
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '8px',
            background: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <ScanOutline fontSize={24} color="#666" />
          )}
        </div>
      }
      description={
        <Space direction="vertical" style={{ '--gap': '2px' }}>
          <div>
            <span style={{ color: '#666' }}>SKU: </span>
            <Tag color="primary" fill="outline" size="small">
              {item.sku}
            </Tag>
          </div>
          <div>
            <span style={{ color: '#666' }}>当前库存: </span>
            <span style={{ fontWeight: 'bold' }}>{item.currentStock}</span>
          </div>
          <div>
            <span style={{ color: '#666' }}>扫描时间: </span>
            <span>{new Date(item.lastScanned).toLocaleTimeString()}</span>
          </div>
        </Space>
      }
      extra={
        <Space direction="vertical" align="end" style={{ '--gap': '4px' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1677ff' }}>
            ×{item.quantity}
          </div>
          <Button
            size="mini"
            color="danger"
            onClick={() => {
              setScannedItems(scannedItems.filter((_, i) => i !== index));
            }}
          >
            删除
          </Button>
        </Space>
      }
    >
      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{item.name}</div>
    </List.Item>
  );

  return (
    <div style={{ padding: '12px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* 操作类型选择 */}
      <Card
        style={{ borderRadius: '8px', marginBottom: '12px' }}
        bodyStyle={{ padding: '12px' }}
      >
        <div style={{ marginBottom: '12px', fontWeight: 'bold' }}>
          选择操作类型:
        </div>
        <Grid columns={3} gap={8}>
          {operationTypes.map((type) => (
            <Grid.Item key={type.value}>
              <Button
                block
                color={operationType === type.value ? type.color : 'default'}
                size="small"
                onClick={() => setOperationType(type.value)}
                style={{ borderRadius: '20px' }}
              >
                {type.label}
              </Button>
            </Grid.Item>
          ))}
        </Grid>
      </Card>

      {/* 扫码控制区域 */}
      <Card
        style={{ borderRadius: '8px', marginBottom: '12px' }}
        bodyStyle={{ padding: '12px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '60px',
              background: scanning ? '#1677ff' : '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onClick={() => {
              if (scanning) {
                setScanning(false);
                // 模拟扫描结果
                const mockSku = `SKU${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
                handleScan(mockSku);
              } else {
                setScanning(true);
                Toast.show({
                  content: '请将摄像头对准条形码/二维码',
                  icon: 'loading',
                  duration: 2000,
                });
              }
            }}
          >
            {scanning ? (
              <div style={{ textAlign: 'center' }}>
                <CameraOutline fontSize={48} color="#fff" />
                <div style={{ color: '#fff', marginTop: '8px', fontSize: '12px' }}>
                  正在扫描...
                </div>
              </div>
            ) : (
              <ScanOutline fontSize={48} color="#666" />
            )}
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
            {scanning ? '点击停止扫描' : '点击开始扫描'}
          </div>
        </div>

        <Grid columns={2} gap={8}>
          <Grid.Item>
            <Button
              block
              color="primary"
              onClick={() => setManualInputVisible(true)}
              style={{ borderRadius: '20px' }}
            >
              <PlusOutline /> 手动输入
            </Button>
          </Grid.Item>
          <Grid.Item>
            <Button
              block
              color="default"
              onClick={() => setHistoryVisible(true)}
              style={{ borderRadius: '20px' }}
            >
              <HistoryOutline /> 扫描历史
            </Button>
          </Grid.Item>
        </Grid>
      </Card>

      {/* 数量调整 */}
      <Card
        style={{ borderRadius: '8px', marginBottom: '12px' }}
        bodyStyle={{ padding: '12px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 'bold' }}>扫描数量:</div>
          <Space align="center" style={{ '--gap': '12px' }}>
            <Button
              shape="circle"
              size="small"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <MinusOutline />
            </Button>
            <div style={{ fontSize: '24px', fontWeight: 'bold', minWidth: '40px', textAlign: 'center' }}>
              {quantity}
            </div>
            <Button
              shape="circle"
              size="small"
              onClick={() => setQuantity(quantity + 1)}
            >
              <PlusOutline />
            </Button>
          </Space>
        </div>
      </Card>

      {/* 扫描结果列表 */}
      <Card
        title={`扫描结果 (${scannedItems.length})`}
        extra={
          <Space style={{ '--gap': '4px' }}>
            <Button
              size="mini"
              color="danger"
              onClick={handleClearAll}
              disabled={scannedItems.length === 0}
            >
              清空
            </Button>
            <Button
              size="mini"
              color="success"
              onClick={handleSubmitBatch}
              disabled={scannedItems.length === 0}
            >
              提交
            </Button>
          </Space>
        }
        style={{ borderRadius: '8px', marginBottom: '12px' }}
        bodyStyle={{ padding: '0' }}
      >
        {scannedItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            <ScanOutline fontSize={48} style={{ marginBottom: '12px' }} />
            <div>暂无扫描结果</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              点击上方按钮开始扫描
            </div>
          </div>
        ) : (
          <List>
            {scannedItems.map(renderScannedItem)}
          </List>
        )}
      </Card>

      {/* 统计信息 */}
      {scannedItems.length > 0 && (
        <Card
          style={{ borderRadius: '8px' }}
          bodyStyle={{ padding: '12px' }}
        >
          <Grid columns={2} gap={8}>
            <Grid.Item>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1677ff' }}>
                  {scannedItems.length}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>扫描项目</div>
              </div>
            </Grid.Item>
            <Grid.Item>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                  {scannedItems.reduce((sum, item) => sum + item.quantity, 0)}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>总数量</div>
              </div>
            </Grid.Item>
          </Grid>
        </Card>
      )}

      {/* 手动输入弹窗 */}
      <Modal
        visible={manualInputVisible}
        title="手动输入SKU"
        content={
          <div style={{ padding: '12px 0' }}>
            <Input
              placeholder="请输入产品SKU"
              value={manualSku}
              onChange={setManualSku}
              style={{ '--text-align': 'center' }}
              autoFocus
            />
            <div style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
              提示: SKU通常是产品的唯一编码，如 "SKU001", "P12345" 等
            </div>
          </div>
        }
        actions={[
          {
            key: 'cancel',
            text: '取消',
            onClick: () => setManualInputVisible(false),
          },
          {
            key: 'confirm',
            text: '确认',
            color: 'primary',
            onClick: handleManualInput,
          },
        ]}
        onClose={() => setManualInputVisible(false)}
      />

      {/* 扫描历史弹窗 */}
      <Modal
        visible={historyVisible}
        title="扫描历史"
        content={
          <div style={{ maxHeight: '400px', overflow: 'auto' }}>
            {scanHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                暂无扫描历史
              </div>
            ) : (
              <List>
                {scanHistory.map((record, index) => (
                  <List.Item
                    key={index}
                    description={`${new Date(record.timestamp).toLocaleString()} | ${record.operation === 'in' ? '入库' : record.operation === 'out' ? '出库' : '盘点'}`}
                    extra={
                      <Tag
                        color={record.operation === 'in' ? 'success' : record.operation === 'out' ? 'warning' : 'primary'}
                        size="small"
                      >
                        ×{record.quantity}
                      </Tag>
                    }
                  >
                    {record.name}
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                      SKU: {record.sku}
                    </div>
                  </List.Item>
                ))}
              </List>
            )}
          </div>
        }
        actions={[
          {
            key: 'close',
            text: '关闭',
            onClick: () => setHistoryVisible(false),
          },
          {
            key: 'clear',
            text: '清空历史',
            color: 'danger',
            onClick: () => {
              setScanHistory([]);
              localStorage.removeItem('scanHistory');
              Toast.show({
                content: '历史已清空',
                icon: 'success',
              });
            },
          },
        ]}
        onClose={() => setHistoryVisible(false)}
      />
    </div>
  );
};

export default ScannerPage;