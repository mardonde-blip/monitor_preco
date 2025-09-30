const { updateProduct } = require('./src/lib/database-postgres.ts');

async function testeUpdateProduct() {
  console.log('🔍 TESTE DIRETO DA FUNÇÃO updateProduct');
  console.log('============================================');
  
  try {
    console.log('📋 Testando updateProduct com dados:');
    console.log('  - productId: 3');
    console.log('  - userId: 1');
    console.log('  - updateData: { target_price: 125.99 }');
    
    const resultado = await updateProduct(3, 1, {
      target_price: 125.99
    });
    
    console.log('✅ Resultado:', resultado);
    
  } catch (error) {
    console.error('❌ Erro na função updateProduct:', error);
    console.error('Stack trace:', error.stack);
  }
}

testeUpdateProduct();