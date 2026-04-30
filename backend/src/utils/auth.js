const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class AuthService {
  // 内存中的刷新令牌吊销列表（生产环境建议使用Redis）
  static #revokedRefreshTokens = new Set();

  /**
   * 生成访问令牌（短时效）
   */
  static generateToken(payload) {
    return jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production',
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );
  }

  /**
   * 验证访问令牌
   */
  static verifyToken(token) {
    try {
      return jwt.verify(
        token,
        process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production'
      );
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * 生成刷新令牌（长时效）
   */
  static generateRefreshToken(payload) {
    return jwt.sign(
      payload,
      process.env.REFRESH_JWT_SECRET || 'your_refresh_jwt_secret_key_here',
      { expiresIn: process.env.REFRESH_JWT_EXPIRES_IN || '7d' }
    );
  }

  /**
   * 验证刷新令牌
   */
  static verifyRefreshToken(token) {
    try {
      return jwt.verify(
        token,
        process.env.REFRESH_JWT_SECRET || 'your_refresh_jwt_secret_key_here'
      );
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * 吊销刷新令牌
   */
  static revokeRefreshToken(token) {
    AuthService.#revokedRefreshTokens.add(token);
  }

  /**
   * 检查刷新令牌是否被吊销
   */
  static isRefreshTokenRevoked(token) {
    return AuthService.#revokedRefreshTokens.has(token);
  }

  /**
   * 密码加密
   */
  static async hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * 验证密码
   */
  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * 从请求中提取令牌
   */
  static extractToken(req) {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      return req.headers.authorization.substring(7);
    }
    return null;
  }

  /**
   * 生成随机字符串
   */
  static generateRandomString(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

module.exports = AuthService;