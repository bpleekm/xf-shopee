const { pool } = require('../config/database');

class Role {
  /**
   * 创建角色
   * @param {Object} roleData - 角色数据
   * @returns {Promise<Object>} 创建的角色
   */
  static async create(roleData) {
    const { name, description, is_system_role = false } = roleData;

    const [result] = await pool.execute(
      `INSERT INTO roles (name, description, is_system_role) 
       VALUES (?, ?, ?)`,
      [name, description, is_system_role]
    );

    return await this.findById(result.insertId);
  }

  /**
   * 根据ID查找角色
   * @param {number} id - 角色ID
   * @returns {Promise<Object|null>} 角色对象或null
   */
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT id, name, description, is_system_role, created_at, updated_at
       FROM roles WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) return null;
    return rows[0];
  }

  /**
   * 根据名称查找角色
   * @param {string} name - 角色名称
   * @returns {Promise<Object|null>} 角色对象或null
   */
  static async findByName(name) {
    const [rows] = await pool.execute(
      `SELECT id, name, description, is_system_role, created_at, updated_at
       FROM roles WHERE name = ?`,
      [name]
    );

    if (rows.length === 0) return null;
    return rows[0];
  }

  /**
   * 更新角色信息
   * @param {number} id - 角色ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object|null>} 更新后的角色
   */
  static async update(id, updateData) {
    const allowedFields = ['name', 'description'];
    const fieldsToUpdate = {};
    
    // 只允许更新指定字段（系统角色不允许更新名称）
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
      `UPDATE roles SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND is_system_role = FALSE`,
      values
    );

    return await this.findById(id);
  }

  /**
   * 删除角色（非系统角色）
   * @param {number} id - 角色ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  static async delete(id) {
    const [result] = await pool.execute(
      'DELETE FROM roles WHERE id = ? AND is_system_role = FALSE',
      [id]
    );
    return result.affectedRows > 0;
  }

  /**
   * 获取角色列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 角色列表和总数
   */
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 20,
      systemRole,
      search
    } = options;

    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (systemRole !== undefined) {
      conditions.push('is_system_role = ?');
      params.push(systemRole);
    }

    if (search) {
      conditions.push('(name LIKE ? OR description LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // 获取总数
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM roles ${whereClause}`,
      params
    );

    // 获取角色列表
    const [rows] = await pool.execute(
      `SELECT id, name, description, is_system_role, created_at, updated_at
       FROM roles ${whereClause}
       ORDER BY is_system_role DESC, name ASC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // 获取每个角色的权限
    const rolesWithPermissions = await Promise.all(
      rows.map(async (role) => {
        const permissions = await this.getRolePermissions(role.id);
        return { ...role, permissions };
      })
    );

    return {
      roles: rolesWithPermissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countRows[0].total,
        totalPages: Math.ceil(countRows[0].total / limit)
      }
    };
  }

  /**
   * 获取角色的权限
   * @param {number} roleId - 角色ID
   * @returns {Promise<Array>} 权限列表
   */
  static async getRolePermissions(roleId) {
    const [rows] = await pool.execute(
      `SELECT p.id, p.code, p.name, p.description, p.resource, p.action
       FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = ?`,
      [roleId]
    );
    return rows;
  }

  /**
   * 为角色分配权限
   * @param {number} roleId - 角色ID
   * @param {Array<number>} permissionIds - 权限ID数组
   * @returns {Promise<number>} 分配的权限数量
   */
  static async assignPermissions(roleId, permissionIds) {
    if (!Array.isArray(permissionIds) || permissionIds.length === 0) return 0;
    
    let assignedCount = 0;
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      for (const permissionId of permissionIds) {
        // 检查权限是否已存在
        const [existing] = await connection.execute(
          'SELECT * FROM role_permissions WHERE role_id = ? AND permission_id = ?',
          [roleId, permissionId]
        );
        
        if (existing.length === 0) {
          await connection.execute(
            'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
            [roleId, permissionId]
          );
          assignedCount++;
        }
      }
      
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
    return assignedCount;
  }

  /**
   * 从角色移除权限
   * @param {number} roleId - 角色ID
   * @param {Array<number>} permissionIds - 权限ID数组
   * @returns {Promise<number>} 移除的权限数量
   */
  static async removePermissions(roleId, permissionIds) {
    if (!Array.isArray(permissionIds) || permissionIds.length === 0) return 0;
    
    const placeholders = permissionIds.map(() => '?').join(',');
    const [result] = await pool.execute(
      `DELETE FROM role_permissions 
       WHERE role_id = ? AND permission_id IN (${placeholders})`,
      [roleId, ...permissionIds]
    );
    
    return result.affectedRows;
  }

  /**
   * 获取用户的角色
   * @param {number} userId - 用户ID
   * @returns {Promise<Array>} 角色列表
   */
  static async getUserRoles(userId) {
    const [rows] = await pool.execute(
      `SELECT r.id, r.name, r.description, r.is_system_role
       FROM roles r
       INNER JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = ?`,
      [userId]
    );
    return rows;
  }

  /**
   * 为用户分配角色
   * @param {number} userId - 用户ID
   * @param {Array<number>} roleIds - 角色ID数组
   * @returns {Promise<number>} 分配的角色数量
   */
  static async assignUserRoles(userId, roleIds) {
    if (!Array.isArray(roleIds) || roleIds.length === 0) return 0;
    
    let assignedCount = 0;
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      for (const roleId of roleIds) {
        // 检查角色是否已存在
        const [existing] = await connection.execute(
          'SELECT * FROM user_roles WHERE user_id = ? AND role_id = ?',
          [userId, roleId]
        );
        
        if (existing.length === 0) {
          await connection.execute(
            'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
            [userId, roleId]
          );
          assignedCount++;
        }
      }
      
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
    return assignedCount;
  }

  /**
   * 从用户移除角色
   * @param {number} userId - 用户ID
   * @param {Array<number>} roleIds - 角色ID数组
   * @returns {Promise<number>} 移除的角色数量
   */
  static async removeUserRoles(userId, roleIds) {
    if (!Array.isArray(roleIds) || roleIds.length === 0) return 0;
    
    const placeholders = roleIds.map(() => '?').join(',');
    const [result] = await pool.execute(
      `DELETE FROM user_roles 
       WHERE user_id = ? AND role_id IN (${placeholders})`,
      [userId, ...roleIds]
    );
    
    return result.affectedRows;
  }

  /**
   * 检查用户是否拥有指定角色
   * @param {number} userId - 用户ID
   * @param {string|Array<string>} roleNames - 角色名称或数组
   * @returns {Promise<boolean>} 是否拥有角色
   */
  static async userHasRole(userId, roleNames) {
    const names = Array.isArray(roleNames) ? roleNames : [roleNames];
    const placeholders = names.map(() => '?').join(',');
    
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as count
       FROM user_roles ur
       INNER JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = ? AND r.name IN (${placeholders})`,
      [userId, ...names]
    );
    
    return rows[0].count > 0;
  }

  /**
   * 检查用户是否拥有指定权限
   * @param {number} userId - 用户ID
   * @param {string|Array<string>} permissionCodes - 权限代码或数组
   * @returns {Promise<boolean>} 是否拥有权限
   */
  static async userHasPermission(userId, permissionCodes) {
    const codes = Array.isArray(permissionCodes) ? permissionCodes : [permissionCodes];
    const placeholders = codes.map(() => '?').join(',');
    
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as count
       FROM user_roles ur
       INNER JOIN role_permissions rp ON ur.role_id = rp.role_id
       INNER JOIN permissions p ON rp.permission_id = p.id
       WHERE ur.user_id = ? AND p.code IN (${placeholders})`,
      [userId, ...codes]
    );
    
    return rows[0].count > 0;
  }
}

module.exports = Role;