// Teste simples do Telegram - Verificar conectividade
const https = require('https');
const http = require('http');

// Configurações do .env.local
const BOT_TOKEN = '8306764040:AAF0N3PSY4TERuU05rcKHsbFBp7u6LQNsts';
const CHAT_ID = '8453013986';

console.log('🔍 TESTE SIMPLES DO TELEGRAM');
console.log('============================');
console.log(`Bot Token: ${BOT_TOKEN.substring(0, 10)}...`);
console.log(`Chat ID: ${CHAT_ID}`);
console.log('');

// Função para testar com diferentes métodos
async function testarTelegram() {
    const mensagem = '🧪 Teste de conectividade - Chat ID configurado!';
    
    console.log('1️⃣ Testando com fetch (Node.js nativo)...');
    try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: mensagem
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Fetch funcionou! Mensagem enviada.');
            console.log('📱 Verifique seu Telegram!');
            return true;
        } else {
            console.log('❌ Erro na resposta:', result);
            return false;
        }
    } catch (error) {
        console.log('❌ Erro com fetch:', error.message);
    }
    
    console.log('');
    console.log('2️⃣ Testando com https nativo...');
    
    return new Promise((resolve) => {
        const data = JSON.stringify({
            chat_id: CHAT_ID,
            text: mensagem + ' (via HTTPS nativo)'
        });
        
        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${BOT_TOKEN}/sendMessage`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };
        
        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(responseData);
                    if (res.statusCode === 200 && result.ok) {
                        console.log('✅ HTTPS nativo funcionou! Mensagem enviada.');
                        console.log('📱 Verifique seu Telegram!');
                        resolve(true);
                    } else {
                        console.log('❌ Erro na resposta HTTPS:', result);
                        resolve(false);
                    }
                } catch (e) {
                    console.log('❌ Erro ao processar resposta:', e.message);
                    resolve(false);
                }
            });
        });
        
        req.on('error', (error) => {
            console.log('❌ Erro HTTPS:', error.message);
            resolve(false);
        });
        
        req.write(data);
        req.end();
    });
}

// Testar API local também
async function testarAPILocal() {
    console.log('');
    console.log('3️⃣ Testando API local do sistema...');
    
    try {
        const response = await fetch('http://localhost:3000/api/telegram/test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                botToken: BOT_TOKEN,
                chatId: CHAT_ID
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ API local funcionou!');
            console.log('📱 Verifique seu Telegram!');
        } else {
            console.log('❌ Erro na API local:', result);
        }
    } catch (error) {
        console.log('❌ Erro ao testar API local:', error.message);
    }
}

// Executar todos os testes
async function executarTestes() {
    const sucesso = await testarTelegram();
    await testarAPILocal();
    
    console.log('');
    console.log('🎯 RESULTADO FINAL:');
    if (sucesso) {
        console.log('✅ Chat ID configurado e funcionando!');
        console.log('✅ Telegram está recebendo mensagens!');
        console.log('');
        console.log('🚀 PRÓXIMOS PASSOS:');
        console.log('1. Acesse http://localhost:3000');
        console.log('2. Habilite as notificações do Telegram');
        console.log('3. Adicione produtos para monitorar');
        console.log('4. Configure preços alvo menores que os atuais');
    } else {
        console.log('❌ Ainda há problemas de conectividade');
        console.log('🔧 Verifique sua conexão com a internet');
    }
}

executarTestes().catch(console.error);