// Script final para diagnosticar problema do Telegram
const fs = require('fs');
const path = require('path');
const http = require('http');

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = http.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });
        
        req.on('error', reject);
        
        if (options.method === 'POST' && options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

async function diagnosticoCompleto() {
    console.log('🔍 DIAGNÓSTICO FINAL - PROBLEMA DO TELEGRAM');
    console.log('==========================================');
    
    // 1. Verificar configurações do .env.local
    console.log('\n1️⃣ Verificando .env.local...');
    const envPath = path.join(__dirname, '.env.local');
    
    if (!fs.existsSync(envPath)) {
        console.log('❌ Arquivo .env.local não encontrado!');
        return;
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const botTokenMatch = envContent.match(/NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=(.+)/);
    const chatIdMatch = envContent.match(/NEXT_PUBLIC_TELEGRAM_CHAT_ID=(.+)/);
    
    let botToken = '';
    let chatId = '';
    
    if (botTokenMatch) {
        botToken = botTokenMatch[1].trim();
        console.log('✅ Bot Token encontrado:', botToken.substring(0, 10) + '...');
    } else {
        console.log('❌ Bot Token não encontrado');
        return;
    }
    
    if (chatIdMatch && chatIdMatch[1].trim() !== 'your_chat_id_here') {
        chatId = chatIdMatch[1].trim();
        console.log('✅ Chat ID configurado:', chatId);
    } else {
        console.log('❌ Chat ID não configurado (ainda é placeholder)');
        console.log('\n🚨 PROBLEMA IDENTIFICADO: CHAT ID NÃO CONFIGURADO!');
        console.log('\n📋 SOLUÇÃO:');
        console.log('1. Abra o Telegram');
        console.log('2. Procure por @userinfobot');
        console.log('3. Envie /start');
        console.log('4. Copie o Chat ID (apenas números)');
        console.log('5. Edite o .env.local e substitua "your_chat_id_here" pelo seu Chat ID');
        console.log('6. Reinicie o servidor (Ctrl+C e npm run dev)');
        return;
    }
    
    // 2. Testar API do Telegram diretamente
    console.log('\n2️⃣ Testando API do Telegram diretamente...');
    try {
        const telegramApiUrl = `https://api.telegram.org/bot${botToken}/getMe`;
        const response = await fetch(telegramApiUrl);
        const result = await response.json();
        
        if (result.ok) {
            console.log('✅ Bot Token válido:', result.result.username);
        } else {
            console.log('❌ Bot Token inválido:', result.description);
            return;
        }
    } catch (error) {
        console.log('❌ Erro ao testar Bot Token:', error.message);
        return;
    }
    
    // 3. Testar envio de mensagem
    console.log('\n3️⃣ Testando envio de mensagem...');
    try {
        const sendMessageUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const messageData = {
            chat_id: chatId,
            text: '🧪 Teste do sistema de monitoramento de preços\n\nSe você recebeu esta mensagem, o sistema está funcionando corretamente!'
        };
        
        const response = await fetch(sendMessageUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(messageData)
        });
        
        const result = await response.json();
        
        if (result.ok) {
            console.log('✅ Mensagem enviada com sucesso!');
            console.log('   Verifique seu Telegram para confirmar o recebimento.');
        } else {
            console.log('❌ Erro ao enviar mensagem:', result.description);
            
            if (result.error_code === 400 && result.description.includes('chat not found')) {
                console.log('\n🚨 PROBLEMA: Chat ID inválido ou bot não iniciado');
                console.log('\n📋 SOLUÇÃO:');
                console.log('1. Verifique se o Chat ID está correto');
                console.log('2. Inicie uma conversa com o bot primeiro');
                console.log('3. Envie /start para o bot');
            }
            return;
        }
    } catch (error) {
        console.log('❌ Erro ao testar envio:', error.message);
        return;
    }
    
    // 4. Testar API local com configurações corretas
    console.log('\n4️⃣ Testando API local do sistema...');
    try {
        const testConfig = {
            botToken: botToken,
            chatId: chatId
        };
        
        const response = await makeRequest('http://localhost:3000/api/telegram/test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testConfig)
        });
        
        if (response.status === 200) {
            console.log('✅ API local funcionando corretamente');
        } else {
            console.log('❌ Erro na API local:', response.status);
            console.log('   Resposta:', JSON.stringify(response.data));
        }
    } catch (error) {
        console.log('❌ Erro ao testar API local:', error.message);
    }
    
    // 5. Verificar se há produtos para monitorar
    console.log('\n5️⃣ Verificando produtos cadastrados...');
    try {
        const response = await makeRequest('http://localhost:3000/api/products');
        
        if (response.status === 200) {
            const produtos = Array.isArray(response.data) ? response.data : [];
            console.log(`📦 Produtos cadastrados: ${produtos.length}`);
            
            if (produtos.length === 0) {
                console.log('\n⚠️ AVISO: Nenhum produto cadastrado para monitoramento');
                console.log('\n📋 PRÓXIMO PASSO:');
                console.log('1. Acesse http://localhost:3000');
                console.log('2. Adicione produtos para monitorar');
                console.log('3. Configure preços alvo');
            } else {
                console.log('\n📋 PRODUTOS ENCONTRADOS:');
                produtos.forEach((produto, index) => {
                    console.log(`   ${index + 1}. ${produto.name || 'Nome não definido'}`);
                    console.log(`      Preço Atual: R$ ${produto.currentPrice || 'N/A'}`);
                    console.log(`      Preço Alvo: R$ ${produto.targetPrice || 'N/A'}`);
                    
                    const shouldAlert = produto.currentPrice && produto.targetPrice && 
                                      parseFloat(produto.currentPrice) <= parseFloat(produto.targetPrice);
                    console.log(`      Deve Alertar: ${shouldAlert ? '🚨 SIM' : '❌ NÃO'}`);
                });
            }
        }
    } catch (error) {
        console.log('⚠️ Não foi possível verificar produtos:', error.message);
    }
    
    // 6. Executar verificação manual
    console.log('\n6️⃣ Executando verificação manual...');
    try {
        const response = await makeRequest('http://localhost:3000/api/scheduler/check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 200) {
            console.log('✅ Verificação manual executada');
            console.log(`   Produtos verificados: ${response.data.productsChecked || 0}`);
            console.log(`   Alertas enviados: ${response.data.alertsSent || 0}`);
            
            if (response.data.alertsSent === 0) {
                console.log('\n⚠️ NENHUM ALERTA ENVIADO - Possíveis causas:');
                console.log('   • Preço atual ainda está acima do preço alvo');
                console.log('   • Notificações desabilitadas na interface');
                console.log('   • Erro na configuração do Telegram');
            }
        } else {
            console.log('❌ Erro na verificação manual:', response.status);
        }
    } catch (error) {
        console.log('❌ Erro ao executar verificação:', error.message);
    }
    
    console.log('\n📋 RESUMO FINAL:');
    console.log('================');
    console.log('✅ Se chegou até aqui, as configurações básicas estão corretas');
    console.log('✅ Bot Token e Chat ID estão funcionando');
    console.log('\n🎯 PARA RECEBER ALERTAS:');
    console.log('1. Certifique-se que há produtos cadastrados');
    console.log('2. Configure preços alvo menores que os preços atuais');
    console.log('3. Habilite as notificações na interface web');
    console.log('4. Execute verificações manuais para testar');
}

diagnosticoCompleto().catch(console.error);