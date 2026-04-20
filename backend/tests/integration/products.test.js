/**
 * 产品管理集成测试
 * 
 * 测试产品相关的API端点：
 * - 获取产品列表
 * - 获取产品详情
 * - 创建新产品
 * - 更新产品信息
 * - 删除产品
 */

const request = require('supertest');
const app = require('../../src/index');
const db = require('../../src/config/database');

describe('产品管理API集成测试', () => {
  let adminToken = '';
  let testCategory = {};
  let testProducts = [];
  
  // 创建测试数据
  beforeAll(async () => {
    // 清理测试数据
    await db.query('DELETE FROM products WHERE name LIKE ?', ['测试产品%']);
    await db.query('DELETE FROM product_categories WHERE name LIKE ?', ['测试分类%']);
    
    // 创建测试分类
    const [categoryResult] = await db.query(
      'INSERT INTO product_categories (name, description, parent_id) VALUES (?, ?, NULL)',
      [`测试分类_${Date.now()}`, '测试用分类']
    );
    
    testCategory.id = categoryResult.insertId;
    testCategory.name = `测试分类_${Date.now()}`;
    
    // 获取管理员令牌
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123'
      });
    
    adminToken = loginResponse.body.data.accessToken;
    
    // 创建一些测试产品
    testProducts = [
      {
        sku: `TEST-PROD-${Date.now()}-1`,
        name: '测试产品1',
        description: '这是第一个测试产品',
        price: 99.99,
        stockQuantity: 100,
        categoryId: testCategory.id,
        status: 'active'
      },
      {
        sku: `TEST-PROD-${Date.now()}-2`,
        name: '测试产品2',
        description: '这是第二个测试产品',
        price: 149.99,
        stockQuantity: 50,
        categoryId: testCategory.id,
        status: 'active'
      },
      {
        sku: `TEST-PROD-${Date.now()}-3`,
        name: '测试产品3',
        description: '这是第三个测试产品',
        price: 199.99,
        stockQuantity: 25,
        categoryId: testCategory.id,
        status: 'inactive'
      }
    ];
    
    for (const product of testProducts) {
      const [result] = await db.query(
        `INSERT INTO products 
         (sku, name, description, price, stock_quantity, category_id, status, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.sku,
          product.name,
          product.description,
          product.price,
          product.stockQuantity,
          product.categoryId,
          product.status,
          1 // 管理员用户ID
        ]
      );
      product.id = result.insertId;
    }
  });
  
  // 清理测试数据
  afterAll(async () => {
    await db.query('DELETE FROM products WHERE name LIKE ?', ['测试产品%']);
    await db.query('DELETE FROM product_categories WHERE name LIKE ?', ['测试分类%']);
    await db.end();
  });
  
  describe('GET /api/v1/products - 获取产品列表', () => {
    test('应该返回产品列表', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data.products)).toBe(true);
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('total');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('limit', 20);
      expect(response.body.data.pagination).toHaveProperty('totalPages');
      
      // 验证返回的产品包含测试产品
      const productNames = response.body.data.products.map(p => p.name);
      expect(productNames).toContain('测试产品1');
      expect(productNames).toContain('测试产品2');
    });
    
    test('应该支持分页', async () => {
      const response = await request(app)
        .get('/api/v1/products?page=1&limit=2')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.products).toHaveLength(2);
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('limit', 2);
    });
    
    test('应该支持按分类筛选', async () => {
      const response = await request(app)
        .get(`/api/v1/products?categoryId=${testCategory.id}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      
      // 所有返回的产品应该属于测试分类
      const allInCategory = response.body.data.products.every(
        product => product.categoryId === testCategory.id
      );
      expect(allInCategory).toBe(true);
    });
    
    test('应该支持按状态筛选', async () => {
      const response = await request(app)
        .get('/api/v1/products?status=active')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      
      // 所有返回的产品状态应该是active
      const allActive = response.body.data.products.every(
        product => product.status === 'active'
      );
      expect(allActive).toBe(true);
      
      // 确保测试产品3（inactive）不在结果中
      const productNames = response.body.data.products.map(p => p.name);
      expect(productNames).not.toContain('测试产品3');
    });
    
    test('应该支持搜索', async () => {
      const response = await request(app)
        .get('/api/v1/products?search=测试产品1')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      
      // 应该只返回包含"测试产品1"的产品
      const productNames = response.body.data.products.map(p => p.name);
      expect(productNames).toContain('测试产品1');
      expect(productNames).not.toContain('测试产品2');
    });
  });
  
  describe('GET /api/v1/products/:id - 获取产品详情', () => {
    test('应该返回产品详情', async () => {
      const testProduct = testProducts[0];
      
      const response = await request(app)
        .get(`/api/v1/products/${testProduct.id}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', testProduct.id);
      expect(response.body.data).toHaveProperty('sku', testProduct.sku);
      expect(response.body.data).toHaveProperty('name', testProduct.name);
      expect(response.body.data).toHaveProperty('description', testProduct.description);
      expect(response.body.data).toHaveProperty('price', testProduct.price);
      expect(response.body.data).toHaveProperty('stockQuantity', testProduct.stockQuantity);
      expect(response.body.data).toHaveProperty('categoryId', testProduct.categoryId);
      expect(response.body.data).toHaveProperty('status', testProduct.status);
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('updatedAt');
    });
    
    test('应该返回404当产品不存在时', async () => {
      const response = await request(app)
        .get('/api/v1/products/999999')
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', '产品不存在');
    });
    
    test('应该返回正确的库存信息', async () => {
      const testProduct = testProducts[0];
      
      const response = await request(app)
        .get(`/api/v1/products/${testProduct.id}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.data).toHaveProperty('stockQuantity', 100);
      expect(response.body.data).toHaveProperty('lowStockThreshold');
      expect(response.body.data).toHaveProperty('isLowStock');
    });
  });
  
  describe('POST /api/v1/products - 创建新产品', () => {
    test('管理员应该能创建新产品', async () => {
      const newProduct = {
        sku: `NEW-PROD-${Date.now()}`,
        name: '新产品',
        description: '这是一个新产品',
        price: 299.99,
        stockQuantity: 200,
        categoryId: testCategory.id,
        status: 'active'
      };
      
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newProduct)
        .expect('Content-Type', /json/)
        .expect(201);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('sku', newProduct.sku);
      expect(response.body.data).toHaveProperty('name', newProduct.name);
      expect(response.body.data).toHaveProperty('description', newProduct.description);
      expect(response.body.data).toHaveProperty('price', newProduct.price);
      expect(response.body.data).toHaveProperty('stockQuantity', newProduct.stockQuantity);
      expect(response.body.data).toHaveProperty('categoryId', newProduct.categoryId);
      expect(response.body.data).toHaveProperty('status', newProduct.status);
      
      // 验证数据库中的产品
      const [products] = await db.query('SELECT * FROM products WHERE id = ?', [response.body.data.id]);
      expect(products).toHaveLength(1);
      expect(products[0].sku).toBe(newProduct.sku);
      expect(products[0].name).toBe(newProduct.name);
      expect(products[0].price).toBe(newProduct.price);
      
      // 清理测试产品
      await db.query('DELETE FROM products WHERE id = ?', [response.body.data.id]);
    });
    
    test('应该拒绝重复的SKU', async () => {
      const duplicateProduct = {
        sku: testProducts[0].sku, // 重复的SKU
        name: '重复SKU产品',
        description: '这是一个重复SKU的产品',
        price: 399.99,
        stockQuantity: 50,
        categoryId: testCategory.id,
        status: 'active'
      };
      
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateProduct)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('SKU已存在');
    });
    
    test('应该验证产品数据', async () => {
      const invalidProduct = {
        sku: 'SHORT',
        name: '', // 空名称
        price: -10, // 负价格
        stockQuantity: -5 // 负库存
      };
      
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidProduct)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
    
    test('应该拒绝未认证的请求', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .send({})
        .expect(401);
      
      expect(response.body).toHaveProperty('error', '未提供认证令牌');
    });
    
    test('应该拒绝非管理员的请求', async () => {
      // 创建普通用户并获取令牌
      const userResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: `regularuser_${Date.now()}`,
          email: `regular_${Date.now()}@example.com`,
          password: 'Password123!',
          fullName: '普通用户'
        });
      
      const userToken = userResponse.body.data.accessToken;
      
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sku: `USER-PROD-${Date.now()}`,
          name: '用户创建的产品',
          price: 99.99,
          stockQuantity: 10,
          categoryId: testCategory.id
        })
        .expect('Content-Type', /json/)
        .expect(403);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', '权限不足');
    });
  });
  
  describe('PUT /api/v1/products/:id - 更新产品信息', () => {
    test('管理员应该能更新产品信息', async () => {
      const testProduct = testProducts[1];
      const updateData = {
        name: '更新后的产品名称',
        description: '更新后的产品描述',
        price: 169.99,
        stockQuantity: 75
      };
      
      const response = await request(app)
        .put(`/api/v1/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('name', updateData.name);
      expect(response.body.data).toHaveProperty('description', updateData.description);
      expect(response.body.data).toHaveProperty('price', updateData.price);
      expect(response.body.data).toHaveProperty('stockQuantity', updateData.stockQuantity);
      
      // 验证数据库更新
      const [products] = await db.query('SELECT * FROM products WHERE id = ?', [testProduct.id]);
      expect(products[0].name).toBe(updateData.name);
      expect(products[0].price).toBe(updateData.price);
      
      // 恢复原值
      await db.query(
        'UPDATE products SET name = ?, description = ?, price = ?, stock_quantity = ? WHERE id = ?',
        [testProduct.name, testProduct.description, testProduct.price, testProduct.stockQuantity, testProduct.id]
      );
    });
    
    test('应该能更新产品状态', async () => {
      const testProduct = testProducts[2]; // inactive产品
      const updateData = {
        status: 'active'
      };
      
      const response = await request(app)
        .put(`/api/v1/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body.data).toHaveProperty('status', 'active');
      
      // 恢复原值
      await db.query('UPDATE products SET status = ? WHERE id = ?', ['inactive', testProduct.id]);
    });
    
    test('应该返回404当产品不存在时', async () => {
      const response = await request(app)
        .put('/api/v1/products/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '不存在的产品' })
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', '产品不存在');
    });
  });
  
  describe('DELETE /api/v1/products/:id - 删除产品', () => {
    test('管理员应该能软删除产品', async () => {
      // 创建一个用于删除的测试产品
      const deleteProduct = {
        sku: `DELETE-PROD-${Date.now()}`,
        name: '待删除产品',
        description: '这个产品将被删除',
        price: 49.99,
        stockQuantity: 10,
        categoryId: testCategory.id,
        status: 'active'
      };
      
      const [result] = await db.query(
        `INSERT INTO products 
         (sku, name, description, price, stock_quantity, category_id, status, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          deleteProduct.sku,
          deleteProduct.name,
          deleteProduct.description,
          deleteProduct.price,
          deleteProduct.stockQuantity,
          deleteProduct.categoryId,
          deleteProduct.status,
          1
        ]
      );
      
      const productId = result.insertId;
      
      const response = await request(app)
        .delete(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', '产品删除成功');
      
      // 验证产品状态已更新为deleted（软删除）
      const [products] = await db.query('SELECT * FROM products WHERE id = ?', [productId]);
      expect(products[0].status).toBe('deleted');
      expect(products[0].deleted_at).not.toBeNull();
    });
    
    test('应该返回404当产品不存在时', async () => {
      const response = await request(app)
        .delete('/api/v1/products/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', '产品不存在');
    });
    
    test('应该拒绝删除已删除的产品', async () => {
      // 创建一个已删除的产品
      const deletedProduct = {
        sku: `DELETED-PROD-${Date.now()}`,
        name: '已删除产品',
        price: 29.99,
        stockQuantity: 5,
        categoryId: testCategory.id,
        status: 'deleted'
      };
      
      const [result] = await db.query(
        `INSERT INTO products 
         (sku, name, price, stock_quantity, category_id, status, created_by, deleted_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          deletedProduct.sku,
          deletedProduct.name,
          deletedProduct.price,
          deletedProduct.stockQuantity,
          deletedProduct.categoryId,
          deletedProduct.status,
          1
        ]
      );
      
      const productId = result.insertId;
      
      const response = await request(app)
        .delete(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', '产品已删除');
      
      // 清理
      await db.query('DELETE FROM products WHERE id = ?', [productId]);
    });
  });
});