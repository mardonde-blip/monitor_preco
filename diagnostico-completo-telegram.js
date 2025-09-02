const fs = require('fs');
const path = require('path');
const https = require('https');

// Função para fazer requisições HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Função para testar API do Telegram diretamente
async function testTelegramAPI(botToken, chatId) {
  try {
    console.log('\n🔍 Testando API do Telegram diretamente...');
    
    // Teste 1: Verificar se o bot é válido
    const botInfo = await makeRequest(`https://api.telegram.org/bot${botToken}/getMe`);
    if (!botInfo.ok) {
      console.log('❌ Bot Token inválido:', botInfo.description);
      return false;
    }
    console.log('✅ Bot Token válido:', botInfo.result.username);
    
    // Teste 2: Verificar se o chat ID é válido
    const chatInfo = await makeRequest(`https://api.telegram.org/bot${botToken}/getChat?chat_id=${chatId}`);
    if (!chatInfo.ok) {
      console.log('❌ Chat ID inválido:', chatInfo.description);
      return false;
    }
    console.log('✅ Chat ID válido:', chatInfo.result.type, chatInfo.result.first_name || chatInfo.result.title);
    
    // Teste 3: Enviar mensagem de teste
    const testMessage = await makeRequest(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: '🧪 TESTE DE DIAGNÓSTICO\n\nSe você recebeu esta mensagem, o Telegram está funcionando corretamente!\n\n⏰ ' + new Date().toLocaleString('pt-BR'),
        parse_mode: 'HTML'
      })
    });
    
    if (!testMessage.ok) {
      console.log('❌ Falha ao enviar mensagem:', testMessage.description);
      return false;
    }
    console.log('✅ Mensagem de teste enviada com sucesso!');
    return true;
    
  } catch (error) {
    console.log('❌ Erro ao testar API do Telegram:', error.message);
    return false;
  }
}

// Função para testar API local do sistema
async function testLocalAPI() {
  try {
    console.log('\n🔍 Testando API local do sistema...');
    
    // Teste 1: Verificar status do scheduler
    const schedulerStatus = await makeRequest('http://localhost:3000/api/scheduler');
    console.log('📊 Status do Scheduler:', schedulerStatus.isRunning ? 'Ativo' : 'Inativo');
    
    // Teste 2: Testar API de teste do Telegram
    const telegramTest = await makeRequest('http://localhost:3000/api/telegram/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (telegramTest.success) {
      console.log('✅ API local do Telegram funcionando');
    } else {
      console.log('❌ API local do Telegram com problema:', telegramTest.error);
    }
    
  } catch (error) {
    console.log('❌ Erro ao testar API local:', error.message);
    console.log('💡 Certifique-se de que o servidor está rodando em http://localhost:3000');
  }
}

// Função para verificar configurações
function checkConfigurations() {
  console.log('\n🔍 Verificando configurações...');
  
  // Verificar .env.local
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.log('❌ Arquivo .env.local não encontrado');
    return null;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const botTokenMatch = envContent.match(/TELEGRAM_BOT_TOKEN=(.+)/);
  const chatIdMatch = envContent.match(/TELEGRAM_CHAT_ID=(.+)/);
  
  const botToken = botTokenMatch ? botTokenMatch[1].trim() : null;
  const chatId = chatIdMatch ? chatIdMatch[1].trim() : null;
  
  console.log('📄 Arquivo .env.local encontrado');
  console.log('🤖 Bot Token:', botToken ? (botToken.length > 10 ? '✅ Configurado' : '❌ Muito curto') : '❌ Não encontrado');
  console.log('💬 Chat ID:', chatId ? (chatId !== 'your_chat_id_here' ? '✅ Configurado' : '❌ Ainda é placeholder') : '❌ Não encontrado');
  
  return { botToken, chatId };
}

// Função para verificar localStorage simulado
function checkLocalStorage() {
  console.log('\n🔍 Verificando configurações do localStorage...');
  
  // Simular localStorage para Node.js
  global.localStorage = {
    getItem: (key) => {
      try {
        const filePath = path.join(process.cwd(), `localStorage_${key}.json`);
        if (fs.existsSync(filePath)) {
          return fs.readFileSync(filePath, 'utf8');
        }
      } catch (e) {}
      return null;
    }
  };
  
  // Verificar produtos
  const productsData = localStorage.getItem('products');
  const products = productsData ? JSON.parse(productsData) : [];
  console.log('📦 Produtos cadastrados:', products.length);
  
  if (products.length > 0) {
    console.log('   Produtos:');
    products.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} - Preço alvo: R$ ${product.targetPrice?.toFixed(2) || 'N/A'}`);
    });
  }
  
  // Verificar configurações de notificação
  const settingsData = localStorage.getItem('notification-settings');
  const settings = settingsData ? JSON.parse(settingsData) : null;
  
  if (settings) {
    console.log('⚙️ Configurações de notificação:');
    console.log('   Habilitadas:', settings.enabled ? '✅ Sim' : '❌ Não');
    console.log('   Bot Token:', settings.telegram?.botToken ? '✅ Configurado' : '❌ Não configurado');
    console.log('   Chat ID:', settings.telegram?.chatId ? '✅ Configurado' : '❌ Não configurado');
  } else {
    console.log('❌ Configurações de notificação não encontradas no localStorage');
  }
  
  return { products, settings };
}

// Função principal de diagnóstico
async function runDiagnosis() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DO SISTEMA DE NOTIFICAÇÕES TELEGRAM');
  console.log('=' .repeat(70));
  
  // 1. Verificar configurações
  const envConfig = checkConfigurations();
  const localData = checkLocalStorage();
  
  // 2. Testar API do Telegram se as configurações estiverem OK
  if (envConfig && envConfig.botToken && envConfig.chatId && envConfig.chatId !== 'your_chat_id_here') {
    await testTelegramAPI(envConfig.botToken, envConfig.chatId);
  } else {
    console.log('\n⚠️ Pulando teste da API do Telegram - configurações incompletas');
  }
  
  // 3. Testar API local
  await testLocalAPI();
  
  // 4. Resumo e recomendações
  console.log('\n📋 RESUMO E RECOMENDAÇÕES:');
  console.log('=' .repeat(50));
  
  if (!envConfig || !envConfig.botToken) {
    console.log('❌ PROBLEMA: Bot Token não configurado no .env.local');
    console.log('   SOLUÇÃO: Adicione TELEGRAM_BOT_TOKEN=seu_token no .env.local');
  }
  
  if (!envConfig || !envConfig.chatId || envConfig.chatId === 'your_chat_id_here') {
    console.log('❌ PROBLEMA: Chat ID não configurado no .env.local');
    console.log('   SOLUÇÃO: Use @userinfobot no Telegram para obter seu Chat ID');
  }
  
  if (!localData.settings || !localData.settings.enabled) {
    console.log('❌ PROBLEMA: Notificações desabilitadas na interface');
    console.log('   SOLUÇÃO: Acesse http://localhost:3000 e habilite as notificações');
  }
  
  if (localData.products.length === 0) {
    console.log('⚠️ AVISO: Nenhum produto cadastrado para monitoramento');
    console.log('   SOLUÇÃO: Adicione produtos na interface web');
  }
  
  console.log('\n✅ Para testar o sistema completo:');
  console.log('   1. Configure o Chat ID no .env.local');
  console.log('   2. Habilite as notificações na interface web');
  console.log('   3. Adicione produtos com preços alvo');
  console.log('   4. Inicie o scheduler automático');
  console.log('   5. Execute uma verificação manual');
}

// Executar diagnóstico
runDiagnosis().catch(console.error);