const fs = require('fs');
const PDFDocument = require('pdfkit');
const env = require('../config/env');
const { formatCurrency, formatInteger, formatDate } = require('../utils/formatter');
const { buildTmpFilePath } = require('../utils/file');

function addHeader(doc, titulo, usuario) {
  doc.fontSize(16).text(env.empresaNome, { align: 'center' });
  doc.fontSize(12).text(env.empresaTituloRelatorio, { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(14).text(titulo, { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).text(`Usuário: ${usuario.nome}`);
  doc.text(`Gerado em: ${formatDate(new Date())}`);
  doc.moveDown();
}

function addTableLine(doc, columns) {
  doc.fontSize(10).text(columns.join(' | '));
  doc.moveDown(0.4);
}

function gerarPdfRelatorio(usuario, relatorio) {
  return new Promise((resolve, reject) => {
    const filename = `relatorio_${relatorio.tipo}_${Date.now()}.pdf`;
    const outputPath = buildTmpFilePath(filename);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const stream = fs.createWriteStream(outputPath);

    doc.pipe(stream);

    addHeader(doc, relatorio.titulo, usuario);

    if (!relatorio.rows || relatorio.rows.length === 0) {
      doc.fontSize(12).text('Nenhum dado encontrado para este relatório.');
    } else if (relatorio.tipo === 'INADIMPLENCIA') {
      addTableLine(doc, ['Cliente', 'Vendedor', 'Valor em aberto', 'Maior atraso']);
      doc.moveDown(0.3);

      let total = 0;
      for (const row of relatorio.rows) {
        total += Number(row.VALOR_ABERTO || 0);
        addTableLine(doc, [
          `${row.CODCLI} - ${row.CLIENTE}`,
          row.NOMEVENDEDOR || '-',
          formatCurrency(row.VALOR_ABERTO),
          `${formatInteger(row.MAIOR_ATRASO)} dias`
        ]);
      }

      doc.moveDown();
      doc.fontSize(12).text(`Total em aberto: ${formatCurrency(total)}`);
    } else {
      addTableLine(doc, ['Código', 'Vendedor', 'Pedidos', 'Venda']);
      doc.moveDown(0.3);

      let totalVenda = 0;
      let totalPedidos = 0;

      for (const row of relatorio.rows) {
        totalVenda += Number(row.VLVENDA || 0);
        totalPedidos += Number(row.QTPEDIDOS || 0);

        addTableLine(doc, [
          String(row.CODUSUR || ''),
          row.VENDEDOR || '-',
          formatInteger(row.QTPEDIDOS),
          formatCurrency(row.VLVENDA)
        ]);
      }

      doc.moveDown();
      doc.fontSize(12).text(`Total de pedidos: ${formatInteger(totalPedidos)}`);
      doc.fontSize(12).text(`Total vendido: ${formatCurrency(totalVenda)}`);
    }

    doc.end();

    stream.on('finish', () => resolve({ outputPath, filename }));
    stream.on('error', reject);
  });
}

module.exports = {
  gerarPdfRelatorio
};