const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

/**
 * @route POST /api/v1/users/register
 * @desc 用户注册
 * @access Public
 */
router.post('/register', UserController.register);

/**
 * @route POST /api/v1/users/login
 * @desc 用户登录
 * @access Public
 */
router.post('/login', UserController.login);

/**
 * @route GET /api/v1/users/me
 * @desc 获取当前用户信息
 * @access Private (所有认证用户)
 */
router.get('/me', authenticate, UserController.getCurrentUser);

/**
 * @route PUT /api/v1/users/me/password
 * @desc 修改当前用户密码
 * @access Private (所有认证用户)
 */
router.put('/me/password', authenticate, UserController.changePassword);

/**
 * @route GET /api/v1/users
 * @desc 获取用户列表（管理员）
 * @access Private (管理员)
 */
router.get('/', authenticate, authorize('admin'), UserController.getUsers);

/**
 * @route GET /api/v1/users/:id
 * @desc 获取用户信息
 * @access Private (管理员或用户本人)
 */
router.get('/:id', authenticate, UserController.getUserById);

/**
 * @route PUT /api/v1/users/:id
 * @desc 更新用户信息
 * @access Private (管理员或用户本人)
 */
router.put('/:id', authenticate, UserController.updateUser);

/**
 * @route DELETE /api/v1/users/:id
 * @desc 删除用户（管理员）
 * @access Private (管理员)
 */
router.delete('/:id', authenticate, authorize('admin'), UserController.deleteUser);

/**
 * @route POST /api/v1/users/:id/reset-password
 * @desc 重置用户密码（管理员）
 * @access Private (管理员)
 */
router.post('/:id/reset-password', authenticate, authorize('admin'), UserController.resetPassword);

module.exports = router;