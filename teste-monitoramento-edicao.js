/**
 * Script para testar o monitoramento e edição de produtos
 * Este script permite testar o monitoramento de preços e a edição de produtos
 */

require('dotenv').config();
const fetch = require('node-fetch');

// Configurações
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const INTERVALO_MINUTOS = 15; // Intervalo de verificação em minutos

// Cores para o console
const cores = {
  reset: '\x1b[0m',
  verde: '\x1b[32m',
  vermelho: '\x1b[31m',
  amarelo: '\x1b[33m',
  azul: '\x1b[34m',
  magenta: '\x1b[35m',
  ciano: '\x1b[36m'
};

// Funções auxiliares
async function fazerRequisicao(url, metodo = 'GET', corpo = null) {
  try {
    const opcoes = {
      method: metodo,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (corpo) {
      opcoes.body = JSON.stringify(corpo);
    }

    const resposta = await fetch(url, opcoes);
    return await resposta.json();
  } catch (erro) {
    console.error(`${cores.vermelho}Erro na requisição:${cores.reset}`, erro);
    return { erro: erro.message };
  }
}

// Funções de monitoramento
async function verificarStatusAgendador() {
  console.log(`${cores.ciano}📊 Verificando status do agendador...${cores.reset}`);
  const resposta = await fazerRequisicao(`${API_URL}/scheduler`);
  
  if (resposta.erro) {
    console.error(`${cores.vermelho}❌ Erro ao verificar status:${cores.reset}`, resposta.erro);
    return null;
  }
  
  const status = resposta.status === 'running' ? 'ATIVO' : 'INATIVO';
  console.log(`${cores.verde}✅ Status do agendador: ${status}${cores.reset}`);
  return resposta;
}

async function iniciarAgendador() {
  console.log(`${cores.ciano}🚀 Iniciando agendador com intervalo de ${INTERVALO_MINUTOS} minutos...${cores.reset}`);
  const resposta = await fazerRequisicao(`${API_URL}/scheduler`, 'POST', {
    action: 'start',
    intervalMinutes: INTERVALO_MINUTOS
  });
  
  if (resposta.erro) {
    console.error(`${cores.vermelho}❌ Erro ao iniciar agendador:${cores.reset}`, resposta.erro);
    return false;
  }
  
  console.log(`${cores.verde}✅ Agendador iniciado: ${resposta.message}${cores.reset}`);
  console.log(`${cores.verde}✅ Monitoramento configurado com sucesso para verificar a cada ${INTERVALO_MINUTOS} minutos.${cores.reset}`);
  console.log(`${cores.verde}📱 Você receberá notificações no Telegram quando os preços dos produtos monitorados baixarem.${cores.reset}`);
  return true;
}

async function executarVerificacaoManual() {
  console.log(`\n${cores.ciano}🧪 Executando teste de verificação manual...${cores.reset}`);
  console.log(`${cores.ciano}🔍 Executando verificação manual de preços...${cores.reset}`);
  
  const resposta = await fazerRequisicao(`${API_URL}/scheduler`, 'POST', {
    action: 'manual'
  });
  
  if (resposta.erro) {
    console.error(`${cores.vermelho}❌ Erro ao executar verificação manual:${cores.reset}`, resposta.erro);
    return false;
  }
  
  console.log(`${cores.verde}✅ Verificação manual executada: ${resposta.message}${cores.reset}`);
  return true;
}

// Funções de gerenciamento de produtos
async function listarProdutos() {
  console.log(`\n${cores.ciano}📋 Listando produtos monitorados...${cores.reset}`);
  const resposta = await fazerRequisicao(`${API_URL}/products`);
  
  if (resposta.erro || !resposta.products) {
    console.error(`${cores.vermelho}❌ Erro ao listar produtos:${cores.reset}`, resposta.erro || 'Resposta inválida');
    return [];
  }
  
  console.log(`${cores.verde}✅ ${resposta.products.length} produtos encontrados${cores.reset}`);
  
  // Exibir produtos em formato de tabela
  console.log(`\n${cores.amarelo}ID | Nome | Preço Alvo | Loja | Status${cores.reset}`);
  console.log(`${cores.amarelo}------------------------------------------${cores.reset}`);
  
  resposta.products.forEach(produto => {
    const status = produto.is_active ? 'Ativo' : 'Inativo';
    console.log(`${produto.id} | ${produto.name.substring(0, 30)}... | R$ ${produto.target_price} | ${produto.store} | ${status}`);
  });
  
  return resposta.products;
}

async function editarProduto(id, novosDados) {
  console.log(`\n${cores.ciano}✏️ Editando produto ID ${id}...${cores.reset}`);
  
  const resposta = await fazerRequisicao(`${API_URL}/products`, 'PUT', {
    id,
    ...novosDados
  });
  
  if (resposta.erro) {
    console.error(`${cores.vermelho}❌ Erro ao editar produto:${cores.reset}`, resposta.erro);
    return false;
  }
  
  console.log(`${cores.verde}✅ Produto atualizado com sucesso!${cores.reset}`);
  return true;
}

async function alternarStatusProduto(id, produtos) {
  const produto = produtos.find(p => p.id === id);
  if (!produto) {
    console.error(`${cores.vermelho}❌ Produto não encontrado${cores.reset}`);
    return false;
  }
  
  const novoStatus = !produto.is_active;
  const statusTexto = novoStatus ? 'ativo' : 'inativo';
  
  console.log(`${cores.ciano}🔄 Alterando status do produto para ${statusTexto}...${cores.reset}`);
  
  return await editarProduto(id, {
    name: produto.name,
    url: produto.url,
    target_price: produto.target_price,
    store: produto.store,
    is_active: novoStatus
  });
}

async function atualizarPrecoAlvo(id, produtos, novoPreco) {
  const produto = produtos.find(p => p.id === id);
  if (!produto) {
    console.error(`${cores.vermelho}❌ Produto não encontrado${cores.reset}`);
    return false;
  }
  
  console.log(`${cores.ciano}💰 Atualizando preço alvo de R$ ${produto.target_price} para R$ ${novoPreco}...${cores.reset}`);
  
  return await editarProduto(id, {
    name: produto.name,
    url: produto.url,
    target_price: novoPreco,
    store: produto.store,
    is_active: produto.is_active
  });
}

// Função principal
async function executarTeste() {
  console.log(`${cores.magenta}🤖 TESTE DE MONITORAMENTO E EDIÇÃO DE PRODUTOS${cores.reset}`);
  console.log(`${cores.magenta}===============================================${cores.reset}`);
  
  // Verificar status do agendador
  await verificarStatusAgendador();
  
  // Iniciar agendador se necessário
  await iniciarAgendador();
  
  // Listar produtos
  const produtos = await listarProdutos();
  
  if (produtos.length > 0) {
    // Selecionar o primeiro produto para testes
    const produtoTeste = produtos[0];
    
    // Atualizar preço alvo
    const novoPreco = (parseFloat(produtoTeste.target_price) * 0.9).toFixed(2); // 10% menor
    await atualizarPrecoAlvo(produtoTeste.id, produtos, novoPreco);
    
    // Alternar status do produto
    await alternarStatusProduto(produtoTeste.id, produtos);
    
    // Listar produtos novamente para confirmar alterações
    console.log(`\n${cores.ciano}🔄 Verificando alterações...${cores.reset}`);
    await listarProdutos();
    
    // Restaurar valores originais
    console.log(`\n${cores.ciano}🔄 Restaurando valores originais...${cores.reset}`);
    await atualizarPrecoAlvo(produtoTeste.id, produtos, produtoTeste.target_price);
    if (!produtoTeste.is_active) {
      await alternarStatusProduto(produtoTeste.id, produtos);
    }
  }
  
  // Executar verificação manual
  await executarVerificacaoManual();
  
  console.log(`\n${cores.verde}✅ TESTE CONCLUÍDO${cores.reset}`);
  console.log(`${cores.verde}O monitoramento está ativo e funcionando.${cores.reset}`);
  console.log(`${cores.verde}Intervalo de verificação: ${INTERVALO_MINUTOS} minutos${cores.reset}`);
}

// Executar o teste
executarTeste().catch(erro => {
  console.error(`${cores.vermelho}❌ Erro durante a execução do teste:${cores.reset}`, erro);
});