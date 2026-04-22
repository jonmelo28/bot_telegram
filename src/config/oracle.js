const oracledb = require('oracledb');
const env = require('./env');

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

if(env.oracleClientLibDir){
    oracledb.initOracleClient({
        libDir: env.oracleClientLibDir
    })
}

async function initOracle() {
  await oracledb.createPool({
    user: env.db.user,
    password: env.db.password,
    connectString: env.db.connectString,
    poolMin: env.db.poolMin,
    poolMax: env.db.poolMax,
    poolIncrement: env.db.poolIncrement
  });
}

async function getConnection() {
  return oracledb.getConnection();
}

async function closeOracle() {
   const pool = oracledb.getPool();
  if (pool) {
    await pool.close(10);
  }
}

module.exports = {
  initOracle,
  getConnection,
  closeOracle,
  oracledb
};