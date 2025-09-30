// Diagnóstico completo do sistema de monitoramento
require('dotenv').config({ path: '.env.local' });

const PRODUCTION_URL = 'https://monitor-preco.vercel.app';

async function diagnosticoCompleto() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DO SISTEMA');
  console.log('==================================');
  console.log('');

  // 1. Testar conectividade básica
  console.log('1️⃣ TESTANDO CONECTIVIDADE BÁSICA');
  console.log('--------------------------------');
  
  try {
    const response = await fetch(PRODUCTION_URL);
    if (response.ok) {
      console.log('✅ Aplicação online');
    } else {
      console.log(`❌ Aplicação retornou: ${response.status}`);
      return;
    }
  } catch (error) {
    console.log(`❌ Erro de conectividade: ${error.message}`);
    return;
  }

  // 2. Testar APIs essenciais
  console.log('');
  console.log('2️⃣ TESTANDO APIs ESSENCIAIS');
  console.log('---------------------------');

  // Testar API de produtos
  try {
    const produtosResponse = await fetch(`${PRODUCTION_URL}/api/products`);
    console.log(`📦 API Produtos: ${produtosResponse.status}`);
    
    if (produtosResponse.ok) {
      const produtos = await produtosResponse.json();
      console.log(`📊 Produtos cadastrados: ${produtos.length || 0}`);
      
      if (produtos.length > 0) {
        console.log('📋 Produtos encontrados:');
        produtos.forEach((produto, index) => {
          console.log(`   ${index + 1}. ${produto.name || 'Sem nome'} - R$ ${produto.currentPrice || 'N/A'}`);
          console.log(`      Preço alvo: R$ ${produto.targetPrice || 'N/A'}`);
          console.log(`      URL: ${produto.url || 'N/A'}`);
        });
      }
    }
  } catch (error) {
    console.log(`❌ Erro na API de produtos: ${error.message}`);
  }

  // Testar API de conexão com banco
  try {
    const dbResponse = await fetch(`${PRODUCTION_URL}/api/test-db`);
    console.log(`🗄️ API Banco de Dados: ${dbResponse.status}`);
    
    if (dbResponse.ok) {
      const dbResult = await dbResponse.json();
      console.log(`📊 Resultado DB: ${dbResult.success ? '✅ Conectado' : '❌ Erro'}`);
      if (dbResult.message) {
        console.log(`   Mensagem: ${dbResult.message}`);
      }
    }
  } catch (error) {
    console.log(`❌ Erro na API de DB: ${error.message}`);
  }

  // Testar API de variáveis de ambiente
  try {
    const envResponse = await fetch(`${PRODUCTION_URL}/api/test-env`);
    console.log(`⚙️ API Variáveis: ${envResponse.status}`);
    
    if (envResponse.ok) {
      const envResult = await envResponse.json();
      console.log(`📊 Variáveis configuradas: ${envResult.success ? '✅ OK' : '❌ Erro'}`);
      if (envResult.variables) {
        console.log('   Variáveis encontradas:');
        Object.entries(envResult.variables).forEach(([key, value]) => {
          console.log(`   • ${key}: ${value ? '✅ Configurada' : '❌ Ausente'}`);
        });
      }
    }
  } catch (error) {
    console.log(`❌ Erro na API de env: ${error.message}`);
  }

  // 3. Testar API do scheduler com detalhes
  console.log('');
  console.log('3️⃣ TESTANDO API DO SCHEDULER');
  console.log('----------------------------');

  try {
    const schedulerResponse = await fetch(`${PRODUCTION_URL}/api/scheduler`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log(`🚀 Status da API: ${schedulerResponse.status}`);

    if (schedulerResponse.ok) {
      const resultado = await schedulerResponse.json();
      console.log('✅ API funcionando!');
      console.log('📊 Resultado completo:', JSON.stringify(resultado, null, 2));
    } else {
      // Tentar obter detalhes do erro
      try {
        const errorText = await schedulerResponse.text();
        console.log('❌ Erro da API:');
        console.log(errorText);
      } catch (e) {
        console.log('❌ Erro na API (sem detalhes)');
      }
    }
  } catch (error) {
    console.log(`❌ Erro ao chamar scheduler: ${error.message}`);
  }

  // 4. Testar Telegram local
  console.log('');
  console.log('4️⃣ TESTANDO TELEGRAM LOCAL');
  console.log('--------------------------');

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  console.log(`🤖 Bot Token: ${BOT_TOKEN ? '✅ Configurado' : '❌ Ausente'}`);
  console.log(`💬 Chat ID: ${CHAT_ID ? '✅ Configurado' : '❌ Ausente'}`);

  if (BOT_TOKEN && CHAT_ID) {
    try {
      // Testar getMe
      const getMeResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
      if (getMeResponse.ok) {
        const botInfo = await getMeResponse.json();
        console.log(`✅ Bot válido: @${botInfo.result.username}`);
      } else {
        console.log('❌ Token do bot inválido');
      }

      // Enviar mensagem de diagnóstico
      const sendResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: `🔍 **DIAGNÓSTICO DO SISTEMA**\n\n⏰ ${new Date().toLocaleString('pt-BR')}\n\n🔧 Executando verificação completa do monitoramento...\n\nResultados serão enviados em breve!`,
          parse_mode: 'Markdown'
        })
      });

      if (sendResponse.ok) {
        console.log('✅ Mensagem de diagnóstico enviada');
      } else {
        console.log('❌ Erro ao enviar mensagem');
      }
    } catch (error) {
      console.log(`❌ Erro no Telegram: ${error.message}`);
    }
  }

  // 5. Resumo e recomendações
  console.log('');
  console.log('5️⃣ RESUMO E RECOMENDAÇÕES');
  console.log('-------------------------');
  console.log('');
  console.log('🎯 PRÓXIMOS PASSOS PARA CORRIGIR:');
  console.log('1. Verificar se há produtos cadastrados');
  console.log('2. Confirmar variáveis de ambiente em produção');
  console.log('3. Verificar logs detalhados da API scheduler');
  console.log('4. Testar adição manual de produto');
  console.log('5. Executar verificação manual após correções');
  console.log('');
  console.log('💡 DICAS:');
  console.log('• Se não há produtos, o monitoramento não fará nada');
  console.log('• Variáveis de ambiente podem estar diferentes em produção');
  console.log('• API scheduler precisa acessar banco de dados');
  console.log('• Telegram precisa estar configurado em produção');
}

// Executar diagnóstico
diagnosticoCompleto().catch(console.error);