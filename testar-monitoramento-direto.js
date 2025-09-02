// Script para testar o monitoramento diretamente via API
const https = require('https');
const http = require('http');

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const req = protocol.request(url, options, (res) => {
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

async function testarSistemaMonitoramento() {
    console.log('🔍 TESTANDO SISTEMA DE MONITORAMENTO');
    console.log('===================================');
    
    try {
        // 1. Testar status do scheduler
        console.log('\n1️⃣ Verificando status do scheduler...');
        const statusResponse = await makeRequest('http://localhost:3000/api/scheduler/status');
        
        if (statusResponse.status === 200) {
            console.log('✅ API Status funcionando');
            console.log(`   Scheduler ativo: ${statusResponse.data.isActive ? '✅ SIM' : '❌ NÃO'}`);
            console.log(`   Última verificação: ${statusResponse.data.lastCheck || 'Nunca'}`);
        } else {
            console.log(`❌ Erro ao acessar API Status: ${statusResponse.status}`);
            console.log(`   Resposta: ${JSON.stringify(statusResponse.data)}`);
        }
        
        // 2. Testar API de produtos
        console.log('\n2️⃣ Verificando produtos cadastrados...');
        try {
            const produtosResponse = await makeRequest('http://localhost:3000/api/products');
            
            if (produtosResponse.status === 200) {
                const produtos = Array.isArray(produtosResponse.data) ? produtosResponse.data : [];
                console.log(`✅ API Produtos funcionando`);
                console.log(`   Produtos cadastrados: ${produtos.length}`);
                
                if (produtos.length > 0) {
                    console.log('\n📋 PRODUTOS ENCONTRADOS:');
                    produtos.forEach((produto, index) => {
                        console.log(`\n   ${index + 1}. ${produto.name || 'Nome não definido'}`);
                        console.log(`      URL: ${produto.url || 'URL não definida'}`);
                        console.log(`      Preço Atual: R$ ${produto.currentPrice || 'N/A'}`);
                        console.log(`      Preço Alvo: R$ ${produto.targetPrice || 'N/A'}`);
                        
                        const shouldAlert = produto.currentPrice && produto.targetPrice && 
                                          parseFloat(produto.currentPrice) <= parseFloat(produto.targetPrice);
                        console.log(`      Deve Alertar: ${shouldAlert ? '🚨 SIM' : '❌ NÃO'}`);
                    });
                }
            } else {
                console.log(`❌ Erro ao acessar API Produtos: ${produtosResponse.status}`);
            }
        } catch (error) {
            console.log('⚠️ API de produtos não disponível ou erro:', error.message);
        }
        
        // 3. Testar verificação manual
        console.log('\n3️⃣ Executando verificação manual...');
        const checkOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const checkResponse = await makeRequest('http://localhost:3000/api/scheduler/check', checkOptions);
        
        if (checkResponse.status === 200) {
            console.log('✅ Verificação manual executada com sucesso');
            console.log(`   Produtos verificados: ${checkResponse.data.productsChecked || 0}`);
            console.log(`   Alertas enviados: ${checkResponse.data.alertsSent || 0}`);
            
            if (checkResponse.data.errors && checkResponse.data.errors.length > 0) {
                console.log('   ⚠️ Erros encontrados:');
                checkResponse.data.errors.forEach(error => {
                    console.log(`     - ${error}`);
                });
            }
            
            if (checkResponse.data.results && checkResponse.data.results.length > 0) {
                console.log('   📊 Resultados detalhados:');
                checkResponse.data.results.forEach(result => {
                    console.log(`     - ${result.name}: R$ ${result.currentPrice} (alvo: R$ ${result.targetPrice})`);
                });
            }
        } else {
            console.log(`❌ Erro na verificação manual: ${checkResponse.status}`);
            console.log(`   Resposta: ${JSON.stringify(checkResponse.data)}`);
        }
        
        // 4. Testar configurações do Telegram
        console.log('\n4️⃣ Verificando configurações do Telegram...');
        try {
            const telegramResponse = await makeRequest('http://localhost:3000/api/telegram/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (telegramResponse.status === 200) {
                console.log('✅ Teste do Telegram executado');
                console.log(`   Resultado: ${JSON.stringify(telegramResponse.data)}`);
            } else {
                console.log(`❌ Erro no teste do Telegram: ${telegramResponse.status}`);
                console.log(`   Resposta: ${JSON.stringify(telegramResponse.data)}`);
            }
        } catch (error) {
            console.log('⚠️ API de teste do Telegram não disponível:', error.message);
        }
        
    } catch (error) {
        console.error('❌ Erro geral no teste:', error.message);
    }
    
    console.log('\n📋 DIAGNÓSTICO COMPLETO:');
    console.log('========================');
    console.log('✅ Se você vê produtos cadastrados acima, o sistema está detectando');
    console.log('✅ Se a verificação manual foi executada, as APIs estão funcionando');
    console.log('❗ Se alertas enviados = 0, verifique:');
    console.log('   1. Chat ID configurado no .env.local');
    console.log('   2. Notificações habilitadas na interface');
    console.log('   3. Preço atual <= preço alvo nos produtos');
    console.log('\n🔧 Para corrigir, edite o .env.local e substitua:');
    console.log('   NEXT_PUBLIC_TELEGRAM_CHAT_ID=your_chat_id_here');
    console.log('   Por seu Chat ID real obtido do @userinfobot');
}

testarSistemaMonitoramento().catch(console.error);