# XF Shopee ERP 集成测试指南

## 概述

本文档描述了XF Shopee ERP系统的集成测试策略、测试场景和测试用例。集成测试旨在验证后端API与前端（Web前端、Web后台管理、移动端）之间的交互是否正常。

## 测试环境要求

### 软件环境
- Node.js >= 18.0.0
- MySQL >= 8.0
- Redis (可选，用于会话缓存)
- Nginx (用于反向代理测试)

### 测试工具
- **Jest**: JavaScript测试框架
- **Supertest**: HTTP断言库
- **MySQL Test Container**: 测试数据库容器
- **Jest测试覆盖率**: 代码覆盖率报告

## 测试架构

```
tests/
├── integration/           # 集成测试
│   ├── auth/             # 认证相关测试
│   ├── products/         # 产品管理测试
│   ├── orders/           # 订单管理测试
│   ├── cart/             # 购物车测试
│   └── users/            # 用户管理测试
├── setup.js             # 测试环境配置
├── teardown.js          # 测试环境清理
└── jest.config.js       # Jest配置
```

## 测试场景

### 1. 用户认证流程
#### 测试用例:
- **TC-AUTH-001**: 用户注册
  - 输入: 有效的用户信息
  - 预期: 返回成功，创建用户记录
  - 验证: 数据库中存在新用户，密码已加密

- **TC-AUTH-002**: 用户登录
  - 输入: 正确的用户名/密码
  - 预期: 返回JWT令牌
  - 验证: 令牌有效，可以访问受保护端点

- **TC-AUTH-003**: 无效登录
  - 输入: 错误的密码
  - 预期: 返回401错误
  - 验证: 不返回令牌，登录失败记录

- **TC-AUTH-004**: 令牌刷新
  - 输入: 有效的刷新令牌
  - 预期: 返回新的访问令牌
  - 验证: 新令牌可以访问受保护端点

### 2. 产品管理流程
#### 测试用例:
- **TC-PROD-001**: 获取产品列表
  - 输入: 分页参数、筛选条件
  - 预期: 返回产品列表
  - 验证: 返回正确的产品数量，分页信息正确

- **TC-PROD-002**: 创建新产品
  - 输入: 产品信息（SKU、名称、价格等）
  - 预期: 返回创建的产品数据
  - 验证: 数据库中存在新产品，SKU唯一性检查

- **TC-PROD-003**: 更新产品信息
  - 输入: 产品ID和更新字段
  - 预期: 返回更新后的产品数据
  - 验证: 数据库记录已更新，历史记录保留

- **TC-PROD-004**: 删除产品
  - 输入: 产品ID
  - 预期: 返回成功消息
  - 验证: 产品状态标记为删除，不物理删除

### 3. 购物车流程
#### 测试用例:
- **TC-CART-001**: 添加商品到购物车
  - 输入: 产品ID、数量
  - 预期: 返回更新后的购物车
  - 验证: 购物车项正确添加，库存验证

- **TC-CART-002**: 更新购物车商品数量
  - 输入: 购物车项ID、新数量
  - 预期: 返回更新后的购物车
  - 验证: 数量正确更新，库存检查

- **TC-CART-003**: 从购物车删除商品
  - 输入: 购物车项ID
  - 预期: 商品从购物车移除
  - 验证: 购物车项被删除，库存释放

- **TC-CART-004**: 清空购物车
  - 输入: 购物车ID
  - 预期: 购物车被清空
  - 验证: 所有购物车项被删除

### 4. 订单流程
#### 测试用例:
- **TC-ORDER-001**: 创建订单
  - 输入: 购物车内容、收货地址、支付方式
  - 预期: 返回订单信息
  - 验证: 订单创建成功，库存扣减，购物车清空

- **TC-ORDER-002**: 获取订单列表
  - 输入: 用户ID、分页参数
  - 预期: 返回用户订单列表
  - 验证: 只返回当前用户的订单

- **TC-ORDER-003**: 获取订单详情
  - 输入: 订单ID
  - 预期: 返回完整订单信息
  - 验证: 包含订单项、支付信息、物流信息

- **TC-ORDER-004**: 更新订单状态
  - 输入: 订单ID、新状态
  - 预期: 返回更新后的订单
  - 验证: 状态流转符合业务规则

### 5. 库存管理流程
#### 测试用例:
- **TC-INV-001**: 库存查询
  - 输入: 产品ID
  - 预期: 返回当前库存数量
  - 验证: 包含安全库存信息

- **TC-INV-002**: 库存调整
  - 输入: 产品ID、调整数量、调整原因
  - 预期: 返回调整后的库存
  - 验证: 创建库存变更记录

- **TC-INV-003**: 低库存预警
  - 输入: 库存阈值
  - 预期: 返回低库存产品列表
  - 验证: 仅返回库存低于阈值的产品

## API测试示例

### 用户认证测试
```javascript
describe('用户认证API', () => {
  test('用户注册成功', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
      fullName: '测试用户'
    };
    
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(userData);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('username', userData.username);
    expect(response.body).not.toHaveProperty('password');
  });
  
  test('用户登录获取令牌', async () => {
    const loginData = {
      username: 'testuser',
      password: 'Password123!'
    };
    
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send(loginData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
    expect(response.body).toHaveProperty('user');
  });
});
```

