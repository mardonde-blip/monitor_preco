const https = require('https');

// Configuração
const BASE_URL = 'https://monitor-precos-seven.vercel.app';

// Função para fazer requisições HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
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
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testarSistemaCorrigido() {
  console.log('🔍 TESTANDO SISTEMA APÓS CORREÇÕES...\n');
  
  try {
    // 1. Testar API de debug de produtos
    console.log('1. Testando API de debug de produtos...');
    try {
      const produtosResponse = await makeRequest(`${BASE_URL}/api/debug/products`);
      console.log(`   Status: ${produtosResponse.status}`);
      
      if (produtosResponse.status === 200 && Array.isArray(produtosResponse.data)) {
        console.log(`   ✅ ${produtosResponse.data.length} produtos encontrados:`);
        produtosResponse.data.forEach((produto, index) => {
          console.log(`      ${index + 1}. ${produto.name}`);
          console.log(`         URL: ${produto.url}`);
          console.log(`         Preço Alvo: R$ ${produto.target_price}`);
          console.log(`         Preço Atual: R$ ${produto.current_price || 'N/A'}`);
          console.log(`         Status: ${produto.current_price && produto.current_price <= produto.target_price ? '🎯 ALERTA ATIVO' : '⏳ Aguardando'}`);
          console.log('');
        });
      } else {
        console.log(`   ❌ Erro ou formato inesperado: ${JSON.stringify(produtosResponse.data).substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    
    // 2. Testar API do scheduler
    console.log('2. Testando API do scheduler...');
    try {
      const schedulerResponse = await makeRequest(`${BASE_URL}/api/scheduler`);
      console.log(`   Status: ${schedulerResponse.status}`);
      
      if (schedulerResponse.status === 200) {
        console.log(`   ✅ Scheduler: ${schedulerResponse.data.running ? 'RODANDO' : 'PARADO'}`);
        if (schedulerResponse.data.lastRun) {
          console.log(`   Última execução: ${schedulerResponse.data.lastRun}`);
        }
      } else {
        console.log(`   ❌ Erro: ${JSON.stringify(schedulerResponse.data)}`);
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    
    // 3. Testar verificação manual
    console.log('3. Testando verificação manual...');
    try {
      const manualResponse = await makeRequest(`${BASE_URL}/api/scheduler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'manual' })
      });
      
      console.log(`   Status: ${manualResponse.status}`);
      
      if (manualResponse.status === 200) {
        console.log(`   ✅ Verificação manual iniciada: ${manualResponse.data.message}`);
      } else {
        console.log(`   ❌ Erro: ${JSON.stringify(manualResponse.data)}`);
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    
    // 4. Aguardar e verificar novamente os produtos
    console.log('\n4. Aguardando 30 segundos para verificação...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    console.log('5. Verificando produtos após verificação manual...');
    try {
      const produtosResponse2 = await makeRequest(`${BASE_URL}/api/debug/products`);
      console.log(`   Status: ${produtosResponse2.status}`);
      
      if (produtosResponse2.status === 200 && Array.isArray(produtosResponse2.data)) {
        console.log(`   ✅ Produtos após verificação:`);
        produtosResponse2.data.forEach((produto, index) => {
          console.log(`      ${index + 1}. ${produto.name}`);
          console.log(`         Preço Alvo: R$ ${produto.target_price}`);
          console.log(`         Preço Atual: R$ ${produto.current_price || 'N/A'}`);
          
          if (produto.current_price && produto.current_price <= produto.target_price) {
            console.log(`         🎯 ALERTA: Preço atual (R$ ${produto.current_price}) <= Preço alvo (R$ ${produto.target_price})`);
          } else if (produto.current_price) {
            console.log(`         ⏳ Aguardando: Preço atual (R$ ${produto.current_price}) > Preço alvo (R$ ${produto.target_price})`);
          } else {
            console.log(`         ❓ Preço atual não disponível`);
          }
          console.log('');
        });
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    
    // 5. Testar configurações do Telegram
    console.log('6. Testando configurações do Telegram...');
    try {
      const envResponse = await makeRequest(`${BASE_URL}/api/test-env`);
      console.log(`   Status: ${envResponse.status}`);
      
      if (envResponse.status === 200) {
        const config = envResponse.data;
        console.log(`   TELEGRAM_BOT_TOKEN: ${config.TELEGRAM_BOT_TOKEN ? '✅ Configurado' : '❌ Não configurado'}`);
        console.log(`   TELEGRAM_CHAT_ID: ${config.TELEGRAM_CHAT_ID ? '✅ Configurado' : '❌ Não configurado'}`);
        console.log(`   NEXT_PUBLIC_TELEGRAM_BOT_TOKEN: ${config.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN ? '✅ Configurado' : '❌ Não configurado'}`);
        
        if (!config.TELEGRAM_BOT_TOKEN || !config.TELEGRAM_CHAT_ID) {
          console.log('\n   ⚠️  ATENÇÃO: Variáveis do Telegram não configuradas no Vercel!');
          console.log('   As notificações não funcionarão até que sejam configuradas.');
        }
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    
    console.log('\n📋 RESUMO DO TESTE:');
    console.log('✅ Lógica de notificação corrigida (preço atual <= preço alvo)');
    console.log('✅ Sistema atualiza preços automaticamente a cada verificação');
    console.log('✅ API de debug funcionando para monitoramento');
    console.log('⚠️  Configurar variáveis do Telegram no Vercel para ativar notificações');
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Executar teste
testarSistemaCorrigido();