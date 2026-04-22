const express = require('express');
const router = express.Router();
const { listarLogsAdmin } = require('../services/adminAuditService');

router.get('/', async (req, res) => {
  const logs = await listarLogsAdmin();
  res.render('admin/logs/index', { logs });
});

module.exports = router;