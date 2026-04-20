// 测试环境清理
module.exports = async () => {
  console.log('清理测试环境...');
  
  // 清理测试数据库
  try {
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    await connection.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME}`);
    await connection.end();
    console.log('测试数据库已清理');
  } catch (error) {
    console.warn('清理测试数据库时出错:', error.message);
  }

  // 清理临时文件
  const fs = require('fs');
  const path = require('path');
  
  const tempDirs = [
    path.join(__dirname, '..', 'coverage'),
    path.join(__dirname, '..', 'test-results')
  ];

  tempDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`清理目录: ${dir}`);
    }
  });

  console.log('测试环境清理完成');
};