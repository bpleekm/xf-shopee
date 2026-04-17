const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'xf_shopee',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// 如果指定了socket路径，则使用socket连接，否则使用TCP
if (process.env.DB_SOCKET) {
  dbConfig.socketPath = process.env.DB_SOCKET;
} else {
  dbConfig.host = process.env.DB_HOST || 'localhost';
  dbConfig.port = process.env.DB_PORT || 3306;
}

const pool = mysql.createPool(dbConfig);

// 测试数据库连接
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// 初始化数据库表
async function initializeDatabase() {
  const connection = await pool.getConnection();
  
  try {
    // 禁用外键检查以便创建表
    await connection.execute('SET FOREIGN_KEY_CHECKS=0');
    // 创建用户表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin', 'employee', 'guest') DEFAULT 'employee',
        full_name VARCHAR(100),
        phone VARCHAR(20),
        status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP NULL,
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 创建角色表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description VARCHAR(200),
        is_system_role BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 创建权限表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description VARCHAR(200),
        resource VARCHAR(100),
        action VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_code (code),
        INDEX idx_resource (resource)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 创建角色权限关联表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INT NOT NULL,
        permission_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
        INDEX idx_role_id (role_id),
        INDEX idx_permission_id (permission_id)
      )
    `);
    
    // 创建用户角色关联表（支持多角色）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_roles (
        user_id INT NOT NULL,
        role_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, role_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_role_id (role_id)
      )
    `);
    
    // 创建商品表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sku VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        price DECIMAL(10, 2) NOT NULL,
        cost_price DECIMAL(10, 2),
        stock_quantity INT DEFAULT 0,
        min_stock_level INT DEFAULT 10,
        image_url VARCHAR(500),
        status ENUM('active', 'inactive', 'out_of_stock') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_sku (sku),
        INDEX idx_category (category),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 创建购物车表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS carts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        session_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_session_id (session_id)
      )
    `);
    
    // 创建购物车项表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cart_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        unit_price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY unique_cart_product (cart_id, product_id),
        INDEX idx_cart_id (cart_id)
      )
    `);
    
    // 创建订单表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        user_id INT,
        total_amount DECIMAL(10, 2) NOT NULL,
        shipping_fee DECIMAL(10, 2) DEFAULT 0,
        tax_amount DECIMAL(10, 2) DEFAULT 0,
        final_amount DECIMAL(10, 2) NOT NULL,
        status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
        shipping_address TEXT,
        payment_method VARCHAR(50),
        payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_order_number (order_number),
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      )
    `);
    
    // 创建订单项表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_order_id (order_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ Database tables created successfully');
    
    // 重新启用外键检查
    await connection.execute('SET FOREIGN_KEY_CHECKS=1');
    
    // 插入默认系统角色
    const defaultRoles = [
      { name: 'admin', description: '系统管理员', is_system_role: true },
      { name: 'employee', description: '员工', is_system_role: true },
      { name: 'guest', description: '游客', is_system_role: true }
    ];
    
    for (const role of defaultRoles) {
      const [existingRole] = await connection.execute(
        'SELECT id FROM roles WHERE name = ?',
        [role.name]
      );
      
      if (existingRole.length === 0) {
        await connection.execute(
          'INSERT INTO roles (name, description, is_system_role) VALUES (?, ?, ?)',
          [role.name, role.description, role.is_system_role]
        );
      }
    }
    
    console.log('✅ Default roles created');
    
    // 插入默认权限
    const defaultPermissions = [
      { code: 'user:create', name: '创建用户', resource: 'user', action: 'create' },
      { code: 'user:read', name: '查看用户', resource: 'user', action: 'read' },
      { code: 'user:update', name: '更新用户', resource: 'user', action: 'update' },
      { code: 'user:delete', name: '删除用户', resource: 'user', action: 'delete' },
      { code: 'product:create', name: '创建商品', resource: 'product', action: 'create' },
      { code: 'product:read', name: '查看商品', resource: 'product', action: 'read' },
      { code: 'product:update', name: '更新商品', resource: 'product', action: 'update' },
      { code: 'product:delete', name: '删除商品', resource: 'product', action: 'delete' },
      { code: 'order:create', name: '创建订单', resource: 'order', action: 'create' },
      { code: 'order:read', name: '查看订单', resource: 'order', action: 'read' },
      { code: 'order:update', name: '更新订单', resource: 'order', action: 'update' },
      { code: 'order:delete', name: '删除订单', resource: 'order', action: 'delete' },
      { code: 'cart:manage', name: '管理购物车', resource: 'cart', action: 'manage' },
      { code: 'system:config', name: '系统配置', resource: 'system', action: 'config' }
    ];
    
    for (const permission of defaultPermissions) {
      const [existingPermission] = await connection.execute(
        'SELECT id FROM permissions WHERE code = ?',
        [permission.code]
      );
      
      if (existingPermission.length === 0) {
        await connection.execute(
          'INSERT INTO permissions (code, name, description, resource, action) VALUES (?, ?, ?, ?, ?)',
          [permission.code, permission.name, permission.description || '', permission.resource, permission.action]
        );
      }
    }
    
    console.log('✅ Default permissions created');
    
    // 为管理员角色分配所有权限
    const [adminRole] = await connection.execute('SELECT id FROM roles WHERE name = "admin"');
    if (adminRole.length > 0) {
      const [allPermissions] = await connection.execute('SELECT id FROM permissions');
      
      for (const perm of allPermissions) {
        const [existing] = await connection.execute(
          'SELECT * FROM role_permissions WHERE role_id = ? AND permission_id = ?',
          [adminRole[0].id, perm.id]
        );
        
        if (existing.length === 0) {
          await connection.execute(
            'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
            [adminRole[0].id, perm.id]
          );
        }
      }
      
      console.log('✅ Admin role permissions assigned');
    }
    
    // 为员工角色分配基本权限
    const [employeeRole] = await connection.execute('SELECT id FROM roles WHERE name = "employee"');
    if (employeeRole.length > 0) {
      const employeePermissions = [
        'product:create', 'product:read', 'product:update', 'product:delete',
        'order:create', 'order:read', 'order:update',
        'cart:manage'
      ];
      
      for (const permCode of employeePermissions) {
        const [permission] = await connection.execute('SELECT id FROM permissions WHERE code = ?', [permCode]);
        if (permission.length > 0) {
          const [existing] = await connection.execute(
            'SELECT * FROM role_permissions WHERE role_id = ? AND permission_id = ?',
            [employeeRole[0].id, permission[0].id]
          );
          
          if (existing.length === 0) {
            await connection.execute(
              'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
              [employeeRole[0].id, permission[0].id]
            );
          }
        }
      }
      
      console.log('✅ Employee role permissions assigned');
    }
    
    // 为游客角色分配只读权限
    const [guestRole] = await connection.execute('SELECT id FROM roles WHERE name = "guest"');
    if (guestRole.length > 0) {
      const guestPermissions = [
        'product:read',
        'cart:manage'
      ];
      
      for (const permCode of guestPermissions) {
        const [permission] = await connection.execute('SELECT id FROM permissions WHERE code = ?', [permCode]);
        if (permission.length > 0) {
          const [existing] = await connection.execute(
            'SELECT * FROM role_permissions WHERE role_id = ? AND permission_id = ?',
            [guestRole[0].id, permission[0].id]
          );
          
          if (existing.length === 0) {
            await connection.execute(
              'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
              [guestRole[0].id, permission[0].id]
            );
          }
        }
      }
      
      console.log('✅ Guest role permissions assigned');
    }
    
    // 创建默认管理员账户（如果不存在）
    const [adminUsers] = await connection.execute(
      'SELECT id FROM users WHERE username = ?',
      ['admin']
    );
    
    let adminUserId = null;
    
    if (adminUsers.length === 0) {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const [insertResult] = await connection.execute(
        'INSERT INTO users (username, email, password_hash, role, full_name, status) VALUES (?, ?, ?, ?, ?, ?)',
        ['admin', 'admin@xfshopee.com', hashedPassword, 'admin', 'System Administrator', 'active']
      );
      
      adminUserId = insertResult.insertId;
      console.log('✅ Default admin user created (username: admin, password: admin123)');
    } else {
      adminUserId = adminUsers[0].id;
    }
    
    // 确保管理员用户关联到admin角色
    if (adminUserId) {
      // 获取admin角色ID
      const [adminRole] = await connection.execute(
        'SELECT id FROM roles WHERE name = ?',
        ['admin']
      );
      
      if (adminRole.length > 0) {
        // 检查是否已关联
        const [existingRelation] = await connection.execute(
          'SELECT * FROM user_roles WHERE user_id = ? AND role_id = ?',
          [adminUserId, adminRole[0].id]
        );
        
        if (existingRelation.length === 0) {
          // 关联管理员用户与admin角色
          await connection.execute(
            'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
            [adminUserId, adminRole[0].id]
          );
          console.log('✅ Admin user role assigned');
        } else {
          console.log('✅ Admin user role already assigned');
        }
      }
    }
    
    // 插入示例商品数据（如果商品表为空）
    const [productCount] = await connection.execute('SELECT COUNT(*) as count FROM products');
    if (productCount[0].count === 0) {
      const sampleProducts = [
        {
          sku: 'PRD001',
          name: 'Premium Coffee',
          description: 'Rich Arabica coffee beans from Colombia',
          category: 'Food & Beverage',
          price: 24.99,
          cost_price: 15.50,
          stock_quantity: 100,
          min_stock_level: 20,
          image_url: null,
          status: 'active'
        },
        {
          sku: 'PRD002',
          name: 'Organic Apples',
          description: 'Fresh organic apples from local farm',
          category: 'Food & Beverage',
          price: 5.99,
          cost_price: 3.50,
          stock_quantity: 50,
          min_stock_level: 10,
          image_url: null,
          status: 'active'
        },
        {
          sku: 'PRD003',
          name: 'Wireless Headphones',
          description: 'Noise-cancelling Bluetooth headphones',
          category: 'Electronics',
          price: 89.99,
          cost_price: 55.00,
          stock_quantity: 25,
          min_stock_level: 5,
          image_url: null,
          status: 'active'
        },
        {
          sku: 'PRD004',
          name: 'Yoga Mat',
          description: 'Non-slip premium yoga mat',
          category: 'Fitness',
          price: 29.99,
          cost_price: 18.00,
          stock_quantity: 75,
          min_stock_level: 15,
          image_url: null,
          status: 'active'
        },
        {
          sku: 'PRD005',
          name: 'Water Bottle',
          description: 'Insulated stainless steel water bottle',
          category: 'Fitness',
          price: 19.99,
          cost_price: 12.00,
          stock_quantity: 120,
          min_stock_level: 25,
          image_url: null,
          status: 'active'
        },
        {
          sku: 'PRD006',
          name: 'Office Chair',
          description: 'Ergonomic office chair with lumbar support',
          category: 'Furniture',
          price: 199.99,
          cost_price: 120.00,
          stock_quantity: 15,
          min_stock_level: 3,
          image_url: null,
          status: 'active'
        }
      ];
      
      for (const product of sampleProducts) {
        await connection.execute(
          `INSERT INTO products (
            sku, name, description, category, price, cost_price,
            stock_quantity, min_stock_level, image_url, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            product.sku,
            product.name,
            product.description,
            product.category,
            product.price,
            product.cost_price,
            product.stock_quantity,
            product.min_stock_level,
            product.image_url,
            product.status
          ]
        );
      }
      
      console.log('✅ Sample products created');
    }
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  testConnection,
  initializeDatabase
};