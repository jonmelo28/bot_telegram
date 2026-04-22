const fs = require('fs');
const PDFDocument = require('pdfkit');
const { buildTmpFilePath } = require('../utils/file');

function moeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function numero(valor) {
  return Number(valor || 0).toLocaleString('pt-BR');
}

function percentual(valor) {
  return `${Number(valor || 0).toFixed(2).replace('.', ',')}%`;
}

function formatarPeriodoMesAtual() {
  const hoje = new Date();
  const meses = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];
  return `${meses[hoje.getMonth()]}/${String(hoje.getFullYear()).slice(-2)}`;
}

function addTable(doc, {
  title,
  columns,
  rows,
  startY,
  fontSize = 7.5,
  rowHeight = 18,
  headerHeight = 20,
  titleGap = 6
}) {
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const startX = doc.page.margins.left;
  let y = startY;

  const azul = '#0B2E59';
  const laranja = '#FFA500';
  const cinza = '#F2F2F2';
  const branco = '#FFFFFF';
  const preto = '#000000';

  if (title) {
    doc.fillColor(preto).font('Helvetica-Bold').fontSize(10).text(title, startX, y);
    y += titleGap + 8;
  }

  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);
  const scale = totalWidth > pageWidth ? pageWidth / totalWidth : 1;

  const scaledColumns = columns.map(col => ({
    ...col,
    width: col.width * scale
  }));

  function drawHeader() {
    let x = startX;

    doc.font('Helvetica-Bold').fontSize(fontSize);

    scaledColumns.forEach((col) => {
      // fundo
      doc.save();
      doc.rect(x, y, col.width, headerHeight).fill(azul);
      doc.restore();

      // borda
      doc.rect(x, y, col.width, headerHeight).stroke();

      // texto
      doc.fillColor(laranja).text(col.label, x + 3, y + 5, {
        width: col.width - 6,
        align: col.align || 'left',
        ellipsis: true
      });

      x += col.width;
    });

    y += headerHeight;
  }

  function ensureSpace(nextBlockHeight = rowHeight) {
    const bottomLimit = doc.page.height - doc.page.margins.bottom;

    if (y + nextBlockHeight > bottomLimit) {
      doc.addPage();
      y = doc.page.margins.top;

      if (title) {
        doc.fillColor(preto).font('Helvetica-Bold').fontSize(10).text(`${title} (continuação)`, startX, y);
        y += titleGap + 8;
      }

      drawHeader();
    }
  }

  // desenha o cabeçalho da primeira página
  drawHeader();

  doc.font('Helvetica').fontSize(fontSize);

  rows.forEach((row, index) => {
    ensureSpace(rowHeight);

    let x = startX;
    const bgColor = index % 2 === 0 ? branco : cinza;

    scaledColumns.forEach((col) => {
      const valor = row[col.key] == null ? '' : String(row[col.key]);

      // fundo da célula
      doc.save();
      doc.rect(x, y, col.width, rowHeight).fill(bgColor);
      doc.restore();

      // borda
      doc.rect(x, y, col.width, rowHeight).stroke();

      // texto
      doc.fillColor(preto).text(valor, x + 3, y + 5, {
        width: col.width - 6,
        align: col.align || 'left',
        ellipsis: true
      });

      x += col.width;
    });

    y += rowHeight;
  });

  return y + 10;
}

function montarTotaisSecao(detalhes) {
  return detalhes.reduce(
    (acc, item) => {
      acc.metaValor += Number(item.VLMETA || 0);
      acc.vlVendido += Number(item.PVENDA || 0);
      acc.vlFaturado += Number(item.VLVENDA || 0);
      acc.metaPos += Number(item.QTMETACLIPOS || 0);
      acc.realPos += Number(item.QTCLIPOS_PED || 0);
      acc.fatPos += Number(item.QTCLIPOS_FAT || 0);
      return acc;
    },
    {
      metaValor: 0,
      vlVendido: 0,
      vlFaturado: 0,
      metaPos: 0,
      realPos: 0,
      fatPos: 0
    }
  );
}

function montarFaixas7090(metaValor, vlFaturado) {
  const meta = Number(metaValor || 0);
  const faturado = Number(vlFaturado || 0);

  const v70 = meta * 0.70;
  const v80 = meta * 0.80;
  const v90 = meta * 0.90;

  return {
    metaValor: meta,
    vlFaturado: faturado,
    v70,
    v80,
    v90,
    f70: faturado - v70,
    f80: faturado - v80,
    f90: faturado - v90
  };
}

