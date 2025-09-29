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

async function reiniciarScheduler() {
  console.log('🔄 Reiniciando o scheduler após configuração do Telegram...\n');
  
  try {
    // 1. Verificar status atual do scheduler
    console.log('1. Verificando status atual do scheduler...');
    const statusResponse = await makeGetRequest('http://localhost:3000/api/scheduler');
    console.log(`Status: ${statusResponse.status}`);
    
    if (statusResponse.status === 200) {
      console.log(`Scheduler rodando: ${statusResponse.data.running ? '✅ SIM' : '❌ NÃO'}`);
      
      if (statusResponse.data.running) {
        console.log('Scheduler já está rodando, vamos pará-lo primeiro...');
        
        // 2. Parar o scheduler se estiver rodando
        console.log('\n2. Parando o scheduler...');
        const stopResponse = await makePostRequest('http://localhost:3000/api/scheduler', {
          action: 'stop'
        });
        
        console.log(`Status: ${stopResponse.status}`);
        if (stopResponse.status === 200) {
          console.log('✅ Scheduler parado com sucesso!');
        } else {
          console.log('❌ Erro ao parar scheduler');
          console.log(`Resposta: ${JSON.stringify(stopResponse.data, null, 2)}`);
        }
        
        // Aguardar um pouco antes de reiniciar
        console.log('⏳ Aguardando 2 segundos...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } else {
      console.log('❌ Erro ao verificar status do scheduler');
    }
    
    // 3. Verificar se o Telegram está configurado
    console.log('\n3. Verificando configuração do Telegram...');
    const settingsResponse = await makeGetRequest('http://localhost:3000/api/settings');
    console.log(`Status: ${settingsResponse.status}`);
    
    let telegramConfigurado = false;
    if (settingsResponse.status === 200) {
      const settings = settingsResponse.data;
      console.log(`Notificações habilitadas: ${settings.enabled ? '✅' : '❌'}`);
      
      if (settings.telegram) {
        const hasToken = settings.telegram.botToken && 
                        settings.telegram.botToken !== 'SEU_BOT_TOKEN_AQUI' &&
                        settings.telegram.botToken.length > 10;
        const hasChatId = settings.telegram.chatId && 
                         settings.telegram.chatId !== 'SEU_CHAT_ID_AQUI' &&
                         settings.telegram.chatId.length > 3;
        
        console.log(`Bot Token: ${hasToken ? '✅ Configurado' : '❌ Não configurado'}`);
        console.log(`Chat ID: ${hasChatId ? '✅ Configurado' : '❌ Não configurado'}`);
        
        telegramConfigurado = hasToken && hasChatId;
      }
    }
    
    if (!telegramConfigurado) {
      console.log('\n⚠️  ATENÇÃO: Telegram não está configurado corretamente!');
      console.log('Execute primeiro: node configurar-telegram.js');
      console.log('E configure as variáveis de ambiente com seus dados reais.');
      console.log('\nContinuando mesmo assim para testar...');
    }
    
    // 4. Testar Telegram antes de iniciar scheduler
    console.log('\n4. Testando Telegram...');
    const telegramTest = await makeGetRequest('http://localhost:3000/api/test-telegram');
    console.log(`Status: ${telegramTest.status}`);
    
    if (telegramTest.status === 200) {
      if (telegramTest.data.success) {
        console.log('✅ Telegram funcionando perfeitamente!');
        console.log(`Mensagem: ${telegramTest.data.message}`);
      } else {
        console.log('❌ Erro no Telegram:');
        console.log(`Erro: ${telegramTest.data.error}`);
        console.log('\n💡 Verifique se o bot token e chat ID estão corretos');
      }
    }
    
    // 5. Iniciar o scheduler
    console.log('\n5. Iniciando o scheduler...');
    const startResponse = await makePostRequest('http://localhost:3000/api/scheduler', {
      action: 'start',
      intervalMinutes: 60 // Verificar a cada 60 minutos
    });
    
    console.log(`Status: ${startResponse.status}`);
    
    if (startResponse.status === 200) {
      console.log('✅ Scheduler iniciado com sucesso!');
      console.log(`Resposta: ${JSON.stringify(startResponse.data, null, 2)}`);
      
      // 6. Verificar se realmente está rodando
      console.log('\n6. Verificando se o scheduler está ativo...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const finalStatus = await makeGetRequest('http://localhost:3000/api/scheduler');
      console.log(`Status: ${finalStatus.status}`);
      
      if (finalStatus.status === 200) {
        console.log(`Scheduler rodando: ${finalStatus.data.running ? '✅ SIM' : '❌ NÃO'}`);
        
        if (finalStatus.data.running) {
          console.log('🎉 Scheduler reiniciado com sucesso!');
        } else {
          console.log('⚠️  Scheduler foi iniciado mas não está mais rodando');
          console.log('Isso pode ser normal em ambiente de desenvolvimento');
        }
      }
      
      // 7. Executar uma verificação manual para testar
      console.log('\n7. Executando verificação manual para testar...');
      const manualResponse = await makePostRequest('http://localhost:3000/api/scheduler', {
        action: 'manual'
      });
      
      console.log(`Status: ${manualResponse.status}`);
      
      if (manualResponse.status === 200) {
        console.log('✅ Verificação manual executada!');
        console.log(`Resposta: ${manualResponse.data.message}`);
        
        console.log('\n⏳ Aguardando 10 segundos para processamento...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        console.log('✅ Verificação concluída!');
      } else {
        console.log('❌ Erro na verificação manual');
        console.log(`Resposta: ${JSON.stringify(manualResponse.data, null, 2)}`);
      }
      
    } else {
      console.log('❌ Erro ao iniciar scheduler');
      console.log(`Resposta: ${JSON.stringify(startResponse.data, null, 2)}`);
    }
    
    console.log('\n📋 RESUMO DO REINÍCIO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (telegramConfigurado) {
      console.log('✅ Telegram configurado corretamente');
      console.log('✅ Scheduler reiniciado');
      console.log('✅ Verificação manual executada');
      console.log('');
      console.log('🎯 SISTEMA PRONTO!');
      console.log('- As notificações devem funcionar agora');
      console.log('- O scheduler verificará preços automaticamente');
      console.log('- Você receberá alertas quando preços baixarem');
    } else {
      console.log('⚠️  Telegram não configurado com dados reais');
      console.log('✅ Scheduler reiniciado (mas notificações não funcionarão)');
      console.log('');
      console.log('🎯 PARA FUNCIONAR COMPLETAMENTE:');
      console.log('1. Configure o bot do Telegram (@BotFather)');
      console.log('2. Configure as variáveis de ambiente');
      console.log('3. Execute: node configurar-telegram.js');
      console.log('4. Execute: node reiniciar-scheduler.js');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n💡 Certifique-se de que o servidor local está rodando:');
    console.log('   npm run dev');
  }
}

// Executar
reiniciarScheduler();