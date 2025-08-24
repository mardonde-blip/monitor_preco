require('dotenv').config({ path: '.env.local' });

// URL mais simples da Amazon
const amazonUrl = 'https://www.amazon.com.br/dp/B00MTFIL0U';

async function testAmazonSimple() {
  console.log('🛒 TESTE AMAZON - URL SIMPLIFICADA');
  console.log('==================================');
  console.log('');
  console.log('🌐 URL:', amazonUrl);
  console.log('');
  
  try {
    console.log('🔍 Enviando requisição para a API...');
    
    const response = await fetch('http://localhost:3000/api/monitor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        products: [{
          id: 'test-amazon-1',
          name: 'Whisky Buchanan\'s 12 Anos - Teste Amazon',
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
    
    const responseText = await response.text();
    console.log('📄 Resposta bruta:', responseText);
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      
      if (result.newPrice !== undefined && result.newPrice !== null) {
        console.log('');
        console.log('✅ SUCESSO!');
        console.log(`💰 Preço: R$ ${result.newPrice.toFixed(2)}`);
        console.log(`🎯 Seletor: ${result.detectedSelector}`);
      } else {
        console.log('');
        console.log('❌ Preço não detectado');
        console.log('📊 Resultado:', JSON.stringify(result, null, 2));
      }
    } else {
      console.log('');
      console.log('❌ Erro na API');
      console.log('📄 Resposta:', responseText);
    }
    
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }
}

testAmazonSimple().catch(console.error);