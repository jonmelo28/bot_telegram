const MYSQL_ADMIN_SQL = {
    listarUsuarios:`
    SELECT 
    id,
     telegram_user_id,
      telegram_chat_id,
      nome,
      codusur,
      codsupervisor,
      ativo,
      perfil,
      dt_cadastro
    FROM usuarios_bot
    ORDER BY nome
    `,

    buscarUsuarioPorId: `
    SELECT
      id,
      telegram_user_id,
      telegram_chat_id,
      nome,
      codusur,
      codsupervisor,
      ativo,
      perfil
    FROM usuarios_bot
    WHERE id = ?
    LIMIT 1
    `,

    inserirUsuario: `
    INSERT INTO usuarios_bot
      (telegram_user_id, telegram_chat_id, nome, codusur, codsupervisor, ativo, perfil)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,

    atualizarUsuario: `
    UPDATE usuarios_bot
       SET telegram_user_id = ?,
           telegram_chat_id = ?,
           nome = ?,
           codusur = ?,
           codsupervisor = ?,
           ativo = ?,
           perfil = ?
     WHERE id = ?
    `,

    listarUsuariosSimples: `
    SELECT id, nome
    FROM usuarios_bot
    WHERE ativo = 'S'
    ORDER BY nome
    `,

     listarOpcoes: `
    SELECT
      id,
      codigo,
      nome,
      descricao,
      ativo
    FROM opcoes_bot
    ORDER BY nome
  `,

  buscarOpcaoPorId: `
    SELECT
      id,
      codigo,
      nome,
      descricao,
      ativo
    FROM opcoes_bot
    WHERE id = ?
    LIMIT 1
  `,

  inserirOpcao: `
    INSERT INTO opcoes_bot
      (codigo, nome, descricao, ativo)
    VALUES (?, ?, ?, ?)
  `,

  atualizarOpcao: `
    UPDATE opcoes_bot
       SET codigo = ?,
           nome = ?,
           descricao = ?,
           ativo = ?
     WHERE id = ?
  `,
  
  listarOpcoesSimples: `
    SELECT id, codigo, nome
    FROM opcoes_bot
    WHERE ativo = 'S'
    ORDER BY nome
  `,

    listarPermissoes: `
    SELECT
      p.id,
      p.usuario_id,
      p.opcao_id,
      p.ativo,
      u.nome AS usuario_nome,
      o.codigo AS opcao_codigo,
      o.nome AS opcao_nome
    FROM permissoes_bot p
    JOIN usuarios_bot u ON u.id = p.usuario_id
    JOIN opcoes_bot o ON o.id = p.opcao_id
    ORDER BY u.nome, o.nome
  `,

  buscarPermissaoExistente: `
  SELECT id, usuario_id, opcao_id, ativo
  FROM permissoes_bot
  WHERE usuario_id = ?
    AND opcao_id = ?
  LIMIT 1
`,

  inserirPermissao: `
    INSERT INTO permissoes_bot
      (usuario_id, opcao_id, ativo)
    VALUES (?, ?, ?)
  `,

  listarOpcoesDisponiveisPorUsuario: `
  SELECT o.id, o.codigo, o.nome
  FROM opcoes_bot o
  WHERE o.ativo = 'S'
    AND NOT EXISTS (
      SELECT 1
      FROM permissoes_bot p
      WHERE p.opcao_id = o.id
        AND p.usuario_id = ?
    )
  ORDER BY o.nome
`,

  excluirPermissao: `
    DELETE FROM permissoes_bot
    WHERE id = ?
  `,

    listarLogs: `
    SELECT
      l.id,
      l.telegram_user_id,
      l.opcao,
      l.status_execucao,
      l.mensagem,
      l.dt_log,
      u.nome
    FROM logs_bot l
    LEFT JOIN usuarios_bot u ON u.id = l.usuario_id
    ORDER BY l.dt_log DESC
    LIMIT 300
    `
};

module.exports = MYSQL_ADMIN_SQL;
