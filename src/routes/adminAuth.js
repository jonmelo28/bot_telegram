const express = require('express');
const router = express.Router();
const env = require('../config/env');
const { registrarLogAdmin } = require('../services/adminAuditService');
const { autenticarAdmin } = require('../services/adminAuthService');

router.get('/login', (req, res) => {
  return res.render('admin/auth/login', { erro: null });
});

router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    const resultado = await autenticarAdmin(email, senha);

    if (!resultado) {
      return res.status(401).render('admin/auth/login', {
        erro: 'E-mail ou senha inválidos.'
      });
    }

    res.cookie(env.cookieName, resultado.token, {
      httpOnly: true,
      secure: env.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000
    });

    await registrarLogAdmin({
  admin: resultado.admin,
  acao: 'LOGIN_ADMIN',
  tabelaAfetada: 'usuarios_adm_bot',
  registroId: resultado.admin.id,
  descricao: `Login realizado com sucesso por ${resultado.admin.email}`,
  dadosAnteriores: null,
  dadosNovos: null,
  ip: req.ip,
  userAgent: req.get('user-agent')  
  
});

return res.redirect('/admin/usuarios');

} catch (error) {
    return res.status(500).render('admin/auth/login', {
      erro: 'Erro ao realizar login.'
    });
  }
});

router.post('/logout', async (req, res) => {
  try {
    await registrarLogAdmin({
      admin: req.admin || null,
      acao: 'LOGOUT_ADMIN',
      tabelaAfetada: 'usuarios_adm_bot',
      registroId: req.admin ? req.admin.id : null,
      descricao: 'Logout realizado',
      dadosAnteriores: null,
      dadosNovos: null,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  } catch (error) {
    console.error('Erro ao registrar log de logout:', error.message);
  }
  
  res.clearCookie(env.cookieName);

  return res.redirect('/admin/login');
});

module.exports = router;