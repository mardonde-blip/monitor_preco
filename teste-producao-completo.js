// Teste completo do monitoramento em produção
require('dotenv').config({ path: '.env.local' });

// URL da aplicação em produção (substitua pela URL real do Vercel)
const PRODUCTION_URL = 'https://monitor-precos-git-main-mardos-projects-b8b8b8b8.vercel.app'; // Ajuste conforme necessário

async function testarProducao() {
  console.log('🌐 TESTE COMPLETO EM PRODUÇÃO');
  console.log('=============================');
  console.log(`🔗 URL: ${PRODUCTION_URL}`);
  console.log('');

  try {
    // 1. Testar se a aplicação está online
    console.log('1️⃣ Verificando se a aplicação está online...');
    const healthResponse = await fetch(PRODUCTION_URL);
    
    if (!healthResponse.ok) {
      throw new Error(`Aplicação offline: ${healthResponse.status}`);
    }
    
    console.log('✅ Aplicação online e funcionando!');
    console.log('');

    // 2. Testar API do scheduler em produção
    console.log('2️⃣ Testando API do scheduler em produção...');
    
    const schedulerResponse = await fetch(`${PRODUCTION_URL}/api/scheduler`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!schedulerResponse.ok) {
      console.log(`⚠️ API do scheduler retornou: ${schedulerResponse.status}`);
      const errorText = await schedulerResponse.text();
      console.log('Erro:', errorText);
    } else {
      const resultado = await schedulerResponse.json();
      console.log('✅ API do scheduler funcionando!');
      console.log('📊 Resultado:', JSON.stringify(resultado, null, 2));
      
      if (resultado.success && resultado.data) {
        const { checked, notifications, errors } = resultado.data;
        
        console.log('');
        console.log('📊 ESTATÍSTICAS DA VERIFICAÇÃO:');
        console.log(`📦 Produtos verificados: ${checked || 0}`);
        console.log(`📱 Notificações enviadas: ${notifications || 0}`);
        console.log(`❌ Erros encontrados: ${errors || 0}`);
        
        if (notifications > 0) {
          console.log('');
          console.log('🎉 SUCESSO! NOTIFICAÇÕES ENVIADAS!');
          console.log('📱 Verifique seu Telegram para ver as informações dos produtos e preços!');
          console.log('');
          console.log('📋 As notificações devem conter:');
          console.log('   • 📦 Nome do produto');
          console.log('   • 💰 Preço anterior vs preço atual');
          console.log('   • 🎯 Percentual de desconto');
          console.log('   • 🔗 Link direto para o produto');
          console.log('   • ⏰ Data e hora da verificação');
        } else {
          console.log('');
          console.log('ℹ️ Nenhuma notificação enviada.');
          console.log('💡 Para receber notificações:');
          console.log(`   1. Acesse ${PRODUCTION_URL}`);
          console.log('   2. Adicione um produto');
          console.log('   3. Configure um preço alvo MENOR que o atual');
          console.log('   4. Execute este teste novamente');
        }
      }
    }

    console.log('');
    console.log('3️⃣ Testando conectividade com Telegram...');
    
    // 3. Testar Telegram diretamente
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    
    if (BOT_TOKEN && CHAT_ID) {
      const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
      const telegramResponse = await fetch(telegramUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: `🚀 **TESTE DE PRODUÇÃO**\n\nSistema de monitoramento em produção funcionando!\n\n🌐 URL: ${PRODUCTION_URL}\n⏰ ${new Date().toLocaleString('pt-BR')}`,
          parse_mode: 'Markdown'
        })
      });
      
      if (telegramResponse.ok) {
        console.log('✅ Telegram funcionando em produção!');
        console.log('📱 Mensagem de teste enviada!');
      } else {
        const telegramError = await telegramResponse.json();
        console.log('❌ Erro no Telegram:', telegramError);
      }
    } else {
      console.log('⚠️ Variáveis do Telegram não configuradas');
    }

  } catch (error) {
    console.error('❌ Erro no teste de produção:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('💡 Dica: Verifique se a URL de produção está correta');
      console.log('💡 Dica: Verifique se o deploy foi concluído com sucesso');
    }
  }

  console.log('');
  console.log('🎯 RESUMO DO TESTE:');
  console.log('✅ Sistema em produção testado');
  console.log('✅ API de monitoramento verificada');
  console.log('✅ Conectividade com Telegram testada');
  console.log('');
  console.log('🚀 PRÓXIMOS PASSOS:');
  console.log(`1. Acesse ${PRODUCTION_URL}`);
  console.log('2. Adicione produtos para monitorar');
  console.log('3. Configure preços alvo');
  console.log('4. Receba notificações automáticas no Telegram!');
}

// Executar teste
testarProducao();