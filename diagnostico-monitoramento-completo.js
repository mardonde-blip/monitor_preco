// Diagnóstico Completo do Sistema de Monitoramento
const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNÓSTICO COMPLETO DO MONITORAMENTO');
console.log('=====================================');
console.log('');

// 1. Verificar configurações do .env.local
function verificarConfiguracoes() {
    console.log('1️⃣ Verificando configurações...');
    
    const envPath = path.join(__dirname, '.env.local');
    if (!fs.existsSync(envPath)) {
        console.log('❌ Arquivo .env.local não encontrado!');
        return false;
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    let botToken = '';
    let chatId = '';
    let monitoringInterval = '';
    
    lines.forEach(line => {
        if (line.startsWith('NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=')) {
            botToken = line.split('=')[1];
        }
        if (line.startsWith('NEXT_PUBLIC_TELEGRAM_CHAT_ID=')) {
            chatId = line.split('=')[1];
        }
        if (line.startsWith('NEXT_PUBLIC_MONITORING_INTERVAL=')) {
            monitoringInterval = line.split('=')[1];
        }
    });
    
    console.log(`   Bot Token: ${botToken ? botToken.substring(0, 10) + '...' : '❌ NÃO CONFIGURADO'}`);
    console.log(`   Chat ID: ${chatId || '❌ NÃO CONFIGURADO'}`);
    console.log(`   Intervalo: ${monitoringInterval || '❌ NÃO CONFIGURADO'} minutos`);
    
    if (!botToken || !chatId || chatId === 'your_chat_id_here') {
        console.log('❌ Configurações incompletas!');
        return false;
    }
    
    console.log('✅ Configurações OK');
    return true;
}

// 2. Testar APIs do sistema
async function testarAPIs() {
    console.log('');
    console.log('2️⃣ Testando APIs do sistema...');
    
    const testes = [
        { nome: 'Status do Scheduler', url: 'http://localhost:3000/api/scheduler/status' },
        { nome: 'Produtos', url: 'http://localhost:3000/api/products' },
        { nome: 'Configurações', url: 'http://localhost:3000/api/settings' }
    ];
    
    for (const teste of testes) {
        try {
            console.log(`   Testando ${teste.nome}...`);
            const response = await fetch(teste.url);
            const data = await response.json();
            
            if (response.ok) {
                console.log(`   ✅ ${teste.nome}: OK`);
                if (teste.nome === 'Status do Scheduler') {
                    console.log(`      - Scheduler ativo: ${data.isRunning ? '✅ SIM' : '❌ NÃO'}`);
                    console.log(`      - Último ciclo: ${data.lastRun || 'Nunca executado'}`);
                }
                if (teste.nome === 'Produtos') {
                    console.log(`      - Produtos cadastrados: ${data.length || 0}`);
                    if (data.length > 0) {
                        data.forEach((produto, index) => {
                            console.log(`        ${index + 1}. ${produto.name} - Preço alvo: R$ ${produto.targetPrice}`);
                        });
                    }
                }
                if (teste.nome === 'Configurações') {
                    console.log(`      - Notificações habilitadas: ${data.telegramEnabled ? '✅ SIM' : '❌ NÃO'}`);
                }
            } else {
                console.log(`   ❌ ${teste.nome}: Erro ${response.status}`);
            }
        } catch (error) {
            console.log(`   ❌ ${teste.nome}: ${error.message}`);
        }
    }
}

// 3. Testar verificação manual
async function testarVerificacaoManual() {
    console.log('');
    console.log('3️⃣ Testando verificação manual...');
    
    try {
        const response = await fetch('http://localhost:3000/api/scheduler/check', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Verificação manual executada com sucesso');
            console.log(`   - Produtos verificados: ${data.productsChecked || 0}`);
            console.log(`   - Alertas enviados: ${data.alertsSent || 0}`);
            if (data.errors && data.errors.length > 0) {
                console.log('   ⚠️ Erros encontrados:');
                data.errors.forEach(error => console.log(`     - ${error}`));
            }
        } else {
            console.log('❌ Erro na verificação manual:', data.error || 'Erro desconhecido');
        }
    } catch (error) {
        console.log('❌ Erro ao executar verificação manual:', error.message);
    }
}

// 4. Verificar localStorage (simulação)
async function verificarLocalStorage() {
    console.log('');
    console.log('4️⃣ Verificando configurações da interface...');
    
    // Como não podemos acessar localStorage diretamente, vamos verificar via API
    try {
        const response = await fetch('http://localhost:3000/api/settings');
        const settings = await response.json();
        
        console.log('   Configurações da interface:');
        console.log(`   - Notificações Telegram: ${settings.telegramEnabled ? '✅ HABILITADAS' : '❌ DESABILITADAS'}`);
        console.log(`   - Intervalo de monitoramento: ${settings.monitoringInterval || 'Não definido'} min`);
        
        if (!settings.telegramEnabled) {
            console.log('   ⚠️ PROBLEMA: Notificações desabilitadas na interface!');
            console.log('   💡 SOLUÇÃO: Acesse http://localhost:3000 e habilite as notificações');
        }
    } catch (error) {
        console.log('   ❌ Erro ao verificar configurações:', error.message);
    }
}

// 5. Verificar logs recentes
function verificarLogs() {
    console.log('');
    console.log('5️⃣ Verificando logs do sistema...');
    
    // Verificar se existe arquivo de log
    const logPaths = [
        path.join(__dirname, 'logs', 'monitoring.log'),
        path.join(__dirname, 'monitoring.log'),
        path.join(__dirname, '.next', 'server.log')
    ];
    
    let logEncontrado = false;
    
    logPaths.forEach(logPath => {
        if (fs.existsSync(logPath)) {
            logEncontrado = true;
            console.log(`   📄 Log encontrado: ${logPath}`);
            
            try {
                const logContent = fs.readFileSync(logPath, 'utf8');
                const lines = logContent.split('\n').slice(-10); // Últimas 10 linhas
                
                console.log('   Últimas entradas:');
                lines.forEach(line => {
                    if (line.trim()) {
                        console.log(`     ${line}`);
                    }
                });
            } catch (error) {
                console.log(`   ❌ Erro ao ler log: ${error.message}`);
            }
        }
    });
    
    if (!logEncontrado) {
        console.log('   ⚠️ Nenhum arquivo de log encontrado');
        console.log('   💡 Isso pode indicar que o sistema não está executando verificações');
    }
}

// 6. Resumo e recomendações
function gerarResumo() {
    console.log('');
    console.log('📋 RESUMO E RECOMENDAÇÕES');
    console.log('========================');
    console.log('');
    console.log('🔧 PASSOS PARA RESOLVER:');
    console.log('');
    console.log('1. Acesse: http://localhost:3000');
    console.log('2. Vá para a seção de Configurações');
    console.log('3. Habilite as "Notificações do Telegram"');
    console.log('4. Adicione pelo menos um produto para monitorar');
    console.log('5. Configure um preço alvo MENOR que o preço atual');
    console.log('6. Execute uma verificação manual para testar');
    console.log('');
    console.log('⚡ IMPORTANTE:');
    console.log('- O sistema só envia alertas quando o preço ATUAL é <= preço ALVO');
    console.log('- As notificações devem estar HABILITADAS na interface');
    console.log('- O scheduler deve estar RODANDO automaticamente');
    console.log('');
    console.log('🧪 PARA TESTAR:');
    console.log('- Execute: node teste-telegram-simples.js');
    console.log('- Ou use a verificação manual na interface');
}

// Executar diagnóstico completo
async function executarDiagnostico() {
    const configOK = verificarConfiguracoes();
    
    if (configOK) {
        await testarAPIs();
        await verificarLocalStorage();
        await testarVerificacaoManual();
    }
    
    verificarLogs();
    gerarResumo();
}

executarDiagnostico().catch(console.error);