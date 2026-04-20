const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

class DatabaseMigrator {
  constructor() {
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'xf_shopee',
      multipleStatements: true
    };
    
    this.migrationsTable = 'database_migrations';
    this.migrationsDir = path.join(__dirname, 'migrations');
  }

  async connect() {
    this.connection = await mysql.createConnection(this.config);
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.end();
    }
  }

  async ensureMigrationsTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        batch INT NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await this.connection.execute(createTableSQL);
  }

  async getAppliedMigrations() {
    const [rows] = await this.connection.execute(
      `SELECT migration_name FROM ${this.migrationsTable} ORDER BY id ASC`
    );
    return rows.map(row => row.migration_name);
  }

  async getMigrationFiles() {
    if (!fs.existsSync(this.migrationsDir)) {
      return [];
    }
    
    const files = fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    return files;
  }

  async runMigration(fileName) {
    const filePath = path.join(this.migrationsDir, fileName);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log(`运行迁移: ${fileName}`);
    await this.connection.query(sql);
    
    // 获取当前批次号
    const [batchRows] = await this.connection.execute(
      `SELECT MAX(batch) as max_batch FROM ${this.migrationsTable}`
    );
    const currentBatch = (batchRows[0].max_batch || 0) + 1;
    
    // 记录迁移
    await this.connection.execute(
      `INSERT INTO ${this.migrationsTable} (migration_name, batch) VALUES (?, ?)`,
      [fileName, currentBatch]
    );
    
    console.log(`✓ 迁移完成: ${fileName}`);
  }

  async migrate() {
    try {
      await this.connect();
      console.log('连接到数据库...');
      
      await this.ensureMigrationsTable();
      console.log('检查迁移表...');
      
      const applied = await this.getAppliedMigrations();
      const files = await this.getMigrationFiles();
      
      const pending = files.filter(file => !applied.includes(file));
      
      if (pending.length === 0) {
        console.log('✓ 没有待处理的迁移');
        return;
      }
      
      console.log(`发现 ${pending.length} 个待处理迁移:`);
      pending.forEach(file => console.log(`  - ${file}`));
      
      for (const file of pending) {
        await this.runMigration(file);
      }
      
      console.log('✓ 所有迁移完成');
      
    } catch (error) {
      console.error('迁移失败:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async rollback(batch = 1) {
    try {
      await this.connect();
      
      // 获取指定批次的迁移
      const [migrations] = await this.connection.execute(
        `SELECT migration_name FROM ${this.migrationsTable} WHERE batch = ? ORDER BY id DESC`,
        [batch]
      );
      
      if (migrations.length === 0) {
        console.log(`没有找到批次 ${batch} 的迁移记录`);
        return;
      }
      
      console.log(`回滚批次 ${batch} 的迁移:`);
      
      // 注意：这个简单的实现只是删除迁移记录，实际项目中应该创建回滚SQL文件
      for (const migration of migrations) {
        console.log(`  - ${migration.migration_name} (仅删除记录)`);
        await this.connection.execute(
          `DELETE FROM ${this.migrationsTable} WHERE migration_name = ?`,
          [migration.migration_name]
        );
      }
      
      console.log('✓ 回滚完成 (注意: 数据库变更未撤销，需要手动处理)');
      
    } catch (error) {
      console.error('回滚失败:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async status() {
    try {
      await this.connect();
      await this.ensureMigrationsTable();
      
      const applied = await this.getAppliedMigrations();
      const files = await this.getMigrationFiles();
      
      console.log('迁移状态:');
      console.log(`应用迁移: ${applied.length}`);
      console.log(`可用迁移: ${files.length}`);
      console.log(`待处理迁移: ${files.length - applied.length}`);
      
      console.log('\n详细列表:');
      files.forEach(file => {
        const status = applied.includes(file) ? '✓' : '✗';
        console.log(`  ${status} ${file}`);
      });
      
    } catch (error) {
      console.error('获取状态失败:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// CLI 接口
if (require.main === module) {
  const migrator = new DatabaseMigrator();
  const command = process.argv[2] || 'migrate';
  
  switch (command) {
    case 'migrate':
      migrator.migrate();
      break;
    case 'rollback':
      const batch = parseInt(process.argv[3]) || 1;
      migrator.rollback(batch);
      break;
    case 'status':
      migrator.status();
      break;
    case 'fresh':
      console.log('注意: fresh 命令需要手动实现数据库重置');
      console.log('建议使用:');
      console.log('  1. 删除数据库: DROP DATABASE xf_shopee');
      console.log('  2. 创建数据库: CREATE DATABASE xf_shopee');
      console.log('  3. 运行迁移: node database/migrate.js migrate');
      break;
    default:
      console.log('可用命令:');
      console.log('  migrate     - 运行所有待处理迁移');
      console.log('  rollback [batch] - 回滚指定批次迁移');
      console.log('  status      - 显示迁移状态');
      console.log('  fresh       - 重置数据库并重新运行迁移');
      break;
  }
}

module.exports = DatabaseMigrator;