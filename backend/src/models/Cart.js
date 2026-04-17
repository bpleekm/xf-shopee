const { pool } = require('../config/database');

class Cart {
  /**
   * 获取或创建购物车（根据用户ID或会话ID）
   * @param {Object} options - 选项
   * @param {number|null} options.userId - 用户ID（登录用户）
   * @param {string|null} options.sessionId - 会话ID（游客）
   * @returns {Promise<Object>} 购物车对象
   */
  static async getOrCreate({ userId = null, sessionId = null }) {
    if (!userId && !sessionId) {
      throw new Error('需要userId或sessionId');
    }

    // 查找现有购物车
    let cart = null;
    if (userId) {
      cart = await this.findByUserId(userId);
    } else if (sessionId) {
      cart = await this.findBySessionId(sessionId);
    }

    // 如果找到购物车，返回它
    if (cart) {
      return cart;
    }

    // 创建新购物车
    const [result] = await pool.execute(
      `INSERT INTO carts (user_id, session_id) VALUES (?, ?)`,
      [userId, sessionId]
    );

    return await this.findById(result.insertId);
  }

  /**
   * 根据ID查找购物车
   * @param {number} id - 购物车ID
   * @returns {Promise<Object|null>} 购物车对象或null
   */
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT id, user_id, session_id, created_at, updated_at
       FROM carts WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) return null;
    
    const cart = rows[0];
    cart.items = await this.getCartItems(id);
    return cart;
  }

  /**
   * 根据用户ID查找购物车
   * @param {number} userId - 用户ID
   * @returns {Promise<Object|null>} 购物车对象或null
   */
  static async findByUserId(userId) {
    const [rows] = await pool.execute(
      `SELECT id, user_id, session_id, created_at, updated_at
       FROM carts WHERE user_id = ?`,
      [userId]
    );

    if (rows.length === 0) return null;
    
    const cart = rows[0];
    cart.items = await this.getCartItems(cart.id);
    return cart;
  }

  /**
   * 根据会话ID查找购物车
   * @param {string} sessionId - 会话ID
   * @returns {Promise<Object|null>} 购物车对象或null
   */
  static async findBySessionId(sessionId) {
    const [rows] = await pool.execute(
      `SELECT id, user_id, session_id, created_at, updated_at
       FROM carts WHERE session_id = ?`,
      [sessionId]
    );

    if (rows.length === 0) return null;
    
    const cart = rows[0];
    cart.items = await this.getCartItems(cart.id);
    return cart;
  }

  /**
   * 获取购物车中的所有商品
   * @param {number} cartId - 购物车ID
   * @returns {Promise<Array>} 购物车商品列表
   */
  static async getCartItems(cartId) {
    const [rows] = await pool.execute(
      `SELECT ci.id, ci.cart_id, ci.product_id, ci.quantity, ci.unit_price,
              p.sku, p.name, p.description, p.category, p.image_url,
              (ci.quantity * ci.unit_price) as subtotal
       FROM cart_items ci
       INNER JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = ?`,
      [cartId]
    );
    return rows;
  }

  /**
   * 添加商品到购物车
   * @param {number} cartId - 购物车ID
   * @param {number} productId - 商品ID
   * @param {number} quantity - 数量
   * @param {number} unitPrice - 单价
   * @returns {Promise<Object>} 添加的购物车项
   */
  static async addItem(cartId, productId, quantity, unitPrice) {
    // 检查商品是否已在购物车中
    const [existing] = await pool.execute(
      `SELECT id, quantity FROM cart_items 
       WHERE cart_id = ? AND product_id = ?`,
      [cartId, productId]
    );

    if (existing.length > 0) {
      // 更新数量
      const newQuantity = existing[0].quantity + quantity;
      await pool.execute(
        `UPDATE cart_items 
         SET quantity = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [newQuantity, existing[0].id]
      );
      
      // 返回更新后的项
      const [updated] = await pool.execute(
        `SELECT ci.*, p.sku, p.name, p.image_url 
         FROM cart_items ci
         INNER JOIN products p ON ci.product_id = p.id
         WHERE ci.id = ?`,
        [existing[0].id]
      );
      
      return updated[0];
    } else {
      // 添加新项
      const [result] = await pool.execute(
        `INSERT INTO cart_items (cart_id, product_id, quantity, unit_price)
         VALUES (?, ?, ?, ?)`,
        [cartId, productId, quantity, unitPrice]
      );

      const [newItem] = await pool.execute(
        `SELECT ci.*, p.sku, p.name, p.image_url 
         FROM cart_items ci
         INNER JOIN products p ON ci.product_id = p.id
         WHERE ci.id = ?`,
        [result.insertId]
      );

      return newItem[0];
    }
  }

  /**
   * 更新购物车商品数量
   * @param {number} cartId - 购物车ID
   * @param {number} itemId - 购物车项ID
   * @param {number} quantity - 新数量
   * @returns {Promise<boolean>} 是否成功
   */
  static async updateItemQuantity(cartId, itemId, quantity) {
    if (quantity <= 0) {
      // 删除商品
      return await this.removeItem(cartId, itemId);
    }

    const [result] = await pool.execute(
      `UPDATE cart_items 
       SET quantity = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND cart_id = ?`,
      [quantity, itemId, cartId]
    );

    return result.affectedRows > 0;
  }

  /**
   * 从购物车移除商品
   * @param {number} cartId - 购物车ID
   * @param {number} itemId - 购物车项ID
   * @returns {Promise<boolean>} 是否成功
   */
  static async removeItem(cartId, itemId) {
    const [result] = await pool.execute(
      'DELETE FROM cart_items WHERE id = ? AND cart_id = ?',
      [itemId, cartId]
    );
    return result.affectedRows > 0;
  }

  /**
   * 清空购物车
   * @param {number} cartId - 购物车ID
   * @returns {Promise<boolean>} 是否成功
   */
  static async clearCart(cartId) {
    const [result] = await pool.execute(
      'DELETE FROM cart_items WHERE cart_id = ?',
      [cartId]
    );
    
    // 更新购物车更新时间
    await pool.execute(
      'UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [cartId]
    );
    
    return result.affectedRows >= 0;
  }

  /**
   * 计算购物车总金额
   * @param {number} cartId - 购物车ID
   * @returns {Promise<number>} 总金额
   */
  static async calculateTotal(cartId) {
    const [rows] = await pool.execute(
      `SELECT SUM(quantity * unit_price) as total
       FROM cart_items WHERE cart_id = ?`,
      [cartId]
    );
    
    return rows[0].total || 0;
  }

  /**
   * 合并购物车（将游客购物车合并到用户购物车）
   * @param {number} guestCartId - 游客购物车ID
   * @param {number} userCartId - 用户购物车ID
   * @returns {Promise<Object>} 合并后的购物车
   */
  static async mergeCarts(guestCartId, userCartId) {
    // 获取游客购物车商品
    const guestItems = await this.getCartItems(guestCartId);
    
    // 将游客购物车商品添加到用户购物车
    for (const item of guestItems) {
      await this.addItem(
        userCartId, 
        item.product_id, 
        item.quantity, 
        item.unit_price
      );
    }
    
    // 删除游客购物车
    await this.clearCart(guestCartId);
    await pool.execute('DELETE FROM carts WHERE id = ?', [guestCartId]);
    
    // 返回合并后的购物车
    return await this.findById(userCartId);
  }

  /**
   * 删除购物车
   * @param {number} cartId - 购物车ID
   * @returns {Promise<boolean>} 是否成功
   */
  static async deleteCart(cartId) {
    // 先删除购物车项
    await pool.execute('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
    
    // 再删除购物车
    const [result] = await pool.execute(
      'DELETE FROM carts WHERE id = ?',
      [cartId]
    );
    
    return result.affectedRows > 0;
  }
}

module.exports = Cart;