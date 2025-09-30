// Teste completo do monitoramento de preços com notificação
require('dotenv').config({ path: '.env.local' });

const { PriceMonitorScheduler } = require('./src/lib/scheduler');

async function testarMonitoramentoCompleto() {
  console.log('🔍 TESTE COMPLETO DO MONITORAMENTO');
  console.log('==================================');
  console.log('');

  try {
    // Inicializar o scheduler
    console.log('⚙️ Inicializando sistema de monitoramento...');
    const scheduler = new PriceMonitorScheduler();
    
    // Executar verificação manual
    console.log('🚀 Executando verificação manual de preços...');
    console.log('📊 Isso irá:');
    console.log('   • Buscar todos os produtos ativos no banco');
    console.log('   • Fazer scraping dos preços atuais');
    console.log('   • Comparar com preços alvo');
    console.log('   • Enviar notificações no Telegram se necessário');
    console.log('');
    
    const resultado = await scheduler.runManualCheck();
    
    console.log('✅ Verificação manual concluída!');
    console.log('📊 Resultado:', resultado);
    
    if (resultado.notifications > 0) {
      console.log('');
      console.log('🎉 SUCESSO!');
      console.log(`📱 ${resultado.notifications} notificação(ões) enviada(s) para o Telegram!`);
      console.log('📱 Verifique seu Telegram para ver as informações dos produtos e preços!');
    } else {
      console.log('');
      console.log('ℹ️ Nenhuma notificação enviada.');
      console.log('💡 Possíveis motivos:');
      console.log('   • Nenhum produto cadastrado');
      console.log('   • Preços atuais ainda acima dos preços alvo');
      console.log('   • Produtos inativos ou com erro');
      console.log('');
      console.log('🔧 Para testar:');
      console.log('   1. Adicione um produto em http://localhost:3003');
      console.log('   2. Configure um preço alvo MENOR que o atual');
      console.log('   3. Execute este teste novamente');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Executar teste
testarMonitoramentoCompleto();