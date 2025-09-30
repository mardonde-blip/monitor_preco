const { TelegramNotifier } = require('./src/lib/telegram');

async function testarTelegram() {
  console.log('🔍 Testando notificações do Telegram...');
  
  try {
    // Cria uma instância do notificador
    const telegramNotifier = new TelegramNotifier();
    
    // Testa o envio de uma mensagem simples
    const resultado = await telegramNotifier.sendMessage('🧪 **Teste de Notificação**\n\nEste é um teste para verificar se as notificações do Telegram estão funcionando corretamente.\n\n✅ Se você recebeu esta mensagem, o sistema está funcionando!');
    
    if (resultado.success) {
      console.log('✅ Mensagem enviada com sucesso!');
      console.log('📱 Verifique seu Telegram para confirmar o recebimento.');
    } else {
      console.log('❌ Erro ao enviar mensagem:', resultado.error);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    
    // Verifica possíveis problemas comuns
    if (error.message.includes('TELEGRAM_BOT_TOKEN')) {
      console.log('💡 Dica: Verifique se o TELEGRAM_BOT_TOKEN está configurado no .env.local');
    }
    
    if (error.message.includes('TELEGRAM_CHAT_ID')) {
      console.log('💡 Dica: Verifique se o TELEGRAM_CHAT_ID está configurado no .env.local');
    }
    
    if (error.message.includes('401')) {
      console.log('💡 Dica: Token do bot inválido. Verifique o TELEGRAM_BOT_TOKEN');
    }
    
    if (error.message.includes('400')) {
      console.log('💡 Dica: Chat ID inválido. Verifique o TELEGRAM_CHAT_ID');
    }
  }
}

// Executa o teste
testarTelegram();