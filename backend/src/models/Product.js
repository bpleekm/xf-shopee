const { pool } = require('../config/database');

class Product {
  /**
   * 创建商品
   * @param {Object} productData - 商品数据
   * @returns {Promise<Object>} 创建的商品
   */
  static async create(productData) {
    const {
      sku,
      name,
      description,
      category,
      price,
      cost_price,
      stock_quantity = 0,
      min_stock_level = 10,
      image_url,
      status = 'active'
    } = productData;

    const [result] = await pool.execute(
      `INSERT INTO products (
        sku, name, description, category, price, cost_price, 
        stock_quantity, min_stock_level, image_url, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sku, name, description, category, price, cost_price, 
       stock_quantity, min_stock_level, image_url, status]
    );

    const product = await this.findById(result.insertId);
    return product;
  }

  /**
   * 根据ID查找商品
   * @param {number} id - 商品ID
   * @returns {Promise<Object|null>} 商品对象或null
   */
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT id, sku, name, description, category, price, cost_price,
              stock_quantity, min_stock_level, image_url, status,
              created_at, updated_at
       FROM products WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) return null;
    return rows[0];
  }

  /**
   * 根据SKU查找商品
   * @param {string} sku - 商品SKU
   * @returns {Promise<Object|null>} 商品对象或null
   */
  static async findBySKU(sku) {
    const [rows] = await pool.execute(
      `SELECT id, sku, name, description, category, price, cost_price,
              stock_quantity, min_stock_level, image_url, status,
              created_at, updated_at
       FROM products WHERE sku = ?`,
      [sku]
    );

    if (rows.length === 0) return null;
    return rows[0];
  }

  /**
   * 更新商品信息
   * @param {number} id - 商品ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object|null>} 更新后的商品
   */
  static async update(id, updateData) {
    const allowedFields = [
      'name', 'description', 'category', 'price', 'cost_price',
      'stock_quantity', 'min_stock_level', 'image_url', 'status'
    ];
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
      `UPDATE products SET ${setClause} WHERE id = ?`,
      values
    );

    return await this.findById(id);
  }

  /**
   * 更新库存数量
   * @param {number} id - 商品ID
   * @param {number} quantity - 库存变化量（正数为增加，负数为减少）
   * @returns {Promise<Object|null>} 更新后的商品
   */
  static async updateStock(id, quantity) {
    // 使用原子操作更新库存，避免并发问题
    const [result] = await pool.execute(
      `UPDATE products 
       SET stock_quantity = stock_quantity + ?, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND stock_quantity + ? >= 0`,
      [quantity, id, quantity]
    );

    if (result.affectedRows === 0) {
      throw new Error('库存不足或商品不存在');
    }

    return await this.findById(id);
  }

  /**
   * 删除商品
   * @param {number} id - 商品ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  static async delete(id) {
    const [result] = await pool.execute(
      'DELETE FROM products WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  /**
   * 获取商品列表（分页）
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 商品列表和总数
   */
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 20,
      category,
      status,
      search,
      minStock = false,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;

    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (search) {
      conditions.push('(name LIKE ? OR description LIKE ? OR sku LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (minStock === true) {
      conditions.push('stock_quantity <= min_stock_level');
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // 验证排序字段
    const validSortFields = ['created_at', 'updated_at', 'price', 'stock_quantity', 'name'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const orderClause = `ORDER BY ${sortField} ${sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'}`;

    // 获取总数
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM products ${whereClause}`,
      params
    );

    // 获取商品列表
    const [rows] = await pool.execute(
      `SELECT id, sku, name, description, category, price, cost_price,
              stock_quantity, min_stock_level, image_url, status,
              created_at, updated_at
       FROM products ${whereClause}
       ${orderClause}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    return {
      products: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countRows[0].total,
        totalPages: Math.ceil(countRows[0].total / limit)
      }
    };
  }

  /**
   * 获取库存预警商品（库存低于最小库存）
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 库存预警商品列表
   */
  static async getLowStockProducts(options = {}) {
    const { page = 1, limit = 50 } = options;
    const offset = (page - 1) * limit;

    const [rows] = await pool.execute(
      `SELECT id, sku, name, category, price, stock_quantity, min_stock_level,
              status, created_at, updated_at
       FROM products 
       WHERE stock_quantity <= min_stock_level AND status = 'active'
       ORDER BY stock_quantity ASC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), offset]
    );

    return rows;
  }

  /**
   * 批量更新商品状态
   * @param {Array<number>} ids - 商品ID数组
   * @param {string} status - 新状态
   * @returns {Promise<number>} 更新的商品数量
   */
  static async batchUpdateStatus(ids, status) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;
    
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await pool.execute(
      `UPDATE products SET status = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id IN (${placeholders})`,
      [status, ...ids]
    );
    
    return result.affectedRows;
  }
}

module.exports = Product;