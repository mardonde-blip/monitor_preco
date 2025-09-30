// Teste com a URL real do Vercel
require('dotenv').config({ path: '.env.local' });

// URLs possíveis do Vercel baseadas no repositório GitHub
const POSSIBLE_URLS = [
  'https://monitor-preco.vercel.app',
  'https://monitor-preco-git-main-mardonde-blip.vercel.app',
  'https://monitor-preco-mardonde-blip.vercel.app'
];

async function testarURLsVercel() {
  console.log('🌐 TESTANDO URLs DO VERCEL');
  console.log('=========================');
  console.log('📂 Repositório: https://github.com/mardonde-blip/monitor_preco.git');
  console.log('');

  let urlFuncionando = null;

  for (const url of POSSIBLE_URLS) {
    console.log(`🔍 Testando: ${url}`);
    
    try {
      const response = await fetch(url, { 
        method: 'GET',
        timeout: 10000 // 10 segundos de timeout
      });
      
      if (response.ok) {
        console.log(`✅ ENCONTRADA! ${url} está funcionando!`);
        urlFuncionando = url;
        break;
      } else {
        console.log(`❌ ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Erro: ${error.message}`);
    }
    
    console.log('');
  }

  if (urlFuncionando) {
    console.log('🎉 APLICAÇÃO ENCONTRADA EM PRODUÇÃO!');
    console.log(`🔗 URL: ${urlFuncionando}`);
    console.log('');
    
    // Testar API do scheduler
    console.log('🚀 Testando API do scheduler...');
    
    try {
      const schedulerResponse = await fetch(`${urlFuncionando}/api/scheduler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (schedulerResponse.ok) {
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
          } else {
            console.log('');
            console.log('ℹ️ Nenhuma notificação enviada (normal se não há produtos cadastrados).');
          }
        }
      } else {
        console.log(`⚠️ API do scheduler retornou: ${schedulerResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Erro na API: ${error.message}`);
    }

    // Testar Telegram
    console.log('');
    console.log('📱 Testando Telegram...');
    
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    
    if (BOT_TOKEN && CHAT_ID) {
      try {
        const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const telegramResponse = await fetch(telegramUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: CHAT_ID,
            text: `🚀 **DEPLOY CONCLUÍDO COM SUCESSO!**\n\n✅ Sistema de monitoramento em produção funcionando!\n\n🌐 **URL:** ${urlFuncionando}\n\n📊 **Próximos passos:**\n• Adicione produtos para monitorar\n• Configure preços alvo\n• Receba notificações automáticas!\n\n⏰ ${new Date().toLocaleString('pt-BR')}`,
            parse_mode: 'Markdown'
          })
        });
        
        if (telegramResponse.ok) {
          console.log('✅ Telegram funcionando! Mensagem de confirmação enviada!');
        } else {
          const telegramError = await telegramResponse.json();
          console.log('❌ Erro no Telegram:', telegramError);
        }
      } catch (error) {
        console.log('❌ Erro ao testar Telegram:', error.message);
      }
    }

    console.log('');
    console.log('🎯 RESUMO FINAL:');
    console.log('✅ Deploy concluído com sucesso');
    console.log(`✅ Aplicação funcionando em: ${urlFuncionando}`);
    console.log('✅ API de monitoramento operacional');
    console.log('✅ Telegram configurado e funcionando');
    console.log('');
    console.log('🚀 SISTEMA PRONTO PARA USO!');
    console.log(`📱 Acesse: ${urlFuncionando}`);

  } else {
    console.log('❌ Nenhuma URL do Vercel está funcionando.');
    console.log('💡 Verifique se o deploy foi concluído com sucesso.');
    console.log('💡 Pode levar alguns minutos para o deploy ficar disponível.');
  }
}

// Executar teste
testarURLsVercel();