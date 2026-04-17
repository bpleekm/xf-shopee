const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class AuthService {
  /**
   * 生成JWT令牌
   * @param {Object} payload - 载荷数据
   * @returns {string} JWT令牌
   */
  static generateToken(payload) {
    return jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  /**
   * 验证JWT令牌
   * @param {string} token - JWT令牌
   * @returns {Object} 解码后的载荷
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
   * 密码加密
   * @param {string} password - 明文密码
   * @returns {Promise<string>} 哈希密码
   */
  static async hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * 验证密码
   * @param {string} password - 明文密码
   * @param {string} hash - 哈希密码
   * @returns {Promise<boolean>} 是否匹配
   */
  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * 从请求中提取令牌
   * @param {Object} req - Express请求对象
   * @returns {string|null} 令牌或null
   */
  static extractToken(req) {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      return req.headers.authorization.substring(7);
    }
    return null;
  }

  /**
   * 生成随机字符串（用于会话ID等）
   * @param {number} length - 长度
   * @returns {string} 随机字符串
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