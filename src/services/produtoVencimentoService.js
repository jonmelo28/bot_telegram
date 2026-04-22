const { getConnection } = require('../config/oracle');
const SQL = require('../db/oracleProdutoVencimentoSql');

async function buscarProdutosVencimento() {
  let conn;

  try {
    conn = await getConnection();

    const result = await conn.execute(SQL.listar, {}, {
      outFormat: 4002 // oracledb.OUT_FORMAT_OBJECT
    });

    return result.rows || [];
  } finally {
    if (conn) {
      await conn.close();
    }
  }
}

module.exports = {
  buscarProdutosVencimento
};