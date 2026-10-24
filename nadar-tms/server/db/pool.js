const mysql = require('mysql2/promise');

const dbPort = parseInt(process.env.DB_PORT || '3307', 10);
const dbName = process.env.DB_NAME || 'nadar_tms2';

console.log('Connecting to database with config:', {
  host: process.env.DB_HOST || '127.0.0.1',
  port: dbPort,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD ? '******' : '',
  database: dbName,
});

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: dbPort,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});


async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

module.exports = { pool, query };
