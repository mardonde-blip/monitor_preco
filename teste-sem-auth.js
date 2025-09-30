// Teste para verificar produtos sem autenticação
require('dotenv').config({ path: '.env.local' });

const PRODUCTION_URL = 'https://monitor-preco.vercel.app';

async function testarSemAuth() {
  console.log('🔍 TESTANDO ACESSO SEM AUTENTICAÇÃO');
  console.log('===================================');
  console.log('');

  // 1. Tentar acessar produtos diretamente
  console.log('1️⃣ Testando API de produtos...');
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/products`);
    console.log(`Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('❌ Confirmado: API exige autenticação');
      console.log('💡 Solução: Criar API pública para diagnóstico');
    }
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }

  // 2. Testar outras APIs
  console.log('');
  console.log('2️⃣ Testando outras APIs...');
  
  const apis = [
    { name: 'Test DB', path: '/api/test-db' },
    { name: 'Test Env', path: '/api/test-env' },
    { name: 'Scheduler', path: '/api/scheduler' }
  ];

  for (const api of apis) {
    try {
      const response = await fetch(`${PRODUCTION_URL}${api.path}`, {
        method: api.path === '/api/scheduler' ? 'POST' : 'GET'
      });
      console.log(`${api.name}: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`  Resultado: ${JSON.stringify(data, null, 2)}`);
      } else if (response.status !== 401) {
        const errorText = await response.text();
        console.log(`  Erro: ${errorText}`);
      }
    } catch (error) {
      console.log(`${api.name}: ❌ ${error.message}`);
    }
  }

  console.log('');
  console.log('🎯 PRÓXIMOS PASSOS:');
  console.log('1. Criar API pública para listar produtos (sem auth)');
  console.log('2. Configurar variáveis de ambiente no Vercel');
  console.log('3. Corrigir API scheduler');
  console.log('4. Testar monitoramento completo');
}

testarSemAuth();