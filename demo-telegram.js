// Demonstração completa do sistema de monitoramento com Telegram
// Execute com: node demo-telegram.js

const productUrl = 'https://www.carrefour.com.br/whisky-buchanans-deluxe-12-anos-1l-6-unidades-b2-6-164666/p';
const productName = 'Whisky Buchanan\'s Deluxe 12 Anos 1L';

// CONFIGURAÇÕES DO TELEGRAM
// Para usar o Telegram, substitua pelos seus valores reais:
const TELEGRAM_BOT_TOKEN = 'SEU_BOT_TOKEN_AQUI'; // Obtenha com @BotFather
const TELEGRAM_CHAT_ID = 'SEU_CHAT_ID_AQUI';   // Obtenha com @userinfobot

async function sendTelegramMessage(message) {
  if (TELEGRAM_BOT_TOKEN === 'SEU_BOT_TOKEN_AQUI' || TELEGRAM_CHAT_ID === 'SEU_CHAT_ID_AQUI') {
    console.log('\n📱 MENSAGEM QUE SERIA ENVIADA PARA O TELEGRAM:');
    console.log('=' .repeat(60));
    console.log(message.replace(/<[^>]*>/g, '').replace(/\\n/g, '\n'));
    console.log('=' .repeat(60));
    console.log('\n💡 Para enviar realmente para o Telegram:');
    console.log('1. Crie um bot com @BotFather no Telegram');
    console.log('2. Obtenha o token do bot');
    console.log('3. Obtenha seu chat ID enviando /start para @userinfobot');
    console.log('4. Substitua os valores no script');
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });
    
    const result = await response.json();
    if (result.ok) {
      console.log('✅ Mensagem enviada para o Telegram com sucesso!');
    } else {
      console.error('❌ Erro ao enviar mensagem:', result.description);
    }
  } catch (error) {
    console.error('❌ Erro na requisição para o Telegram:', error.message);
  }
}

async function demonstrarSistema() {
  console.log('🚀 DEMONSTRAÇÃO DO SISTEMA DE MONITORAMENTO DE PREÇOS');
  console.log('=' .repeat(60));
  console.log(`📦 Produto: ${productName}`);
  console.log(`🔗 URL: ${productUrl}`);
  console.log('⏳ Testando detecção automática de preços...');
  console.log('');
  
  try {
    const response = await fetch('http://localhost:3000/api/monitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        products: [{
          id: 'demo-' + Date.now(),
          name: productName,
          url: productUrl,
          selector: 'auto',
          initialPrice: 0
        }]
      })
    });
    
    const result = await response.json();
    const productResult = result.results[0];
    
    if (productResult.success) {
      // SUCESSO - Preço encontrado
      console.log('🎉 SUCESSO! Sistema funcionando perfeitamente!');
      console.log(`💰 Preço encontrado: R$ ${productResult.price}`);
      console.log(`🎯 Seletor CSS usado: ${productResult.detectedSelector}`);
      
      const successMessage = `🛒 <b>Preço Monitorado com Sucesso!</b>\n\n` +
                             `📦 <b>Produto:</b> ${productName}\n` +
                             `💰 <b>Preço Atual:</b> R$ ${productResult.price}\n` +
                             `🏪 <b>Loja:</b> Carrefour\n` +
                             `🔗 <b>Link:</b> <a href="${productUrl}">Ver produto</a>\n\n` +
                             `🎯 <b>Seletor CSS:</b> <code>${productResult.detectedSelector}</code>\n` +
                             `🤖 <i>Detectado automaticamente pelo sistema</i>\n\n` +
                             `✅ <b>Sistema ativo!</b> Você receberá notificações quando o preço baixar.`;
      
      await sendTelegramMessage(successMessage);
      
    } else {
      // ERRO - Preço não encontrado
      console.log('⚠️  RESULTADO: Sistema funcionando, mas preço não detectado');
      console.log(`❌ Erro: ${productResult.error}`);
      console.log('');
      console.log('📊 ANÁLISE:');
      console.log('• O sistema testou 29 seletores CSS comuns para e-commerce brasileiro');
      console.log('• Nenhum conseguiu localizar o preço nesta página específica');
      console.log('• Isso pode acontecer se:');
      console.log('  - O site usa seletores CSS únicos/personalizados');
      console.log('  - O site tem proteção anti-bot');
      console.log('  - A estrutura da página mudou recentemente');
      console.log('');
      console.log('💡 SOLUÇÕES:');
      console.log('• Adicionar seletores específicos do Carrefour ao sistema');
      console.log('• Usar a interface web para testar outros produtos');
      console.log('• Testar com outros sites de e-commerce');
      
      const errorMessage = `⚠️ <b>Teste de Monitoramento</b>\n\n` +
                          `📦 <b>Produto:</b> ${productName}\n` +
                          `🔗 <b>URL:</b> <a href="${productUrl}">Ver produto</a>\n` +
                          `❌ <b>Status:</b> Preço não detectado automaticamente\n\n` +
                          `🔍 <b>Detalhes:</b> Sistema testou 29 seletores CSS comuns, mas nenhum funcionou para esta página específica.\n\n` +
                          `💡 <b>Próximos passos:</b> Testar com outros produtos ou adicionar seletores específicos do Carrefour.`;
      
      await sendTelegramMessage(errorMessage);
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    
    const criticalErrorMessage = `🚨 <b>Erro no Sistema</b>\n\n` +
                                `📦 <b>Produto:</b> ${productName}\n` +
                                `💥 <b>Erro:</b> ${error.message}\n\n` +
                                `🔧 <b>Verificar:</b> Se o servidor está rodando (npm run dev)`;
    
    await sendTelegramMessage(criticalErrorMessage);
  }
}

// DEMONSTRAÇÃO COMPLETA
console.log('\n🎯 SISTEMA DE MONITORAMENTO DE PREÇOS COM TELEGRAM');
console.log('Desenvolvido com Next.js + Puppeteer + Telegram Bot API');
console.log('');
console.log('📋 FUNCIONALIDADES:');
console.log('✅ Detecção automática de preços (29 seletores CSS)');
console.log('✅ Monitoramento contínuo de produtos');
console.log('✅ Notificações via Telegram');
console.log('✅ Interface web para gerenciar produtos');
console.log('✅ API REST para integração');
console.log('');

demonstrarSistema().then(() => {
  console.log('\n🎉 DEMONSTRAÇÃO CONCLUÍDA!');
  console.log('');
  console.log('🚀 PRÓXIMOS PASSOS:');
  console.log('1. Configure seu bot do Telegram para receber notificações reais');
  console.log('2. Acesse http://localhost:3000 para usar a interface web');
  console.log('3. Adicione produtos de diferentes lojas para monitorar');
  console.log('4. O sistema verificará automaticamente mudanças de preço');
}).catch((error) => {
  console.error('💥 Erro na demonstração:', error);
});