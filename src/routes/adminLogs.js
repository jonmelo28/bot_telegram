const express = require('express');
const router = express.Router();
const { listarLogs } = require('../services/adminService');

router.get('/', async (req, res) => {
  const logsbot = await listarLogs();
  res.render('admin/logsbot/index', { logsbot });
});

module.exports = router;