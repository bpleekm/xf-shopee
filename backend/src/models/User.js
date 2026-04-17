const { pool } = require('../config/database');
const AuthService = require('../utils/auth');

class User {
  /**
   * 创建用户
   * @param {Object} userData - 用户数据
   * @returns {Promise<Object>} 创建的用户
   */
  static async create(userData) {
    const {
      username,
      email,
      password,
      role = 'employee',
      full_name,
      phone,
      status = 'active'
    } = userData;

    // 密码加密
    const passwordHash = await AuthService.hashPassword(password);

    const [result] = await pool.execute(
      `INSERT INTO users (
        username, email, password_hash, role, full_name, phone, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, email, passwordHash, role, full_name || null, phone || null, status]
    );

    const user = await this.findById(result.insertId);
    return user;
  }

  /**
   * 根据ID查找用户
   * @param {number} id - 用户ID
   * @returns {Promise<Object|null>} 用户对象或null
   */
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT id, username, email, role, full_name, phone, status, 
              created_at, updated_at, last_login_at 
       FROM users WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) return null;
    return rows[0];
  }

  /**
   * 根据用户名查找用户
   * @param {string} username - 用户名
   * @returns {Promise<Object|null>} 用户对象或null
   */
  static async findByUsername(username) {
    const [rows] = await pool.execute(
      `SELECT id, username, email, password_hash, role, full_name, phone, status,
              created_at, updated_at, last_login_at 
       FROM users WHERE username = ?`,
      [username]
    );

    if (rows.length === 0) return null;
    return rows[0];
  }

  /**
   * 根据邮箱查找用户
   * @param {string} email - 邮箱
   * @returns {Promise<Object|null>} 用户对象或null
   */
  static async findByEmail(email) {
    const [rows] = await pool.execute(
      `SELECT id, username, email, password_hash, role, full_name, phone, status,
              created_at, updated_at, last_login_at 
       FROM users WHERE email = ?`,
      [email]
    );

    if (rows.length === 0) return null;
    return rows[0];
  }

  /**
   * 更新用户信息
   * @param {number} id - 用户ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object|null>} 更新后的用户
   */
  static async update(id, updateData) {
    const allowedFields = ['full_name', 'phone', 'status'];
    const fieldsToUpdate = {};
    
    // 只允许更新指定字段
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        fieldsToUpdate[key] = updateData[key];
      }
    });

    if (Object.keys(fieldsToUpdate).length === 0) {
      return await this.findById(id);
    }

    const setClause = Object.keys(fieldsToUpdate)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = [...Object.values(fieldsToUpdate), id];

    await pool.execute(
      `UPDATE users SET ${setClause} WHERE id = ?`,
      values
    );

    return await this.findById(id);
  }

  /**
   * 删除用户
   * @param {number} id - 用户ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  static async delete(id) {
    const [result] = await pool.execute(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  /**
   * 获取用户列表（分页）
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 用户列表和总数
   */
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 20,
      role,
      status,
      search
    } = options;

    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (role) {
      conditions.push('role = ?');
      params.push(role);
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (search) {
      conditions.push('(username LIKE ? OR email LIKE ? OR full_name LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // 获取总数
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      params
    );

    // 获取用户列表
    const [rows] = await pool.execute(
      `SELECT id, username, email, role, full_name, phone, status,
              created_at, updated_at, last_login_at 
       FROM users ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    return {
      users: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countRows[0].total,
        totalPages: Math.ceil(countRows[0].total / limit)
      }
    };
  }

  /**
   * 更新最后登录时间
   * @param {number} id - 用户ID
   * @returns {Promise<void>}
   */
  static async updateLastLogin(id) {
    await pool.execute(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
  }

  /**
   * 验证用户密码
   * @param {string} password - 明文密码
   * @param {string} hash - 哈希密码
   * @returns {Promise<boolean>} 是否匹配
   */
  static async verifyPassword(password, hash) {
    return await AuthService.verifyPassword(password, hash);
  }

  /**
   * 更改用户密码
   * @param {number} id - 用户ID
   * @param {string} newPassword - 新密码
   * @returns {Promise<boolean>} 是否成功
   */
  static async changePassword(id, newPassword) {
    const passwordHash = await AuthService.hashPassword(newPassword);
    const [result] = await pool.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = User;