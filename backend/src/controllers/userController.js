const User = require('../models/User');
const AuthService = require('../utils/auth');
const { ApiResponse, asyncHandler } = require('../utils/response');
const Joi = require('joi');

// 验证模式
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  full_name: Joi.string().max(100),
  phone: Joi.string().max(20),
  role: Joi.string().valid('employee', 'admin')
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

const updateUserSchema = Joi.object({
  full_name: Joi.string().max(100),
  phone: Joi.string().max(20),
  status: Joi.string().valid('active', 'inactive', 'suspended')
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

class UserController {
  /**
   * 用户注册
   */
  static register = asyncHandler(async (req, res) => {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }));
      return res.status(422).json(ApiResponse.validationError(errors).toJSON());
    }

    const { username, email, password, role = 'employee', full_name, phone } = req.body;

    // 检查用户名是否已存在
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(409).json(ApiResponse.error('用户名已存在', 409).toJSON());
    }

    // 检查邮箱是否已存在
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(409).json(ApiResponse.error('邮箱已存在', 409).toJSON());
    }

    // 创建用户
    const user = await User.create({
      username,
      email,
      password,
      role,
      full_name,
      phone,
      status: 'active'
    });

    const payload = { id: user.id, username: user.username, role: user.role, email: user.email };
    const token = AuthService.generateToken(payload);
    const refreshToken = AuthService.generateRefreshToken(payload);

    return res.status(201).json(
      ApiResponse.success(
        {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            full_name: user.full_name,
            phone: user.phone,
            status: user.status,
            created_at: user.created_at
          },
          token,
          refreshToken
        },
        '用户注册成功'
      ).toJSON()
    );
  });

  /**
   * 用户登录
   */
  static login = asyncHandler(async (req, res) => {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }));
      return res.status(422).json(ApiResponse.validationError(errors).toJSON());
    }

    const { username, password } = req.body;

    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json(ApiResponse.unauthorized('用户名或密码错误').toJSON());
    }

    const isValidPassword = await User.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json(ApiResponse.unauthorized('用户名或密码错误').toJSON());
    }

    if (user.status !== 'active') {
      return res.status(403).json(ApiResponse.forbidden('账户已被禁用').toJSON());
    }

    await User.updateLastLogin(user.id);

    const payload = { id: user.id, username: user.username, role: user.role, email: user.email };
    const token = AuthService.generateToken(payload);
    const refreshToken = AuthService.generateRefreshToken(payload);

    return res.status(200).json(
      ApiResponse.success(
        {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            full_name: user.full_name,
            phone: user.phone,
            status: user.status,
            last_login_at: user.last_login_at
          },
          token,
          refreshToken
        },
        '登录成功'
      ).toJSON()
    );
  });

  /**
   * 获取当前用户信息
   */
  static getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json(ApiResponse.notFound('用户不存在').toJSON());
    }

    return res.status(200).json(
      ApiResponse.success(
        { user },
        '获取用户信息成功'
      ).toJSON()
    );
  });

  /**
   * 获取用户列表（管理员）
   */
  static getUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, role, status, search } = req.query;

    const result = await User.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      role,
      status,
      search
    });

    return res.status(200).json(
      ApiResponse.success(
        result,
        '获取用户列表成功'
      ).toJSON()
    );
  });

  /**
   * 获取单个用户信息
   */
  static getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(parseInt(id));

    if (!user) {
      return res.status(404).json(ApiResponse.notFound('用户不存在').toJSON());
    }

    return res.status(200).json(
      ApiResponse.success(
        { user },
        '获取用户信息成功'
      ).toJSON()
    );
  });

  /**
   * 更新用户信息
   */
  static updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { error } = updateUserSchema.validate(req.body);
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }));
      return res.status(422).json(ApiResponse.validationError(errors).toJSON());
    }

    // 检查用户是否存在
    const existingUser = await User.findById(parseInt(id));
    if (!existingUser) {
      return res.status(404).json(ApiResponse.notFound('用户不存在').toJSON());
    }

    // 普通用户只能更新自己的信息，管理员可以更新任何用户
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json(ApiResponse.forbidden('只能更新自己的信息').toJSON());
    }

    const updatedUser = await User.update(parseInt(id), req.body);

    return res.status(200).json(
      ApiResponse.success(
        { user: updatedUser },
        '更新用户信息成功'
      ).toJSON()
    );
  });

  /**
   * 删除用户（管理员）
   */
  static deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // 不能删除自己
    if (req.user.id === parseInt(id)) {
      return res.status(400).json(ApiResponse.error('不能删除自己的账户').toJSON());
    }

    const deleted = await User.delete(parseInt(id));

    if (!deleted) {
      return res.status(404).json(ApiResponse.notFound('用户不存在').toJSON());
    }

    return res.status(200).json(
      ApiResponse.success(
        null,
        '删除用户成功'
      ).toJSON()
    );
  });

  /**
   * 更改密码
   */
  static changePassword = asyncHandler(async (req, res) => {
    const { error } = changePasswordSchema.validate(req.body);
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }));
      return res.status(422).json(ApiResponse.validationError(errors).toJSON());
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // 获取用户并验证当前密码
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(ApiResponse.notFound('用户不存在').toJSON());
    }

    const isValidPassword = await User.verifyPassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json(ApiResponse.unauthorized('当前密码错误').toJSON());
    }

    // 更新密码
    const success = await User.changePassword(userId, newPassword);
    if (!success) {
      return res.status(500).json(ApiResponse.serverError('密码更新失败').toJSON());
    }

    return res.status(200).json(
      ApiResponse.success(
        null,
        '密码修改成功'
      ).toJSON()
    );
  });

  /**
   * 重置用户密码（管理员）
   */
  static resetPassword = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(422).json(
        ApiResponse.error('新密码长度至少6位').toJSON()
      );
    }

    const user = await User.findById(parseInt(id));
    if (!user) {
      return res.status(404).json(ApiResponse.notFound('用户不存在').toJSON());
    }

    const success = await User.changePassword(parseInt(id), newPassword);
    if (!success) {
      return res.status(500).json(ApiResponse.serverError('密码重置失败').toJSON());
    }

    return res.status(200).json(
      ApiResponse.success(
        null,
        '密码重置成功'
      ).toJSON()
    );
  });
}

module.exports = UserController;