### 产品API测试
```javascript
describe('产品管理API', () => {
  let authToken;
  
  beforeEach(async () => {
    // 获取认证令牌
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    
    authToken = loginResponse.body.accessToken;
  });
  
  test('创建新产品', async () => {
    const productData = {
      sku: 'TEST-PROD-001',
      name: '测试产品',
      description: '这是一个测试产品',
      price: 99.99,
      stockQuantity: 100,
      categoryId: 1
    };
    
    const response = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send(productData);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('sku', productData.sku);
    expect(response.body).toHaveProperty('name', productData.name);
  });
});
```

## 跨组件集成测试

### 1. 端到端购物流程
**测试场景**: 用户浏览产品 -> 添加到购物车 -> 结算 -> 创建订单 -> 支付

**测试步骤**:
1. 用户登录系统
2. 浏览产品列表，搜索特定产品
3. 查看产品详情
4. 添加产品到购物车
5. 查看购物车，修改数量
6. 进入结算页面，填写收货信息
7. 选择支付方式，提交订单
8. 验证订单创建成功，库存扣减
9. 查看订单列表和详情

**验证点**:
- 用户界面响应正确
- 后端API返回正确数据
- 数据库状态一致
- 库存管理正确
- 订单状态流转正常

### 2. 后台管理流程
**测试场景**: 管理员登录 -> 管理用户 -> 管理产品 -> 处理订单

**测试步骤**:
1. 管理员登录后台系统
2. 查看用户列表，搜索用户
3. 编辑用户信息，修改权限
4. 添加新产品，设置价格和库存
5. 查看待处理订单，更新订单状态
6. 查看系统报表和统计数据

**验证点**:
- 权限控制正确
- 数据操作审计完整
- 批量操作性能良好
- 报表数据准确

## 性能测试

### 负载测试
- **并发用户**: 模拟100个并发用户
- **测试端点**: 产品列表API、订单创建API
- **性能指标**: 响应时间 < 500ms，错误率 < 1%

### 压力测试
- **持续负载**: 持续30分钟高负载
- **资源监控**: CPU、内存、数据库连接
- **瓶颈识别**: 识别性能瓶颈和优化点

## 安全测试

### 认证授权测试
- **令牌安全**: JWT令牌验证、过期处理
- **权限检查**: 角色权限验证、越权访问防护
- **会话管理**: 会话超时、并发登录控制

### 输入验证测试
- **SQL注入**: 特殊字符过滤
- **XSS攻击**: HTML/JS代码过滤
- **CSRF防护**: 跨站请求伪造防护

## 测试数据管理

### 测试数据策略
- **测试数据生成**: 使用Faker.js生成测试数据
- **数据隔离**: 每个测试用例使用独立数据
- **数据清理**: 测试完成后清理测试数据

### 测试数据示例
```javascript
const testData = {
  users: [
    {
      username: 'admin',
      email: 'admin@xfshopee.com',
      password: 'admin123',
      role: 'super_admin'
    },
    {
      username: 'test_customer',
      email: 'customer@example.com',
      password: 'password123',
      role: 'user'
    }
  ],
  products: [
    {
      sku: 'PROD-001',
      name: '测试产品1',
      price: 99.99,
      stock: 100
    }
  ]
};
```

## 测试执行

### 本地执行
```bash
# 安装测试依赖
npm install --save-dev jest supertest

# 运行所有测试
npm test

# 运行特定测试
npm test -- products.test.js

# 生成测试覆盖率报告
npm test -- --coverage
```

### CI/CD集成
```yaml
# GitHub Actions 示例
name: 集成测试
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: xf_shopee_test
        ports:
          - 3306:3306
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
```

## 测试报告

### 报告格式
- **控制台输出**: 测试进度和结果摘要
- **HTML报告**: 详细的测试结果和覆盖率
- **JUnit XML**: CI/CD系统集成

### 报告示例
```
Test Suites: 5 passed, 5 total
Tests:       42 passed, 42 total
Snapshots:   0 total
Time:        12.34 s
Ran all test suites.

-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------|---------|----------|---------|---------|-------------------
All files          |   85.23 |    78.45 |   89.12 |   85.23 |
 src/controllers   |   88.91 |    82.34 |   92.45 |   88.91 |
 src/models        |   82.45 |    75.67 |   85.23 |   82.45 |
 src/routes        |   84.56 |    77.89 |   89.78 |   84.56 |
-------------------|---------|----------|---------|---------|-------------------
```

## 故障排除

### 常见问题
1. **数据库连接失败**
   - 检查数据库服务是否运行
   - 验证连接配置
   - 检查网络连接

2. **测试数据冲突**
   - 确保测试数据唯一性
   - 使用事务回滚
   - 清理测试数据

3. **异步测试问题**
   - 使用async/await正确
   - 设置合理的超时时间
   - 处理Promise拒绝

### 调试技巧
- **日志记录**: 启用详细日志记录
- **断点调试**: 使用Node.js调试器
- **网络监控**: 监控API请求/响应

## 维护指南

### 测试维护
- **定期更新**: 根据API变更更新测试用例
- **代码审查**: 测试代码也需要代码审查
- **文档同步**: 测试文档与API文档同步

### 最佳实践
1. **测试独立性**: 每个测试用例应该独立运行
2. **测试数据管理**: 使用工厂模式创建测试数据
3. **断言清晰**: 断言信息应该清晰明确
4. **错误处理**: 测试应该正确处理错误情况
5. **性能考虑**: 测试应该快速执行，避免长时间运行

---

*本文档最后更新: 2024-04-20*
*版本: 1.0.0*