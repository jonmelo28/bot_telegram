const express = require('express');
const router = express.Router();
const { registrarLogAdmin } = require('../services/adminAuditService');
const { listarOpcoes, buscarOpcaoPorId, salvarOpcao } = require('../services/adminService');

router.get('/', async (req, res) => {
  const opcoes = await listarOpcoes();
  res.render('admin/opcoes/index', { opcoes });
});

router.get('/nova', async (req, res) => {
  res.render('admin/opcoes/form', { opcao: null });
});

router.get('/:id/editar', async (req, res) => {
  const opcao = await buscarOpcaoPorId(req.params.id);
  res.render('admin/opcoes/form', { opcao });
});

router.post('/salvar', async (req, res) => {
  const payload = {
    id: req.body.id || null,
    codigo: (req.body.codigo || '').trim(),
    nome: (req.body.nome || '').trim(),
    descricao: req.body.descricao ? req.body.descricao.trim() : null,
    ativo: req.body.ativo || 'S'
  };

  const isEdicao = !!payload.id;
  let dadosAnteriores = null;

  if (isEdicao) {
    dadosAnteriores = await buscarOpcaoPorId(payload.id);
  }

  await salvarOpcao(payload);

  const dadosNovos = isEdicao
    ? await buscarOpcaoPorId(payload.id)
    : payload;

  await registrarLogAdmin({
    admin: req.admin,
    acao: isEdicao ? 'EDITAR_OPCAO_BOT' : 'CRIAR_OPCAO_BOT',
    tabelaAfetada: 'opcoes_bot',
    registroId: payload.id || dadosNovos?.id || null,
    descricao: isEdicao
      ? `Admin editou a opção ${payload.nome}`
      : `Admin criou a opção ${payload.nome}`,
    dadosAnteriores,
    dadosNovos,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  res.redirect('/admin/opcoes');
});

module.exports = router;