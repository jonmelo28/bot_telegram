const env = require('../config/env');
const { verificarToken, buscarAdminPorId } = require('../services/adminAuthService');

async function adminJwtAuth(req, res, next) {
  try {
    const token = req.cookies?.[env.cookieName];

    if (!token) {
      return res.redirect('/admin/login');
    }

    const payload = verificarToken(token);

    if (!payload || payload.tipo !== 'ADMIN_BOT') {
      res.clearCookie(env.cookieName);
      return res.redirect('/admin/login');
    }

    const admin = await buscarAdminPorId(payload.sub);

    if (!admin || Number(admin.status) !== 1) {
      res.clearCookie(env.cookieName);
      return res.redirect('/admin/login');
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.clearCookie(env.cookieName);
    return res.redirect('/admin/login');
  }
}

module.exports = adminJwtAuth;