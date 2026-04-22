const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const env = require('./config/env');
const { initOracle, closeOracle, oracledb } = require('./config/oracle');
const {initMySQL, closeMySQL} = require('./config/mysql');

const telegramWebhookRouter = require('./routes/telegramWebhook');
const { setWebhook } = require('./services/telegramService');

const adminJwtAuth = require('./middlewares/adminJwtAuth');
const adminAuthRouter = require('./routes/adminAuth');
const adminUsuariosRouter = require('./routes/adminUsuarios');
const adminOpcoesRouter = require('./routes/adminOpcoes');
const adminPermissoesRouter = require('./routes/adminPermissoes');
const adminLogsRouter = require('./routes/adminLogs');
const adminMenu = require('./config/adminMenu');
const adminLogsAdminRouter = require('./routes/adminlogsAdmin');

async function bootstrap() {
  await initMySQL();
  await initOracle();

  console.log('Modo thin Oracle?', oracledb.thin);

  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  app.use((req, res, next) => {
  res.locals.adminMenu = adminMenu;
  res.locals.currentPath = req.path;
  next();
});

 // app.get('/', (req, res) => {
 //   res.json({ ok: true, app: 'bot-telegram-oracle-pdf' });
 // });

  app.use('/telegram', telegramWebhookRouter);

  app.use('/admin', adminAuthRouter);
  app.use('/admin/usuarios', adminJwtAuth, adminUsuariosRouter);
  app.use('/admin/opcoes', adminJwtAuth, adminOpcoesRouter);
  app.use('/admin/permissoes', adminJwtAuth, adminPermissoesRouter);
  app.use('/admin/logsbot', adminJwtAuth, adminLogsRouter);
  app.use('/admin/logs', adminJwtAuth, adminLogsAdminRouter);


  app.listen(env.port, async () => {
    console.log(`Servidor iniciado na porta ${env.port}`);

    try {
      await setWebhook();
      console.log('Webhook do Telegram configurado com sucesso.');
    } catch (error) {
      console.error('Não foi possível configurar o webhook automaticamente:', error.message);
    }
  });

  async function shutdown(){
    await closeOracle();
    await closeMySQL();
    process.exit(0);
  }

  
  process.on('SIGINT', shutdown);  
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((error) => {
    console.error('Erro ao iniciar aplicação:', error);
    process.exit(1);
});
