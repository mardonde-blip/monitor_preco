// Teste da API de verificação manual
require('dotenv').config({ path: '.env.local' });

async function testarAPIManual() {
  console.log('🔍 TESTE DA API DE VERIFICAÇÃO MANUAL');
  console.log('====================================');
  console.log('');

  try {
    console.log('📡 Fazendo requisição para API de verificação manual...');
    
    const response = await fetch('http://localhost:3003/api/check-prices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const resultado = await response.json();
    
    console.log('✅ Resposta da API recebida!');
    console.log('📊 Resultado completo:', JSON.stringify(resultado, null, 2));
    
    if (resultado.success) {
      console.log('');
      console.log('🎉 VERIFICAÇÃO CONCLUÍDA COM SUCESSO!');
      
      if (resultado.data) {
        const { checked, notifications, errors } = resultado.data;
        
        console.log(`📦 Produtos verificados: ${checked || 0}`);
        console.log(`📱 Notificações enviadas: ${notifications || 0}`);
        console.log(`❌ Erros encontrados: ${errors || 0}`);
        
        if (notifications > 0) {
          console.log('');
          console.log('🎯 NOTIFICAÇÕES ENVIADAS!');
          console.log('📱 Verifique seu Telegram para ver as informações dos produtos e preços!');
        } else {
          console.log('');
          console.log('ℹ️ Nenhuma notificação enviada.');
          console.log('💡 Para receber notificações:');
          console.log('   1. Acesse http://localhost:3003');
          console.log('   2. Adicione um produto');
          console.log('   3. Configure um preço alvo MENOR que o atual');
          console.log('   4. Execute este teste novamente');
        }
      }
    } else {
      console.log('❌ Erro na verificação:', resultado.error || 'Erro desconhecido');
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Dica: Certifique-se de que o servidor está rodando em http://localhost:3003');
    }
  }
}

// Executar teste
testarAPIManual();