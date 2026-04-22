require('dotenv').config();

function getEnv(name, fallback = '') {
  return process.env[name] || fallback;
}

module.exports = {
  port: Number(getEnv('PORT', 3000)),
  telegramBotToken: getEnv('TELEGRAM_BOT_TOKEN'),
  telegramWebhookSecret: getEnv('TELEGRAM_WEBHOOK_SECRET'),
  appBaseUrl: getEnv('APP_BASE_URL'),
  empresaNome: getEnv('EMPRESA_NOME', 'JMSYSTEMS'),
  empresaTituloRelatorio: getEnv('EMPRESA_TITULO_RELATORIO', 'Relatórios Comerciais'),
  oracleClientLibDir: getEnv('ORACLE_CLIENT_LIB_DIR'),
  jwtSecret: getEnv('JWT_SECRET'),
  jwtExpiresIn: getEnv('JWT_EXPIRES_IN', '8h'),
  cookieName: getEnv('COOKIE_NAME', 'admin_token'),
  nodeEnv: getEnv('NODE_ENV', 'development'),
  mysql: {
    host: getEnv('MYSQL_HOST', 'localhost'),
    port: Number(getEnv('MYSQL_PORT', 3306)),
    user: getEnv('MYSQL_USER'),
    password: getEnv('MYSQL_PASSWORD'),
    database: getEnv('MYSQL_DATABASE'),
    connectionLimit: Number(getEnv('MYSQL_CONNECTION_LIMIT', 10))
  },
  db: {
    user: getEnv('DB_USER'),
    password: getEnv('DB_PASSWORD'),
    connectString: getEnv('DB_CONNECT_STRING'),
    poolMin: Number(getEnv('DB_POOL_MIN', 1)),
    poolMax: Number(getEnv('DB_POOL_MAX', 5)),
    poolIncrement: Number(getEnv('DB_POOL_INCREMENT', 1))
  }
};