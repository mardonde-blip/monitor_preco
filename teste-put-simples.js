const fetch = require('node-fetch');

async function testePutSimples() {
  console.log('🔍 TESTE PUT SIMPLES');
  console.log('====================');
  
  try {
    // Fazer login primeiro
    console.log('🔐 Fazendo login...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'teste@teste.com',
        senha: 'teste123'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Erro no login:', loginResponse.status);
      return;
    }
    
    // Extrair cookies
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('🍪 Cookies recebidos:', cookies ? 'Sim' : 'Não');
    
    // Testar PUT com dados mínimos
    console.log('📡 Testando PUT...');
    const putResponse = await fetch('http://localhost:3000/api/products', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || ''
      },
      body: JSON.stringify({
        id: 3,
        target_price: 150.00
      })
    });
    
    console.log('📊 Status:', putResponse.status);
    const responseText = await putResponse.text();
    console.log('📄 Resposta:', responseText);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testePutSimples();