function montarFaixas100120(metaValor, vlFaturado) {
  const meta = Number(metaValor || 0);
  const faturado = Number(vlFaturado || 0);

  const v100 = meta;
  const v110 = meta * 1.10;
  const v120 = meta * 1.20;

  return {
    metaValor: meta,
    vlFaturado: faturado,
    v100,
    v110,
    v120,
    f100: faturado - v100,
    f110: faturado - v110,
    f120: faturado - v120
  };
}

function gerarPdfRaioX({ usuario, dados }) {
  return new Promise((resolve, reject) => {
    const filename = `raio_x_${usuario.codusur}_${Date.now()}.pdf`;
    const outputPath = buildTmpFilePath(filename);

    const doc = new PDFDocument({
      margin: 24,
      size: 'A4',
      layout: 'landscape'
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    const resumo = dados.resumo || {};
    const ind = dados.indicadores || {};
    const detalhes = Array.isArray(dados.detalhes) ? dados.detalhes : [];

    doc.font('Helvetica-Bold').fontSize(15).text('RAIO X POR RCA', { align: 'center' });
    doc.moveDown(0.3);

    doc.font('Helvetica').fontSize(9);
    doc.text(`RCA: ${resumo.CODUSUR || usuario.codusur} - ${resumo.NOME || usuario.nome}`, 24, 46);
    doc.text(`Período: ${formatarPeriodoMesAtual()}`, 24, 60);
    doc.text(`Emissão: ${new Date().toLocaleString('pt-BR')}`, 24, 74);

    let y = 95;

    // RESUMO SUPERIOR
    y = addTable(doc, {
      title: '',
      startY: y,
      fontSize: 8,
      rowHeight: 20,
      headerHeight: 20,
      columns: [
        { label: 'META VALOR', key: 'metaValor', width: 105, align: 'right' },
        { label: 'VL. VENDIDO', key: 'vlVendido', width: 105, align: 'right' },
        { label: 'VL. FATURADO', key: 'vlFaturado', width: 105, align: 'right' },
        { label: '% FATURAMENTO', key: 'percentualFaturamento', width: 95, align: 'right' },
        { label: 'META POS.', key: 'metaPos', width: 70, align: 'right' },
        { label: 'REAL.POS.', key: 'realPos', width: 70, align: 'right' },
        { label: 'FAT.POS.', key: 'fatPos', width: 70, align: 'right' },
        { label: 'META DIÁRIA', key: 'metaDiaria', width: 105, align: 'right' },
        { label: 'DIAS RESTANTES', key: 'diasRestantes', width: 90, align: 'right' }
      ],
      rows: [
        {
          metaValor: moeda(ind.metaValor),
          vlVendido: moeda(ind.vlVendido),
          vlFaturado: moeda(ind.vlFaturado),
          percentualFaturamento: percentual(ind.percentualFaturamento),
          metaPos: numero(ind.metaPos),
          realPos: numero(ind.realPos),
          fatPos: numero(ind.fatPos),
          metaDiaria: moeda(ind.metaDiaria),
          diasRestantes: numero(ind.diasRestantes)
        }
      ]
    });

    // REALIZADO POR SEÇÃO
    const rowsDetalhes = detalhes.map((item) => {
      const metaValor = Number(item.VLMETA || 0);
      const vlVendido = Number(item.PVENDA || 0);
      const vlFaturado = Number(item.VLVENDA || 0);
      const metaPos = Number(item.QTMETACLIPOS || 0);
      const realPos = Number(item.QTCLIPOS_PED || 0);
      const fatPos = Number(item.QTCLIPOS_FAT || 0);

      const percMeta = metaValor > 0 ? (vlFaturado / metaValor) * 100 : 0;
      const percPos = metaPos > 0 ? (fatPos / metaPos) * 100 : 0;

      return {
        secao: item.SECAO,
        metaValor: moeda(metaValor),
        vlVendido: moeda(vlVendido),
        vlFaturado: moeda(vlFaturado),
        percMeta: percentual(percMeta),
        metaPos: numero(metaPos),
        realPos: numero(realPos),
        fatPos: numero(fatPos),
        percPos: percentual(percPos)
      };
    });

    const totalSecao = montarTotaisSecao(detalhes);

    rowsDetalhes.unshift({
      secao: 'Total',
      metaValor: moeda(totalSecao.metaValor),
      vlVendido: moeda(totalSecao.vlVendido),
      vlFaturado: moeda(totalSecao.vlFaturado),
      percMeta: percentual(
        totalSecao.metaValor > 0
          ? (totalSecao.vlFaturado / totalSecao.metaValor) * 100
          : 0
      ),
      metaPos: numero(totalSecao.metaPos),
      realPos: numero(totalSecao.realPos),
      fatPos: numero(totalSecao.fatPos),
      percPos: percentual(
        totalSecao.metaPos > 0
          ? (totalSecao.fatPos / totalSecao.metaPos) * 100
          : 0
      )
    });

    y = addTable(doc, {
      title: 'REALIZADO POR SEÇÃO',
      startY: y,
      fontSize: 7.5,
      rowHeight: 18,
      headerHeight: 20,
      columns: [
        { label: 'SEÇÃO', key: 'secao', width: 240 },
        { label: 'META VALOR', key: 'metaValor', width: 92, align: 'right' },
        { label: 'VL. VENDIDO', key: 'vlVendido', width: 92, align: 'right' },
        { label: 'VL. FATURADO', key: 'vlFaturado', width: 92, align: 'right' },
        { label: '% REAL. META', key: 'percMeta', width: 72, align: 'right' },
        { label: 'META POS.', key: 'metaPos', width: 62, align: 'right' },
        { label: 'REAL.POS.', key: 'realPos', width: 62, align: 'right' },
        { label: 'FAT.POS.', key: 'fatPos', width: 62, align: 'right' },
        { label: '% REAL.POS.', key: 'percPos', width: 72, align: 'right' }
      ],
      rows: rowsDetalhes
    });

    // FAIXAS 70 / 80 / 90
    const total7090 = montarFaixas7090(totalSecao.metaValor, totalSecao.vlFaturado);

    const rows7090 = detalhes.map((item) => {
      const fx = montarFaixas7090(item.VLMETA, item.VLVENDA);
      return {
        secao: item.SECAO,
        metaValor: moeda(fx.metaValor),
        vlFaturado: moeda(fx.vlFaturado),
        v70: moeda(fx.v70),
        v80: moeda(fx.v80),
        v90: moeda(fx.v90),
        f70: moeda(fx.f70),
        f80: moeda(fx.f80),
        f90: moeda(fx.f90)
      };
    });

    rows7090.unshift({
      secao: 'Total',
      metaValor: moeda(total7090.metaValor),
      vlFaturado: moeda(total7090.vlFaturado),
      v70: moeda(total7090.v70),
      v80: moeda(total7090.v80),
      v90: moeda(total7090.v90),
      f70: moeda(total7090.f70),
      f80: moeda(total7090.f80),
      f90: moeda(total7090.f90)
    });

    y = addTable(doc, {
      title: 'O QUE FALTA PARA TER CADA MARCA? VEJA ABAIXO',
      startY: y,
      fontSize: 7.5,
      rowHeight: 18,
      headerHeight: 20,
      columns: [
        { label: 'SEÇÃO', key: 'secao', width: 240 },
        { label: 'META VALOR', key: 'metaValor', width: 92, align: 'right' },
        { label: 'VL. FATURADO', key: 'vlFaturado', width: 92, align: 'right' },
        { label: '70%', key: 'v70', width: 88, align: 'right' },
        { label: '80%', key: 'v80', width: 88, align: 'right' },
        { label: '90%', key: 'v90', width: 88, align: 'right' },
        { label: 'FALTA P/70%', key: 'f70', width: 96, align: 'right' },
        { label: 'FALTA P/80%', key: 'f80', width: 96, align: 'right' },
        { label: 'FALTA P/90%', key: 'f90', width: 96, align: 'right' }
      ],
      rows: rows7090
    });

    // FAIXAS 100 / 110 / 120
    const total100120 = montarFaixas100120(totalSecao.metaValor, totalSecao.vlFaturado);

    const rows100120 = detalhes.map((item) => {
      const fx = montarFaixas100120(item.VLMETA, item.VLVENDA);
      return {
        secao: item.SECAO,
        metaValor: moeda(fx.metaValor),
        vlFaturado: moeda(fx.vlFaturado),
        v100: moeda(fx.v100),
        v110: moeda(fx.v110),
        v120: moeda(fx.v120),
        f100: moeda(fx.f100),
        f110: moeda(fx.f110),
        f120: moeda(fx.f120)
      };
    });

    rows100120.unshift({
      secao: 'Total',
      metaValor: moeda(total100120.metaValor),
      vlFaturado: moeda(total100120.vlFaturado),
      v100: moeda(total100120.v100),
      v110: moeda(total100120.v110),
      v120: moeda(total100120.v120),
      f100: moeda(total100120.f100),
      f110: moeda(total100120.f110),
      f120: moeda(total100120.f120)
    });

    y = addTable(doc, {
      title: 'FAIXAS DE 100% / 110% / 120%',
      startY: y,
      fontSize: 7.5,
      rowHeight: 18,
      headerHeight: 20,
      columns: [
        { label: 'SEÇÃO', key: 'secao', width: 240 },
        { label: 'META VALOR', key: 'metaValor', width: 92, align: 'right' },
        { label: 'VL. FATURADO', key: 'vlFaturado', width: 92, align: 'right' },
        { label: '100%', key: 'v100', width: 88, align: 'right' },
        { label: '110%', key: 'v110', width: 88, align: 'right' },
        { label: '120%', key: 'v120', width: 88, align: 'right' },
        { label: 'FALTA P/100%', key: 'f100', width: 96, align: 'right' },
        { label: 'FALTA P/110%', key: 'f110', width: 96, align: 'right' },
        { label: 'FALTA P/120%', key: 'f120', width: 96, align: 'right' }
      ],
      rows: rows100120
    });

    const totalPositivacao = detalhes.reduce(
  (acc, item) => {
    acc.metaPos += Number(item.QTMETACLIPOS || 0);
    return acc;
  },
  { metaPos: 0 }
);



function montarFaixasPositivacao(metaPos) {
  const meta = Number(metaPos || 0);

  return {
    metaPos,
    p0a69: Math.round(meta * 0.60),
    p70a79: Math.round(meta * 0.70),
    p80a89: Math.round(meta * 0.80),
    p90a99: Math.round(meta * 0.90),
    p100a109: Math.round(meta * 1.00),
    p110a119: Math.round(meta * 1.10),
    pAcima120: Math.round(meta * 1.20)
  };
}

const totalPosFaixas = montarFaixasPositivacao(totalPositivacao.metaPos);
const rowsPositivacao = detalhes.map((item) => {
  const fx = montarFaixasPositivacao(item.QTMETACLIPOS);

  return {
    secao: item.SECAO,
    metaPos: numero(item.QTMETACLIPOS || 0),
    p0a69: numero(fx.p0a69),
    p70a79: numero(fx.p70a79),
    p80a89: numero(fx.p80a89),
    p90a99: numero(fx.p90a99),
    p100a109: numero(fx.p100a109),
    p110a119: numero(fx.p110a119),
    pAcima120: numero(fx.pAcima120)
  };
});

rowsPositivacao.unshift({
  secao: 'Total',
  metaPos: numero(totalPositivacao.metaPos),
  p0a69: numero(totalPosFaixas.p0a69),
  p70a79: numero(totalPosFaixas.p70a79),
  p80a89: numero(totalPosFaixas.p80a89),
  p90a99: numero(totalPosFaixas.p90a99),
  p100a109: numero(totalPosFaixas.p100a109),
  p110a119: numero(totalPosFaixas.p110a119),
  pAcima120: numero(totalPosFaixas.pAcima120)
});

    y = addTable(doc, {
  title: 'POSITIVAÇÃO',
  startY: y,
  fontSize: 7.5,
  rowHeight: 18,
  headerHeight: 20,
  columns: [
    { label: 'SEÇÃO', key: 'secao', width: 240 },
    { label: 'META POSITIVAÇÃO', key: 'metaPos', width: 120, align: 'right' },
    { label: '0 A 69%', key: 'p0a69', width: 86, align: 'right' },
    { label: '70 A 79%', key: 'p70a79', width: 86, align: 'right' },
    { label: '80 A 89%', key: 'p80a89', width: 86, align: 'right' },
    { label: '90 A 99%', key: 'p90a99', width: 86, align: 'right' },
    { label: '100 A 109%', key: 'p100a109', width: 92, align: 'right' },
    { label: '110 A 119%', key: 'p110a119', width: 92, align: 'right' },
    { label: 'ACIMA DE 120%', key: 'pAcima120', width: 96, align: 'right' }
  ],
  rows: rowsPositivacao
});

    doc.end();

    stream.on('finish', () => resolve({ outputPath, filename }));
    stream.on('error', reject);
  });
}

module.exports = {
  gerarPdfRaioX
};