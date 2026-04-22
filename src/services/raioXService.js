const { getConnection } = require('../config/oracle');
const SQL = require('../db/oracleRaioXSql');

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
    metaDiaria: diasRestantes > 0 ? Math.max((metaValor - vlFaturado) / diasRestantes, 0) : 0,
    diasRestantes,
    diasUteis
  };
}

function calcularFaixas(metaValor, vlFaturado) {
  const faturado = Number(vlFaturado || 0);
  const meta = Number(metaValor || 0);

  // Grupo 1
  const v70 = meta * 0.70;
  const v80 = meta * 0.80;
  const v90 = meta * 0.90;

  // Grupo 2
  const v100 = meta;
  const v110 = meta * 1.10;
  const v120 = meta * 1.20;

  return {
    v70,
    v80,
    v90,
    f70: faturado - v70,
    f80: faturado - v80,
    f90: faturado - v90,

    v100,
    v110,
    v120,
    f100: faturado - v100,
    f110: faturado - v110,
    f120: faturado - v120
  };
}


async function buscarRaioX({ dtIni, dtFim, codFilial, codusur, codfunc }) {
  let conn;

  try {
    conn = await getConnection();

    const bindsResumo = {
      dtIni,
      dtFim,
      codFilial: String(codFilial),
      codusur: Number(codusur),
      codfunc: Number(codfunc)
    };

    const bindsDias = {
      dtIni,
      dtFim,
      codFilial: String(codFilial)
    };

    const bindsRestantes = {
      dtFim,
      codFilial: String(codFilial)
    };

    const bindsDetalhes = {
      dtIni,
      dtFim,
      codFilial: String(codFilial),
      codusur: Number(codusur),
      codfunc: Number(codfunc)
    };

    const resumoResult = await conn.execute(SQL.resumoRca, bindsResumo);
    const diasResult = await conn.execute(SQL.diasUteis, bindsDias);
    const diasRestantesResult = await conn.execute(SQL.diasRestantes, bindsRestantes);
    const detalhesResult = await conn.execute(SQL.detalhesSecao, bindsDetalhes);

    const resumo = resumoResult.rows?.[0] || null;
    const diasUteis = Number(diasResult.rows?.[0]?.DIAVENDAS || 0);
    const diasRestantes = Number(diasRestantesResult.rows?.[0]?.DIAS_RESTANTES || 0);
    const detalhes = detalhesResult.rows || [];

    const indicadores = calcularIndicadores(resumo, diasUteis, diasRestantes);

    const linhasFaixa7090 = detalhes.map((item) => {
  const meta = Number(item.VLMETA || 0);
  const faturado = Number(item.VLVENDA || 0);

  const v70 = meta * 0.70;
  const v80 = meta * 0.80;
  const v90 = meta * 0.90;

  return {
    secao: item.SECAO,
    metaValor: meta,
    vlFaturado: faturado,
    v70,
    v80,
    v90,
    f70: faturado - v70,
    f80: faturado - v80,
    f90: faturado - v90
  };
});

const linhasFaixa100120 = detalhes.map((item) => {
  const meta = Number(item.VLMETA || 0);
  const faturado = Number(item.VLVENDA || 0);

  const v100 = meta;
  const v110 = meta * 1.10;
  const v120 = meta * 1.20;

  return {
    secao: item.SECAO,
    metaValor: meta,
    vlFaturado: faturado,
    v100,
    v110,
    v120,
    f100: faturado - v100,
    f110: faturado - v110,
    f120: faturado - v120
  };
});

function somarFaixa7090(detalhes) {
  const total = detalhes.reduce(
    (acc, item) => {
      acc.metaValor += Number(item.VLMETA || 0);
      acc.vlFaturado += Number(item.VLVENDA || 0);
      return acc;
    },
    { metaValor: 0, vlFaturado: 0 }
  );

  total.v70 = total.metaValor * 0.70;
  total.v80 = total.metaValor * 0.80;
  total.v90 = total.metaValor * 0.90;
  total.f70 = total.vlFaturado - total.v70;
  total.f80 = total.vlFaturado - total.v80;
  total.f90 = total.vlFaturado - total.v90;

  return total;
}

function somarFaixa100120(detalhes) {
  const total = detalhes.reduce(
    (acc, item) => {
      acc.metaValor += Number(item.VLMETA || 0);
      acc.vlFaturado += Number(item.VLVENDA || 0);
      return acc;
    },
    { metaValor: 0, vlFaturado: 0 }
  );

  total.v100 = total.metaValor;
  total.v110 = total.metaValor * 1.10;
  total.v120 = total.metaValor * 1.20;
  total.f100 = total.vlFaturado - total.v100;
  total.f110 = total.vlFaturado - total.v110;
  total.f120 = total.vlFaturado - total.v120;

  return total;
}



    return {
      resumo,
      diasUteis,
      diasRestantes,
      indicadores,
      detalhes,
      linhasFaixa7090,
      linhasFaixa100120,
      somarFaixa7090,
      somarFaixa100120
    };
  } finally {
    if (conn) await conn.close();
  }
}

module.exports = {
  buscarRaioX
};