const MYSQL_ADMIN_LOG_SQL = {
  inserirLogAdmin: `
    INSERT INTO logs_admin_bot (
      admin_id,
      admin_nome,
      acao,
      tabela_afetada,
      registro_id,
      descricao,
      dados_anteriores,
      dados_novos,
      ip,
      user_agent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,

  listarLogsAdmin: `
    SELECT
      id,
      admin_id,
      admin_nome,
      acao,
      tabela_afetada,
      registro_id,
      descricao,
      dados_anteriores,
      dados_novos,
      ip,
      user_agent,
      dt_log
    FROM logs_admin_bot
    ORDER BY dt_log DESC
    LIMIT 500
  `
};

module.exports = MYSQL_ADMIN_LOG_SQL;