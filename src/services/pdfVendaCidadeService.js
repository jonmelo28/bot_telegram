const fs = require('fs');
const PDFDocument = require('pdfkit');
const { buildTmpFilePath } = require('../utils/file');

function moeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function addTable(doc, {
  title,
  matrix,
  startY
}) {
  let y = startY;
  const startX = doc.page.margins.left;
  const azul = '#0B2E59';
  const laranja = '#FFA500';
  const cinza = '#F2F2F2';
  const branco = '#FFFFFF';
  const preto = '#000000';
  const cinzaTotal = '#D9D9D9';

  const baseCols = [
    { key: 'cidade', label: 'CIDADE', width: 120 },
    { key: 'cliente', label: 'CLIENTE', width: 300 },
    ...matrix.colunas.map((c) => ({
      key: c,
      label: c,
      width: 140,
      align: 'right'
    })),
    { key: 'total', label: 'TOTAL', width: 120, align: 'right' }
  ];

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const totalWidth = baseCols.reduce((acc, c) => acc + c.width, 0);
  const scale = totalWidth > pageWidth ? pageWidth / totalWidth : 1;

  const columns = baseCols.map((c) => ({
    ...c,
    width: c.width * scale
  }));

  doc.fillColor(preto).font('Helvetica-Bold').fontSize(11).text(title, startX, y);
  y += 18;

  const minRowHeight = 18;
  const headerHeight = 36;

  const drawHeader = () => {
    let x = startX;
    doc.font('Helvetica-Bold').fontSize(7);

    for (const col of columns) {
      doc.save();
      doc.rect(x, y, col.width, headerHeight).fill(azul);
      doc.restore();

      doc.rect(x, y, col.width, headerHeight).stroke();

      doc.fillColor(laranja).text(col.label, x + 3, y + 10, {
        width: col.width - 6,
        align: col.align || 'left',
        ellipsis: true
      });

      x += col.width;
    }

    y += headerHeight;
  };

  function getRowHeight(row) {
    let maxHeight = minRowHeight;

    for (const col of columns) {
      const valor = row[col.key] == null ? '' : String(row[col.key]);

      const textHeight = doc.heightOfString(valor, {
        width: col.width - 6,
        align: col.align || 'left'
      }) + 10;

      if (textHeight > maxHeight) {
        maxHeight = textHeight;
      }
    }

    return maxHeight;
  }

    const drawRow = (row, bgColor = branco) => {
    const currentRowHeight = getRowHeight(row);

    if (y + currentRowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.page.margins.top;
      drawHeader();
    }

    let x = startX;

    for (const col of columns) {
      const valor = row[col.key] == null ? '' : String(row[col.key]);

      doc.save();
      doc.rect(x, y, col.width, currentRowHeight).fill(bgColor);
      doc.restore();

      doc.rect(x, y, col.width, currentRowHeight).stroke();

      doc.fillColor(preto).font('Helvetica').fontSize(6.5).text(valor, x + 3, y + 5, {
        width: col.width - 6,
        align: col.align || 'left'
      });

      x += col.width;
    }

    y += currentRowHeight;
  };

  drawHeader();

  // LINHA TOTAL GERAL
  const totalGeralRow = {
    cidade: 'Total',
    cliente: 'Total',
    total: moeda(matrix.totalGeral)
  };

  for (const col of matrix.colunas) {
    totalGeralRow[col] = moeda(matrix.totaisColuna[col] || 0);
  }

  drawRow(totalGeralRow, cinzaTotal);

  // CIDADES + CLIENTES
  matrix.cidades.forEach((cidadeObj, cidadeIndex) => {
    const totalCidadeRow = {
      cidade: cidadeObj.cidade,
      cliente: 'Total',
      total: moeda(cidadeObj.total)
    };

    for (const col of matrix.colunas) {
      totalCidadeRow[col] = moeda(cidadeObj.totaisColuna?.[col] || 0);
    }

    drawRow(totalCidadeRow, cinzaTotal);

    cidadeObj.clientes.forEach((clienteObj, clienteIndex) => {
      const row = {
        cidade: clienteObj.cidade,
        cliente: clienteObj.cliente || '',
        total: moeda(clienteObj.total)
      };

      for (const col of matrix.colunas) {
        row[col] = clienteObj.valores[col] ? moeda(clienteObj.valores[col]) : '';
      }

      const bgColor = clienteIndex % 2 === 0 ? branco : cinza;
      drawRow(row, bgColor);
    });
  });

  return y + 12;
}

function gerarPdfVendaCidade({ usuario, dados }) {
  return new Promise((resolve, reject) => {
    const filename = `venda_cidade_${usuario.codusur}_${Date.now()}.pdf`;
    const outputPath = buildTmpFilePath(filename);

    const doc = new PDFDocument({
      margin: 24,
      size: 'A4',
      layout: 'landscape'
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    doc.font('Helvetica-Bold').fontSize(16).text('RELATÓRIO VENDA CIDADE', {
      align: 'center'
    });

    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(9);
    doc.text(`RCA: ${usuario.codusur} - ${usuario.nome}`, 24, 50);
    doc.text(`Emissão: ${new Date().toLocaleString('pt-BR')}`, 24, 64);

    let y = 90;

    y = addTable(doc, {
      title: 'VENDA POR CIDADE X FORNECEDOR',
      matrix: dados.porFornecedor,
      startY: y
    });

    y = addTable(doc, {
      title: 'VENDA POR CIDADE X SEÇÃO',
      matrix: dados.porSecao,
      startY: y
    });

    doc.end();

    stream.on('finish', () => resolve({ outputPath, filename }));
    stream.on('error', reject);
  });
}

module.exports = {
  gerarPdfVendaCidade
};