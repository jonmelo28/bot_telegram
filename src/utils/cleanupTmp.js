const fs = require('fs');
const path = require('path');

const TMP_DIR = path.resolve(__dirname, '../../tmp');

// tempo limite (ex: 1 hora)
const MAX_AGE_MS = 60 * 60 * 1000;

function limparArquivosTmp() {
  try {
    if (!fs.existsSync(TMP_DIR)) return;

    const agora = Date.now();

    fs.readdirSync(TMP_DIR).forEach((file) => {
      const filePath = path.join(TMP_DIR, file);
      const stat = fs.statSync(filePath);

      const idade = agora - stat.mtimeMs;

      if (idade > MAX_AGE_MS) {
        fs.unlinkSync(filePath);
        console.log(`🧹 Removido: ${file}`);
      }
    });

  } catch (err) {
    console.error('Erro ao limpar tmp:', err);
  }
}

module.exports = {
  limparArquivosTmp
};