const express = require('express');
const router = express.Router();
const adminJwtAuth = require('../middlewares/adminJwtAuth');

const {
  listarUsuariosAdmin,
  buscarUsuarioAdminPorId,
  buscarUsuarioAdminPorEmail,
  salvarUsuarioAdmin
} = require('../services/adminService');

const { registrarLogAdmin } = require('../services/adminAuditService');

router.use(adminJwtAuth);

router.get('/', async (req, res) => {
  const usuariosAdmin = await listarUsuariosAdmin();

  res.render('admin/usuarios-admin/index', {
    usuariosAdmin,
    erro: null,
    sucesso: null
  });
});

router.get('/novo', async (req, res) => {
  res.render('admin/usuarios-admin/form', {
    usuarioAdmin: null,
    erro: null
  });
});

router.get('/:id/editar', async (req, res) => {
  const usuarioAdmin = await buscarUsuarioAdminPorId(req.params.id);

  if (!usuarioAdmin) {
    return res.redirect('/admin/usuarios-admin');
  }

  res.render('admin/usuarios-admin/form', {
    usuarioAdmin,
    erro: null
  });
});

router.post('/salvar', async (req, res) => {

  try {
    const id = req.body.id || null;
    const nome = (req.body.nome || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const senha = req.body.senha || '';
    const status = req.body.status || '1';

    const existente = await buscarUsuarioAdminPorEmail(email);

    if (existente && String(existente.id) !== String(id || '')) {
      return res.render('admin/usuarios-admin/form', {
        usuarioAdmin: {
          id,
          nome,
          email,
          status
        },
        erro: 'Já existe um usuário admin com esse e-mail.'
      });
    }

    let dadosAnteriores = null;
    if (id) {
      dadosAnteriores = await buscarUsuarioAdminPorId(id);
    }

    const usuarioAdminId = await salvarUsuarioAdmin({
      id,
      nome,
      email,
      senha,
      status
    });

    const dadosNovos = await buscarUsuarioAdminPorId(usuarioAdminId);
    


    
    await registrarLogAdmin({
      admin: req.admin,
      nome: req.nome,
      acao: id ? 'EDITAR_USUARIO_ADMIN_BOT' : 'CRIAR_USUARIO_ADMIN_BOT',
      tabelaAfetada: 'usuario_adm_bot',
      registroId: usuarioAdminId,
      descricao: id
        ? `Admin editou usuário admin ${nome}`
        : `Admin criou usuário admin ${nome}`,
      dadosAnteriores,
      dadosNovos,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });


    res.redirect('/admin/usuarios-admin');
  } catch (error) {
    return res.render('admin/usuarios-admin/form', {
      usuarioAdmin: {
        id: req.body.id || null,
        nome: req.body.nome || '',
        email: req.body.email || '',
        status: req.body.status || '1'
      },
      erro: error.message || 'Erro ao salvar usuário admin.'
    });
  }
});

module.exports = router;