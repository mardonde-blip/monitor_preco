const https = require('https');

// Configurações do Telegram
const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || '7896765432:AAGjKGJKGJKGJKGJKGJKGJKGJKGJKGJKGJK';
const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID || '123456789';

// Nova URL da API pública
const vercelUrl = 'https://monitor-precos-9uikc0t61-marcus-dondes-projects.vercel.app';

console.log('🚀 Testando API PÚBLICA do Telegram no Vercel...');
console.log('URL:', vercelUrl);
console.log('Bot Token:', botToken ? `${botToken.substring(0, 10)}...` : 'NÃO DEFINIDO');
console.log('Chat ID:', chatId);

// Dados para enviar
const postData = JSON.stringify({
  botToken: botToken,
  chatId: chatId
});

// Configurações da requisição para a API pública
const options = {
  hostname: 'monitor-precos-9uikc0t61-marcus-dondes-projects.vercel.app',
  port: 443,
  path: '/api/public/telegram-test',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'User-Agent': 'Node.js Test Script'
  }
};

console.log('\n📡 Enviando requisição para API PÚBLICA...');
console.log('Endpoint:', options.path);

const req = https.request(options, (res) => {
  console.log(`\n✅ Status: ${res.statusCode}`);
  console.log('Headers:', res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📄 Resposta:');
    try {
      const jsonResponse = JSON.parse(data);
      console.log(JSON.stringify(jsonResponse, null, 2));
      
      if (jsonResponse.success) {
        console.log('\n🎉 SUCESSO! Mensagem enviada para o Telegram!');
        console.log('📱 Verifique seu Telegram agora!');
      } else {
        console.log('\n❌ FALHA:', jsonResponse.error);
        if (jsonResponse.telegramError) {
          console.log('🤖 Erro do Telegram:', jsonResponse.telegramError);
        }
      }
    } catch (e) {
      console.log('Resposta não é JSON válido:');
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error('\n❌ Erro na requisição:', e.message);
});

// Enviar os dados
req.write(postData);
req.end();

console.log('⏳ Aguardando resposta...');