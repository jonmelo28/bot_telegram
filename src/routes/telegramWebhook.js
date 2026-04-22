const express = require('express');
const router = express.Router();
const env = require('../config/env');

const {
  buscarUsuarioPorTelegram,
  buscarPermissoes,
  usuarioTemPermissao,
  registrarlog
} = require('../services/authService');

const {
  montarMenu,
  buscarDadosRelatorio
} = require('../services/reportService');

const { gerarPdfRelatorio } = require('../services/pdfService');

const {
  sendMessage,
  sendInlineMenu,
  sendDocument,
  answerCallbackQuery,
  editMessageRemoveKeyboard
} = require('../services/telegramService');

const { buscarRaioX } = require('../services/raioXService');
const { gerarPdfRaioX } = require('../services/pdfRaioXService');
const { buscarRaioXNovoModelo } = require('../services/raioXNovoModeloService');
const { gerarPdfRaioXNovoModelo } = require('../services/pdfRaioXNovoModeloService');
const { buscarVendaCidade } = require('../services/vendaCidadeService');
const { gerarPdfVendaCidade } = require('../services/pdfVendaCidadeService');

const { buscarProdutosVencimento } = require('../services/produtoVencimentoService');
const { gerarPdfProdutoVencimento } = require('../services/pdfProdutoVencimentoService');

function validarSecret(req) {
  if (!env.telegramWebhookSecret) return true;
  return req.headers['x-telegram-bot-api-secret-token'] === env.telegramWebhookSecret;
}

function isMenuRequest(text = '') {
  const normalizado = String(text || '').trim().toLowerCase();
  return ['/start', 'oi', 'olá', 'ola', 'menu'].includes(normalizado);
}

