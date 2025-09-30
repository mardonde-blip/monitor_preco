/**
 * Script para criar usuário de teste
 */

const bcrypt = require('bcryptjs');

// Simular a criação de usuário diretamente via API
async function criarUsuarioTeste() {
  console.log('🔧 Criando usuário de teste...');
  
  const userData = {
    nome_completo: 'Usuário Teste',
    email: 'teste@teste.com',
    senha: 'teste123',
    data_nascimento: '1990-01-01',
    sexo: 'Masculino',
    celular: '11999999999'
  };

  try {
    const response = await fetch('http://localhost:3000/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Usuário criado com sucesso!');
      console.log('📧 Email:', userData.email);
      console.log('🔑 Senha:', userData.senha);
      return true;
    } else {
      const error = await response.text();
      console.log('ℹ️ Resposta:', error);
      
      if (error.includes('já existe')) {
        console.log('✅ Usuário já existe, pode usar para teste');
        console.log('📧 Email:', userData.email);
        console.log('🔑 Senha:', userData.senha);
        return true;
      }
      return false;
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
    return false;
  }
}

// Testar login com o usuário
async function testarLogin() {
  console.log('\n🔐 Testando login...');
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'teste@teste.com',
        senha: 'teste123'
      })
    });

    if (response.ok) {
      console.log('✅ Login funcionando!');
      const cookies = response.headers.get('set-cookie');
      return cookies;
    } else {
      const error = await response.text();
      console.log('❌ Erro no login:', error);
      return null;
    }
  } catch (error) {
    console.error('❌ Erro no login:', error.message);
    return null;
  }
}

// Criar produto de teste
async function criarProdutoTeste(cookies) {
  console.log('\n📦 Criando produto de teste...');
  
  const produtoData = {
    name: 'Produto Teste para Edição',
    url: 'https://www.amazon.com.br/dp/B08N5WRWNW',
    target_price: 100.00,
    store: 'Amazon'
  };

  try {
    const response = await fetch('http://localhost:3000/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify(produtoData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Produto criado com sucesso!');
      console.log('🆔 ID do produto:', result.product.id);
      console.log('💰 Preço alvo:', result.product.target_price);
      return result.product;
    } else {
      const error = await response.text();
      console.log('ℹ️ Resposta:', error);
      return null;
    }
  } catch (error) {
    console.error('❌ Erro ao criar produto:', error.message);
    return null;
  }
}

// Função principal
async function main() {
  console.log('🚀 CONFIGURANDO AMBIENTE DE TESTE\n');
  console.log('=' .repeat(50));

  // 1. Criar usuário
  const usuarioCriado = await criarUsuarioTeste();
  if (!usuarioCriado) {
    console.log('❌ Falha ao criar usuário');
    return;
  }

  // 2. Testar login
  const cookies = await testarLogin();
  if (!cookies) {
    console.log('❌ Falha no login');
    return;
  }

  // 3. Criar produto de teste
  const produto = await criarProdutoTeste(cookies);
  if (!produto) {
    console.log('❌ Falha ao criar produto');
    return;
  }

  console.log('\n' + '=' .repeat(50));
  console.log('✅ AMBIENTE CONFIGURADO COM SUCESSO!');
  console.log('\n📋 INSTRUÇÕES PARA TESTAR A EDIÇÃO:');
  console.log('1. Acesse: http://localhost:3000');
  console.log('2. Faça login com:');
  console.log('   📧 Email: teste@teste.com');
  console.log('   🔑 Senha: teste123');
  console.log('3. Vá para "Produtos Monitorados"');
  console.log('4. Clique no ícone ✏️ do produto "Produto Teste para Edição"');
  console.log('5. Altere o preço e clique em "Salvar"');
  console.log('\n🎯 Se a edição funcionar, o problema estava na autenticação!');
}

main().catch(console.error);