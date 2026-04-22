const MYSQL_SQL = require('../db/mysqlSql');
const { getMySQL } = require('../config/mysql');

async function buscarUsuarioPorTelegram(telegramUserId, chatId) {
  const mysql = getMySQL();

  const [rows] = await mysql.execute(
    MYSQL_SQL.buscarUsuarioTelegram,
    [String(telegramUserId)]
  ) 

  const usuario = rows[0] || null;

  if(usuario && String(usuario.telegram_chat_id || '')  !== String(chatId || '')){
    await mysql.execute(MYSQL_SQL.atualizarChatId, [String(chatId), usuario.id]);
    usuario.telegram_chat_id = String(chatId);
  }

  return usuario;
}

async function buscarPermissoes(usuarioId) {
 const mysql = getMySQL();
 
 const [rows] = await mysql.execute(MYSQL_SQL.buscarPermissoesUsuario, [usuarioId]);
 return rows || [];

}

async function usuarioTemPermissao(usuarioId, codigoOpcao) {
 const mysql = getMySQL();

 const [rows] = await mysql.execute(MYSQL_SQL.validarPermissao, [usuarioId, codigoOpcao]);
 return rows.length > 0;
}

async function registrarlog(usuario, opcao, statusExecucao, mensagem){
  const mysql = getMySQL();
  await mysql.execute(MYSQL_SQL.inserirLog,[
    usuario?.id || null,
    String(usuario?.telegram_user_id || ''),
    opcao,
    statusExecucao,
    mensagem
  ]);
}

module.exports = {
  buscarUsuarioPorTelegram,
  buscarPermissoes,
  usuarioTemPermissao,
  registrarlog
};