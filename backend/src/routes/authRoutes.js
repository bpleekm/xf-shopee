const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const AuthController = require('../controllers/authController');

router.post('/refresh', AuthController.refresh);
router.post('/logout', authenticate, AuthController.logout);
router.get('/permissions', authenticate, AuthController.getUserPermissions);
router.post('/check', authenticate, AuthController.checkPermission);
router.get('/resources', authenticate, authorize('admin'), AuthController.getResources);
router.get('/roles', authenticate, authorize('admin'), AuthController.getRoles);
router.get('/roles/:id', authenticate, authorize('admin'), AuthController.getRoleById);
router.post('/roles', authenticate, authorize('admin'), AuthController.createRole);
router.put('/roles/:id', authenticate, authorize('admin'), AuthController.updateRole);
router.delete('/roles/:id', authenticate, authorize('admin'), AuthController.deleteRole);
router.post('/roles/:id/permissions', authenticate, authorize('admin'), AuthController.assignPermissions);
router.delete('/roles/:id/permissions', authenticate, authorize('admin'), AuthController.removePermissions);
router.get('/permissions/list', authenticate, authorize('admin'), AuthController.getPermissionList);
router.post('/permissions', authenticate, authorize('admin'), AuthController.createPermission);
router.put('/permissions/:id', authenticate, authorize('admin'), AuthController.updatePermission);
router.delete('/permissions/:id', authenticate, authorize('admin'), AuthController.deletePermission);
router.get('/users/:userId/roles', authenticate, authorize('admin'), AuthController.getUserRoles);
router.post('/users/:userId/roles', authenticate, authorize('admin'), AuthController.assignUserRoles);
router.delete('/users/:userId/roles', authenticate, authorize('admin'), AuthController.removeUserRoles);

module.exports = router;