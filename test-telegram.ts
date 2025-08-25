// Script para testar scraping e envio para Telegram
// Execute com: npx tsx test-telegram.ts

// Configurações do produto
const productUrl = 'https://www.carrefour.com.br/whisky-buchanans-deluxe-12-anos-1l-6-unidades-b2-6-164666/p';
const productName = 'Whisky Buchanan\'s Deluxe 12 Anos 1L';

// Configurações do Telegram (SUBSTITUA PELOS SEUS VALORES REAIS)
const TELEGRAM_BOT_TOKEN = 'SEU_BOT_TOKEN_AQUI';
const TELEGRAM_CHAT_ID = 'SEU_CHAT_ID_AQUI';

async function sendTelegramMessage(message: string): Promise<void> {
  if (TELEGRAM_BOT_TOKEN === 'SEU_BOT_TOKEN_AQUI' || TELEGRAM_CHAT_ID === 'SEU_CHAT_ID_AQUI') {
    console.log('\n⚠️  CONFIGURAÇÃO NECESSÁRIA:');
    console.log('1. Crie um bot no Telegram com @BotFather');
    console.log('2. Obtenha o token do bot');
    console.log('3. Obtenha seu chat ID (envie /start para @userinfobot)');
    console.log('4. Substitua os valores no script');
    console.log('\n📱 Mensagem que seria enviada:');
    console.log('---');
    console.log(message.replace(/<[^>]*>/g, '').replace(/\\n/g, '\n'));
    console.log('---');
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });
    
    const result = await response.json() as any;
    if (result.ok) {
      console.log('✅ Mensagem enviada para o Telegram com sucesso!');
    } else {
      console.error('❌ Erro ao enviar mensagem:', result.description);
    }
  } catch (error: any) {
    console.error('❌ Erro na requisição para o Telegram:', error.message);
  }
}

async function testScrapingViaAPI(): Promise<void> {
  console.log('🔍 Testando scraping via API do sistema...');
  console.log(`📦 Produto: ${productName}`);
  console.log(`🔗 URL: ${productUrl}`);
  console.log('');
  
  try {
    // Fazer requisição para a API de monitoramento
    const response = await fetch('http://localhost:3000/api/monitor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        products: [{
          id: 'test-' + Date.now(),
          name: productName,
          url: productUrl,
          selector: 'auto', // Usar detecção automática
          initialPrice: 0
        }]
      })
    });
    
    const result = await response.json() as any;
    
    if (result.success && result.results && result.results.length > 0) {
      const productResult = result.results[0];
      
      if (productResult.success) {
        console.log(`✅ Preço encontrado: R$ ${productResult.price}`);
        console.log(`🎯 Seletor usado: ${productResult.detectedSelector || 'N/A'}`);
        
        // Preparar mensagem para o Telegram
        const message = `🛒 <b>Preço Encontrado!</b>\n\n` +
                       `📦 <b>Produto:</b> ${productName}\n` +
                       `💰 <b>Preço:</b> R$ ${productResult.price}\n` +
                       `🏪 <b>Loja:</b> Carrefour\n` +
                       `🔗 <b>Link:</b> <a href="${productUrl}">Ver produto</a>\n\n` +
                       `🎯 <b>Seletor CSS:</b> <code>${productResult.detectedSelector || 'auto'}</code>\n` +
                       `🤖 <i>Detectado automaticamente pelo sistema</i>`;
        
        // Enviar para o Telegram
        await sendTelegramMessage(message);
        
      } else {
        console.log('❌ Não foi possível encontrar o preço');
        console.log('Erro:', productResult.error);
        
        // Enviar erro para o Telegram
        const errorMessage = `❌ <b>Erro no Scraping</b>\n\n` +
                            `📦 <b>Produto:</b> ${productName}\n` +
                            `🔗 <b>URL:</b> <a href="${productUrl}">Ver produto</a>\n` +
                            `⚠️ <b>Erro:</b> ${productResult.error}`;
        
        await sendTelegramMessage(errorMessage);
      }
    } else {
      console.log('❌ Erro na API:', result.error || 'Resposta inválida');
      
      const apiErrorMessage = `🚨 <b>Erro na API</b>\n\n` +
                             `📦 <b>Produto:</b> ${productName}\n` +
                             `💥 <b>Erro:</b> ${result.error || 'Resposta inválida da API'}`;
      
      await sendTelegramMessage(apiErrorMessage);
    }
    
  } catch (error: any) {
    console.error('❌ Erro durante o teste:', error.message);
    
    // Enviar erro crítico para o Telegram
    const criticalErrorMessage = `🚨 <b>Erro Crítico</b>\n\n` +
                                `📦 <b>Produto:</b> ${productName}\n` +
                                `💥 <b>Erro:</b> ${error.message}`;
    
    await sendTelegramMessage(criticalErrorMessage);
  }
}

// Executar o teste
console.log('🚀 Iniciando teste de scraping e Telegram...');
console.log('\n📋 INSTRUÇÕES:');
console.log('1. Certifique-se de que o servidor está rodando (npm run dev)');
console.log('2. Configure seu bot do Telegram substituindo os valores no script');
console.log('3. Execute: npx tsx test-telegram.ts');
console.log('');

testScrapingViaAPI().then(() => {
  console.log('\n🎉 Teste concluído!');
}).catch((error) => {
  console.error('💥 Erro fatal:', error);
});