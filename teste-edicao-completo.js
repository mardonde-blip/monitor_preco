/**
 * Teste Completo da Funcionalidade de Edição de Preços
 * 
 * Este script testa toda a cadeia de edição para identificar onde está o problema
 */

const BASE_URL = 'http://localhost:3000';

// Função para fazer login
async function login() {
  console.log('🔐 Fazendo login...');
  
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'teste@teste.com',
      senha: 'teste123'
    })
  });

  if (!response.ok) {
    throw new Error(`Erro no login: ${response.status} - ${await response.text()}`);
  }

  const cookies = response.headers.get('set-cookie');
  console.log('✅ Login realizado com sucesso');
  return cookies;
}

// Função para listar produtos
async function listarProdutos(cookies) {
  console.log('\n📋 Listando produtos...');
  
  const response = await fetch(`${BASE_URL}/api/products`, {
    headers: {
      'Cookie': cookies
    }
  });

  if (!response.ok) {
    throw new Error(`Erro ao listar produtos: ${response.status} - ${await response.text()}`);
  }

  const data = await response.json();
  console.log(`✅ ${data.products.length} produtos encontrados`);
  
  if (data.products.length > 0) {
    console.log('\n📦 Produtos disponíveis:');
    data.products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Preço alvo: R$ ${product.target_price}`);
      console.log(`   Status: ${product.is_active ? 'Ativo' : 'Inativo'}`);
      console.log('');
    });
  }
  
  return data.products;
}

// Função para testar edição de preço - VERSÃO DETALHADA
async function testarEdicaoDetalhada(cookies, productId, novoPreco) {
  console.log(`\n🔍 TESTE DETALHADO DE EDIÇÃO`);
  console.log(`📋 Produto ID: ${productId}`);
  console.log(`💰 Novo preço: R$ ${novoPreco}`);
  console.log('-'.repeat(50));
  
  try {
    // Preparar dados da requisição
    const requestData = {
      id: productId,
      target_price: novoPreco
    };
    
    console.log('📤 Dados da requisição:', JSON.stringify(requestData, null, 2));
    console.log('🍪 Cookies:', cookies ? 'Presentes' : 'Ausentes');
    
    // Fazer a requisição
    console.log('\n📡 Enviando requisição PUT...');
    const response = await fetch(`${BASE_URL}/api/products`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify(requestData)
    });

    console.log(`📊 Status HTTP: ${response.status} ${response.statusText}`);
    console.log('📋 Headers de resposta:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`   ${key}: ${value}`);
    }

    // Ler resposta
    const responseText = await response.text();
    console.log(`\n📄 Resposta completa (${responseText.length} chars):`);
    console.log(responseText);

    if (!response.ok) {
      console.error(`❌ FALHA: Status ${response.status}`);
      return { success: false, error: responseText };
    }

    try {
      const data = JSON.parse(responseText);
      console.log('\n✅ SUCESSO: Resposta parseada');
      console.log('📊 Dados retornados:', JSON.stringify(data, null, 2));
      return { success: true, data };
    } catch (parseError) {
      console.error('❌ ERRO: Falha ao parsear JSON:', parseError.message);
      return { success: false, error: 'Resposta não é JSON válido' };
    }

  } catch (networkError) {
    console.error('❌ ERRO DE REDE:', networkError.message);
    return { success: false, error: networkError.message };
  }
}

// Função para verificar se a mudança persistiu
async function verificarPersistencia(cookies, productId, precoEsperado) {
  console.log(`\n🔍 VERIFICANDO PERSISTÊNCIA`);
  console.log(`📋 Produto ID: ${productId}`);
  console.log(`💰 Preço esperado: R$ ${precoEsperado}`);
  console.log('-'.repeat(50));
  
  try {
    // Aguardar um pouco para garantir que a mudança foi processada
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Buscar produtos novamente
    const produtos = await listarProdutos(cookies);
    const produto = produtos.find(p => p.id === productId);
    
    if (!produto) {
      console.error('❌ PRODUTO NÃO ENCONTRADO após edição');
      return false;
    }
    
    console.log(`📊 Preço atual no banco: R$ ${produto.target_price}`);
    console.log(`🎯 Preço esperado: R$ ${precoEsperado}`);
    
    if (produto.target_price === precoEsperado) {
      console.log('✅ PERSISTÊNCIA: SUCESSO - Mudança foi salva');
      return true;
    } else {
      console.log('❌ PERSISTÊNCIA: FALHA - Mudança não foi salva');
      console.log(`   Diferença: ${produto.target_price - precoEsperado}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ ERRO na verificação:', error.message);
    return false;
  }
}

// Função principal
async function main() {
  try {
    console.log('🚀 TESTE COMPLETO DE EDIÇÃO DE PREÇOS');
    console.log('=' .repeat(60));

    // 1. Login
    const cookies = await login();

    // 2. Listar produtos
    const produtos = await listarProdutos(cookies);

    if (produtos.length === 0) {
      console.log('⚠️ Nenhum produto encontrado. Execute criar-usuario-teste.js primeiro.');
      return;
    }

    // 3. Selecionar produto para teste
    const produto = produtos.find(p => p.name.includes('Teste')) || produtos[0];
    const precoOriginal = parseFloat(produto.target_price);
    const novoPreco = parseFloat((precoOriginal + 25.99).toFixed(2));

    console.log(`\n🎯 PRODUTO SELECIONADO: ${produto.name}`);
    console.log(`💰 Preço original: R$ ${precoOriginal}`);
    console.log(`🔄 Novo preço: R$ ${novoPreco}`);

    // 4. Testar edição
    const resultado = await testarEdicaoDetalhada(cookies, produto.id, novoPreco);

    if (resultado.success) {
      console.log('\n✅ EDIÇÃO: SUCESSO');
      
      // 5. Verificar persistência
      const persistiu = await verificarPersistencia(cookies, produto.id, novoPreco);
      
      if (persistiu) {
        console.log('\n🎉 TESTE COMPLETO: SUCESSO TOTAL');
        
        // Restaurar preço original
        console.log('\n🔄 Restaurando preço original...');
        await testarEdicaoDetalhada(cookies, produto.id, precoOriginal);
        console.log('✅ Preço restaurado');
      } else {
        console.log('\n❌ TESTE COMPLETO: FALHA NA PERSISTÊNCIA');
      }
    } else {
      console.log('\n❌ EDIÇÃO: FALHA');
      console.log('🔍 Erro:', resultado.error);
    }

  } catch (error) {
    console.error('\n💥 ERRO GERAL:', error.message);
    console.error('Stack:', error.stack);
  }

  console.log('\n' + '=' .repeat(60));
  console.log('🏁 TESTE CONCLUÍDO');
}

// Executar teste
main().catch(console.error);