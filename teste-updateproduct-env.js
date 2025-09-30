require('dotenv').config({ path: '.env.local' });
const { updateProduct } = require('./src/lib/database-postgres.ts');

async function testeUpdateProductComEnv() {
  console.log('🔍 TESTE updateProduct COM VARIÁVEIS DE AMBIENTE');
  console.log('===============================================');
  
  console.log('🔧 DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'NÃO CONFIGURADA');
  
  try {
    console.log('📋 Testando updateProduct com:');
    console.log('- productId: 3');
    console.log('- userId: 5');
    console.log('- updateData: { target_price: 175.99 }');
    
    const resultado = await updateProduct(3, 5, {
      target_price: 175.99
    });
    
    console.log('✅ Resultado:', resultado);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
  }
}

testeUpdateProductComEnv();