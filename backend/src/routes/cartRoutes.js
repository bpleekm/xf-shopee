const express = require('express');
const router = express.Router();
const { authenticate, authenticateOrGuest } = require('../middleware/authMiddleware');
const { ApiResponse, asyncHandler } = require('../utils/response');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');

/**
 * 获取购物车标识（用户ID或会话ID）
 */
function getCartIdentifier(req) {
  const userId = req.user.id || null;
  const sessionId = req.headers['x-session-id'] || req.user.sessionId || `guest_${Date.now()}`;
  return { userId, sessionId };
}

/**
 * @route GET /api/v1/carts
 * @desc 获取购物车
 * @access Private/Public (游客使用session)
 */
router.get('/', authenticateOrGuest, asyncHandler(async (req, res) => {
  const { userId, sessionId } = getCartIdentifier(req);
  
  const cart = await Cart.getOrCreate({ userId, sessionId });
  const total = await Cart.calculateTotal(cart.id);
  
  return res.status(200).json(
    ApiResponse.success({ 
      cart: {
        ...cart,
        total
      }
    }, '获取购物车成功').toJSON()
  );
}));

/**
 * @route POST /api/v1/carts/items
 * @desc 添加商品到购物车
 * @access Private/Public (游客使用session)
 */
router.post('/items', authenticateOrGuest, asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  
  if (!productId || quantity < 1) {
    return res.status(422).json(
      ApiResponse.error('商品ID和数量必填').toJSON()
    );
  }
  
  // 检查商品是否存在
  const product = await Product.findById(parseInt(productId));
  if (!product) {
    return res.status(404).json(ApiResponse.notFound('商品不存在').toJSON());
  }
  
  // 检查库存
  if (product.stock_quantity < quantity) {
    return res.status(400).json(
      ApiResponse.error(`商品库存不足，当前库存: ${product.stock_quantity}`).toJSON()
    );
  }
  
  const { userId, sessionId } = getCartIdentifier(req);
  
  // 获取或创建购物车
  const cart = await Cart.getOrCreate({ userId, sessionId });
  
  // 添加商品到购物车
  const cartItem = await Cart.addItem(
    cart.id, 
    parseInt(productId), 
    quantity, 
    product.price
  );
  
  // 获取更新后的购物车
  const updatedCart = await Cart.findById(cart.id);
  const total = await Cart.calculateTotal(cart.id);
  
  return res.status(200).json(
    ApiResponse.success({ 
      cart: {
        ...updatedCart,
        total
      },
      addedItem: cartItem
    }, '商品添加到购物车成功').toJSON()
  );
}));

/**
 * @route PUT /api/v1/carts/items/:itemId
 * @desc 更新购物车商品数量
 * @access Private/Public (游客使用session)
 */
router.put('/items/:itemId', authenticateOrGuest, asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;
  
  if (quantity === undefined || quantity < 0) {
    return res.status(422).json(
      ApiResponse.error('数量必填且不能为负数').toJSON()
    );
  }
  
  const { userId, sessionId } = getCartIdentifier(req);
  const cart = await Cart.getOrCreate({ userId, sessionId });
  
  const success = await Cart.updateItemQuantity(cart.id, parseInt(itemId), quantity);
  
  if (!success) {
    return res.status(404).json(ApiResponse.notFound('购物车商品不存在').toJSON());
  }
  
  const updatedCart = await Cart.findById(cart.id);
  const total = await Cart.calculateTotal(cart.id);
  
  return res.status(200).json(
    ApiResponse.success({ 
      cart: {
        ...updatedCart,
        total
      }
    }, '购物车更新成功').toJSON()
  );
}));

/**
 * @route DELETE /api/v1/carts/items/:itemId
 * @desc 从购物车移除商品
 * @access Private/Public (游客使用session)
 */
