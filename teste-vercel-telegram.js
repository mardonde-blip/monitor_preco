/**
 * Script para testar o monitoramento de preços com Telegram no Vercel
 * Este script configura o monitoramento com intervalo personalizado em minutos
 */

const https = require('https');

// URL da API do seu aplicativo no Vercel
const API_URL = 'https://monitor-preco.vercel.app';

// Configurações
const INTERVALO_MINUTOS = 15; // Intervalo de monitoramento em minutos

/**
 * Função para fazer requisições HTTP
 */
async function fazerRequisicao(url, metodo = 'GET', dados = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const resposta = JSON.parse(data);
          resolve({ statusCode: res.statusCode, dados: resposta });
        } catch (erro) {
          resolve({ statusCode: res.statusCode, dados: data });
        }
      });
    });
    
    req.on('error', (erro) => {
      reject(erro);
    });
    
    if (dados) {
      req.write(JSON.stringify(dados));
    }
    
    req.end();
  });
}

/**
 * Função para verificar o status do agendador
 */
async function verificarStatusAgendador() {
  try {
    console.log('📊 Verificando status do agendador...');
    const resposta = await fazerRequisicao(`${API_URL}/api/scheduler`);
    
    if (resposta.statusCode === 200) {
      console.log(`✅ Status do agendador: ${resposta.dados.isRunning ? 'ATIVO' : 'INATIVO'}`);
      return resposta.dados;
    } else {
      console.error(`❌ Erro ao verificar status: ${resposta.statusCode}`);
      return null;
    }
  } catch (erro) {
    console.error('❌ Erro ao verificar status do agendador:', erro);
    return null;
  }
}

/**
 * Função para iniciar o agendador com intervalo personalizado
 */
async function iniciarAgendador(intervaloMinutos) {
  try {
    console.log(`🚀 Iniciando agendador com intervalo de ${intervaloMinutos} minutos...`);
    
    const resposta = await fazerRequisicao(
      `${API_URL}/api/scheduler`,
      'POST',
      {
        action: 'start',
        intervalMinutes: intervaloMinutos
      }
    );
    
    if (resposta.statusCode === 200) {
      console.log(`✅ Agendador iniciado: ${resposta.dados.message}`);
      return true;
    } else {
      console.error(`❌ Erro ao iniciar agendador: ${resposta.statusCode}`);
      console.error(resposta.dados);
      return false;
    }
  } catch (erro) {
    console.error('❌ Erro ao iniciar agendador:', erro);
    return false;
  }
}

/**
 * Função para executar verificação manual
 */
async function executarVerificacaoManual() {
  try {
    console.log('🔍 Executando verificação manual de preços...');
    
    const resposta = await fazerRequisicao(
      `${API_URL}/api/scheduler`,
      'POST',
      {
        action: 'manual'
      }
    );
    
    if (resposta.statusCode === 200) {
      console.log(`✅ Verificação manual executada: ${resposta.dados.message}`);
      return true;
    } else {
      console.error(`❌ Erro na verificação manual: ${resposta.statusCode}`);
      console.error(resposta.dados);
      return false;
    }
  } catch (erro) {
    console.error('❌ Erro na verificação manual:', erro);
    return false;
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🤖 TESTE DE MONITORAMENTO COM TELEGRAM NO VERCEL');
  console.log('==============================================');
  
  // Verificar status atual
  const statusInicial = await verificarStatusAgendador();
  
  if (!statusInicial) {
    console.error('❌ Não foi possível verificar o status do agendador. Verifique se o aplicativo está online no Vercel.');
    return;
  }
  
  // Iniciar agendador com intervalo personalizado
  const sucesso = await iniciarAgendador(INTERVALO_MINUTOS);
  
  if (sucesso) {
    console.log(`✅ Monitoramento configurado com sucesso para verificar a cada ${INTERVALO_MINUTOS} minutos.`);
    console.log('📱 Você receberá notificações no Telegram quando os preços dos produtos monitorados baixarem.');
    
    // Executar verificação manual para testar
    console.log('\n🧪 Executando teste de verificação manual...');
    await executarVerificacaoManual();
    
    console.log('\n✅ CONFIGURAÇÃO CONCLUÍDA');
    console.log('O monitoramento está ativo e funcionando no Vercel.');
    console.log(`Intervalo de verificação: ${INTERVALO_MINUTOS} minutos`);
  } else {
    console.error('❌ Não foi possível configurar o monitoramento. Verifique os logs acima para mais detalhes.');
  }
}

// Executar o script
main().catch(console.error);