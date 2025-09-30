// Teste rápido da API de debug
require('dotenv').config({ path: '.env.local' });

const PRODUCTION_URL = 'https://monitor-preco.vercel.app';

async function testeRapido() {
  console.log('🔍 TESTE RÁPIDO - API DE DEBUG');
  console.log('==============================');
  console.log('');

  try {
    console.log('🚀 Testando API de debug...');
    const response = await fetch(`${PRODUCTION_URL}/api/debug/products`);
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json();
      console.log('✅ JSON recebido:', JSON.stringify(data, null, 2));
      
      if (data.success && data.total === 0) {
        console.log('');
        console.log('🎯 PROBLEMA IDENTIFICADO:');
        console.log('❌ NENHUM PRODUTO CADASTRADO NO BANCO!');
        console.log('');
        console.log('💡 SOLUÇÃO:');
        console.log('1. Acesse: https://monitor-preco.vercel.app');
        console.log('2. Cadastre-se ou faça login');
        console.log('3. Adicione produtos para monitorar');
        console.log('4. O monitoramento funcionará automaticamente');
      }
    } else {
      console.log('❌ Resposta não é JSON - API ainda não está disponível');
      console.log('⏳ O deploy pode levar alguns minutos para ficar ativo');
    }
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }

  // Testar outras APIs rapidamente
  console.log('');
  console.log('🔍 Testando outras APIs...');
  
  const apis = [
    { name: 'Test DB', path: '/api/test-db' },
    { name: 'Test Env', path: '/api/test-env' }
  ];

  for (const api of apis) {
    try {
      const response = await fetch(`${PRODUCTION_URL}${api.path}`);
      console.log(`${api.name}: ${response.status}`);
      
      if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json();
        console.log(`  ✅ ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.log(`${api.name}: ❌ ${error.message}`);
    }
  }

  console.log('');
  console.log('🎯 RESUMO:');
  console.log('• Se a API de debug não funcionar: aguarde mais alguns minutos');
  console.log('• Se funcionar mas não há produtos: adicione produtos na interface');
  console.log('• O monitoramento só funciona com produtos cadastrados');
}

testeRapido();