const { mysql } = require('../config/env');
const { getMySQL } = require('../config/mysql');
const SQL = require('../db/mysqlAdminSQL');

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
  listarLogs
};