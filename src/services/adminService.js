const { mysql } = require('../config/env');
const { getMySQL } = require('../config/mysql');
const SQL = require('../db/mysqlAdminSQL');
const bcrypt = require('bcryptjs');

async function listarUsuarios() {
    const mysql = getMySQL();
    const [rows] = await mysql.execute(SQL.listarUsuarios);
    return rows;
}

async function buscarUsuarioPorId(id) {
    const mysql = getMySQL();
    const [rows] = await mysql.execute(SQL.buscarUsuarioPorId, [id]);
    return rows[0] || null;    
}

async function salvarUsuario(dados) {
    const mysql = getMySQL();

    if(dados.id){
        await mysql.execute(SQL.atualizarUsuario,[
            dados.telegram_user_id,
            dados.telegram_chat_id,
            dados.nome,
            dados.codusur || null,
            dados.codsupervisor || null,
            dados.ativo,
            dados.perfil || null,
            dados.id
        ]);
        return;
    }

    await mysql.execute(SQL.inserirUsuario,[
            dados.telegram_user_id,
            dados.telegram_chat_id,
            dados.nome,
            dados.codusur || null,
            dados.codsupervisor || null,
            dados.ativo,
            dados.perfil || null,
            dados.id
        ]);
};

async function listarOpcoes() {
    const mysql = getMySQL();
    const [rows] = await mysql.execute(SQL.listarOpcoes);
    return rows;
}

async function buscarOpcaoPorId(id) {
    const mysql = getMySQL();
    const [rows] = await mysql.execute(SQL.buscarOpcaoPorId, [id]);
    return rows[0] || null;
}

async function buscarPermissaoExistente(usuarioId, opcaoId) {
  const mysql = getMySQL();
  const [rows] = await mysql.execute(
    SQL.buscarPermissaoExistente,
    [usuarioId, opcaoId]
  );

  return rows[0] || null;
}

async function salvarOpcao(dados) {
  const mysql = getMySQL();
  const id = dados.id || null;
  const codigo = dados.codigo || '';
  const nome = dados.nome || '';
  const descricao = dados.descricao ?? null;
  const ativo = dados.ativo || 'S';

  if (id) {
    await mysql.execute(SQL.atualizarOpcao, [
      codigo,
      nome,
      descricao,
      ativo,
      id
    ]);
    return;
  }

  await mysql.execute(SQL.inserirOpcao, [
    codigo,
    nome,
    descricao,
    ativo
  ]);
}

async function listarPermissoes() {
  const mysql = getMySQL();
  const [rows] = await mysql.execute(SQL.listarPermissoes);
  return rows;
}

async function listarUsuariosSimples() {
  const mysql = getMySQL();
  const [rows] = await mysql.execute(SQL.listarUsuariosSimples);
  return rows;
}

async function listarOpcoesSimples() {
  const mysql = getMySQL();
  const [rows] = await mysql.execute(SQL.listarOpcoesSimples);
  return rows;
}

async function listarPermissoesPorUsuario(usuarioId) {
  const mysql = getMySQL();
  const [rows] = await mysql.execute(SQL.listarPermissoesPorUsuario, [usuarioId]);
  return rows;
}

async function listarOpcoesDisponiveisPorUsuario(usuarioId) {
  const mysql = getMySQL();

  console.log('usuarioId:', usuarioId);
  console.log('SQL listarOpcoesDisponiveisPorUsuario:', SQL.listarOpcoesDisponiveisPorUsuario);


  const [rows] = await mysql.execute(
    SQL.listarOpcoesDisponiveisPorUsuario,
    [usuarioId]
  );
  return rows;
}

async function adicionarPermissao({usuario_id, opcao_id, ativo = 'S'}) {
  const mysql = getMySQL();
  await mysql.execute(SQL.inserirPermissao, [usuario_id, opcao_id, ativo]);
}

async function removerPermissao(id) {
  const mysql = getMySQL();
  await mysql.execute(SQL.excluirPermissao, [id]);
}

function formatarDataBR(data) {
  if (!data) return '';

  const d = new Date(data);

  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();

  const hora = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const seg = String(d.getSeconds()).padStart(2, '0');

  return `${dia}/${mes}/${ano} ${hora}:${min}:${seg}`;
}

async function listarLogs() {
  const mysql = getMySQL();
  const [rows] = await mysql.execute(SQL.listarLogs);
  
  return rows.map(log => ({
    ...log,
    dt_log_formatado: formatarDataBR(log.dt_log)
  }));
}

async function listarUsuariosAdmin() {
  const mysql = getMySQL();
  const [rows] = await mysql.execute(SQL.listarUsuariosAdmin);
  return rows;
}

async function buscarUsuarioAdminPorId(id) {
  const mysql = getMySQL();
  const [rows] = await mysql.execute(SQL.buscarUsuarioAdminPorId, [id]);
  return rows[0] || null;
}

async function buscarUsuarioAdminPorEmail(email) {
  const mysql = getMySQL();
  const [rows] = await mysql.execute(SQL.buscarUsuarioAdminPorEmail, [email]);
  return rows[0] || null;
}

async function salvarUsuarioAdmin(dados) {
  const mysql = getMySQL();

  const id = dados.id || null;
  const nome = (dados.nome || '').trim();
  const email = (dados.email || '').trim().toLowerCase();
  const senha = dados.senha || '';
  const status = String(dados.status || '1');

  if (!nome || !email) {
    throw new Error('Nome e e-mail são obrigatórios.');
  }

  if (id) {
    await mysql.execute(SQL.atualizarUsuarioAdmin, [
      nome,
      email,
      status,
      id
    ]);

    if (senha && senha.trim()) {
      const senhaHash = await bcrypt.hash(senha, 10);
      await mysql.execute(SQL.atualizarSenhaUsuarioAdmin, [
        senhaHash,
        id
      ]);
    }

    return id;
  }

  if (!senha || !senha.trim()) {
    throw new Error('Senha é obrigatória para novo usuário admin.');
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const [result] = await mysql.execute(SQL.inserirUsuarioAdmin, [
    nome,
    email,
    senhaHash,
    status
  ]);

  return result.insertId;
}

async function registrarLogAdmin({
  admin,
  acao,
  tabelaAfetada,
  registroId,
  descricao,
  dadosAnteriores,
  dadosNovos,
  ip,
  userAgent
}) {
  const mysql = getMySQL();

  await mysql.execute(`
    INSERT INTO logs_admin_bot
      (admin_id, acao, tabela_afetada, registro_id, descricao, dados_anteriores, dados_novos, ip, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    admin?.id || null,
    admin?.nome || null,
    acao,
    tabelaAfetada,
    registroId,
    descricao,
    JSON.stringify(dadosAnteriores || {}),
    JSON.stringify(dadosNovos || {}),
    ip || null,
    userAgent || null
  ]);
}

module.exports = {
  listarUsuarios,
  buscarUsuarioPorId,
  salvarUsuario,
  listarOpcoes,
  buscarOpcaoPorId,
  buscarPermissaoExistente,
  salvarOpcao,
  listarPermissoes,
  listarUsuariosSimples,
  listarOpcoesSimples,
  listarOpcoesDisponiveisPorUsuario,
  listarPermissoesPorUsuario,
  adicionarPermissao,
  removerPermissao,
  listarLogs,
  listarUsuariosAdmin,
  buscarUsuarioAdminPorId,
  buscarUsuarioAdminPorEmail,
  salvarUsuarioAdmin,
  registrarLogAdmin
};