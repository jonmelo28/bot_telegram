const { getConnection } = require('../config/oracle');
const SQL = require('../db/oracleRaioXNovoModeloSql');

function calcularIndicadores(resumo, diasUteis, diasRestantes) {
  const metaValor = Number(resumo?.VLMETA || 0);
  const vlVendido = Number(resumo?.PVENDA || 0);
  const vlFaturado = Number(resumo?.VLVENDA || 0);
  const metaPos = Number(resumo?.QTMETACLIPOS || 0);
  const realPos = Number(resumo?.QTCLIPOS_PED || 0);
  const fatPos = Number(resumo?.QTCLIPOSFAT || 0);

  return {
    metaValor,
    vlVendido,
    vlFaturado,
    percentualFaturamento: metaValor > 0 ? (vlFaturado / metaValor) * 100 : 0,
    metaPos,
    realPos,
    fatPos,
    metaDiaria: diasRestantes > 0
      ? Math.max((metaValor - vlFaturado) / diasRestantes, 0)
      : 0,
    diasRestantes,
    diasUteis
  };
}

function montarResumoPorFornecedor({ codusur, nome, detalhesFornecedor }) {
  return detalhesFornecedor.reduce(
    (acc, item) => {
      acc.PVENDA += Number(item.PVENDA || 0);
      acc.VLMETA += Number(item.VLMETA || 0);
      acc.VLVENDA += Number(item.VLVENDA || 0);
      acc.QTMETACLIPOS += Number(item.QTMETACLIPOS || 0);
      acc.QTCLIPOS_PED += Number(item.QTCLIPOS_PED || 0);
      acc.QTCLIPOSFAT += Number(item.QTCLIPOS_FAT || 0);
      return acc;
    },
    {
      CODUSUR: Number(codusur),
      NOME: nome || '',
      QTCLIPOS_PED: 0,
      PVENDA: 0,
      VLMETA: 0,
      QTMETACLIPOS: 0,
      VLVENDA: 0,
      QTCLIPOSFAT: 0
    }
  );
}

