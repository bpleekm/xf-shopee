const express = require('express');
const router = express.Router();
const { authenticate, authenticateOrGuest } = require('../middleware/authMiddleware');
const CartController = require('../controllers/cartController');

router.get('/', authenticateOrGuest, CartController.getCart);
router.post('/items', authenticateOrGuest, CartController.addItem);
router.put('/items/:itemId', authenticateOrGuest, CartController.updateItem);
router.delete('/items/:itemId', authenticateOrGuest, CartController.removeItem);
router.delete('/', authenticateOrGuest, CartController.clearCart);
router.post('/checkout', authenticate, CartController.checkout);
router.post('/merge', authenticate, CartController.mergeCart);

module.exports = router;