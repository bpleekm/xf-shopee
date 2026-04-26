const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const OrderController = require('../controllers/orderController');

router.get('/', authenticate, OrderController.getOrders);
router.get('/stats', authenticate, authorize('admin'), OrderController.getOrderStats);
router.get('/user/:userId', authenticate, authorize('admin'), OrderController.getUserOrders);
router.get('/order-number/:orderNumber', authenticate, OrderController.getOrderByNumber);
router.get('/:id', authenticate, OrderController.getOrderById);
router.post('/', authenticate, OrderController.createOrder);
router.put('/:id/status', authenticate, authorize('admin', 'employee'), OrderController.updateOrderStatus);
router.put('/:id/payment-status', authenticate, authorize('admin'), OrderController.updatePaymentStatus);
router.post('/:id/cancel', authenticate, OrderController.cancelOrder);

module.exports = router;