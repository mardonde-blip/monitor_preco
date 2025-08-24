// Script para testar configuração do Telegram
// Execute com: node test-telegram.js

require('dotenv').config({ path: '.env.local' });

const TELEGRAM_BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

console.log('🤖 TESTE DE CONFIGURAÇÃO DO TELEGRAM');
console.log('=' .repeat(50));

// Verificar se as configurações estão definidas
if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === 'your_bot_token_here') {
  console.log('❌ ERRO: Token do bot não configurado!');
  console.log('📋 Siga as instruções em CONFIGURAR_TELEGRAM.md');
  console.log('🔧 Edite o arquivo .env.local com seu token real');
  process.exit(1);
}

if (!TELEGRAM_CHAT_ID || TELEGRAM_CHAT_ID === 'your_chat_id_here') {
  console.log('❌ ERRO: Chat ID não configurado!');
  console.log('📋 Siga as instruções em CONFIGURAR_TELEGRAM.md');
  console.log('🔧 Edite o arquivo .env.local com seu chat ID real');
  process.exit(1);
}

console.log('✅ Configurações encontradas:');
console.log(`🤖 Bot Token: ${TELEGRAM_BOT_TOKEN.substring(0, 10)}...`);
console.log(`💬 Chat ID: ${TELEGRAM_CHAT_ID}`);
console.log('');

async function testarTelegram() {
  console.log('📤 Enviando mensagem de teste...');
  
  const mensagem = `🧪 <b>Teste do Sistema de Monitoramento</b>\n\n` +
                  `✅ <b>Status:</b> Configuração funcionando!\n` +
                  `🕐 <b>Data/Hora:</b> ${new Date().toLocaleString('pt-BR')}\n` +
                  `🤖 <b>Sistema:</b> Monitor de Preços\n\n` +
                  `🎉 <i>Agora você receberá notificações quando os preços baixarem!</i>`;
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: mensagem,
        parse_mode: 'HTML'
      })
    });
    
    const result = await response.json();
    
    if (result.ok) {
      console.log('🎉 SUCESSO! Mensagem enviada para o Telegram!');
      console.log('📱 Verifique seu Telegram para ver a mensagem de teste');
      console.log('');
      console.log('🚀 PRÓXIMOS PASSOS:');
      console.log('1. Acesse http://localhost:3000');
      console.log('2. Adicione produtos para monitorar');
      console.log('3. Aguarde as notificações automáticas!');
    } else {
      console.log('❌ ERRO ao enviar mensagem:');
      console.log(`💥 Código: ${result.error_code}`);
      console.log(`📝 Descrição: ${result.description}`);
      console.log('');
      console.log('🔧 POSSÍVEIS SOLUÇÕES:');
      if (result.error_code === 400) {
        console.log('• Verifique se o Chat ID está correto');
        console.log('• Certifique-se de ter iniciado uma conversa com o bot');
      } else if (result.error_code === 401) {
        console.log('• Verifique se o Token do bot está correto');
        console.log('• Certifique-se de ter copiado o token completo');
      }
    }
    
  } catch (error) {
    console.log('❌ ERRO na requisição:');
    console.log(`💥 ${error.message}`);
    console.log('');
    console.log('🔧 VERIFICAR:');
    console.log('• Conexão com a internet');
    console.log('• Se o token e chat ID estão corretos');
  }
}

testarTelegram();