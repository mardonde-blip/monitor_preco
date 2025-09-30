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

async function diagnosticarNotificacoes() {
  console.log('🔍 DIAGNÓSTICO: Por que as notificações não estão funcionando?\n');
  
  try {
    // 1. Verificar variáveis do Telegram
    console.log('1. Verificando configuração do Telegram...');
    try {
      const envResponse = await makeRequest(`${BASE_URL}/api/test-env`);
      console.log(`   Status: ${envResponse.status}`);
      
      if (envResponse.status === 200) {
        const config = envResponse.data;
        console.log(`   TELEGRAM_BOT_TOKEN: ${config.TELEGRAM_BOT_TOKEN ? '✅ Configurado' : '❌ NÃO CONFIGURADO'}`);
        console.log(`   TELEGRAM_CHAT_ID: ${config.TELEGRAM_CHAT_ID ? '✅ Configurado' : '❌ NÃO CONFIGURADO'}`);
        console.log(`   NEXT_PUBLIC_TELEGRAM_BOT_TOKEN: ${config.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN ? '✅ Configurado' : '❌ NÃO CONFIGURADO'}`);
        
        if (!config.TELEGRAM_BOT_TOKEN || !config.TELEGRAM_CHAT_ID) {
          console.log('\n   🚨 PROBLEMA IDENTIFICADO: Variáveis do Telegram não configuradas!');
          console.log('   ➡️  SOLUÇÃO: Configure no painel do Vercel:');
          console.log('       - TELEGRAM_BOT_TOKEN');
          console.log('       - TELEGRAM_CHAT_ID');
          console.log('       - NEXT_PUBLIC_TELEGRAM_BOT_TOKEN');
        }
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    
    // 2. Verificar produtos e preços
    console.log('\n2. Verificando produtos cadastrados...');
    try {
      const produtosResponse = await makeRequest(`${BASE_URL}/api/debug/products`);
      console.log(`   Status: ${produtosResponse.status}`);
      
      if (produtosResponse.status === 200 && Array.isArray(produtosResponse.data.products)) {
        console.log(`   ✅ ${produtosResponse.data.products.length} produtos encontrados:`);
        
        let produtosComAlerta = 0;
        produtosResponse.data.products.forEach((produto, index) => {
          console.log(`\n      ${index + 1}. ${produto.name}`);
          console.log(`         Preço Alvo: R$ ${produto.target_price}`);
          console.log(`         Preço Atual: R$ ${produto.current_price || 'N/A'}`);
          
          if (produto.current_price && produto.current_price <= produto.target_price) {
            console.log(`         🎯 DEVE NOTIFICAR: ${produto.current_price} <= ${produto.target_price}`);
            produtosComAlerta++;
          } else if (produto.current_price) {
            console.log(`         ⏳ Aguardando: ${produto.current_price} > ${produto.target_price}`);
          } else {
            console.log(`         ❓ Preço atual não disponível - pode ser problema de scraping`);
          }
        });
        
        console.log(`\n   📊 Resumo: ${produtosComAlerta} produto(s) deveriam gerar notificação`);
        
        if (produtosComAlerta > 0) {
          console.log('   🚨 PROBLEMA: Produtos com preço baixo mas sem notificação!');
        }
      } else {
        console.log(`   ❌ Erro ou formato inesperado: ${JSON.stringify(produtosResponse.data).substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    
    // 3. Verificar status do scheduler
    console.log('\n3. Verificando scheduler...');
    try {
      const schedulerResponse = await makeRequest(`${BASE_URL}/api/scheduler`);
      console.log(`   Status: ${schedulerResponse.status}`);
      
      if (schedulerResponse.status === 200) {
        console.log(`   Scheduler: ${schedulerResponse.data.running ? '✅ RODANDO' : '❌ PARADO'}`);
        if (schedulerResponse.data.lastRun) {
          console.log(`   Última execução: ${schedulerResponse.data.lastRun}`);
        } else {
          console.log('   ⚠️  Nenhuma execução registrada');
        }
      } else {
        console.log(`   ❌ Erro: ${JSON.stringify(schedulerResponse.data)}`);
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    
    // 4. Testar verificação manual
    console.log('\n4. Executando verificação manual...');
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
        console.log(`   ✅ Verificação iniciada: ${manualResponse.data.message}`);
      } else {
        console.log(`   ❌ Erro: ${JSON.stringify(manualResponse.data)}`);
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    
    // 5. Aguardar e verificar novamente
    console.log('\n5. Aguardando 20 segundos para verificação...');
    await new Promise(resolve => setTimeout(resolve, 20000));
    
    console.log('6. Verificando produtos após verificação manual...');
    try {
      const produtosResponse2 = await makeRequest(`${BASE_URL}/api/debug/products`);
      
      if (produtosResponse2.status === 200 && Array.isArray(produtosResponse2.data.products)) {
        console.log('   📊 Status após verificação:');
        
        produtosResponse2.data.products.forEach((produto, index) => {
          console.log(`\n      ${index + 1}. ${produto.name}`);
          console.log(`         Preço Alvo: R$ ${produto.target_price}`);
          console.log(`         Preço Atual: R$ ${produto.current_price || 'N/A'}`);
          
          if (produto.current_price && produto.current_price <= produto.target_price) {
            console.log(`         🎯 DEVERIA TER NOTIFICADO: ${produto.current_price} <= ${produto.target_price}`);
          }
        });
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    
    // 6. Testar Telegram diretamente
    console.log('\n7. Testando Telegram diretamente...');
    try {
      const telegramResponse = await makeRequest(`${BASE_URL}/api/test-telegram`);
      console.log(`   Status: ${telegramResponse.status}`);
      
      if (telegramResponse.status === 200) {
        console.log(`   ✅ Telegram: ${telegramResponse.data.success ? 'Funcionando' : 'Com erro'}`);
        if (telegramResponse.data.message) {
          console.log(`   Mensagem: ${telegramResponse.data.message}`);
        }
      } else {
        console.log(`   ❌ Erro: ${JSON.stringify(telegramResponse.data)}`);
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    
    console.log('\n📋 DIAGNÓSTICO COMPLETO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 POSSÍVEIS CAUSAS DA FALTA DE NOTIFICAÇÃO:');
    console.log('');
    console.log('1. ❌ Variáveis do Telegram não configuradas no Vercel');
    console.log('2. ❌ Scheduler não está rodando automaticamente');
    console.log('3. ❌ Erro no scraping de preços');
    console.log('4. ❌ Problema na lógica de comparação de preços');
    console.log('5. ❌ Erro na API de notificação');
    console.log('');
    console.log('💡 PRÓXIMOS PASSOS:');
    console.log('1. Configure as variáveis do Telegram no Vercel');
    console.log('2. Inicie o scheduler automático');
    console.log('3. Teste novamente o monitoramento');
    
  } catch (error) {
    console.error('❌ Erro geral no diagnóstico:', error);
  }
}

// Executar diagnóstico
diagnosticarNotificacoes();