require('dotenv').config({ path: '.env.local' });
const https = require('https');
const http = require('http');

// Função para fazer requisições HTTP
async function makeRequest(url, options = {}) {
  try {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    return new Promise((resolve) => {
      const postData = options.body || null;
      
      const reqOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      };
      
      if (postData) {
        reqOptions.headers['Content-Length'] = Buffer.byteLength(postData);
      }
      
      const req = client.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({ success: res.statusCode >= 200 && res.statusCode < 300, data: jsonData, status: res.statusCode });
          } catch (error) {
            resolve({ success: false, error: 'Invalid JSON response', data: data });
          }
        });
      });
      
      req.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });
      
      if (postData) {
        req.write(postData);
      }
      
      req.end();
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Função para validar o bot
async function validateBot(botToken) {
  console.log('🔍 Validando bot...');
  
  const url = `https://api.telegram.org/bot${botToken}/getMe`;
  const result = await makeRequest(url);
  
  if (result.success && result.data.ok) {
    const bot = result.data.result;
    console.log(`✅ Bot válido: ${bot.first_name} (@${bot.username})`);
    return { valid: true, bot };
  } else {
    console.log(`❌ Bot inválido: ${result.error || result.data?.description || 'Token incorreto'}`);
    return { valid: false, error: result.error || result.data?.description };
  }
}

// Função para validar o chat ID
async function validateChatId(botToken, chatId) {
  console.log('🔍 Validando Chat ID...');
  
  const url = `https://api.telegram.org/bot${botToken}/getChat`;
  const result = await makeRequest(url, {
    method: 'POST',
    body: JSON.stringify({ chat_id: chatId })
  });
  
  if (result.success && result.data.ok) {
    const chat = result.data.result;
    const name = chat.first_name || chat.title || 'Chat';
    console.log(`✅ Chat válido: ${name} (ID: ${chatId})`);
    return { valid: true, chat };
  } else {
    console.log(`❌ Chat ID inválido: ${result.error || result.data?.description || 'ID não encontrado'}`);
    return { valid: false, error: result.error || result.data?.description };
  }
}

// Função para enviar mensagem de teste
async function sendTestMessage(botToken, chatId) {
  console.log('📤 Enviando mensagem de teste...');
  
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const message = `🧪 <b>TESTE DE VALIDAÇÃO</b>\n\n` +
                 `✅ Bot configurado corretamente\n` +
                 `✅ Chat ID válido\n` +
                 `✅ Conexão funcionando\n\n` +
                 `🤖 Sistema pronto para enviar notificações!\n\n` +
                 `⏰ ${new Date().toLocaleString('pt-BR')}`;
  
  const result = await makeRequest(url, {
    method: 'POST',
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    })
  });
  
  if (result.success && result.data.ok) {
    console.log('✅ Mensagem de teste enviada com sucesso!');
    return true;
  } else {
    console.log(`❌ Falha ao enviar mensagem: ${result.error || result.data?.description}`);
    return false;
  }
}

// Função para obter informações do bot
async function getBotInfo(botToken) {
  const url = `https://api.telegram.org/bot${botToken}/getMe`;
  const result = await makeRequest(url);
  
  if (result.success && result.data.ok) {
    return result.data.result;
  }
  return null;
}

// Função para obter atualizações recentes
async function getRecentUpdates(botToken) {
  const url = `https://api.telegram.org/bot${botToken}/getUpdates?limit=5`;
  const result = await makeRequest(url);
  
  if (result.success && result.data.ok) {
    return result.data.result;
  }
  return [];
}

// Função principal
async function main() {
  console.log('🔧 VALIDADOR COMPLETO DO TELEGRAM');
  console.log('=====================================\n');
  
  // 1. Verificar configurações
  console.log('1️⃣ Verificando configurações...');
  const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
  const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;
  
  if (!botToken || !chatId) {
    console.log('❌ Configurações não encontradas!');
    console.log('   Verifique se as variáveis estão definidas no .env.local:');
    console.log('   - NEXT_PUBLIC_TELEGRAM_BOT_TOKEN');
    console.log('   - NEXT_PUBLIC_TELEGRAM_CHAT_ID');
    return;
  }
  
  console.log('✅ Configurações encontradas!');
  console.log(`🤖 Bot Token: ${botToken.substring(0, 10)}...`);
  console.log(`💬 Chat ID: ${chatId}\n`);
  
  // 2. Validar bot
  console.log('2️⃣ Validando bot...');
  const botValidation = await validateBot(botToken);
  
  if (!botValidation.valid) {
    console.log('\n❌ VALIDAÇÃO FALHOU!');
    console.log('   O token do bot está incorreto ou inválido.');
    console.log('   Verifique se o token foi copiado corretamente do @BotFather.');
    return;
  }
  
  // 3. Validar chat ID
  console.log('\n3️⃣ Validando Chat ID...');
  const chatValidation = await validateChatId(botToken, chatId);
  
  if (!chatValidation.valid) {
    console.log('\n❌ VALIDAÇÃO FALHOU!');
    console.log('   O Chat ID está incorreto ou o bot não tem acesso ao chat.');
    console.log('   Certifique-se de:');
    console.log('   1. Enviar /start para o bot primeiro');
    console.log('   2. Usar o Chat ID correto (obtenha com @userinfobot)');
    return;
  }
  
  // 4. Enviar mensagem de teste
  console.log('\n4️⃣ Enviando mensagem de teste...');
  const testResult = await sendTestMessage(botToken, chatId);
  
  if (!testResult) {
    console.log('\n⚠️  TESTE PARCIALMENTE FALHOU!');
    console.log('   As configurações estão corretas, mas houve problema no envio.');
    console.log('   Verifique se o bot não foi bloqueado ou removido do chat.');
    return;
  }
  
  // 5. Informações adicionais
  console.log('\n5️⃣ Coletando informações adicionais...');
  const botInfo = await getBotInfo(botToken);
  const updates = await getRecentUpdates(botToken);
  
  console.log('\n📊 RELATÓRIO COMPLETO');
  console.log('=====================================');
  console.log(`✅ Bot: ${botInfo?.first_name} (@${botInfo?.username})`);
  console.log(`✅ Chat: ${chatValidation.chat?.first_name || chatValidation.chat?.title} (${chatId})`);
  console.log(`✅ Mensagem de teste: Enviada com sucesso`);
  console.log(`📱 Atualizações recentes: ${updates.length} mensagens`);
  
  console.log('\n🎉 VALIDAÇÃO COMPLETA!');
  console.log('=====================================');
  console.log('✅ Todas as configurações estão corretas');
  console.log('✅ Bot funcionando perfeitamente');
  console.log('✅ Sistema pronto para notificações');
  
  console.log('\n🚀 Próximos passos:');
  console.log('1. Acesse http://localhost:3000');
  console.log('2. Configure produtos para monitorar');
  console.log('3. Aguarde as notificações automáticas!');
}

// Executar validação
main().catch(error => {
  console.error('\n💥 ERRO INESPERADO:', error.message);
  console.log('\n🔧 Tente executar novamente ou verifique:');
  console.log('1. Conexão com a internet');
  console.log('2. Configurações do .env.local');
  console.log('3. Se o bot não foi deletado no @BotFather');
});