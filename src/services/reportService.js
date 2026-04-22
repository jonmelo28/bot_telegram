const ORACLE_SQL = require('../db/oracleSQL');
const { getConnection } = require('../config/oracle');

const OPCOES = {
  RELATORIO_DIA: {
    titulo: 'Vendas do dia',
    callback: 'RELATORIO_DIA'
  },
  RELATORIO_MES: {
    titulo: 'Vendas do mês',
    callback: 'RELATORIO_MES'
  },
  INADIMPLENCIA: {
    titulo: 'Inadimplência',
    callback: 'INADIMPLENCIA'
  },
  RAIO_X: {
    titulo: 'Raio X',
    callback: 'RAIO_X'
  }
};

function montarMenu(permissoes = []) {
  return permissoes.map((item) => ({
    text: item.nome,
    callback_data: `MENU:${item.codigo}`
  }));
}

async function buscarDadosRelatorio(usuario, codigoOpcao) {
  let conn;
  try {
    conn = await getConnection();

    if (codigoOpcao === 'RELATORIO_DIA') {
      const result = await conn.execute(ORACLE_SQL.vendasDiaVendedor, {
        codusur: usuario.codusur
      });
      return {
        tipo: 'RELATORIO_DIA',
        titulo: 'Relatório de vendas do dia',
        rows: result.rows
      };
    }

    if (codigoOpcao === 'RELATORIO_MES') {
      const result = await conn.execute(ORACLE_SQL.vendasMesVendedor, {
        codusur: usuario.codusur
      });
      return {
        tipo: 'RELATORIO_MES',
        titulo: 'Relatório de vendas do mês',
        rows: result.rows
      };
    }

    if (codigoOpcao === 'INADIMPLENCIA') {
      const result = await conn.execute(ORACLE_SQL.inadimplenciaPorUsuario, {
        codusur: usuario.codusur
      });
      return {
        tipo: 'INADIMPLENCIA',
        titulo: 'Relatório de inadimplência',
        rows: result.rows
      };
    }

    throw new Error('Opção de relatório inválida');
  } finally {
    if (conn) await conn.close();
  }
}

module.exports = {
  OPCOES,
  montarMenu,
  buscarDadosRelatorio
};