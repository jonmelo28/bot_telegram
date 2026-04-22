const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { getMySQL } = require('../config/mysql');

async function buscarAdminPorEmail(email) {
  const mysql = getMySQL();

  const [rows] = await mysql.execute(
    `
      SELECT id, nome, email, senha, status
      FROM usuarios_adm_bot
      WHERE email = ?
      LIMIT 1
    `,
    [email]
  );

  return rows[0] || null;
}

async function buscarAdminPorId(id) {
  const mysql = getMySQL();

  const [rows] = await mysql.execute(
    `
      SELECT id, nome, email, status
      FROM usuarios_adm_bot
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );

  return rows[0] || null;
}

function gerarToken(admin) {
  return jwt.sign(
    {
      sub: admin.id,
      nome: admin.nome,
      email: admin.email,
      tipo: 'ADMIN_BOT'
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn
    }
  );
}

async function autenticarAdmin(email, senha) {
  const admin = await buscarAdminPorEmail(email);

  if (!admin) {
    return null;
  }

  if (Number(admin.status) !== 1) {
    return null;
  }

  const senhaValida = await bcrypt.compare(senha, admin.senha);

  if (!senhaValida) {
    return null;
  }

  const token = gerarToken(admin);

  return {
    admin: {
      id: admin.id,
      nome: admin.nome,
      email: admin.email,
      status: admin.status
    },
    token
  };
}

function verificarToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

module.exports = {
  autenticarAdmin,
  buscarAdminPorId,
  verificarToken
};