router.post('/webhook', async (req, res) => {
  try {
    if (!validarSecret(req)) {
      return res.status(403).json({ ok: false, error: 'Webhook inválido' });
    }

    const update = req.body;

    if (update.message) {
      const chatId = update.message.chat.id;
      const telegramUserId = update.message.from.id;
      const text = update.message.text || '';

      const usuario = await buscarUsuarioPorTelegram(telegramUserId, chatId);

      if (text === '/id') {
        await sendMessage(chatId, `Seu ID é: ${telegramUserId}`);
        return res.json({ ok: true });
      }

      if (!usuario) {
        await sendMessage(
          chatId,
          'Seu usuário não está liberado para usar este bot. Fale com o administrador.'
        );
        return res.json({ ok: true });
      }

      if (isMenuRequest(text)) {
        const permissoes = await buscarPermissoes(usuario.id);
        const botoes = montarMenu(permissoes);

        if (!botoes.length) {
          await registrarlog(
            usuario,
            'MENU',
            'SEM_PERMISSAO',
            'Usuário sem opções liberadas'
          );

          await sendMessage(
            chatId,
            `Olá, ${usuario.nome}. Você não possui opções liberadas no momento.`
          );

          return res.json({ ok: true });
        }

        await sendInlineMenu(
          chatId,
          `Olá, ${usuario.nome}. Escolha uma opção:`,
          botoes
        );

        await registrarlog(
          usuario,
          'MENU',
          'SUCESSO',
          'Menu exibido com sucesso'
        );

        return res.json({ ok: true });
      }

      await sendMessage(chatId, 'Envie /start ou digite Oi para abrir o menu.');
      return res.json({ ok: true });
    }

    if (update.callback_query) {
      const callbackId = update.callback_query.id;
      const chatId = update.callback_query.message.chat.id;
      const telegramUserId = update.callback_query.from.id;
      const data = update.callback_query.data || '';
      const messageId = update.callback_query.message.message_id;

      // Responde imediatamente ao Telegram para evitar expiração do callback
      await answerCallbackQuery(callbackId).catch((error) => {
         const descricao = error.response?.data?.description || '';

  if (
    !descricao.includes('query is too old') &&
    !descricao.includes('query ID is invalid')
  ) {
        console.error(
          'Erro ao responder callback query:',
          error.response?.data || error.message
        );
      }
      });

      const usuario = await buscarUsuarioPorTelegram(telegramUserId, chatId);

      if (!usuario) {
        await sendMessage(chatId, 'Usuário não autorizado.');
        return res.json({ ok: true });
      }

      if (!data.startsWith('MENU:')) {
        await sendMessage(chatId, 'Opção inválida.');
        return res.json({ ok: true });
      }

      const codigoOpcao = data.replace('MENU:', '').trim();
      const permitido = await usuarioTemPermissao(usuario.id, codigoOpcao);

      if (!permitido) {
        await registrarlog(
          usuario,
          codigoOpcao,
          'NEGADO',
          'Tentativa de acesso sem permissão'
        );

        await sendMessage(chatId, 'Você não possui permissão para esta opção.');
        return res.json({ ok: true });
      }

      // Desativa o menu antigo
     try {
  await editMessageRemoveKeyboard(
    chatId,
    messageId,
    'Opção recebida. Envie /start ou digite oi para abrir o menu novamente.'
  );
} catch (error) {
  const descricao = error.response?.data?.description || '';
  if (!descricao.includes('message is not modified')) {
    throw error;
  }
}

      if (codigoOpcao === 'RAIO_X') {
        await sendMessage(chatId, 'Seu RAIO X está sendo gerado.');

        const hoje = new Date();
        const dtIni = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const dtFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

        let dados;
        let pdf;
        
        if (Number(usuario.codsupervisor) === 10) {
  dados = await buscarRaioX({
    dtIni,
    dtFim,
    codFilial: '1',
    codusur: usuario.codusur,
    codfunc: usuario.codfunc || 1
  });

  pdf = await gerarPdfRaioX({
    usuario,
    dados
  });
} else {
  dados = await buscarRaioXNovoModelo({
    dtIni,
    dtFim,
    codFilial: ['1','2'],
    codusur: usuario.codusur,
    codfunc: usuario.codfunc || 1
  });

  pdf = await gerarPdfRaioXNovoModelo({
    usuario,
    dados
  });
}

        await sendDocument(
          chatId,
          pdf.outputPath,
          pdf.filename,
          'Relatório RAIO X'
        );

        await registrarlog(
          usuario,
          codigoOpcao,
          'SUCESSO',
          'RAIO X gerado e enviado'
        );

        return res.json({ ok: true });
      }

  if (codigoOpcao === 'VENDA_CIDADE') {
  await sendMessage(chatId, 'Seu relatório de venda por cidade está sendo gerado.');

  const hoje = new Date();
  const dtIni = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const dtFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

  const dados = await buscarVendaCidade({
    dtIni,
    dtFim,
    codusur: usuario.codusur,
    codFilial: usuario.codfilial || '1'
  });

  const pdf = await gerarPdfVendaCidade({
    usuario,
    dados
  });

  await sendDocument(
    chatId,
    pdf.outputPath,
    pdf.filename,
    'Relatório Venda Cidade'
  );

  await registrarlog(usuario, codigoOpcao, 'SUCESSO', 'Venda Cidade gerado e enviado');
  return res.json({ ok: true });
}

if (codigoOpcao === 'PRODUTO_VENCIMENTO') {
  await sendMessage(chatId, 'Seu relatório de produtos próximos do vencimento está sendo gerado.');

  const dados = await buscarProdutosVencimento();

  const pdf = await gerarPdfProdutoVencimento({
    usuario,
    dados
  });

  await sendDocument(
    chatId,
    pdf.outputPath,
    pdf.filename,
    'Relatório de produtos próximos do vencimento'
  );

  await registrarlog(
    usuario,
    codigoOpcao,
    'SUCESSO',
    'Relatório de produtos próximos do vencimento gerado e enviado'
  );

  return res.json({ ok: true });
}

      await sendMessage(chatId, 'Seu relatório está sendo gerado.');

      const relatorio = await buscarDadosRelatorio(usuario, codigoOpcao);
      const pdf = await gerarPdfRelatorio(usuario, relatorio);

      await sendDocument(
        chatId,
        pdf.outputPath,
        pdf.filename,
        `Relatório: ${relatorio.titulo}`
      );

      await registrarlog(
        usuario,
        codigoOpcao,
        'SUCESSO',
        'Relatório gerado e enviado'
      );

      return res.json({ ok: true });
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error(
      'Erro no webhook Telegram:',
      error.response?.data || error.message
    );
    return res.status(500).json({
      ok: false,
      error: error.response?.data?.description || error.message
    });
  }
});

module.exports = router;