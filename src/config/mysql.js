const mysql = require('mysql2/promise');
const env = require('./env');
const { error } = require('console');

let pool;

async function initMySQL() {
  pool = mysql.createPool({
    host: env.mysql.host,
    port: env.mysql.port,
    user: env.mysql.user,
    password: env.mysql.password,
    database: env.mysql.database,
    waitForConnections: true,
    connectionLimit: env.mysql.connectionLimit,
    queueLimit: 0,
    charset: 'utf8mb4'
  });

  const conn = await pool.getConnection();
  conn.release();
}

function getMySQL() {
  if(!pool){
    throw new error('Pool MySQL não inicializado');
  }
  return pool;
}

async function closeMySQL() {
    if(pool){
        await pool.end();
    }
}

module.exports = {
  initMySQL,
  getMySQL,
  closeMySQL
};