/**
 * Script de Teste - Debug da Funcionalidade de Edição de Preços
 * 
 * Este script testa especificamente a funcionalidade de edição de preços
 * para identificar onde está o problema.
 */

const BASE_URL = 'http://localhost:3000';

// Função para fazer login e obter cookies
async function login() {
  console.log('🔐 Fazendo login...');
  
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'admin@admin.com',
      senha: 'admin123'
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
      console.log(`   Preço alvo atual: R$ ${product.target_price}`);
      console.log(`   Status: ${product.is_active ? 'Ativo' : 'Inativo'}`);
      console.log('');
    });
  }
  
  return data.products;
}

// Função para testar edição de preço
async function testarEdicaoPreco(cookies, productId, novoPreco) {
  console.log(`\n✏️ Testando edição de preço do produto ID ${productId} para R$ ${novoPreco}...`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/products`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        id: productId,
        target_price: novoPreco
      })
    });

    console.log(`📡 Status da resposta: ${response.status}`);
    
    const responseText = await response.text();
    console.log(`📄 Resposta completa: ${responseText}`);

    if (!response.ok) {
      console.error(`❌ Erro na edição: ${response.status}`);
      return false;
    }

    const data = JSON.parse(responseText);
    console.log('✅ Edição realizada com sucesso!');
    console.log(`📊 Produto atualizado: ${data.product.name}`);
    console.log(`💰 Novo preço alvo: R$ ${data.product.target_price}`);
    return true;

  } catch (error) {
    console.error('❌ Erro durante a edição:', error.message);
    return false;
  }
}

// Função principal
async function main() {
  try {
    console.log('🚀 INICIANDO TESTE DE DEBUG DA EDIÇÃO DE PREÇOS\n');
    console.log('=' .repeat(60));

    // 1. Fazer login
    const cookies = await login();

    // 2. Listar produtos
    const produtos = await listarProdutos(cookies);

    if (produtos.length === 0) {
      console.log('⚠️ Nenhum produto encontrado para testar a edição.');
      return;
    }

    // 3. Testar edição no primeiro produto
    const produto = produtos[0];
    const precoOriginal = produto.target_price;
    const novoPreco = precoOriginal + 10.50; // Adicionar R$ 10,50 ao preço

    console.log(`\n🎯 Produto selecionado para teste: ${produto.name}`);
    console.log(`💰 Preço atual: R$ ${precoOriginal}`);
    console.log(`🔄 Novo preço a ser testado: R$ ${novoPreco}`);

    // Testar a edição
    const edicaoSucesso = await testarEdicaoPreco(cookies, produto.id, novoPreco);

    if (edicaoSucesso) {
      console.log('\n✅ TESTE DE EDIÇÃO: SUCESSO');
      
      // Verificar se a mudança foi persistida
      console.log('\n🔍 Verificando se a mudança foi persistida...');
      const produtosAtualizados = await listarProdutos(cookies);
      const produtoAtualizado = produtosAtualizados.find(p => p.id === produto.id);
      
      if (produtoAtualizado && produtoAtualizado.target_price === novoPreco) {
        console.log('✅ PERSISTÊNCIA: SUCESSO - Mudança foi salva no banco de dados');
        
        // Restaurar preço original
        console.log('\n🔄 Restaurando preço original...');
        await testarEdicaoPreco(cookies, produto.id, precoOriginal);
        console.log('✅ Preço original restaurado');
      } else {
        console.log('❌ PERSISTÊNCIA: FALHA - Mudança não foi salva no banco de dados');
      }
    } else {
      console.log('\n❌ TESTE DE EDIÇÃO: FALHA');
    }

  } catch (error) {
    console.error('\n💥 ERRO GERAL:', error.message);
    console.error('Stack trace:', error.stack);
  }

  console.log('\n' + '=' .repeat(60));
  console.log('🏁 TESTE DE DEBUG CONCLUÍDO');
}

// Executar o teste
main().catch(console.error);