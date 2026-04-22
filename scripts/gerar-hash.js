const bcrypt = require('bcrypt');

async function main() {
  const senha = process.argv[2];

  if (!senha) {
    console.error('Use: node scripts/gerar-hash.js SUA_SENHA');
    process.exit(1);
  }

  try {
    const hash = await bcrypt.hash(senha, 10);
    console.log('\nHash gerado:\n');
    console.log(hash);
    process.exit(0);
  } catch (error) {
    console.error('Erro ao gerar hash:', error.message);
    process.exit(1);
  }
}

main();