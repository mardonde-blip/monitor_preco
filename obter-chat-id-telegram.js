// Script para obter o Chat ID do Telegram
const TelegramBot = require('node-telegram-bot-api');

// Token do bot (do arquivo .env.local)
const BOT_TOKEN = '8306764040:AAF0N3PSY4TERuU05rcKHsbFBp7u6LQNsts';

if (!BOT_TOKEN || BOT_TOKEN === 'your_bot_token_here') {
  console.log('❌ Bot token não configurado!');
  console.log('Configure o NEXT_PUBLIC_TELEGRAM_BOT_TOKEN no arquivo .env.local');
  process.exit(1);
}

console.log('🤖 Iniciando bot para obter Chat ID...');
console.log('📱 INSTRUÇÕES:');
console.log('1. Abra o Telegram');
console.log('2. Procure pelo seu bot (nome que você deu quando criou)');
console.log('3. Envie qualquer mensagem para o bot (ex: /start ou "oi")');
console.log('4. O Chat ID aparecerá aqui automaticamente');
console.log('5. Pressione Ctrl+C para parar o script');
console.log('\n⏳ Aguardando mensagem...');

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'Usuário';
  const username = msg.from.username ? `@${msg.from.username}` : '';
  
  console.log('\n✅ MENSAGEM RECEBIDA!');
  console.log('👤 De:', firstName, username);
  console.log('💬 Mensagem:', msg.text);
  console.log('🆔 SEU CHAT ID:', chatId);
  console.log('\n📋 COPIE ESTE CHAT ID:', chatId);
  console.log('\n🔧 Agora você pode:');
  console.log('1. Parar este script (Ctrl+C)');
  console.log('2. Atualizar o .env.local com este Chat ID');
  console.log('3. Ou usar a interface web em http://localhost:3000');
  
  // Responder ao usuário
  bot.sendMessage(chatId, `✅ Perfeito! Seu Chat ID é: ${chatId}\n\nAgora você pode configurar as notificações no sistema de monitoramento de preços.`);
});

bot.on('polling_error', (error) => {
  console.log('❌ Erro no bot:', error.message);
  if (error.message.includes('401')) {
    console.log('\n🔑 Token inválido! Verifique se o token está correto.');
    console.log('Para obter um novo token:');
    console.log('1. Abra o Telegram');
    console.log('2. Procure por @BotFather');
    console.log('3. Envie /mybots');
    console.log('4. Selecione seu bot');
    console.log('5. Clique em "API Token"');
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Parando o bot...');
  bot.stopPolling();
  process.exit(0);
});