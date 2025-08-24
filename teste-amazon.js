require('dotenv').config({ path: '.env.local' });

const amazonUrl = 'https://www.amazon.com.br/Whisky-Buchanans-12-Anos-Litro/dp/B00MTFIL0U/ref=sr_1_8?crid=1TM1AGZ2XK460&dib=eyJ2IjoiMSJ9.HfJ5pBZivfonNouCxWjSt0zwwC_3HnQfVqARkrE1vfeLaUpw92A4FbXVnfIoTjioJ7SGCwx1tCQSUoacuG1YGPQwdd-2RcXLbHln1du2rlsfAF_lmSv-p89HS_fat997Shcz-lDLvusvY_qtWF4erSfe0IqVBxZTVuvUwgeG8y2hNQNnjEp6FEt8Wzu10T5sCRX5c3XSBRA5GsBZcF_FyrMsYhCdZh06qNJv_m81A8RDpBbJXnu8WFV5rMCuWwyYlpEhUFTQyfy4TnPtoUrL-XV-0C3NY21SOmTTl7ZUmag.pAEH5jVrvY3tequc2HQ1m-CBQVrbV2mDpQ9ebsUj4u8&dib_tag=se&keywords=whisky&qid=1755918501&sprefix=whi%2Caps%2C1642&sr=8-8&ufe=app_do%3Aamzn1.fos.db68964d-7c0e-4bb2-a95c-e5cb9e32eb12';

async function testAmazonPriceDetection() {
  console.log('🛒 TESTE DE DETECÇÃO DE PREÇOS - AMAZON BRASIL');
  console.log('==============================================');
  console.log('');
  console.log('📦 Produto: Whisky Buchanan\'s Deluxe 12 Anos 1L');
  console.log('🌐 Loja: Amazon Brasil');
  console.log('🔧 Melhorias implementadas:');
  console.log('   ✅ Seletores específicos da Amazon');
  console.log('   ✅ Função de extração de preços brasileiros');
  console.log('   ✅ Detecção automática');
  console.log('');
  console.log('⚠️  IMPORTANTE: Certifique-se de que o servidor Next.js está rodando!');
  console.log('');
  
  try {
    console.log('🔍 Testando detecção automática de preços...');
    
    const response = await fetch('http://localhost:3000/api/monitor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        products: [{
          id: 'test-amazon-1',
          name: 'Whisky Buchanan\'s Deluxe 12 Anos 1L',
          url: amazonUrl,
          selector: 'auto', // Usar detecção automática
          initialPrice: 250.00,
          currentPrice: 250.00,
          targetPrice: 200.00
        }],
        settings: {
          enabled: false, // Desabilitar notificações para teste
          telegram: {
            botToken: '',
            chatId: ''
          }
        }
      })
    });
    
    if (!response.ok) {
      console.log(`❌ Erro na API: ${response.status} ${response.statusText}`);
      return;
    }
    
    const result = await response.json();
    
    console.log('📊 RESULTADO DA API:');
    console.log('===================');
    console.log(`📡 Status: ${response.status}`);
    
    if (result.results && result.results.length > 0) {
      const productResult = result.results[0];
      
      if (productResult.success) {
        console.log('🎯 Detecção automática: ✅ SUCESSO!');
        console.log(`💰 Preço detectado: R$ ${productResult.newPrice}`);
        console.log(`🔧 Seletor usado: ${productResult.detectedSelector || 'N/A'}`);
        console.log(`📊 Preço em promoção: ${productResult.priceDropped ? 'SIM' : 'NÃO'}`);
        console.log('');
        console.log('🎉 PARABÉNS! O sistema agora consegue:');
        console.log('   ✅ Detectar preços da Amazon automaticamente');
        console.log('   ✅ Contornar sistemas anti-bot');
        console.log('   ✅ Usar seletores específicos da Amazon');
        console.log('   ✅ Processar formato de preços brasileiros');
        console.log('');
        console.log('🎊 TESTE CONCLUÍDO COM SUCESSO!');
      } else {
        console.log('🎯 Detecção automática: ❌ FALHOU');
        console.log('❌ Preço não foi detectado');
        console.log(`🔍 Erro: ${productResult.error}`);
      }
    } else {
      console.log('❌ Preço não foi detectado');
      console.log('📊 Resposta completa da API:', JSON.stringify(result, null, 2));
      
      if (result.error) {
        console.log(`🚨 Erro: ${result.error}`);
      }
      
      console.log('');
      console.log('💡 POSSÍVEIS SOLUÇÕES:');
      console.log('1. Verifique se o servidor Next.js está rodando');
      console.log('2. A Amazon pode estar bloqueando o acesso automatizado');
      console.log('3. Tente com uma URL mais simples da Amazon');
      console.log('4. Verifique se há captcha na página');
    }
    
  } catch (error) {
    console.log('❌ Erro durante o teste:', error.message);
    console.log('');
    console.log('💡 VERIFICAÇÕES:');
    console.log('1. O servidor Next.js está rodando em http://localhost:3000?');
    console.log('2. A API /api/monitor está funcionando?');
    console.log('3. Há problemas de conectividade?');
  }
}

testAmazonPriceDetection().catch(console.error);