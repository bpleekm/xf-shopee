const { pool } = require('../config/database');

class Order {
  /**
   * 生成订单号
   * @returns {Promise<string>} 订单号
   */
  static async generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // 获取当天的订单数量
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as count FROM orders 
       WHERE DATE(created_at) = CURDATE()`
    );
    
    const count = rows[0].count + 1;
    const counter = count.toString().padStart(4, '0');
    
    return `ORD${year}${month}${day}${counter}`;
  }

  /**
   * 创建订单
   * @param {Object} orderData - 订单数据
   * @returns {Promise<Object>} 创建的订单
   */
  static async create(orderData) {
    const {
      userId,
      items,
      shippingAddress,
      paymentMethod = 'credit_card',
      shippingFee = 5.99,
      notes = null
    } = orderData;

    // 验证商品列表
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('订单商品不能为空');
    }

    // 计算总金额
    let totalAmount = 0;
    for (const item of items) {
      if (!item.productId || !item.quantity || !item.unitPrice) {
        throw new Error('商品信息不完整');
      }
      totalAmount += item.quantity * item.unitPrice;
    }

    // 计算税费（假设8.5%）
    const taxAmount = totalAmount * 0.085;
    const finalAmount = totalAmount + shippingFee + taxAmount;

    const orderNumber = await this.generateOrderNumber();
    
    // 开始事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 创建订单
      const [orderResult] = await connection.execute(
        `INSERT INTO orders (
          order_number, user_id, total_amount, shipping_fee, tax_amount,
          final_amount, shipping_address, payment_method, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderNumber, 
          userId, 
          totalAmount, 
          shippingFee, 
          taxAmount,
          finalAmount, 
          shippingAddress || null, 
          paymentMethod || 'credit_card', 
          notes || null
        ]
      );

      const orderId = orderResult.insertId;

      // 创建订单项
      for (const item of items) {
        const subtotal = item.quantity * item.unitPrice;
        await connection.execute(
          `INSERT INTO order_items (
            order_id, product_id, quantity, unit_price, subtotal
          ) VALUES (?, ?, ?, ?, ?)`,
          [orderId, item.productId, item.quantity, item.unitPrice, subtotal]
        );

        // 更新商品库存（减少库存）
        await connection.execute(
          `UPDATE products 
           SET stock_quantity = stock_quantity - ?, 
               updated_at = CURRENT_TIMESTAMP 
           WHERE id = ? AND stock_quantity >= ?`,
          [item.quantity, item.productId, item.quantity]
        );
      }

      await connection.commit();
      return await this.findById(orderId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 根据ID查找订单
   * @param {number} id - 订单ID
   * @returns {Promise<Object|null>} 订单对象或null
   */
  static async findById(id) {
    const [orderRows] = await pool.execute(
      `SELECT id, order_number, user_id, total_amount, shipping_fee, tax_amount,
              final_amount, status, shipping_address, payment_method,
              payment_status, notes, created_at, updated_at
       FROM orders WHERE id = ?`,
      [id]
    );

    if (orderRows.length === 0) return null;
    
    const order = orderRows[0];
    order.items = await this.getOrderItems(id);
    return order;
  }

  /**
   * 根据订单号查找订单
   * @param {string} orderNumber - 订单号
   * @returns {Promise<Object|null>} 订单对象或null
   */
  static async findByOrderNumber(orderNumber) {
    const [orderRows] = await pool.execute(
      `SELECT id, order_number, user_id, total_amount, shipping_fee, tax_amount,
              final_amount, status, shipping_address, payment_method,
              payment_status, notes, created_at, updated_at
       FROM orders WHERE order_number = ?`,
      [orderNumber]
    );

    if (orderRows.length === 0) return null;
    
    const order = orderRows[0];
    order.items = await this.getOrderItems(order.id);
    return order;
  }

  /**
   * 获取订单中的所有商品
   * @param {number} orderId - 订单ID
   * @returns {Promise<Array>} 订单商品列表
   */
  static async getOrderItems(orderId) {
    const [rows] = await pool.execute(
      `SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, 
              oi.unit_price, oi.subtotal, oi.created_at,
              p.sku, p.name, p.description, p.category, p.image_url
       FROM order_items oi
       INNER JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [orderId]
    );
    return rows;
  }

  /**
   * 更新订单状态
   * @param {number} id - 订单ID
   * @param {string} status - 新状态
   * @returns {Promise<Object|null>} 更新后的订单
   */
  static async updateStatus(id, status) {
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      throw new Error(`状态必须为: ${validStatuses.join(', ')}`);
    }

    await pool.execute(
      `UPDATE orders 
       SET status = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [status, id]
    );

    return await this.findById(id);
  }

  /**
   * 更新订单支付状态
   * @param {number} id - 订单ID
   * @param {string} paymentStatus - 新支付状态
   * @returns {Promise<Object|null>} 更新后的订单
   */
  static async updatePaymentStatus(id, paymentStatus) {
    const validStatuses = ['pending', 'paid', 'failed'];
    
    if (!validStatuses.includes(paymentStatus)) {
      throw new Error(`支付状态必须为: ${validStatuses.join(', ')}`);
    }

    await pool.execute(
      `UPDATE orders 
       SET payment_status = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [paymentStatus, id]
    );

    return await this.findById(id);
  }

  /**
   * 获取用户订单列表
   * @param {number} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 订单列表和总数
   */
  static async findByUser(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;

    const offset = (page - 1) * limit;
    const conditions = ['user_id = ?'];
    const params = [userId];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (startDate) {
      conditions.push('DATE(created_at) >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('DATE(created_at) <= ?');
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // 验证排序字段
    const validSortFields = ['created_at', 'updated_at', 'final_amount'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const orderClause = `ORDER BY ${sortField} ${sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'}`;

    // 获取总数
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM orders ${whereClause}`,
      params
    );

    // 获取订单列表
    const [rows] = await pool.execute(
      `SELECT id, order_number, user_id, total_amount, shipping_fee, tax_amount,
              final_amount, status, shipping_address, payment_method,
              payment_status, notes, created_at, updated_at
       FROM orders ${whereClause}
       ${orderClause}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    return {
      orders: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countRows[0].total,
        totalPages: Math.ceil(countRows[0].total / limit)
      }
    };
  }

  /**
   * 获取所有订单列表（管理员）
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 订单列表和总数
   */
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      userId,
      startDate,
      endDate,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;

    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (userId) {
      conditions.push('user_id = ?');
      params.push(userId);
    }

    if (startDate) {
      conditions.push('DATE(created_at) >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('DATE(created_at) <= ?');
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // 验证排序字段
    const validSortFields = ['created_at', 'updated_at', 'final_amount'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const orderClause = `ORDER BY ${sortField} ${sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'}`;

    // 获取总数
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM orders ${whereClause}`,
      params
    );

    // 获取订单列表
    const [rows] = await pool.execute(
      `SELECT id, order_number, user_id, total_amount, shipping_fee, tax_amount,
              final_amount, status, shipping_address, payment_method,
              payment_status, notes, created_at, updated_at
       FROM orders ${whereClause}
       ${orderClause}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    return {
      orders: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countRows[0].total,
        totalPages: Math.ceil(countRows[0].total / limit)
      }
    };
  }

  /**
   * 获取订单统计信息（管理员）
   * @param {Object} options - 统计选项
   * @returns {Promise<Object>} 统计信息
   */
  static async getStatistics(options = {}) {
    const { startDate, endDate } = options;
    const conditions = [];
    const params = [];

    if (startDate) {
      conditions.push('DATE(created_at) >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('DATE(created_at) <= ?');
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // 基本统计
    const [basicStats] = await pool.execute(
      `SELECT 
         COUNT(*) as totalOrders,
         SUM(final_amount) as totalRevenue,
         AVG(final_amount) as avgOrderValue,
         COUNT(DISTINCT user_id) as uniqueCustomers
       FROM orders ${whereClause}`,
      params
    );

    // 按状态统计
    const [statusStats] = await pool.execute(
      `SELECT 
         status,
         COUNT(*) as count,
         SUM(final_amount) as revenue
       FROM orders ${whereClause}
       GROUP BY status`,
      params
    );

    // 按日期统计（最近30天）
    const [dailyStats] = await pool.execute(
      `SELECT 
         DATE(created_at) as date,
         COUNT(*) as orderCount,
         SUM(final_amount) as dailyRevenue
       FROM orders 
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      []
    );

    return {
      basic: basicStats[0],
      status: statusStats,
      daily: dailyStats
    };
  }

  /**
   * 取消订单
   * @param {number} id - 订单ID
   * @returns {Promise<Object|null>} 更新后的订单
   */
  static async cancelOrder(id) {
    const order = await this.findById(id);
    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.status === 'cancelled') {
      return order;
    }

    // 开始事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 更新订单状态
      await connection.execute(
        `UPDATE orders 
         SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [id]
      );

      // 恢复商品库存
      for (const item of order.items) {
        await connection.execute(
          `UPDATE products 
           SET stock_quantity = stock_quantity + ?, 
               updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [item.quantity, item.product_id]
        );
      }

      await connection.commit();
      return await this.findById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = Order;