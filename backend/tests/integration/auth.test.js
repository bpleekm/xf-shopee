/**
 * 用户认证集成测试
 * 
 * 测试认证相关的API端点：
 * - 用户注册
 * - 用户登录
 * - 令牌刷新
 * - 用户登出
 */

const request = require('supertest');
const app = require('../../src/index');
const db = require('../../src/config/database');
const { generateToken, verifyToken } = require('../../src/utils/auth');

describe('用户认证API集成测试', () => {
  let testUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'TestPassword123!',
    fullName: '测试用户',
    phone: '13800138000'
  };
  
  let authTokens = {};
  
  // 清理测试数据
  beforeAll(async () => {
    await db.query('DELETE FROM users WHERE email LIKE ?', ['test_%@example.com']);
  });
  
  afterAll(async () => {
    await db.query('DELETE FROM users WHERE email LIKE ?', ['test_%@example.com']);
    await db.end();
  });
  
  describe('POST /api/v1/auth/register - 用户注册', () => {
    test('应该成功注册新用户', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect('Content-Type', /json/)
        .expect(201);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('username', testUser.username);
      expect(response.body.data).toHaveProperty('email', testUser.email);
      expect(response.body.data).toHaveProperty('fullName', testUser.fullName);
      expect(response.body.data).not.toHaveProperty('password');
      expect(response.body.data).not.toHaveProperty('passwordHash');
      
      // 验证数据库中的用户
      const [users] = await db.query('SELECT * FROM users WHERE email = ?', [testUser.email]);
      expect(users).toHaveLength(1);
      expect(users[0].username).toBe(testUser.username);
      expect(users[0].password_hash).not.toBe(testUser.password); // 密码应该被加密
    });
    
    test('应该拒绝重复的用户名', async () => {
      const duplicateUser = {
        ...testUser,
        email: `duplicate_${Date.now()}@example.com`
      };
      
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(duplicateUser)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('用户名已存在');
    });
    
    test('应该拒绝重复的邮箱', async () => {
      const duplicateEmailUser = {
        ...testUser,
        username: `different_${Date.now()}`
      };
      
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(duplicateEmailUser)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('邮箱已存在');
    });
    
    test('应该验证密码强度', async () => {
      const weakPasswordUser = {
        ...testUser,
        username: `weakpass_${Date.now()}`,
        email: `weakpass_${Date.now()}@example.com`,
        password: '123'
      };
      
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(weakPasswordUser)
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('密码');
    });
  });
  
  describe('POST /api/v1/auth/login - 用户登录', () => {
    test('应该成功登录并返回令牌', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        })
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('username', testUser.username);
      expect(response.body.data.user).toHaveProperty('email', testUser.email);
      
      // 保存令牌供后续测试使用
      authTokens = response.body.data;
      
      // 验证令牌有效性
      const decoded = verifyToken(authTokens.accessToken);
      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('username', testUser.username);
    });
    
    test('应该拒绝错误的密码', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: testUser.username,
          password: 'WrongPassword123!'
        })
        .expect('Content-Type', /json/)
        .expect(401);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('密码错误');
    });
    
    test('应该拒绝不存在的用户', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'nonexistentuser',
          password: 'SomePassword123!'
        })
        .expect('Content-Type', /json/)
        .expect(401);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('用户不存在');
    });
  });
  
  describe('POST /api/v1/auth/refresh - 令牌刷新', () => {
    test('应该使用刷新令牌获取新的访问令牌', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: authTokens.refreshToken
        })
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data.accessToken).not.toBe(authTokens.accessToken);
      
      // 验证新令牌的有效性
      const decoded = verifyToken(response.body.data.accessToken);
      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('username', testUser.username);
      
      // 更新访问令牌
      authTokens.accessToken = response.body.data.accessToken;
    });
    
    test('应该拒绝无效的刷新令牌', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'invalid.refresh.token'
        })
        .expect('Content-Type', /json/)
        .expect(401);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('无效的令牌');
    });
    
    test('应该拒绝过期的刷新令牌', async () => {
      // 创建一个过期的刷新令牌
      const expiredToken = generateToken(
        { userId: 999, username: 'test' },
        process.env.JWT_REFRESH_SECRET,
        '-1h' // 1小时前过期
      );
      
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: expiredToken
        })
        .expect('Content-Type', /json/)
        .expect(401);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('令牌已过期');
    });
  });
  
  describe('POST /api/v1/auth/logout - 用户登出', () => {
    test('应该成功登出并使令牌失效', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send({})
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      
      // 验证令牌已失效（尝试使用失效的令牌访问受保护端点）
      const protectedResponse = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(401);
      
      expect(protectedResponse.body).toHaveProperty('error', '令牌已失效');
    });
    
    test('应该拒绝未认证的登出请求', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect('Content-Type', /json/)
        .expect(401);
      
      expect(response.body).toHaveProperty('error', '未提供认证令牌');
    });
  });
  
  describe('令牌保护端点访问控制', () => {
    let newUser = {};
    let newUserTokens = {};
    
    beforeAll(async () => {
      // 创建另一个测试用户
      newUser = {
        username: `newuser_${Date.now()}`,
        email: `newuser_${Date.now()}@example.com`,
        password: 'NewPassword123!',
        fullName: '新测试用户'
      };
      
      await request(app)
        .post('/api/v1/auth/register')
        .send(newUser);
      
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: newUser.username,
          password: newUser.password
        });
      
      newUserTokens = loginResponse.body.data;
    });
    
    test('受保护端点应该要求有效的令牌', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${newUserTokens.accessToken}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('username', newUser.username);
      expect(response.body.data).toHaveProperty('email', newUser.email);
    });
    
    test('应该拒绝无效的令牌', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });
    
    test('应该拒绝过期的令牌', async () => {
      // 创建一个过期的访问令牌
      const expiredToken = generateToken(
        { userId: 999, username: 'test' },
        process.env.JWT_ACCESS_SECRET,
        '-1h' // 1小时前过期
      );
      
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
      
      expect(response.body).toHaveProperty('error', '令牌已过期');
    });
    
    test('应该拒绝没有令牌的请求', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .expect(401);
      
      expect(response.body).toHaveProperty('error', '未提供认证令牌');
    });
  });
});