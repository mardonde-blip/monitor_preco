// Script para verificar produtos no localStorage e testar monitoramento
const puppeteer = require('puppeteer');

async function verificarProdutosLocalStorage() {
    console.log('🔍 VERIFICANDO PRODUTOS NO LOCALSTORAGE');
    console.log('=====================================');
    
    let browser;
    try {
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        // Navegar para a aplicação
        console.log('📱 Acessando aplicação...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
        
        // Verificar produtos no localStorage
        const produtos = await page.evaluate(() => {
            const produtosStr = localStorage.getItem('products');
            return produtosStr ? JSON.parse(produtosStr) : [];
        });
        
        console.log(`📦 Produtos encontrados: ${produtos.length}`);
        
        if (produtos.length > 0) {
            console.log('\n📋 DETALHES DOS PRODUTOS:');
            produtos.forEach((produto, index) => {
                console.log(`\n${index + 1}. ${produto.name || 'Nome não definido'}`);
                console.log(`   URL: ${produto.url || 'URL não definida'}`);
                console.log(`   Preço Atual: R$ ${produto.currentPrice || 'N/A'}`);
                console.log(`   Preço Alvo: R$ ${produto.targetPrice || 'N/A'}`);
                console.log(`   Deve Alertar: ${produto.currentPrice && produto.targetPrice && produto.currentPrice <= produto.targetPrice ? '🚨 SIM' : '❌ NÃO'}`);
            });
        }
        
        // Verificar configurações de notificação
        const notificationSettings = await page.evaluate(() => {
            const settingsStr = localStorage.getItem('notificationSettings');
            return settingsStr ? JSON.parse(settingsStr) : null;
        });
        
        console.log('\n🔔 CONFIGURAÇÕES DE NOTIFICAÇÃO:');
        if (notificationSettings) {
            console.log(`   Habilitadas: ${notificationSettings.enabled ? '✅ SIM' : '❌ NÃO'}`);
            console.log(`   Bot Token: ${notificationSettings.botToken ? '✅ Configurado' : '❌ Não configurado'}`);
            console.log(`   Chat ID: ${notificationSettings.chatId ? '✅ Configurado' : '❌ Não configurado'}`);
        } else {
            console.log('   ❌ Configurações não encontradas');
        }
        
        // Verificar status do scheduler
        const schedulerStatus = await page.evaluate(() => {
            const statusStr = localStorage.getItem('schedulerStatus');
            return statusStr ? JSON.parse(statusStr) : null;
        });
        
        console.log('\n⏰ STATUS DO SCHEDULER:');
        if (schedulerStatus) {
            console.log(`   Ativo: ${schedulerStatus.isActive ? '✅ SIM' : '❌ NÃO'}`);
            console.log(`   Última verificação: ${schedulerStatus.lastCheck || 'Nunca'}`);
        } else {
            console.log('   ❌ Status não encontrado');
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar localStorage:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

async function testarAPIScheduler() {
    console.log('\n🔍 TESTANDO API DO SCHEDULER');
    console.log('============================');
    
    try {
        // Testar status do scheduler
        const statusResponse = await fetch('http://localhost:3000/api/scheduler/status');
        if (statusResponse.ok) {
            const status = await statusResponse.json();
            console.log('✅ API Status funcionando');
            console.log(`   Scheduler ativo: ${status.isActive ? '✅ SIM' : '❌ NÃO'}`);
            console.log(`   Última verificação: ${status.lastCheck || 'Nunca'}`);
        } else {
            console.log('❌ Erro ao acessar API Status:', statusResponse.status);
        }
        
        // Testar verificação manual
        console.log('\n🔄 Testando verificação manual...');
        const checkResponse = await fetch('http://localhost:3000/api/scheduler/check', {
            method: 'POST'
        });
        
        if (checkResponse.ok) {
            const result = await checkResponse.json();
            console.log('✅ Verificação manual executada');
            console.log(`   Produtos verificados: ${result.productsChecked || 0}`);
            console.log(`   Alertas enviados: ${result.alertsSent || 0}`);
            if (result.errors && result.errors.length > 0) {
                console.log('   ⚠️ Erros encontrados:');
                result.errors.forEach(error => console.log(`     - ${error}`));
            }
        } else {
            console.log('❌ Erro na verificação manual:', checkResponse.status);
            const errorText = await checkResponse.text();
            console.log('   Detalhes:', errorText);
        }
        
    } catch (error) {
        console.error('❌ Erro ao testar API:', error.message);
    }
}

async function main() {
    await verificarProdutosLocalStorage();
    await testarAPIScheduler();
    
    console.log('\n📋 RESUMO E PRÓXIMOS PASSOS:');
    console.log('============================');
    console.log('1. ✅ Verifique se há produtos cadastrados acima');
    console.log('2. ✅ Confirme se as notificações estão habilitadas');
    console.log('3. ❗ Configure o Chat ID no .env.local (substitua "your_chat_id_here")');
    console.log('4. 🔄 Execute uma verificação manual na interface');
    console.log('5. 📱 Use @userinfobot no Telegram para obter seu Chat ID');
}

main().catch(console.error);