router.delete('/items/:itemId', authenticateOrGuest, asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  
  const { userId, sessionId } = getCartIdentifier(req);
  const cart = await Cart.getOrCreate({ userId, sessionId });
  
  const success = await Cart.removeItem(cart.id, parseInt(itemId));
  
  if (!success) {
    return res.status(404).json(ApiResponse.notFound('购物车商品不存在').toJSON());
  }
  
  const updatedCart = await Cart.findById(cart.id);
  const total = await Cart.calculateTotal(cart.id);
  
  return res.status(200).json(
    ApiResponse.success({ 
      cart: {
        ...updatedCart,
        total
      }
    }, '商品移除成功').toJSON()
  );
}));

/**
 * @route DELETE /api/v1/carts
 * @desc 清空购物车
 * @access Private/Public (游客使用session)
 */
router.delete('/', authenticateOrGuest, asyncHandler(async (req, res) => {
  const { userId, sessionId } = getCartIdentifier(req);
  const cart = await Cart.getOrCreate({ userId, sessionId });
  
  await Cart.clearCart(cart.id);
  
  const updatedCart = await Cart.findById(cart.id);
  
  return res.status(200).json(
    ApiResponse.success({ 
      cart: updatedCart
    }, '购物车已清空').toJSON()
  );
}));

/**
 * @route POST /api/v1/carts/checkout
 * @desc 购物车结算
 * @access Private (需要登录用户)
 */
router.post('/checkout', authenticate, asyncHandler(async (req, res) => {
  const { userId, sessionId } = getCartIdentifier(req);
  const cart = await Cart.getOrCreate({ userId, sessionId });
  
  if (!cart.items || cart.items.length === 0) {
    return res.status(400).json(
      ApiResponse.error('购物车为空').toJSON()
    );
  }
  
  const { shippingAddress, paymentMethod, notes } = req.body;
  
  if (!shippingAddress) {
    return res.status(422).json(
      ApiResponse.error('收货地址是必填项').toJSON()
    );
  }
  
  // 准备订单商品数据
  const orderItems = cart.items.map(item => ({
    productId: item.product_id,
    quantity: item.quantity,
    unitPrice: item.unit_price
  }));
  
  // 创建订单
  const orderData = {
    userId: req.user.id,
    items: orderItems,
    shippingAddress,
    paymentMethod: paymentMethod || 'credit_card',
    notes: notes || null
  };
  
  try {
    const order = await Order.create(orderData);
    
    // 清空购物车
    await Cart.clearCart(cart.id);
    
    const updatedCart = await Cart.findById(cart.id);
    
    return res.status(201).json(
      ApiResponse.success({ 
        order,
        cart: updatedCart
      }, '订单创建成功').toJSON()
    );
  } catch (error) {
    if (error.message.includes('库存不足')) {
      return res.status(400).json(
        ApiResponse.error('部分商品库存不足，请调整购物车后重试').toJSON()
      );
    }
    throw error;
  }
}));

/**
 * @route POST /api/v1/carts/merge
 * @desc 合并购物车（游客登录后合并到用户购物车）
 * @access Private
 */
router.post('/merge', authenticate, asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  
  if (!sessionId) {
    return res.status(422).json(
      ApiResponse.error('会话ID是必填项').toJSON()
    );
  }
  
  // 获取游客购物车
  const guestCart = await Cart.findBySessionId(sessionId);
  if (!guestCart || !guestCart.items || guestCart.items.length === 0) {
    return res.status(200).json(
      ApiResponse.success({ merged: false }, '没有可合并的购物车商品').toJSON()
    );
  }
  
  // 获取用户购物车
  const userCart = await Cart.getOrCreate({ userId: req.user.id });
  
  // 合并购物车
  const mergedCart = await Cart.mergeCarts(guestCart.id, userCart.id);
  const total = await Cart.calculateTotal(mergedCart.id);
  
  return res.status(200).json(
    ApiResponse.success({ 
      cart: {
        ...mergedCart,
        total
      },
      merged: true
    }, '购物车合并成功').toJSON()
  );
}));

module.exports = router;