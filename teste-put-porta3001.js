const https = require('https');
const http = require('http');

async function testePutPorta3001() {
  console.log('🔍 TESTE PUT PORTA 3001');
  console.log('=======================');
  
  try {
    // 1. Fazer login
    console.log('🔐 Fazendo login...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'teste@teste.com',
        senha: 'teste123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('📊 Status login:', loginResponse.status);
    
    if (loginResponse.status !== 200) {
      console.log('❌ Erro no login:', loginData);
      return;
    }

    // Extrair cookies
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('🍪 Cookies recebidos:', cookies ? 'Sim' : 'Não');

    // 2. Testar PUT
    console.log('📡 Testando PUT...');
    const putResponse = await fetch('http://localhost:3001/api/products', {
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

    const putData = await putResponse.json();
    console.log('📊 Status:', putResponse.status);
    console.log('📄 Resposta:', JSON.stringify(putData));

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testePutPorta3001();