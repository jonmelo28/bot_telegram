const express = require('express');
const router = express.Router();
const { registrarLogAdmin } = require('../services/adminAuditService');
const { listarUsuarios, buscarUsuarioPorId, salvarUsuario } = require('../services/adminService');

router.get('/', async (req, res) => {
  const usuarios = await listarUsuarios();
  res.render('admin/usuarios/index', { usuarios });
});

router.get('/novo', async (req, res) => {
  res.render('admin/usuarios/form', { usuario: null });
});

router.get('/:id/editar', async (req, res) => {
  const usuario = await buscarUsuarioPorId(req.params.id);
  res.render('admin/usuarios/form', { usuario });
});

router.post('/salvar', async (req, res) => {
  const isEdicao = !!req.body.id;
  let dadosAnteriores = null;

  if (isEdicao) {
    dadosAnteriores = await buscarUsuarioPorId(req.body.id);
  }

  await salvarUsuario(req.body);

  const dadosNovos = isEdicao
    ? await buscarUsuarioPorId(req.body.id)
    : req.body;

  await registrarLogAdmin({
    admin: req.admin,
    acao: isEdicao ? 'EDITAR_USUARIO_BOT' : 'CRIAR_USUARIO_BOT',
    tabelaAfetada: 'usuarios_bot',
    registroId: req.body.id || dadosNovos?.id || null,
    descricao: isEdicao
      ? `Admin editou o usuário do bot ${req.body.nome}`
      : `Admin criou o usuário do bot ${req.body.nome}`,
    dadosAnteriores,
    dadosNovos,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  res.redirect('/admin/usuarios');
});

module.exports = router;