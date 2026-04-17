const { pool } = require('../config/database');

class Permission {
  /**
   * 创建权限
   * @param {Object} permissionData - 权限数据
   * @returns {Promise<Object>} 创建的权限
   */
  static async create(permissionData) {
    const { code, name, description, resource, action } = permissionData;

    const [result] = await pool.execute(
      `INSERT INTO permissions (code, name, description, resource, action) 
       VALUES (?, ?, ?, ?, ?)`,
      [code, name, description || '', resource, action]
    );

    return await this.findById(result.insertId);
  }

  /**
   * 根据ID查找权限
   * @param {number} id - 权限ID
   * @returns {Promise<Object|null>} 权限对象或null
   */
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT id, code, name, description, resource, action, created_at, updated_at
       FROM permissions WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) return null;
    return rows[0];
  }

  /**
   * 根据代码查找权限
   * @param {string} code - 权限代码
   * @returns {Promise<Object|null>} 权限对象或null
   */
  static async findByCode(code) {
    const [rows] = await pool.execute(
      `SELECT id, code, name, description, resource, action, created_at, updated_at
       FROM permissions WHERE code = ?`,
      [code]
    );

    if (rows.length === 0) return null;
    return rows[0];
  }

  /**
   * 更新权限信息
   * @param {number} id - 权限ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object|null>} 更新后的权限
   */
  static async update(id, updateData) {
    const allowedFields = ['name', 'description', 'resource', 'action'];
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
      `UPDATE permissions SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      values
    );

    return await this.findById(id);
  }

  /**
   * 删除权限
   * @param {number} id - 权限ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  static async delete(id) {
    const [result] = await pool.execute(
      'DELETE FROM permissions WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  /**
   * 获取权限列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 权限列表和总数
   */
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 50,
      resource,
      action,
      search
    } = options;

    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (resource) {
      conditions.push('resource = ?');
      params.push(resource);
    }

    if (action) {
      conditions.push('action = ?');
      params.push(action);
    }

    if (search) {
      conditions.push('(code LIKE ? OR name LIKE ? OR description LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // 获取总数
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM permissions ${whereClause}`,
      params
    );

    // 获取权限列表
    const [rows] = await pool.execute(
      `SELECT id, code, name, description, resource, action, created_at, updated_at
       FROM permissions ${whereClause}
       ORDER BY resource, action, code
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    return {
      permissions: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countRows[0].total,
        totalPages: Math.ceil(countRows[0].total / limit)
      }
    };
  }

  /**
   * 获取所有资源分类
   * @returns {Promise<Array>} 资源列表
   */
  static async getResources() {
    const [rows] = await pool.execute(
      'SELECT DISTINCT resource FROM permissions WHERE resource IS NOT NULL ORDER BY resource'
    );
    return rows.map(row => row.resource);
  }

  /**
   * 获取资源的所有操作
   * @param {string} resource - 资源名称
   * @returns {Promise<Array>} 操作列表
   */
  static async getActions(resource) {
    const [rows] = await pool.execute(
      'SELECT DISTINCT action FROM permissions WHERE resource = ? AND action IS NOT NULL ORDER BY action',
      [resource]
    );
    return rows.map(row => row.action);
  }

  /**
   * 批量创建权限
   * @param {Array<Object>} permissions - 权限数组
   * @returns {Promise<number>} 创建的权限数量
   */
  static async batchCreate(permissions) {
    if (!Array.isArray(permissions) || permissions.length === 0) return 0;
    
    let createdCount = 0;
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      for (const perm of permissions) {
        // 检查权限是否已存在
        const [existing] = await connection.execute(
          'SELECT id FROM permissions WHERE code = ?',
          [perm.code]
        );
        
        if (existing.length === 0) {
          await connection.execute(
            'INSERT INTO permissions (code, name, description, resource, action) VALUES (?, ?, ?, ?, ?)',
            [perm.code, perm.name, perm.description || '', perm.resource, perm.action]
          );
          createdCount++;
        }
      }
      
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
    return createdCount;
  }

  /**
   * 获取拥有该权限的角色
   * @param {number} permissionId - 权限ID
   * @returns {Promise<Array>} 角色列表
   */
  static async getRolesWithPermission(permissionId) {
    const [rows] = await pool.execute(
      `SELECT r.id, r.name, r.description, r.is_system_role
       FROM roles r
       INNER JOIN role_permissions rp ON r.id = rp.role_id
       WHERE rp.permission_id = ?`,
      [permissionId]
    );
    return rows;
  }

  /**
   * 检查权限是否被任何角色使用
   * @param {number} permissionId - 权限ID
   * @returns {Promise<boolean>} 是否被使用
   */
  static async isUsed(permissionId) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM role_permissions WHERE permission_id = ?',
      [permissionId]
    );
    return rows[0].count > 0;
  }
}

module.exports = Permission;