// Usando fetch nativo do Node.js 18+

console.log('🧪 TESTE COMPLETO DO SISTEMA DE MONITORAMENTO');
console.log('==============================================\n');

const BASE_URL = 'http://localhost:3000';

async function testarSistemaCompleto() {
  try {
    console.log('1️⃣ Verificando status inicial...');
    
    // Verificar status do scheduler
    const statusResponse = await fetch(`${BASE_URL}/api/scheduler/status`);
    const statusData = await statusResponse.json();
    console.log('   Status do Scheduler:', statusData.success ? '✅ OK' : '❌ ERRO');
    console.log('   Produtos cadastrados:', statusData.productsCount || 0);
    console.log('   Notificações habilitadas:', statusData.notificationsEnabled ? '✅ SIM' : '❌ NÃO');
    
    console.log('\n2️⃣ Adicionando produto de teste...');
    
    // Adicionar produto de teste
    const produtoTeste = {
      name: 'Produto de Teste - Monitor de Preços',
      url: 'https://www.carrefour.com.br/produto-teste',
      selector: 'auto',
      initialPrice: 100.00,
      targetPrice: 80.00,
      currentPrice: 100.00
    };
    
    const addProductResponse = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(produtoTeste)
    });
    
    const addProductData = await addProductResponse.json();
    console.log('   Produto adicionado:', addProductData.success ? '✅ OK' : '❌ ERRO');
    
    if (addProductData.success) {
      console.log('   ID do produto:', addProductData.product.id);
      console.log('   Nome:', addProductData.product.name);
      console.log('   Preço inicial: R$', addProductData.product.initialPrice.toFixed(2));
      console.log('   Preço alvo: R$', addProductData.product.targetPrice.toFixed(2));
    }
    
    console.log('\n3️⃣ Verificando produtos cadastrados...');
    
    // Listar produtos
    const productsResponse = await fetch(`${BASE_URL}/api/products`);
    const productsData = await productsResponse.json();
    console.log('   Produtos encontrados:', productsData.success ? productsData.products.length : 0);
    
    console.log('\n4️⃣ Testando verificação manual...');
    
    // Executar verificação manual
    const checkResponse = await fetch(`${BASE_URL}/api/scheduler/check`, {
      method: 'POST'
    });
    
    const checkData = await checkResponse.json();
    console.log('   Verificação manual:', checkData.success ? '✅ OK' : '❌ ERRO');
    
    if (checkData.success) {
      console.log('   Produtos verificados:', checkData.productsChecked);
      console.log('   Timestamp:', checkData.timestamp);
    } else {
      console.log('   Erro:', checkData.error);
    }
    
    console.log('\n5️⃣ Testando inicialização do scheduler...');
    
    // Iniciar scheduler
    const startResponse = await fetch(`${BASE_URL}/api/scheduler`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'start',
        intervalMinutes: 5 // 5 minutos para teste
      })
    });
    
    const startData = await startResponse.json();
    console.log('   Scheduler iniciado:', startData.success ? '✅ OK' : '❌ ERRO');
    
    if (startData.success) {
      console.log('   Status:', startData.isRunning ? 'Rodando' : 'Parado');
      console.log('   Mensagem:', startData.message);
    }
    
    console.log('\n6️⃣ Verificando status final...');
    
    // Verificar status final
    const finalStatusResponse = await fetch(`${BASE_URL}/api/scheduler/status`);
    const finalStatusData = await finalStatusResponse.json();
    
    console.log('   Scheduler ativo:', finalStatusData.isRunning ? '✅ SIM' : '❌ NÃO');
    console.log('   Produtos monitorados:', finalStatusData.productsCount);
    console.log('   Notificações:', finalStatusData.notificationsEnabled ? '✅ Habilitadas' : '❌ Desabilitadas');
    console.log('   Telegram configurado:', finalStatusData.settings?.telegramConfigured ? '✅ SIM' : '❌ NÃO');
    
    console.log('\n📋 RESUMO DO TESTE');
    console.log('==================');
    
    const sistemaFuncionando = (
      finalStatusData.success &&
      finalStatusData.isRunning &&
      finalStatusData.productsCount > 0 &&
      finalStatusData.notificationsEnabled &&
      finalStatusData.settings?.telegramConfigured
    );
    
    if (sistemaFuncionando) {
      console.log('🎉 SISTEMA FUNCIONANDO PERFEITAMENTE!');
      console.log('✅ Scheduler ativo');
      console.log('✅ Produtos cadastrados');
      console.log('✅ Notificações habilitadas');
      console.log('✅ Telegram configurado');
      console.log('\n🚀 O monitoramento automático está rodando!');
      console.log('📱 Você receberá alertas quando os preços baixarem.');
    } else {
      console.log('⚠️ SISTEMA PARCIALMENTE CONFIGURADO');
      
      if (!finalStatusData.isRunning) {
        console.log('❌ Scheduler não está rodando');
      }
      if (finalStatusData.productsCount === 0) {
        console.log('❌ Nenhum produto cadastrado');
      }
      if (!finalStatusData.notificationsEnabled) {
        console.log('❌ Notificações não habilitadas');
      }
      if (!finalStatusData.settings?.telegramConfigured) {
        console.log('❌ Telegram não configurado');
      }
    }
    
    console.log('\n🔧 PRÓXIMOS PASSOS:');
    console.log('1. Acesse http://localhost:3000');
    console.log('2. Adicione produtos reais para monitorar');
    console.log('3. Configure preços alvo menores que os atuais');
    console.log('4. O sistema enviará alertas automaticamente!');
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.message);
    console.log('\n🔧 VERIFIQUE:');
    console.log('- Se o servidor está rodando em http://localhost:3000');
    console.log('- Se as APIs foram criadas corretamente');
    console.log('- Se não há erros no terminal do servidor');
  }
}

testarSistemaCompleto();