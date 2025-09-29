const http = require('http');

// Função para fazer requisição POST
function makePostRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(url, options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

// Função para fazer requisição GET
function makeGetRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => reject(error));
    req.end();
  });
}

async function configurarTelegram() {
  console.log('🤖 Configurando Telegram para notificações...\n');
  
  try {
    // 1. Verificar configurações atuais
    console.log('1. Verificando configurações atuais...');
    const currentSettings = await makeGetRequest('http://localhost:3000/api/settings');
    console.log(`Status: ${currentSettings.status}`);
    
    if (currentSettings.status === 200) {
      console.log('Configurações atuais:');
      console.log(`- Notificações habilitadas: ${currentSettings.data.enabled ? '✅' : '❌'}`);
      if (currentSettings.data.telegram) {
        console.log(`- Bot Token: ${currentSettings.data.telegram.botToken ? '✅ Configurado' : '❌ Não configurado'}`);
        console.log(`- Chat ID: ${currentSettings.data.telegram.chatId ? '✅ Configurado' : '❌ Não configurado'}`);
      }
    }
    
    // 2. Configurar Telegram (usando valores de exemplo - você deve substituir pelos seus)
    console.log('\n2. Configurando Telegram...');
    
    // IMPORTANTE: Substitua estes valores pelos seus dados reais do Telegram
    const telegramConfig = {
      enabled: true,
      telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN || 'SEU_BOT_TOKEN_AQUI',
        chatId: process.env.TELEGRAM_CHAT_ID || 'SEU_CHAT_ID_AQUI'
      }
    };
    
    // Verificar se as variáveis de ambiente estão definidas
    if (telegramConfig.telegram.botToken === 'SEU_BOT_TOKEN_AQUI' || 
        telegramConfig.telegram.chatId === 'SEU_CHAT_ID_AQUI') {
      console.log('⚠️  ATENÇÃO: Você precisa configurar as variáveis de ambiente:');
      console.log('');
      console.log('Para Windows (PowerShell):');
      console.log('$env:TELEGRAM_BOT_TOKEN="seu_bot_token_aqui"');
      console.log('$env:TELEGRAM_CHAT_ID="seu_chat_id_aqui"');
      console.log('');
      console.log('Para Linux/Mac:');
      console.log('export TELEGRAM_BOT_TOKEN="seu_bot_token_aqui"');
      console.log('export TELEGRAM_CHAT_ID="seu_chat_id_aqui"');
      console.log('');
      console.log('📋 COMO OBTER ESSAS INFORMAÇÕES:');
      console.log('');
      console.log('1. Bot Token:');
      console.log('   - Abra o Telegram e procure por @BotFather');
      console.log('   - Digite /newbot e siga as instruções');
      console.log('   - Copie o token que ele fornecer');
      console.log('');
      console.log('2. Chat ID:');
      console.log('   - Envie uma mensagem para seu bot');
      console.log('   - Acesse: https://api.telegram.org/bot<SEU_TOKEN>/getUpdates');
      console.log('   - Procure pelo "chat":{"id": NUMERO}');
      console.log('   - Use esse número como Chat ID');
      console.log('');
      
      // Tentar usar valores padrão para teste (não funcionará, mas mostra o processo)
      console.log('⚠️  Continuando com valores de exemplo (não funcionará)...');
    }
    
    const response = await makePostRequest('http://localhost:3000/api/settings', telegramConfig);
    console.log(`Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ Configurações do Telegram salvas!');
      console.log(`Resposta: ${JSON.stringify(response.data, null, 2)}`);
    } else {
      console.log('❌ Erro ao salvar configurações');
      console.log(`Resposta: ${JSON.stringify(response.data, null, 2)}`);
    }
    
    // 3. Testar Telegram
    console.log('\n3. Testando Telegram...');
    const testResponse = await makeGetRequest('http://localhost:3000/api/test-telegram');
    console.log(`Status: ${testResponse.status}`);
    
    if (testResponse.status === 200) {
      if (testResponse.data.success) {
        console.log('✅ Telegram funcionando!');
        console.log(`Mensagem: ${testResponse.data.message}`);
      } else {
        console.log('❌ Erro no Telegram:');
        console.log(`Erro: ${testResponse.data.error}`);
      }
    } else {
      console.log('❌ Erro ao testar Telegram');
      console.log(`Resposta: ${JSON.stringify(testResponse.data, null, 2)}`);
    }
    
    // 4. Verificar configurações finais
    console.log('\n4. Verificando configurações finais...');
    const finalSettings = await makeGetRequest('http://localhost:3000/api/settings');
    
    if (finalSettings.status === 200) {
      console.log('✅ Configurações finais:');
      console.log(`- Notificações: ${finalSettings.data.enabled ? '✅ HABILITADAS' : '❌ DESABILITADAS'}`);
      if (finalSettings.data.telegram) {
        console.log(`- Bot Token: ${finalSettings.data.telegram.botToken ? '✅ OK' : '❌ FALTANDO'}`);
        console.log(`- Chat ID: ${finalSettings.data.telegram.chatId ? '✅ OK' : '❌ FALTANDO'}`);
      }
    }
    
    console.log('\n📋 RESUMO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (telegramConfig.telegram.botToken !== 'SEU_BOT_TOKEN_AQUI' && 
        telegramConfig.telegram.chatId !== 'SEU_CHAT_ID_AQUI') {
      console.log('✅ Telegram configurado com sucesso!');
      console.log('✅ Notificações habilitadas!');
      console.log('');
      console.log('🎯 PRÓXIMOS PASSOS:');
      console.log('1. Inicie o scheduler automático');
      console.log('2. Adicione produtos para monitorar');
      console.log('3. Aguarde as notificações automáticas');
    } else {
      console.log('❌ Telegram NÃO configurado - usando valores de exemplo');
      console.log('');
      console.log('🎯 PARA FUNCIONAR:');
      console.log('1. Configure as variáveis de ambiente (veja instruções acima)');
      console.log('2. Execute este script novamente');
      console.log('3. Inicie o scheduler automático');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n💡 Certifique-se de que o servidor local está rodando:');
    console.log('   npm run dev');
  }
}

// Executar
configurarTelegram();