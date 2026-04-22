🚀 Bot Telegram com Relatórios PDF (MySQL + Oracle)








Sistema completo de bot para Telegram com:

📊 Geração de relatórios em PDF
🤖 Integração com Telegram via Webhook
🔐 Painel administrativo com autenticação
🗄️ Controle de usuários e permissões (MySQL)
📈 Consultas de dados corporativos (Oracle)
📸 Preview

💡 (Opcional: você pode adicionar prints do sistema aqui depois)

🧱 Arquitetura
bot_telegram/
├─ scripts/
├─ src/
│  ├─ app.js
│  ├─ config/
│  ├─ db/
│  ├─ routes/
│  ├─ services/
│  ├─ utils/
│  └─ views/
├─ .env.example
├─ package.json
⚙️ Tecnologias
Node.js
Express
MySQL (mysql2)
Oracle (oracledb)
PDFKit
EJS
JWT
Bcrypt
Axios
🚀 Instalação
1. Clonar o projeto
git clone https://github.com/jonmelo28/bot_telegram.git
cd bot_telegram
2. Instalar dependências
npm install
🔑 Configuração do .env
📌 Passo 1 — Criar arquivo

Copie o arquivo de exemplo:

cp .env.example .env

Ou renomeie manualmente:

.env.example → .env
📌 Passo 2 — Configurar variáveis
PORT=3000

# Telegram
TELEGRAM_BOT_TOKEN=SEU_TOKEN
APP_BASE_URL=https://seu-dominio.com

# MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=123456
MYSQL_DATABASE=bot_telegram

# Oracle
DB_USER=usuario
DB_PASSWORD=senha
DB_CONNECT_STRING=host:1521/servico

# Segurança
JWT_SECRET=segredo_super_forte
🗄️ Banco de Dados MySQL
📌 Criar banco
CREATE DATABASE bot_telegram;
📌 Criar tabelas
CREATE TABLE usuarios_bot (
    id INT AUTO_INCREMENT PRIMARY KEY,
    telegram_user_id VARCHAR(50) UNIQUE,
    telegram_chat_id VARCHAR(50),
    nome VARCHAR(150),
    codusur INT,
    codsupervisor INT,
    perfil VARCHAR(50),
    ativo CHAR(1) DEFAULT 'S',
    dt_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE opcoes_bot (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE,
    nome VARCHAR(100),
    descricao VARCHAR(255),
    ativo CHAR(1) DEFAULT 'S'
);

CREATE TABLE permissoes_bot (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    opcao_id INT,
    ativo CHAR(1) DEFAULT 'S'
);

CREATE TABLE logs_bot (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    opcao VARCHAR(100),
    status_execucao VARCHAR(50),
    mensagem TEXT,
    dt_log TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuarios_adm_bot (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150),
    email VARCHAR(150),
    senha VARCHAR(255),
    status TINYINT DEFAULT 1
);

CREATE TABLE logs_admin_bot (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_nome VARCHAR(150),
    acao VARCHAR(100),
    descricao TEXT,
    dt_log TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
🔐 Criar usuário administrador
1. Gerar senha criptografada
node scripts/gerar-hash.js suaSenha
2. Inserir no banco
INSERT INTO usuarios_adm_bot (nome, email, senha)
VALUES ('Admin', 'admin@email.com', 'HASH_GERADO');
🤖 Configuração do Telegram
📌 Criar bot
Acesse o Telegram
Procure por BotFather
Use o comando:
/newbot
Copie o token gerado
📌 Configurar webhook

O sistema registra automaticamente:

https://seu-dominio.com/telegram/webhook
▶️ Rodando o projeto
Desenvolvimento
npm run dev
Produção
npm start
🔑 Acesso ao sistema

Painel administrativo:

http://localhost:3000/admin/login
📊 Funcionalidades do Bot
Relatório do dia
Relatório do mês
Inadimplência
Raio X
Venda por cidade
Produtos próximos do vencimento
🔐 Controle de acesso

O bot só funciona se o usuário:

✔ estiver cadastrado no banco
✔ estiver ativo
✔ tiver permissões vinculadas

⚠️ Problemas comuns
❌ Bot não responde
Verifique webhook
Verifique token

❌ Erro MySQL
Confirme .env
Confirme banco criado

❌ Erro Oracle
Verifique DB_CONNECT_STRING
Verifique Instant Client

🔒 Segurança
❌ Nunca subir .env no GitHub
🔑 Use senha forte no JWT

🔄 Troque tokens se expostos
📌 Melhorias futuras
Dashboard com gráficos
Logs em tempo real
Cache de consultas
Multi-empresa

👨‍💻 Autor
Jonatha de Souza Melo Melo

⭐ Contribuição

Sinta-se à vontade para abrir PR ou Issue 🚀