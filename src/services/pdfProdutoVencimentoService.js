const fs = require('fs');
const PDFDocument = require('pdfkit');
const { buildTmpFilePath } = require('../utils/file');

function numero(valor) {
  return Number(valor || 0).toLocaleString('pt-BR');
}

function formatarData(data) {
  if (!data) return '';
  const dt = new Date(data);
  return dt.toLocaleDateString('pt-BR');
}

function addTable(doc, rows, startY) {
  let y = startY;
  const startX = doc.page.margins.left;
  const azul = '#0B2E59';
  const laranja = '#FFA500';
  const cinza = '#F2F2F2';
  const branco = '#FFFFFF';
  const preto = '#000000';

  const columns = [
    { key: 'CODPROD', label: 'CÓDIGO', width: 60 },
    { key: 'DESCRICAO', label: 'DESCRIÇÃO', width: 250 },
    { key: 'CODFORNEC', label: 'COD. FORN', width: 70 },
    { key: 'FORNECEDOR', label: 'FORNECEDOR', width: 170 },
    { key: 'QT', label: 'QT', width: 55, align: 'right' },
    { key: 'DTVAL_FMT', label: 'DT. VAL', width: 70, align: 'center' },
    { key: 'DIAS_PARA_VENCER', label: 'DIAS', width: 55, align: 'right' },
    { key: 'STATUS_VENCIMENTO', label: 'STATUS', width: 150 }
  ];

  const rowHeight = 18;
  const headerHeight = 24;

  const drawHeader = () => {
    let x = startX;

    doc.font('Helvetica-Bold').fontSize(7);

    columns.forEach((col) => {
      doc.save();
      doc.rect(x, y, col.width, headerHeight).fill(azul);
      doc.restore();

      doc.rect(x, y, col.width, headerHeight).stroke();

      doc.fillColor(laranja).text(col.label, x + 3, y + 7, {
        width: col.width - 6,
        align: col.align || 'left'
      });

      x += col.width;
    });

    y += headerHeight;
  };

  drawHeader();

  rows.forEach((row, index) => {
    if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.page.margins.top;
      drawHeader();
    }

    let x = startX;
    const bgColor = index % 2 === 0 ? branco : cinza;

    columns.forEach((col) => {
      const valor = row[col.key] == null ? '' : String(row[col.key]);

      doc.save();
      doc.rect(x, y, col.width, rowHeight).fill(bgColor);
      doc.restore();

      doc.rect(x, y, col.width, rowHeight).stroke();

      doc.fillColor(preto).font('Helvetica').fontSize(7).text(valor, x + 3, y + 5, {
        width: col.width - 6,
        align: col.align || 'left',
        ellipsis: true
      });

      x += col.width;
    });

    y += rowHeight;
  });

  return y;
}

function gerarPdfProdutoVencimento({ usuario, dados }) {
  return new Promise((resolve, reject) => {
    const filename = `produto_vencimento_${Date.now()}.pdf`;
    const outputPath = buildTmpFilePath(filename);

    const doc = new PDFDocument({
      margin: 24,
      size: 'A4',
      layout: 'landscape'
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    const rows = (dados || []).map((item) => ({
      ...item,
      DTVAL_FMT: formatarData(item.DTVAL),
      QT: numero(item.QT),
      DIAS_PARA_VENCER: numero(item.DIAS_PARA_VENCER)
    }));

    doc.font('Helvetica-Bold').fontSize(16).text('RELATÓRIO PRODUTOS PRÓXIMOS DO VENCIMENTO', {
      align: 'center'
    });

    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(9);
    doc.text(`Solicitado por: ${usuario.nome || 'Usuário'}`, 24, 52);
    doc.text(`Emissão: ${new Date().toLocaleString('pt-BR')}`, 24, 66);
    doc.text(`Quantidade de registros: ${rows.length}`, 24, 80);

    addTable(doc, rows, 105);

    doc.end();

    stream.on('finish', () => resolve({ outputPath, filename }));
    stream.on('error', reject);
  });
}

module.exports = {
  gerarPdfProdutoVencimento
};