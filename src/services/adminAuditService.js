const { getMySQL } = require('../config/mysql');
const SQL = require('../db/mysqlAdminLogSql');

async function registrarLogAdmin({
  admin,
  acao,
  tabelaAfetada,
  registroId = null,
  descricao = '',
  dadosAnteriores = null,
  dadosNovos = null,
  ip = null,
  userAgent = null
}) {
  const mysql = getMySQL();

  await mysql.execute(SQL.inserirLogAdmin, [
    admin?.id || null,
    admin?.nome || null,
    acao,
    tabelaAfetada,
    registroId ? String(registroId) : null,
    descricao,
    dadosAnteriores ? JSON.stringify(dadosAnteriores) : null,
    dadosNovos ? JSON.stringify(dadosNovos) : null,
    ip,
    userAgent
  ]);
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

async function listarLogsAdmin() {
  const mysql = getMySQL();
  const [rows] = await mysql.execute(SQL.listarLogsAdmin);

  return rows.map(log => ({
    ...log,
    dt_log_formatado: formatarDataBR(log.dt_log)
  }));
}

module.exports = {
  registrarLogAdmin,
  listarLogsAdmin
};