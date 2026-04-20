/**
 * 购物车集成测试
 * 
 * 测试购物车相关的API端点：
 * - 获取购物车
 * - 添加商品到购物车
 * - 更新购物车商品数量
 * - 从购物车删除商品
 * - 清空购物车
 */

const request = require('supertest');
const app = require('../../src/index');
const db = require('../../src/config/database');

describe('购物车API集成测试', () => {
  let customerToken = '';
  let customerId = 0;
  let testProduct = {};
  let testCategory = {};
  
  // 创建测试数据
  beforeAll(async () => {
    // 清理测试数据
    await db.query('DELETE FROM cart_items WHERE 1=1');
    await db.query('DELETE FROM carts WHERE 1=1');
    await db.query('DELETE FROM products WHERE name LIKE ?', ['购物车测试产品%']);
    await db.query('DELETE FROM product_categories WHERE name LIKE ?', ['购物车测试分类%']);
    
    // 创建测试分类
    const [categoryResult] = await db.query(
      'INSERT INTO product_categories (name, description) VALUES (?, ?)',
      [`购物车测试分类_${Date.now()}`, '购物车测试用分类']
    );
    
    testCategory.id = categoryResult.insertId;
    
    // 创建测试产品
    const [productResult] = await db.query(
      `INSERT INTO products 
       (sku, name, description, price, stock_quantity, category_id, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        `CART-TEST-PROD-${Date.now()}`,
        '购物车测试产品',
        '用于购物车测试的产品',
        99.99,
        100,
        testCategory.id,
        'active'
      ]
    );
    
    testProduct.id = productResult.insertId;
    testProduct.sku = `CART-TEST-PROD-${Date.now()}`;
    testProduct.name = '购物车测试产品';
    testProduct.price = 99.99;
    testProduct.stockQuantity = 100;
    
    // 创建测试用户
    const customerData = {
      username: `cartcustomer_${Date.now()}`,
      email: `cartcustomer_${Date.now()}@example.com`,
      password: 'CartPassword123!',
      fullName: '购物车测试用户'
    };
    
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(customerData);
    
    customerId = registerResponse.body.data.id;
    
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: customerData.username,
        password: customerData.password
      });
    
    customerToken = loginResponse.body.data.accessToken;
  });
  
  // 清理测试数据
  afterAll(async () => {
    await db.query('DELETE FROM cart_items WHERE 1=1');
    await db.query('DELETE FROM carts WHERE 1=1');
    await db.query('DELETE FROM products WHERE id = ?', [testProduct.id]);
    await db.query('DELETE FROM product_categories WHERE id = ?', [testCategory.id]);
    await db.query('DELETE FROM users WHERE id = ?', [customerId]);
    await db.end();
  });
  
  describe('购物车基本操作', () => {
    test('应该为登录用户创建购物车', async () => {
      const response = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('userId', customerId);
      expect(response.body.data).toHaveProperty('items');
      expect(Array.isArray(response.body.data.items)).toBe(true);
      expect(response.body.data.items).toHaveLength(0); // 初始购物车为空
      expect(response.body.data).toHaveProperty('totalItems', 0);
      expect(response.body.data).toHaveProperty('totalPrice', 0);
    });
    
    test('应该拒绝未认证的购物车访问', async () => {
      const response = await request(app)
        .get('/api/v1/cart')
        .expect(401);
      
      expect(response.body).toHaveProperty('error', '未提供认证令牌');
    });
  });
  
  describe('添加商品到购物车', () => {
    test('应该能添加商品到购物车', async () => {
      const addItemRequest = {
        productId: testProduct.id,
        quantity: 2
      };
      
      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(addItemRequest)
        .expect('Content-Type', /json/)
        .expect(201);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('cart');
      expect(response.body.data.cart).toHaveProperty('id');
      expect(response.body.data.cart).toHaveProperty('userId', customerId);
      expect(response.body.data.cart.items).toHaveLength(1);
      expect(response.body.data.cart).toHaveProperty('totalItems', 2);
      expect(response.body.data.cart).toHaveProperty('totalPrice', 199.98); // 99.99 * 2
      
      const cartItem = response.body.data.cart.items[0];
      expect(cartItem).toHaveProperty('productId', testProduct.id);
      expect(cartItem).toHaveProperty('productName', testProduct.name);
      expect(cartItem).toHaveProperty('productPrice', testProduct.price);
      expect(cartItem).toHaveProperty('quantity', 2);
      expect(cartItem).toHaveProperty('subtotal', 199.98);
    });
    
    test('应该验证商品库存', async () => {
      const addItemRequest = {
        productId: testProduct.id,
        quantity: 200 // 超过库存
      };
      
      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(addItemRequest)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('库存不足');
    });
    
    test('应该验证商品状态', async () => {
      // 创建一个非活跃产品
      const [inactiveProduct] = await db.query(
        `INSERT INTO products 
         (sku, name, price, stock_quantity, category_id, status) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          `INACTIVE-PROD-${Date.now()}`,
          '非活跃产品',
          49.99,
          10,
          testCategory.id,
          'inactive'
        ]
      );
      
      const inactiveProductId = inactiveProduct.insertId;
      
      const addItemRequest = {
        productId: inactiveProductId,
        quantity: 1
      };
      
      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(addItemRequest)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('产品不可用');
      
      // 清理测试产品
      await db.query('DELETE FROM products WHERE id = ?', [inactiveProductId]);
    });
  });
  
  describe('更新购物车商品数量', () => {
    let cartItemId = 0;
    
    beforeAll(async () => {
      // 获取购物车项ID
      const cartResponse = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${customerToken}`);
      
      cartItemId = cartResponse.body.data.items[0]?.id;
    });
    
    test('应该能更新购物车商品数量', async () => {
      const updateRequest = {
        quantity: 3
      };
      
      const response = await request(app)
        .put(`/api/v1/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(updateRequest)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('cart');
      expect(response.body.data.cart.items[0]).toHaveProperty('quantity', 3);
      expect(response.body.data.cart).toHaveProperty('totalItems', 3);
      expect(response.body.data.cart).toHaveProperty('totalPrice', 299.97); // 99.99 * 3
    });
    
    test('应该验证更新后的库存', async () => {
      const updateRequest = {
        quantity: 150 // 超过库存
      };
      
      const response = await request(app)
        .put(`/api/v1/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(updateRequest)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('库存不足');
    });
    
    test('设置为0应该从购物车删除商品', async () => {
      const updateRequest = {
        quantity: 0
      };
      
      const response = await request(app)
        .put(`/api/v1/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(updateRequest)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.cart.items).toHaveLength(0);
      expect(response.body.data.cart).toHaveProperty('totalItems', 0);
      expect(response.body.data.cart).toHaveProperty('totalPrice', 0);
    });
  });
  
  describe('从购物车删除商品', () => {
    let newCartItemId = 0;
    
    beforeAll(async () => {
      // 重新添加一个商品
      const addItemRequest = {
        productId: testProduct.id,
        quantity: 1
      };
      
      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(addItemRequest);
      
      newCartItemId = response.body.data.cart.items[0].id;
    });
    
    test('应该能从购物车删除商品', async () => {
      const response = await request(app)
        .delete(`/api/v1/cart/items/${newCartItemId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.cart.items).toHaveLength(0);
      expect(response.body.data.cart).toHaveProperty('totalItems', 0);
      expect(response.body.data.cart).toHaveProperty('totalPrice', 0);
      
      // 验证数据库中的购物车项已被删除
      const [cartItems] = await db.query('SELECT * FROM cart_items WHERE id = ?', [newCartItemId]);
      expect(cartItems).toHaveLength(0);
    });
    
    test('删除不存在的商品应该返回404', async () => {
      const response = await request(app)
        .delete('/api/v1/cart/items/999999')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', '购物车项不存在');
    });
  });
  
  describe('清空购物车', () => {
    beforeAll(async () => {
      // 添加几个商品到购物车
      const addItemRequest1 = {
        productId: testProduct.id,
        quantity: 1
      };
      
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(addItemRequest1);
      
      // 创建第二个测试产品
      const [productResult] = await db.query(
        `INSERT INTO products 
         (sku, name, price, stock_quantity, category_id, status) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          `CART-TEST-PROD-2-${Date.now()}`,
          '购物车测试产品2',
          49.99,
          50,
          testCategory.id,
          'active'
        ]
      );
      
      const testProduct2Id = productResult.insertId;
      
      const addItemRequest2 = {
        productId: testProduct2Id,
        quantity: 2
      };
      
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(addItemRequest2);
      
      // 清理第二个产品
      await db.query('DELETE FROM products WHERE id = ?', [testProduct2Id]);
    });
    
    test('应该能清空购物车', async () => {
      // 先验证购物车不为空
      const cartBeforeResponse = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${customerToken}`);
      
      expect(cartBeforeResponse.body.data.items.length).toBeGreaterThan(0);
      
      // 清空购物车
      const response = await request(app)
        .delete('/api/v1/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.cart.items).toHaveLength(0);
      expect(response.body.data.cart).toHaveProperty('totalItems', 0);
      expect(response.body.data.cart).toHaveProperty('totalPrice', 0);
      
      // 验证购物车确实为空
      const cartAfterResponse = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${customerToken}`);
      
      expect(cartAfterResponse.body.data.items).toHaveLength(0);
    });
  });
  
  describe('库存同步', () => {
    test('添加到购物车应该预扣库存', async () => {
      // 获取当前库存
      const [products] = await db.query('SELECT stock_quantity FROM products WHERE id = ?', [testProduct.id]);
      const originalStock = products[0].stock_quantity;
      
      // 添加商品到购物车
      const addItemRequest = {
        productId: testProduct.id,
        quantity: 5
      };
      
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(addItemRequest);
      
      // 验证库存减少（预扣）
      const [productsAfter] = await db.query('SELECT stock_quantity FROM products WHERE id = ?', [testProduct.id]);
      expect(productsAfter[0].stock_quantity).toBe(originalStock - 5);
      
      // 清空购物车释放库存
      await request(app)
        .delete('/api/v1/cart')
        .set('Authorization', `Bearer ${customerToken}`);
      
      // 验证库存恢复
      const [productsFinal] = await db.query('SELECT stock_quantity FROM products WHERE id = ?', [testProduct.id]);
      expect(productsFinal[0].stock_quantity).toBe(originalStock);
    });
  });
});