const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const env = require('../config/env');

const telegramApi = axios.create({
  baseURL: `https://api.telegram.org/bot${env.telegramBotToken}`,
  timeout: 30000
});

async function setWebhook() {
  if (!env.appBaseUrl) return;

  const webhookUrl = `${env.appBaseUrl}/telegram/webhook`;
  const response = await telegramApi.post('/setWebhook', {
    url: webhookUrl,
    secret_token: env.telegramWebhookSecret || undefined
  });

  return response.data;
}

async function sendMessage(chatId, text, extra = {}) {
  await telegramApi.post('/sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    ...extra
  });
}

async function answerCallbackQuery(callbackQueryId, text = '') {
  const payload = {
    callback_query_id: callbackQueryId,
    show_alert: false
  };

  if (text) {
    payload.text = text;
  }

  await telegramApi.post('/answerCallbackQuery', payload);
}

async function sendInlineMenu(chatId, text, buttons = []) {
  const inlineKeyboard = buttons.map((button) => [button]);

  await sendMessage(chatId, text, {
    reply_markup: {
      inline_keyboard: inlineKeyboard
    }
  });
}

async function sendDocument(chatId, filePath, filename, caption = '') {
  const form = new FormData();
  form.append('chat_id', String(chatId));
  form.append('caption', caption);
  form.append('document', fs.createReadStream(filePath), filename);

  const response = await axios.post(
    `https://api.telegram.org/bot${env.telegramBotToken}/sendDocument`,
    form,
    { headers: form.getHeaders(), timeout: 60000 }
  );

  return response.data;
}

async function editMessageRemoveKeyboard(chatId, messageId, text) {
  await telegramApi.post('/editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: []
    }
  });
}

module.exports = {
  setWebhook,
  sendMessage,
  sendInlineMenu,
  sendDocument,
  answerCallbackQuery,
  editMessageRemoveKeyboard
};