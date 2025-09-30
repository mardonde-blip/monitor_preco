const https = require('https');

// Configurações do Telegram
const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || '7896765432:AAGjKGJKGJKGJKGJKGJKGJKGJKGJKGJKGJK';
const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID || '123456789';

// URL principal do projeto
const vercelUrl = 'https://monitor-precos.vercel.app';

console.log('🎯 TESTE FINAL - API do Telegram no Vercel');
console.log('URL:', vercelUrl);
console.log('Bot Token:', botToken ? `${botToken.substring(0, 10)}...` : 'NÃO DEFINIDO');
console.log('Chat ID:', chatId);

// Dados para enviar
const postData = JSON.stringify({
  botToken: botToken,
  chatId: chatId
});

// Configurações da requisição para a URL principal
const options = {
  hostname: 'monitor-precos.vercel.app',
  port: 443,
  path: '/api/public/telegram-test',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'User-Agent': 'Node.js Test Script'
  }
};

console.log('\n🚀 Enviando requisição para URL PRINCIPAL...');
console.log('Endpoint completo:', `${vercelUrl}${options.path}`);

const req = https.request(options, (res) => {
  console.log(`\n✅ Status HTTP: ${res.statusCode}`);
  console.log('Headers de resposta:', res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📄 Resposta completa:');
    try {
      const jsonResponse = JSON.parse(data);
      console.log(JSON.stringify(jsonResponse, null, 2));
      
      if (jsonResponse.success) {
        console.log('\n🎉 SUCESSO TOTAL! Mensagem enviada para o Telegram!');
        console.log('📱 VERIFIQUE SEU TELEGRAM AGORA!');
        console.log('🔔 Você deve ter recebido uma mensagem de teste!');
        
        if (jsonResponse.telegramResponse) {
          console.log('\n📊 Detalhes da resposta do Telegram:');
          console.log('- Message ID:', jsonResponse.telegramResponse.message_id);
          console.log('- Chat:', jsonResponse.telegramResponse.chat);
        }
      } else {
        console.log('\n❌ FALHA no envio:', jsonResponse.error);
        if (jsonResponse.telegramError) {
          console.log('🤖 Erro específico do Telegram:', jsonResponse.telegramError);
          console.log('📋 Código do erro:', jsonResponse.errorCode);
        }
        
        console.log('\n🔧 Possíveis soluções:');
        console.log('1. Verifique se o Bot Token está correto');
        console.log('2. Verifique se o Chat ID está correto');
        console.log('3. Certifique-se de ter enviado /start para o bot');
      }
    } catch (e) {
      console.log('❌ Resposta não é JSON válido:');
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error('\n💥 Erro na requisição HTTP:', e.message);
  console.log('\n🔧 Verifique sua conexão com a internet');
});

// Enviar os dados
req.write(postData);
req.end();

console.log('⏳ Aguardando resposta do servidor...');