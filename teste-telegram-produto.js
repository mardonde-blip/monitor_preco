// Script para testar envio de mensagem do Telegram via API
const fs = require('fs');
const path = require('path');

async function testarTelegramViaAPI() {
  console.log('🧪 TESTE DE TELEGRAM VIA API');
  console.log('=' .repeat(40));

  try {
    // 1. Carregar configurações do .env.local
    console.log('\n1️⃣ Carregando configurações...');
    
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
      console.log('✅ Bot Token encontrado');
    } else {
      console.log('❌ Bot Token não encontrado no .env.local');
      return;
    }
    
    if (chatIdMatch && chatIdMatch[1].trim() !== 'your_chat_id_here') {
      chatId = chatIdMatch[1].trim();
      console.log('✅ Chat ID encontrado:', chatId);
    } else {
      console.log('❌ Chat ID não configurado ou ainda é placeholder');
      console.log('\n📋 PARA OBTER SEU CHAT ID:');
      console.log('1. Abra o Telegram');
      console.log('2. Procure por @userinfobot');
      console.log('3. Envie /start');
      console.log('4. Copie o Chat ID');
      console.log('5. Substitua "your_chat_id_here" no .env.local');
      return;
    }

    // 2. Testar via API do sistema
    console.log('\n2️⃣ Testando via API /api/telegram/test...');
    
    const testPayload = {
      botToken: botToken,
      chatId: chatId
    };
    
    try {
      const response = await fetch('http://localhost:3000/api/telegram/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ TESTE DA API PASSOU!');
        console.log('📱 Mensagem de teste enviada com sucesso!');
        console.log('Resultado:', result);
      } else {
        console.log('❌ Erro na API:', result);
        
        if (response.status === 401) {
          console.log('\n🔑 Erro 401: Token do bot inválido');
        } else if (response.status === 400) {
          console.log('\n🆔 Erro 400: Chat ID inválido ou bot não iniciado');
          console.log('Certifique-se de enviar uma mensagem para o bot primeiro');
        }
      }
    } catch (fetchError) {
      console.log('❌ Erro ao conectar com a API:', fetchError.message);
      console.log('Verifique se o servidor está rodando em http://localhost:3000');
    }

    // 3. Testar envio direto via API do Telegram
    console.log('\n3️⃣ Testando envio direto via API do Telegram...');
    
    const mensagemTeste = `🧪 TESTE DIRETO DO SISTEMA\n\n` +
                         `📦 Produto: Teste de Notificação\n` +
                         `💰 Preço atual: R$ 299,99\n` +
                         `🎯 Preço alvo: R$ 250,00\n` +
                         `🔗 Link: https://exemplo.com/produto\n\n` +
                         `⏰ Teste realizado em: ${new Date().toLocaleString('pt-BR')}`;
    
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    try {
      const telegramResponse = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: mensagemTeste,
          parse_mode: 'HTML'
        })
      });
      
      const telegramResult = await telegramResponse.json();
      
      if (telegramResponse.ok) {
        console.log('✅ MENSAGEM ENVIADA DIRETAMENTE!');
        console.log('📱 Verifique seu Telegram agora!');
        console.log('ID da mensagem:', telegramResult.result.message_id);
      } else {
        console.log('❌ Erro do Telegram:', telegramResult);
        
        if (telegramResult.error_code === 401) {
          console.log('\n🔑 Token inválido ou bot desabilitado');
        } else if (telegramResult.error_code === 400) {
          console.log('\n🆔 Chat ID inválido ou você não iniciou conversa com o bot');
          console.log('Envie /start para o bot no Telegram primeiro');
        }
      }
    } catch (telegramError) {
      console.log('❌ Erro ao conectar com API do Telegram:', telegramError.message);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Verificar se fetch está disponível (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ Este script requer Node.js 18+ ou instale node-fetch');
  console.log('Versão atual do Node.js:', process.version);
  process.exit(1);
}

// Executar o teste
testarTelegramViaAPI().catch(console.error);