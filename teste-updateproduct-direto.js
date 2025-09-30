const { updateProduct } = require('./src/lib/database-postgres.ts');

async function testeUpdateProductDireto() {
  console.log('🔍 TESTE DIRETO DA FUNÇÃO updateProduct');
  console.log('=====================================');
  
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

testeUpdateProductDireto();