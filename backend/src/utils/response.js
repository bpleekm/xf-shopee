/**
 * 统一API响应格式
 */

class ApiResponse {
  constructor(success = true, data = null, message = '', statusCode = 200) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.timestamp = new Date().toISOString();
    this.statusCode = statusCode;
  }

  static success(data = null, message = '操作成功') {
    return new ApiResponse(true, data, message, 200);
  }

  static error(message = '操作失败', statusCode = 400) {
    return new ApiResponse(false, null, message, statusCode);
  }

  static notFound(message = '资源不存在') {
    return new ApiResponse(false, null, message, 404);
  }

  static unauthorized(message = '未授权访问') {
    return new ApiResponse(false, null, message, 401);
  }

  static forbidden(message = '禁止访问') {
    return new ApiResponse(false, null, message, 403);
  }

  static validationError(errors = [], message = '参数验证失败') {
    return new ApiResponse(false, { errors }, message, 422);
  }

  static serverError(message = '服务器内部错误') {
    return new ApiResponse(false, null, message, 500);
  }

  toJSON() {
    return {
      success: this.success,
      data: this.data,
      message: this.message,
      timestamp: this.timestamp
    };
  }
}

/**
 * 统一错误处理中间件
 */
function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message
    }));
    return res.status(422).json(ApiResponse.validationError(errors).toJSON());
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json(ApiResponse.unauthorized(err.message).toJSON());
  }

  // 数据库错误
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json(ApiResponse.error('数据已存在', 409).toJSON());
  }

  // 默认服务器错误
  return res.status(500).json(ApiResponse.serverError(err.message).toJSON());
}

/**
 * 异步控制器包装器
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  ApiResponse,
  errorHandler,
  asyncHandler
};