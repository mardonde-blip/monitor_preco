require('dotenv').config({ path: '.env.local' });

async function testeNextJSSimulation() {
  console.log('🔍 TESTE SIMULAÇÃO NEXT.JS');
  console.log('===========================');
  
  try {
    // Simular o import dinâmico do Next.js
    const { createPostgreSQLAdapter } = await import('./src/lib/database-adapter.ts');
    const DatabaseAdapter = await createPostgreSQLAdapter();
    
    console.log('📋 Testando DatabaseAdapter.updateProduct...');
    
    // Simular exatamente os parâmetros que o Next.js está passando
    const id = 3;
    const userId = 5;
    const updateData = {
      name: undefined,
      url: undefined,
      target_price: 150.00,
      store: undefined,
      is_active: undefined
    };
    
    console.log('📊 Parâmetros:', { id, userId, updateData });
    
    const result = await DatabaseAdapter.updateProduct(id, userId, updateData);
    
    console.log('✅ Resultado:', result);
    
  } catch (error) {
    console.error('❌ Erro detalhado:', error);
    console.error('Stack trace:', error.stack);
    console.error('Mensagem:', error.message);
    console.error('Código:', error.code);
  }
}

testeNextJSSimulation();