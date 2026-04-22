const { getConnection } = require('../config/oracle');
const SQL = require('../db/oracleVendaCidadeSql');

function buildInClause(prefix, values) {
  const list = Array.isArray(values) ? values : [values];
  const cleanList = list
    .filter((v) => v !== undefined && v !== null && String(v).trim() !== '')
    .map((v) => String(v).trim());

  if (!cleanList.length) {
    throw new Error(`Nenhuma filial válida informada para ${prefix}`);
  }

  const bindNames = cleanList.map((_, i) => `:${prefix}${i}`);
  const binds = {};

  cleanList.forEach((value, i) => {
    binds[`${prefix}${i}`] = value;
  });

  return {
    clause: bindNames.join(', '),
    binds
  };
}

function pivotCidadeCliente(rows, colunaCampo, valorCampo) {
  const colunas = [...new Set(rows.map((r) => r[colunaCampo]).filter(Boolean))];
  const cidadesMap = new Map();

  for (const row of rows) {
    const cidade = row.CIDADE || 'SEM CIDADE';
    const cliente = row.CLIENTE || 'SEM CLIENTE';
    const coluna = row[colunaCampo];
    const valor = Number(row[valorCampo] || 0);

    if (!cidadesMap.has(cidade)) {
      cidadesMap.set(cidade, {
        cidade,
        total: 0,
        totaisColuna: {},
        clientesMap: new Map()
      });
    }

    const cidadeObj = cidadesMap.get(cidade);

    if (!cidadeObj.clientesMap.has(cliente)) {
      cidadeObj.clientesMap.set(cliente, {
        cliente,
        total: 0,
        valores: {}
      });
    }

    const clienteObj = cidadeObj.clientesMap.get(cliente);

    clienteObj.valores[coluna] = (clienteObj.valores[coluna] || 0) + valor;
    clienteObj.total += valor;

    cidadeObj.totaisColuna[coluna] = (cidadeObj.totaisColuna[coluna] || 0) + valor;
    cidadeObj.total += valor;
  }

  const cidades = Array.from(cidadesMap.values()).map((cidadeObj) => ({
    cidade: cidadeObj.cidade,
    total: cidadeObj.total,
    totaisColuna: cidadeObj.totaisColuna,
    clientes: Array.from(cidadeObj.clientesMap.values())
  }));

  const totaisColuna = {};
  for (const col of colunas) {
    totaisColuna[col] = 0;
  }

  let totalGeral = 0;

  for (const cidade of cidades) {
    totalGeral += cidade.total;
    for (const col of colunas) {
      totaisColuna[col] += Number(cidade.totaisColuna[col] || 0);
    }
  }

  return {
    colunas,
    cidades,
    totaisColuna,
    totalGeral
  };
}

async function buscarVendaCidade({ dtIni, dtFim, codusur, codFilial }) {
  let conn;

  try {
    conn = await getConnection();

    const { clause: filialClause, binds: filialBinds } = buildInClause('filial', codFilial);

    const sqlSecao = SQL.porSecao.replaceAll(':CODFILIALS', filialClause);
    const sqlFornecedor = SQL.porFornecedor.replaceAll(':CODFILIALS', filialClause);

    const binds = {
      dtIni,
      dtFim,
      codusur: Number(codusur),
      ...filialBinds
    };

    const [secaoResult, fornecedorResult] = await Promise.all([
      conn.execute(sqlSecao, binds),
      conn.execute(sqlFornecedor, binds)
    ]);

    const rowsSecao = secaoResult.rows || [];
    const rowsFornecedor = fornecedorResult.rows || [];

    return {
      porSecao: pivotCidadeCliente(rowsSecao, 'SECAO', 'VENSECAO'),
      porFornecedor: pivotCidadeCliente(rowsFornecedor, 'FORNEC', 'VENFORNEC'),
      brutoSecao: rowsSecao,
      brutoFornecedor: rowsFornecedor
    };
  } finally {
    if (conn) await conn.close();
  }
}

module.exports = {
  buscarVendaCidade
};