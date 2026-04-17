const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { ApiResponse, asyncHandler } = require('../utils/response');
const Order = require('../models/Order');

/**
 * @route GET /api/v1/orders
 * @desc 获取订单列表
 * @access Private
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { 
    status, 
    page = 1, 
    limit = 20,
    startDate,
    endDate,
    sortBy = 'created_at',
    sortOrder = 'DESC'
  } = req.query;
  
  // 普通用户只能查看自己的订单
  if (req.user.role !== 'admin') {
    const result = await Order.findByUser(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      startDate,
      endDate,
      sortBy,
      sortOrder
    });
    
    return res.status(200).json(
      ApiResponse.success(result, '获取订单列表成功').toJSON()
    );
  }
  
  // 管理员可以查看所有订单
  const result = await Order.findAll({
    page: parseInt(page),
    limit: parseInt(limit),
    status,
    userId: req.query.userId ? parseInt(req.query.userId) : null,
    startDate,
    endDate,
    sortBy,
    sortOrder
  });
  
  return res.status(200).json(
    ApiResponse.success(result, '获取订单列表成功').toJSON()
  );
}));

/**
 * @route GET /api/v1/orders/:id
 * @desc 获取订单详情
 * @access Private
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await Order.findById(parseInt(id));
  
  if (!order) {
    return res.status(404).json(ApiResponse.notFound('订单不存在').toJSON());
  }
  
  // 检查权限：用户只能查看自己的订单，管理员可以查看所有
  if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
    return res.status(403).json(ApiResponse.forbidden('无权查看此订单').toJSON());
  }
  
  return res.status(200).json(
    ApiResponse.success({ order }, '获取订单详情成功').toJSON()
  );
}));

/**
 * @route GET /api/v1/orders/order-number/:orderNumber
 * @desc 根据订单号获取订单详情
 * @access Private
 */
router.get('/order-number/:orderNumber', authenticate, asyncHandler(async (req, res) => {
  const { orderNumber } = req.params;
  const order = await Order.findByOrderNumber(orderNumber);
  
  if (!order) {
    return res.status(404).json(ApiResponse.notFound('订单不存在').toJSON());
  }
  
  // 检查权限：用户只能查看自己的订单，管理员可以查看所有
  if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
    return res.status(403).json(ApiResponse.forbidden('无权查看此订单').toJSON());
  }
  
  return res.status(200).json(
    ApiResponse.success({ order }, '获取订单详情成功').toJSON()
  );
}));

/**
 * @route POST /api/v1/orders
 * @desc 创建订单（直接创建，不通过购物车）
 * @access Private
 */
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod, notes } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(422).json(
      ApiResponse.error('订单商品不能为空').toJSON()
    );
  }
  
  if (!shippingAddress) {
    return res.status(422).json(
      ApiResponse.error('收货地址是必填项').toJSON()
    );
  }
  
  try {
    const orderData = {
      userId: req.user.id,
      items,
      shippingAddress,
      paymentMethod: paymentMethod || 'credit_card',
      notes
    };
    
    const order = await Order.create(orderData);
    
    return res.status(201).json(
      ApiResponse.success({ order }, '订单创建成功').toJSON()
    );
  } catch (error) {
    if (error.message.includes('商品信息不完整')) {
      return res.status(422).json(
        ApiResponse.error('商品信息不完整，请提供productId、quantity和unitPrice').toJSON()
      );
    }
    if (error.message.includes('库存不足')) {
      return res.status(400).json(
        ApiResponse.error('部分商品库存不足').toJSON()
      );
    }
    throw error;
  }
}));

/**
 * @route PUT /api/v1/orders/:id/status
 * @desc 更新订单状态（管理员/员工）
 * @access Private (管理员、员工)
 */
router.put('/:id/status', authenticate, authorize('admin', 'employee'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  // 检查订单是否存在
  const order = await Order.findById(parseInt(id));
  if (!order) {
    return res.status(404).json(ApiResponse.notFound('订单不存在').toJSON());
  }
  
  try {
    const updatedOrder = await Order.updateStatus(parseInt(id), status);
    
    return res.status(200).json(
      ApiResponse.success({ order: updatedOrder }, '订单状态更新成功').toJSON()
    );
  } catch (error) {
    if (error.message.includes('状态必须为')) {
      return res.status(422).json(
        ApiResponse.error(error.message).toJSON()
      );
    }
    throw error;
  }
}));

/**
 * @route PUT /api/v1/orders/:id/payment-status
 * @desc 更新订单支付状态
 * @access Private (管理员)
 */
router.put('/:id/payment-status', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;
  
  // 检查订单是否存在
  const order = await Order.findById(parseInt(id));
  if (!order) {
    return res.status(404).json(ApiResponse.notFound('订单不存在').toJSON());
  }
  
  try {
    const updatedOrder = await Order.updatePaymentStatus(parseInt(id), paymentStatus);
    
    return res.status(200).json(
      ApiResponse.success({ order: updatedOrder }, '支付状态更新成功').toJSON()
    );
  } catch (error) {
    if (error.message.includes('支付状态必须为')) {
      return res.status(422).json(
        ApiResponse.error(error.message).toJSON()
      );
    }
    throw error;
  }
}));

/**
 * @route POST /api/v1/orders/:id/cancel
 * @desc 取消订单
 * @access Private
 */
router.post('/:id/cancel', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // 检查订单是否存在
  const order = await Order.findById(parseInt(id));
  if (!order) {
    return res.status(404).json(ApiResponse.notFound('订单不存在').toJSON());
  }
  
  // 检查权限：用户只能取消自己的订单，管理员可以取消任何订单
  if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
    return res.status(403).json(ApiResponse.forbidden('无权取消此订单').toJSON());
  }
  
  // 检查订单状态是否可以取消
  if (order.status === 'cancelled') {
    return res.status(400).json(
      ApiResponse.error('订单已取消').toJSON()
    );
  }
  
  if (order.status === 'delivered') {
    return res.status(400).json(
      ApiResponse.error('已发货的订单不能取消').toJSON()
    );
  }
  
  try {
    const updatedOrder = await Order.cancelOrder(parseInt(id));
    
    return res.status(200).json(
      ApiResponse.success({ order: updatedOrder }, '订单取消成功').toJSON()
    );
  } catch (error) {
    return res.status(500).json(
      ApiResponse.error('取消订单失败').toJSON()
    );
  }
}));

/**
 * @route GET /api/v1/orders/stats
 * @desc 获取订单统计（管理员）
 * @access Private (管理员)
 */
router.get('/stats', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const stats = await Order.getStatistics({
    startDate,
    endDate
  });
  
  return res.status(200).json(
    ApiResponse.success({ stats }, '获取订单统计成功').toJSON()
  );
}));

/**
 * @route GET /api/v1/orders/user/:userId
 * @desc 获取指定用户的订单列表（管理员）
 * @access Private (管理员)
 */
router.get('/user/:userId', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { 
    status, 
    page = 1, 
    limit = 20,
    startDate,
    endDate
  } = req.query;
  
  const result = await Order.findByUser(parseInt(userId), {
    page: parseInt(page),
    limit: parseInt(limit),
    status,
    startDate,
    endDate
  });
  
  return res.status(200).json(
    ApiResponse.success(result, '获取用户订单列表成功').toJSON()
  );
}));

module.exports = router;