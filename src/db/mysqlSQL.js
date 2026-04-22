const MYSQL_SQL = {
  buscarUsuarioTelegram: `
    SELECT
      id,
      telegram_user_id,
      telegram_chat_id,
      nome,
      codusur,
      codsupervisor,
      perfil,
      ativo
    FROM usuarios_bot
    WHERE telegram_user_id = ?
      AND ativo = 'S'
    LIMIT 1
  `,

  atualizarChatId: `
    UPDATE usuarios_bot
       SET telegram_chat_id = ?
     WHERE id = ?
  `,

  buscarPermissoesUsuario: `
    SELECT
    o.id,
    o.codigo,
    o.nome,
    o.descricao
FROM permissoes_bot p
JOIN opcoes_bot o
  ON o.id = p.opcao_id
WHERE p.usuario_id = ?
  AND p.ativo = 'S'
  AND o.ativo = 'S'
ORDER BY o.nome;
  `,

  validarPermissao: `
    SELECT 1
FROM permissoes_bot p
JOIN opcoes_bot o
  ON o.id = p.opcao_id
WHERE p.usuario_id = ?
  AND o.codigo = ?
  AND p.ativo = 'S'
  AND o.ativo = 'S'
LIMIT 1;
  `,

  inserirLog: `
    INSERT INTO logs_bot
      (usuario_id, telegram_user_id, opcao, status_execucao, mensagem)
    VALUES (?, ?, ?, ?, ?)
  `
};

module.exports = MYSQL_SQL;