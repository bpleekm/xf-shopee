// 测试环境配置
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.test') });

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.DB_NAME = process.env.DB_NAME || 'xf_shopee_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-123';
process.env.PORT = process.env.PORT || 3001;

// 导入测试工具
const { faker } = require('@faker-js/faker');

// 全局测试辅助函数
global.generateTestUser = () => ({
  username: faker.internet.userName().toLowerCase().replace(/[^a-z0-9]/g, ''),
  email: faker.internet.email().toLowerCase(),
  password: 'TestPassword123!',
  fullName: faker.person.fullName(),
  phone: faker.phone.number('+86 1##########')
});

global.generateTestProduct = () => ({
  sku: `TEST-${faker.string.alphanumeric(8).toUpperCase()}`,
  name: faker.commerce.productName(),
  description: faker.commerce.productDescription(),
  price: parseFloat(faker.commerce.price({ min: 10, max: 1000, dec: 2 })),
  costPrice: parseFloat(faker.commerce.price({ min: 5, max: 500, dec: 2 })),
  stockQuantity: faker.number.int({ min: 0, max: 1000 }),
  weight: faker.number.float({ min: 0.1, max: 10, fractionDigits: 2 }),
  dimensions: `${faker.number.int({ min: 10, max: 100 })}x${faker.number.int({ min: 10, max: 100 })}x${faker.number.int({ min: 1, max: 50 })}`,
  brand: faker.company.name()
});

global.generateTestOrder = (userId, products = []) => ({
  userId,
  shippingAddress: {
    recipient: faker.person.fullName(),
    phone: faker.phone.number('+86 1##########'),
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    province: faker.location.state(),
    postalCode: faker.location.zipCode()
  },
  paymentMethod: faker.helpers.arrayElement(['alipay', 'wechat_pay', 'credit_card']),
  items: products.map(product => ({
    productId: product.id,
    quantity: faker.number.int({ min: 1, max: 5 }),
    unitPrice: product.price
  }))
});

// 数据库测试配置
const mysql = require('mysql2/promise');

global.createTestDatabase = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
  await connection.end();
};

global.dropTestDatabase = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  await connection.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME}`);
  await connection.end();
};

// 延迟函数
global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

console.log('测试环境配置完成');