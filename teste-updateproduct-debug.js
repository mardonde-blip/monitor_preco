require('dotenv').config({ path: '.env.local' });
const { updateProduct } = require('./src/lib/database-postgres.ts');

async function testeUpdateProductDebug() {
  console.log('🔍 TESTE DEBUG UPDATE PRODUCT');
  console.log('==============================');
  
  try {
    console.log('📋 Parâmetros do teste:');
    console.log('- productId: 3');
    console.log('- userId: 5');
    console.log('- updateData: { target_price: 175.99 }');
    
    const result = await updateProduct(3, 5, { target_price: 175.99 });
    
    console.log('✅ Resultado:', result);
    
  } catch (error) {
    console.error('❌ Erro detalhado:', error);
    console.error('Stack trace:', error.stack);
    console.error('Mensagem:', error.message);
    console.error('Código:', error.code);
  }
}

testeUpdateProductDebug();