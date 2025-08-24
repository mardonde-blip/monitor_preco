require('dotenv').config({ path: '.env.local' });

console.log('🛒 TESTE FINAL AMAZON - DETECÇÃO DE PREÇOS');
console.log('==========================================');

const amazonUrl = 'https://www.amazon.com.br/Whisky-Buchanans-12-Anos-Litro/dp/B00MTFIL0U/ref=sr_1_8?crid=1TM1AGZ2XK460&dib=eyJ2IjoiMSJ9.HfJ5pBZivfonNouCxWjSt0zwwC_3HnQfVqARkrE1vfeLaUpw92A4FbXVnfIoTjioJ7SGCwx1tCQSUoacuG1YGPQwdd-2RcXLbHln1du2rlsfAF_lmSv-p89HS_fat997Shcz-lDLvusvY_qtWF4erSfe0IqVBxZTVuvUwgeG8y2hNQNnjEp6FEt8Wzu10T5sCRX5c3XSBRA5GsBZcF_FyrMsYhCdZh06qNJv_m81A8RDpBbJXnu8WFV5rMCuWwyYlpEhUFTQyfy4TnPtoUrL-XV-0C3NY21SOmTTl7ZUmag.pAEH5jVrvY3tequc2HQ1m-CBQVrbV2mDpQ9ebsUj4u8&dib_tag=se&keywords=whisky&qid=1755918501&sprefix=whi%2Caps%2C1642&sr=8-8&ufe=app_do%3Aamzn1.fos.db68964d-7c0e-4bb2-a95c-e5cb9e32eb12';

console.log(`🌐 URL: ${amazonUrl}`);
console.log('');

async function testarAmazon() {
  try {
    console.log('🔍 Testando detecção automática de preços da Amazon...');
    
    const response = await fetch('http://localhost:3000/api/monitor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        products: [{
          id: 'test-amazon-final',
          name: 'Whisky Buchanan\'s Deluxe 12 Anos 1L - Amazon',
          url: amazonUrl,
          initialPrice: 200.00,
          selector: 'auto',
          createdAt: new Date(),
          priceHistory: []
        }],
        settings: {
          enabled: false,
          telegram: {
            botToken: '',
            chatId: ''
          }
        }
      })
    });

    console.log(`📡 Status da resposta: ${response.status}`);
    
    const data = await response.json();
    console.log('📄 Resposta completa:', JSON.stringify(data, null, 2));
    
    if (data.results && data.results[0] && data.results[0].success) {
      const result = data.results[0];
      console.log('');
      console.log('✅ SUCESSO! Preço detectado da Amazon:');
      console.log(`💰 Preço atual: R$ ${result.newPrice}`);
      console.log(`🎯 Seletor usado: ${result.detectedSelector}`);
      console.log(`📊 Preço caiu: ${result.priceDropped ? 'Sim' : 'Não'}`);
      console.log('');
      console.log('🎉 O sistema agora consegue detectar preços da Amazon automaticamente!');
      console.log('📝 Seletores Amazon funcionando:');
      console.log('   - .a-price .a-offscreen');
      console.log('   - .a-price-whole');
      console.log('   - .a-price .a-price-whole');
      console.log('   - [data-a-price] .a-offscreen');
      console.log('');
      console.log('💡 Como usar:');
      console.log('   1. Acesse http://localhost:3000');
      console.log('   2. Cole a URL do produto Amazon');
      console.log('   3. O sistema detectará o preço automaticamente');
      console.log('   4. Configure o preço alvo desejado');
    } else {
      console.log('');
      console.log('❌ Não foi possível detectar o preço');
      console.log('📊 Resultado:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testarAmazon();