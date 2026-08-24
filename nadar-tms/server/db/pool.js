const mysql = require('mysql2/promise');

console.log('Connecting to database with config:', {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD ? '******' : '',
  database: process.env.DB_NAME || 'nadar_tms',
});

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nadar_tms',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

module.exports = { pool, query };