function buildInClause(prefix, values) {
  const list = Array.isArray(values) ? values : [values];
  const cleanList = list
    .filter((v) => v !== undefined && v !== null && String(v).trim() !== '')
    .map((v) => String(v).trim());

  if (!cleanList.length) {
    throw new Error(`Nenhum valor válido informado para ${prefix}`);
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

function applyFilialClause(sql, filialClause) {
  return sql.replaceAll(':CODFILIALS', filialClause);
}

async function buscarRaioXNovoModelo({ dtIni, dtFim, codFilial, codusur, codfunc }) {
  let conn;

  try {
    conn = await getConnection();

    const { clause: filialClause, binds: filialBinds } = buildInClause('filial', codFilial);

    const sqlResumo = applyFilialClause(SQL.resumoRca, filialClause);
    const sqlDias = applyFilialClause(SQL.diasUteis, filialClause);
    const sqlRestantes = applyFilialClause(SQL.diasRestantes, filialClause);
    const sqlFornecedor = applyFilialClause(SQL.detalhesFornecedor, filialClause);
    const sqlSecao = applyFilialClause(SQL.detalhesSecao, filialClause);

    const bindsResumo = {
      dtIni,
      dtFim,
      codusur: Number(codusur),
      codfunc: Number(codfunc),
      ...filialBinds
    };

    const bindsDias = {
      dtIni,
      dtFim
    };

    const bindsRestantes = {
      dtFim
    };

    const bindsDetalhes = {
      dtIni,
      dtFim,
      codusur: Number(codusur),
      codfunc: Number(codfunc),
      ...filialBinds
    };

    console.log('==============================');
    console.log('🚀 INICIANDO RAIO X NOVO MODELO');
    console.log('DATA INI:', dtIni);
    console.log('DATA FIM:', dtFim);
    console.log('CODFILIAL:', codFilial);
    console.log('CODUSUR:', codusur);
    console.log('CODFUNC:', codfunc);
    console.log('FILIAL CLAUSE:', filialClause);
    console.log('==============================');

    console.log('📦 BINDS RESUMO:', bindsResumo);
    console.log('📦 BINDS DETALHES:', bindsDetalhes);

    let resumoResult;
    let diasResult;
    let restantesResult;
    let fornecedorResult;
    let secaoResult;

    try {
      console.log('▶ Executando resumoRca...');
      resumoResult = await conn.execute(sqlResumo, bindsResumo);
      console.log('✅ resumoRca OK');
    } catch (err) {
      console.error('❌ ERRO resumoRca:', err);
      console.log('SQL resumoRca:\n', sqlResumo);
      console.log('BINDS resumoRca:', bindsResumo);
      throw err;
    }

    try {
      console.log('▶ Executando diasUteis...');
      diasResult = await conn.execute(sqlDias, bindsDias);
      console.log('✅ diasUteis OK');
    } catch (err) {
      console.error('❌ ERRO diasUteis:', err);
      console.log('SQL diasUteis:\n', sqlDias);
      console.log('BINDS diasUteis:', bindsDias);
      throw err;
    }

    try {
      console.log('▶ Executando diasRestantes...');
      restantesResult = await conn.execute(sqlRestantes, bindsRestantes);
      console.log('✅ diasRestantes OK');
    } catch (err) {
      console.error('❌ ERRO diasRestantes:', err);
      console.log('SQL diasRestantes:\n', sqlRestantes);
      console.log('BINDS diasRestantes:', bindsRestantes);
      throw err;
    }

    try {
      console.log('▶ Executando detalhesFornecedor...');
      fornecedorResult = await conn.execute(sqlFornecedor, bindsDetalhes);
      console.log('✅ detalhesFornecedor OK');
    } catch (err) {
      console.error('❌ ERRO detalhesFornecedor:', err);
      console.log('SQL detalhesFornecedor:\n', sqlFornecedor);
      console.log('BINDS detalhesFornecedor:', bindsDetalhes);
      throw err;
    }

    try {
      console.log('▶ Executando detalhesSecao...');
      secaoResult = await conn.execute(sqlSecao, bindsDetalhes);
      console.log('✅ detalhesSecao OK');
    } catch (err) {
      console.error('❌ ERRO detalhesSecao:', err);
      console.log('SQL detalhesSecao:\n', sqlSecao);
      console.log('BINDS detalhesSecao:', bindsDetalhes);
      throw err;
    }

    console.log('📊 RESUMO RAW:', resumoResult.rows?.[0]);
    console.log('📊 DIAS RAW:', diasResult.rows?.[0]);
    console.log('📊 RESTANTES RAW:', restantesResult.rows?.[0]);
    console.log('📊 FORNECEDOR RAW (3):', fornecedorResult.rows?.slice(0, 3));
    console.log('📊 SECAO RAW (3):', secaoResult.rows?.slice(0, 3));

    const resumoOracle = resumoResult.rows?.[0] || null;
    const diasUteis = Number(diasResult.rows?.[0]?.DIAVENDAS || 0);
    const diasRestantes = Number(restantesResult.rows?.[0]?.DIAS_RESTANTES || 0);

    const detalhesFornecedor = fornecedorResult.rows || [];
    const detalhesSecao = secaoResult.rows || [];

    const resumo = montarResumoPorFornecedor({
      codusur,
      nome: resumoOracle?.NOME || '',
      detalhesFornecedor
    });

    const indicadores = calcularIndicadores(resumo, diasUteis, diasRestantes);

    console.log('📊 RESUMO FINAL:', resumo);
    console.log('📊 INDICADORES FINAL:', indicadores);

    return {
      resumo,
      diasUteis,
      diasRestantes,
      indicadores,
      detalhesFornecedor,
      detalhesSecao
    };
  } catch (err) {
    console.error('❌ ERRO RAIO X NOVO MODELO:', err);
    throw err;
  } finally {
    if (conn) {
      await conn.close();
    }
  }
}

module.exports = {
  buscarRaioXNovoModelo
};