// Teste direto do Telegram usando fetch
require('dotenv').config({ path: '.env.local' });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

console.log('🔍 TESTE DIRETO DO TELEGRAM');
console.log('===========================');
console.log(`Bot Token: ${BOT_TOKEN ? BOT_TOKEN.substring(0, 10) + '...' : 'NÃO CONFIGURADO'}`);
console.log(`Chat ID: ${CHAT_ID || 'NÃO CONFIGURADO'}`);
console.log('');

async function testarTelegram() {
  if (!BOT_TOKEN) {
    console.log('❌ TELEGRAM_BOT_TOKEN não encontrado no .env.local');
    return false;
  }
  
  if (!CHAT_ID) {
    console.log('❌ TELEGRAM_CHAT_ID não encontrado no .env.local');
    return false;
  }

  const mensagem = '🧪 **TESTE DE NOTIFICAÇÃO**\n\nEste é um teste para verificar se as notificações do Telegram estão funcionando corretamente.\n\n✅ Se você recebeu esta mensagem, o sistema está funcionando!';
  
  console.log('📤 Enviando mensagem de teste...');
  
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: mensagem,
        parse_mode: 'Markdown'
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.ok) {
      console.log('✅ Mensagem enviada com sucesso!');
      console.log('📱 Verifique seu Telegram para confirmar o recebimento.');
      console.log('📊 Detalhes da mensagem:', {
        message_id: result.result.message_id,
        chat_id: result.result.chat.id,
        date: new Date(result.result.date * 1000).toLocaleString('pt-BR')
      });
      return true;
    } else {
      console.log('❌ Erro na resposta da API:', result);
      
      // Diagnósticos específicos
      if (result.error_code === 400) {
        console.log('💡 Dica: Chat ID inválido ou bot não foi iniciado pelo usuário');
      } else if (result.error_code === 401) {
        console.log('💡 Dica: Token do bot inválido');
      } else if (result.error_code === 403) {
        console.log('💡 Dica: Bot foi bloqueado pelo usuário ou não tem permissão');
      }
      
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao enviar mensagem:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('💡 Dica: Problema de conectividade com a internet');
    }
    
    return false;
  }
}

// Testar informações do bot
async function testarInfoBot() {
  console.log('');
  console.log('🤖 Verificando informações do bot...');
  
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getMe`;
    const response = await fetch(url);
    const result = await response.json();
    
    if (response.ok && result.ok) {
      console.log('✅ Bot válido:', {
        id: result.result.id,
        nome: result.result.first_name,
        username: result.result.username,
        is_bot: result.result.is_bot
      });
    } else {
      console.log('❌ Erro ao obter info do bot:', result);
    }
  } catch (error) {
    console.log('❌ Erro ao verificar bot:', error.message);
  }
}

// Executar testes
async function executarTestes() {
  await testarInfoBot();
  const sucesso = await testarTelegram();
  
  console.log('');
  console.log('🎯 RESULTADO FINAL:');
  if (sucesso) {
    console.log('✅ Telegram configurado e funcionando!');
    console.log('✅ Mensagem de teste enviada com sucesso!');
    console.log('');
    console.log('🚀 PRÓXIMOS PASSOS:');
    console.log('1. Acesse http://localhost:3003 (ou a porta do seu servidor)');
    console.log('2. Adicione produtos para monitorar');
    console.log('3. Configure preços alvo menores que os atuais');
    console.log('4. As notificações serão enviadas automaticamente!');
  } else {
    console.log('❌ Ainda há problemas com o Telegram');
    console.log('🔧 Verifique as configurações no .env.local');
  }
}

executarTestes().catch(console.error);