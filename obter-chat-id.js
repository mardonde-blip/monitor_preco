require('dotenv').config({ path: '.env.local' });

const TELEGRAM_BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === 'your_bot_token_here') {
  console.log('❌ Token do bot não configurado!');
  process.exit(1);
}

console.log('🤖 OBTER CHAT ID DO TELEGRAM');
console.log('============================');
console.log('');
console.log('📋 INSTRUÇÕES:');
console.log('1. Abra o Telegram e procure pelo seu bot');
console.log('2. Envie qualquer mensagem para o bot (ex: /start ou "oi")');
console.log('3. Aguarde alguns segundos e pressione ENTER aqui');
console.log('');
console.log('⏳ Pressione ENTER quando tiver enviado a mensagem...');

// Aguardar input do usuário
process.stdin.once('data', async () => {
  try {
    console.log('\n🔍 Buscando mensagens recentes...');
    
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`);
    const data = await response.json();
    
    if (!data.ok) {
      console.log('❌ Erro na API do Telegram:', data);
      process.exit(1);
    }
    
    if (data.result.length === 0) {
      console.log('❌ Nenhuma mensagem encontrada!');
      console.log('   Certifique-se de ter enviado uma mensagem para o bot.');
      process.exit(1);
    }
    
    // Pegar a mensagem mais recente
    const lastMessage = data.result[data.result.length - 1];
    const chatId = lastMessage.message.chat.id;
    const userName = lastMessage.message.from.first_name || 'Usuário';
    
    console.log('\n✅ CHAT ID ENCONTRADO!');
    console.log('========================');
    console.log(`👤 Usuário: ${userName}`);
    console.log(`🆔 Chat ID: ${chatId}`);
    console.log('');
    console.log('📝 PRÓXIMOS PASSOS:');
    console.log('1. Copie o Chat ID acima');
    console.log('2. Atualize o arquivo .env.local:');
    console.log(`   NEXT_PUBLIC_TELEGRAM_CHAT_ID=${chatId}`);
    console.log('3. Execute novamente o teste do Telegram');
    console.log('');
    console.log('🎉 Configuração quase completa!');
    
  } catch (error) {
    console.log('❌ Erro ao buscar mensagens:', error.message);
  }
  
  process.exit(0);
});