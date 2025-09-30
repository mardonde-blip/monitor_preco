const http = require('http');

// Configuração para teste local
const BASE_URL = 'http://localhost:3000';

// Função para fazer requisições HTTP locais
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
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

async function testarNotificacoesLocal() {
  console.log('🔍 DIAGNÓSTICO LOCAL: Por que as notificações não funcionaram?\n');
  
  try {
    // 1. Verificar se o servidor local está rodando
    console.log('1. Verificando servidor local...');
    try {
      const healthResponse = await makeRequest(`${BASE_URL}/api/test-db`);
      console.log(`   Status: ${healthResponse.status}`);
      
      if (healthResponse.status === 200) {
        console.log('   ✅ Servidor local está rodando');
      } else {
        console.log('   ❌ Servidor local não está respondendo');
        console.log('   💡 Execute "npm run dev" em outro terminal');
        return;
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
      console.log('   💡 Certifique-se de que o servidor local está rodando (npm run dev)');
      return;
    }
    
    // 2. Verificar produtos e preços atuais
    console.log('\n2. Verificando produtos cadastrados...');
    try {
      const produtosResponse = await makeRequest(`${BASE_URL}/api/products`, {
        headers: {
          'Cookie': 'user_id=1' // Simular autenticação
        }
      });
      console.log(`   Status: ${produtosResponse.status}`);
      
      if (produtosResponse.status === 200) {
        const produtos = produtosResponse.data.products || [];
        console.log(`   ✅ ${produtos.length} produtos encontrados:`);
        
        let produtosComAlerta = 0;
        produtos.forEach((produto, index) => {
          console.log(`\n      ${index + 1}. ${produto.name}`);
          console.log(`         URL: ${produto.url}`);
          console.log(`         Preço Alvo: R$ ${produto.target_price}`);
          console.log(`         Preço Atual: R$ ${produto.current_price || 'N/A'}`);
          
          // Verificar condição de alerta (nova lógica: atual <= alvo)
          if (produto.current_price !== null && produto.current_price !== undefined && 
              produto.target_price !== null && produto.target_price !== undefined) {
            
            if (produto.current_price <= produto.target_price) {
              console.log(`         🎯 DEVE NOTIFICAR: ${produto.current_price} <= ${produto.target_price}`);
              produtosComAlerta++;
            } else {
              console.log(`         ⏳ Aguardando: ${produto.current_price} > ${produto.target_price}`);
            }
          } else {
            console.log(`         ❓ Preço atual não disponível - problema de scraping`);
          }
        });
        
        console.log(`\n   📊 Resumo: ${produtosComAlerta} produto(s) deveriam gerar notificação`);
        
        if (produtosComAlerta > 0) {
          console.log('   🚨 PROBLEMA IDENTIFICADO: Produtos com preço baixo mas sem notificação!');
        }
      } else {
        console.log(`   ❌ Erro: ${JSON.stringify(produtosResponse.data)}`);
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    
    // 3. Verificar configurações de notificação
    console.log('\n3. Verificando configurações de notificação...');
    try {
      const settingsResponse = await makeRequest(`${BASE_URL}/api/settings`);
      console.log(`   Status: ${settingsResponse.status}`);
      
      if (settingsResponse.status === 200) {
        const settings = settingsResponse.data;
        console.log(`   Notificações habilitadas: ${settings.enabled ? '✅ SIM' : '❌ NÃO'}`);
        
        if (settings.telegram) {
          console.log(`   Bot Token: ${settings.telegram.botToken ? '✅ Configurado' : '❌ Não configurado'}`);
          console.log(`   Chat ID: ${settings.telegram.chatId ? '✅ Configurado' : '❌ Não configurado'}`);
        }
        
        if (!settings.enabled) {
          console.log('   🚨 PROBLEMA: Notificações estão desabilitadas!');
        }
        
        if (!settings.telegram?.botToken || !settings.telegram?.chatId) {
          console.log('   🚨 PROBLEMA: Configurações do Telegram incompletas!');
        }
      } else {
        console.log(`   ❌ Erro: ${JSON.stringify(settingsResponse.data)}`);
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    
    // 4. Testar Telegram diretamente
    console.log('\n4. Testando Telegram...');
    try {
      const telegramResponse = await makeRequest(`${BASE_URL}/api/test-telegram`);
      console.log(`   Status: ${telegramResponse.status}`);
      
      if (telegramResponse.status === 200) {
        console.log(`   ✅ Telegram: ${telegramResponse.data.success ? 'Funcionando' : 'Com erro'}`);
        if (telegramResponse.data.message) {
          console.log(`   Mensagem: ${telegramResponse.data.message}`);
        }
        if (telegramResponse.data.error) {
          console.log(`   ❌ Erro: ${telegramResponse.data.error}`);
        }
      } else {
        console.log(`   ❌ Erro: ${JSON.stringify(telegramResponse.data)}`);
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    
    // 5. Verificar status do scheduler
    console.log('\n5. Verificando scheduler...');
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
        
        if (!schedulerResponse.data.running) {
          console.log('   💡 Para iniciar: POST /api/scheduler com {"action": "start"}');
        }
      } else {
        console.log(`   ❌ Erro: ${JSON.stringify(schedulerResponse.data)}`);
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    
    // 6. Executar verificação manual para testar
    console.log('\n6. Executando verificação manual...');
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
        console.log('   📝 Aguardando processamento...');
      } else {
        console.log(`   ❌ Erro: ${JSON.stringify(manualResponse.data)}`);
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    
    console.log('\n📋 RESUMO DO DIAGNÓSTICO LOCAL:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🔍 PRINCIPAIS CAUSAS POSSÍVEIS:');
    console.log('');
    console.log('1. ❌ Notificações desabilitadas nas configurações');
    console.log('2. ❌ Telegram não configurado (bot token / chat ID)');
    console.log('3. ❌ Scheduler não está rodando automaticamente');
    console.log('4. ❌ Preços não foram atualizados (problema de scraping)');
    console.log('5. ❌ Erro na lógica de comparação de preços');
    console.log('');
    console.log('💡 SOLUÇÕES:');
    console.log('1. Habilite as notificações na interface');
    console.log('2. Configure o bot do Telegram');
    console.log('3. Inicie o scheduler automático');
    console.log('4. Verifique se os preços estão sendo atualizados');
    console.log('5. Execute verificação manual para testar');
    
  } catch (error) {
    console.error('❌ Erro geral no diagnóstico:', error);
  }
}

// Executar diagnóstico
testarNotificacoesLocal();