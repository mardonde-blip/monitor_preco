// Teste da API de debug após deploy
require('dotenv').config({ path: '.env.local' });

const PRODUCTION_URL = 'https://monitor-preco.vercel.app';

async function testarDebugAPI() {
  console.log('🔍 TESTANDO API DE DEBUG');
  console.log('========================');
  console.log('');

  // Aguardar um pouco para o deploy ser processado
  console.log('⏳ Aguardando deploy ser processado (30 segundos)...');
  await new Promise(resolve => setTimeout(resolve, 30000));

  console.log('🚀 Testando API de debug...');
  
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/debug/products`);
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API de debug funcionando!');
      console.log('📊 Resultado:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        console.log('');
        console.log(`📦 Total de produtos: ${data.total}`);
        
        if (data.products && data.products.length > 0) {
          console.log('📋 Produtos encontrados:');
          data.products.forEach((produto, index) => {
            console.log(`   ${index + 1}. ${produto.name}`);
            console.log(`      Preço atual: R$ ${produto.currentPrice || 'N/A'}`);
            console.log(`      Preço alvo: R$ ${produto.targetPrice}`);
            console.log(`      Loja: ${produto.store}`);
            console.log(`      Usuário: ${produto.userId}`);
            console.log(`      URL: ${produto.url}`);
            console.log('');
          });
          
          console.log('🎉 PRODUTOS ENCONTRADOS!');
          console.log('💡 O monitoramento deveria estar funcionando...');
          console.log('');
          console.log('🔍 Vamos testar o scheduler agora:');
          
          // Testar scheduler
          const schedulerResponse = await fetch(`${PRODUCTION_URL}/api/scheduler`, {
            method: 'POST'
          });
          
          console.log(`🚀 Scheduler Status: ${schedulerResponse.status}`);
          
          if (schedulerResponse.ok) {
            const schedulerData = await schedulerResponse.json();
            console.log('✅ Scheduler funcionando!');
            console.log('📊 Resultado:', JSON.stringify(schedulerData, null, 2));
          } else {
            const errorText = await schedulerResponse.text();
            console.log('❌ Erro no scheduler:');
            console.log(errorText);
          }
          
        } else {
          console.log('⚠️ Nenhum produto cadastrado');
          console.log('💡 Isso explica por que o monitoramento não funciona!');
          console.log('');
          console.log('🎯 SOLUÇÃO:');
          console.log('1. Acesse: https://monitor-preco.vercel.app');
          console.log('2. Faça login ou cadastre-se');
          console.log('3. Adicione produtos para monitorar');
          console.log('4. Configure preços alvo');
        }
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Erro na API de debug:');
      console.log(errorText);
    }
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }

  // Testar Telegram
  console.log('');
  console.log('📱 Testando Telegram...');
  
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  
  if (BOT_TOKEN && CHAT_ID) {
    try {
      const telegramResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: `🔍 **DIAGNÓSTICO ATUALIZADO**\n\n⏰ ${new Date().toLocaleString('pt-BR')}\n\n🔧 API de debug criada e testada\n📊 Verificando produtos cadastrados...\n\n💡 Resultados em breve!`,
          parse_mode: 'Markdown'
        })
      });

      if (telegramResponse.ok) {
        console.log('✅ Telegram funcionando!');
      }
    } catch (error) {
      console.log(`❌ Erro no Telegram: ${error.message}`);
    }
  }
}

testarDebugAPI();