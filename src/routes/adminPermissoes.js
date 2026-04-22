const express = require('express');
const router = express.Router();
const { registrarLogAdmin } = require('../services/adminAuditService');
const {
  listarPermissoes,
  listarUsuariosSimples,
  listarPermissoesPorUsuario,
  listarOpcoesDisponiveisPorUsuario,
  adicionarPermissao,
  buscarPermissaoExistente,
  removerPermissao
} = require('../services/adminService');

router.get('/', async (req, res) => {
  const usuarioSelecionado = req.query.usuario_id || '';
  const permissoes = await listarPermissoes();
  const usuarios = await listarUsuariosSimples();
  let opcoes = [];

    if (usuarioSelecionado) {
    opcoes = await listarOpcoesDisponiveisPorUsuario(usuarioSelecionado);
  }

  res.render('admin/permissoes/index', {
    permissoes,
    usuarios,
    opcoes,
    usuarioSelecionado,
    erro: null,
    sucesso: null
  });
});

router.post('/adicionar', async (req, res) => {
  const usuarioId = Number(req.body.usuario_id);
  const opcaoId = Number(req.body.opcao_id);
  const ativo = 'S';

  const permissaoExistente = await buscarPermissaoExistente(usuarioId, opcaoId);

  if (permissaoExistente) {
    return res.render('admin/permissoes/index', {
      erro: 'Esse usuário já possui essa permissão cadastrada.',
      sucesso: null,
      permissoes: await listarPermissoes(),
      usuarios: await listarUsuariosSimples(),
      opcoes: await listarOpcoesDisponiveisPorUsuario(usuarioId),
      usuarioSelecionado: usuarioId
    });
  }


  await adicionarPermissao({usuario_id: usuarioId, opcao_id: opcaoId, ativo});

  await registrarLogAdmin({
    admin: req.admin,
    acao: 'ADICIONAR_PERMISSAO_BOT',
    tabelaAfetada: 'permissoes_bot',
    registroId: null,
    descricao: `Admin adicionou permissão. Usuario ${usuarioId}, opção ${opcaoId}`,
    dadosAnteriores: null,
    dadosNovos: {
      usuario_id: usuarioId,
      opcao_id: opcaoId,
      ativo
    },
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  res.redirect('/admin/permissoes');
});

router.post('/:id/excluir', async (req, res) => {
  await removerPermissao(req.params.id);

  await registrarLogAdmin({
    admin: req.admin,
    acao: 'EXCLUIR_PERMISSAO_BOT',
    tabelaAfetada: 'permissoes_bot',
    registroId: req.params.id,
    descricao: `Admin removeu a permissão ${req.params.id}`,
    dadosAnteriores: { id: req.params.id },
    dadosNovos: null,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  res.redirect('/admin/permissoes');
});

module.exports = router;