const AuthService = require('../utils/auth');
const { ApiResponse } = require('../utils/response');

/**
 * 认证中间件 - 验证JWT令牌
 */
const authenticate = (req, res, next) => {
  try {
    const token = AuthService.extractToken(req);
    
    if (!token) {
      return res.status(401).json(ApiResponse.unauthorized('未提供认证令牌').toJSON());
    }

    const decoded = AuthService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json(ApiResponse.unauthorized('无效的认证令牌').toJSON());
  }
};

/**
 * 授权中间件 - 检查用户角色
 * @param {Array} allowedRoles - 允许的角色数组
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(ApiResponse.unauthorized('用户未认证').toJSON());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json(ApiResponse.forbidden('权限不足').toJSON());
    }

    next();
  };
};

/**
 * 游客或认证用户中间件
 */
const authenticateOrGuest = (req, res, next) => {
  try {
    const token = AuthService.extractToken(req);
    
    if (token) {
      const decoded = AuthService.verifyToken(token);
      req.user = decoded;
    } else {
      // 游客用户
      req.user = { role: 'guest', id: null };
    }
    
    next();
  } catch (error) {
    // 令牌无效，视为游客
    req.user = { role: 'guest', id: null };
    next();
  }
};

/**
 * 验证请求体中间件
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return res.status(422).json(ApiResponse.validationError(errors).toJSON());
    }
    
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  authenticateOrGuest,
  validateRequest
};