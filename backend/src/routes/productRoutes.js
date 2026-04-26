const express = require('express');
const router = express.Router();
const { authenticate, authorize, authenticateOrGuest } = require('../middleware/authMiddleware');
const ProductController = require('../controllers/productController');

router.get('/', authenticateOrGuest, ProductController.getProducts);
router.get('/low-stock', authenticate, authorize('admin', 'employee'), ProductController.getLowStockProducts);
router.get('/:id', authenticateOrGuest, ProductController.getProductById);
router.post('/', authenticate, authorize('admin', 'employee'), ProductController.createProduct);
router.put('/:id', authenticate, authorize('admin', 'employee'), ProductController.updateProduct);
router.patch('/:id/stock', authenticate, authorize('admin', 'employee'), ProductController.updateStock);
router.delete('/:id', authenticate, authorize('admin'), ProductController.deleteProduct);
router.post('/batch/status', authenticate, authorize('admin'), ProductController.batchUpdateStatus);

module.exports = router;