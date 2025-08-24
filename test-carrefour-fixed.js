// Script para testar se o sistema agora consegue detectar o preço do Carrefour
// Execute com: node test-carrefour-fixed.js

const axios = require('axios');

const productUrl = 'https://www.carrefour.com.br/whisky-buchanans-deluxe-12-anos-1l-6-unidades-b2-6-164666/p';
const apiUrl = 'http://localhost:3000/api/monitor';

async function testCarrefourPriceDetection() {
  console.log('🎯 TESTE DE DETECÇÃO DE PREÇO - CARREFOUR');
  console.log('=' .repeat(50));
  console.log(`🔗 Produto: ${productUrl}`);
  console.log('');
  
  try {
    console.log('🚀 Enviando requisição para a API...');
    
    const requestData = {
      products: [{
        name: 'Whisky Buchanan\'s Deluxe 12 Anos 1L - Teste',
        url: productUrl,
        selector: 'auto', // Usar detecção automática
        targetPrice: 800.00
      }],
      settings: {
        enabled: false, // Não enviar notificação, apenas testar detecção
        telegram: {
          botToken: 'test',
          chatId: 'test'
        }
      }
    };
    
    const response = await axios.post(apiUrl, requestData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 segundos de timeout
    });
    
    console.log(`✅ Status da resposta: ${response.status}`);
    console.log('');
    
    if (response.data) {
      console.log('📊 RESULTADO DA DETECÇÃO:');
      console.log('─'.repeat(30));
      
      if (response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        
        if (result.success) {
          console.log('🎉 SUCESSO! Preço detectado automaticamente!');
          
          if (result.currentPrice !== undefined && result.currentPrice !== null) {
            console.log(`💰 Preço encontrado: R$ ${result.currentPrice.toFixed(2)}`);
          } else {
            console.log(`💰 Preço encontrado: ${result.currentPrice}`);
          }
          
          console.log(`🎯 Seletor usado: ${result.detectedSelector || 'N/A'}`);
          
          if (result.targetPrice !== undefined && result.targetPrice !== null) {
            console.log(`📈 Preço alvo: R$ ${result.targetPrice.toFixed(2)}`);
            
            if (result.currentPrice && result.currentPrice <= result.targetPrice) {
              console.log('🔥 ALERTA: Preço está abaixo do valor alvo!');
            } else {
              console.log('📊 Preço ainda está acima do valor alvo.');
            }
          }
        } else {
          console.log('❌ FALHA na detecção do preço');
          console.log(`🚫 Erro: ${result.error || 'Erro desconhecido'}`);
        }
      } else {
        console.log('❌ Nenhum resultado retornado pela API');
      }
      
      console.log('');
      console.log('📋 RESPOSTA COMPLETA DA API:');
      console.log(JSON.stringify(response.data, null, 2));
    }
    
  } catch (error) {
    console.error('💥 ERRO na requisição:');
    
    if (error.response) {
      console.error(`❌ Status: ${error.response.status}`);
      console.error(`❌ Dados: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      console.error('❌ Erro de rede - servidor não respondeu');
      console.error('💡 Certifique-se de que o servidor está rodando em http://localhost:3000');
    } else {
      console.error(`❌ Erro: ${error.message}`);
    }
  }
}

console.log('🔧 TESTE DE DETECÇÃO DE PREÇO APRIMORADO');
console.log('');
console.log('Este teste irá:');
console.log('1. ✅ Usar os novos seletores específicos do Carrefour');
console.log('2. ✅ Testar a função melhorada de extração de preços brasileiros');
console.log('3. ✅ Verificar se o preço R$ 899,94 é detectado corretamente');
console.log('4. ✅ Mostrar qual seletor CSS funcionou');
console.log('');
console.log('⚠️  IMPORTANTE: Certifique-se de que o servidor Next.js está rodando!');
console.log('   Execute: npm run dev');
console.log('');

testCarrefourPriceDetection().then(() => {
  console.log('');
  console.log('🎯 TESTE CONCLUÍDO!');
  console.log('');
  console.log('📋 PRÓXIMOS PASSOS:');
  console.log('1. Se o preço foi detectado: ✅ Sistema funcionando!');
  console.log('2. Se ainda não funcionou: 🔍 Verificar logs do servidor');
  console.log('3. Testar com outros produtos do Carrefour');
}).catch(error => {
  console.error('💥 Erro fatal no teste:', error.message);
});