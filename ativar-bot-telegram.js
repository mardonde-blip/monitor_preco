#!/usr/bin/env node

// Script para ativação automática do bot do Telegram
// Execute com: node ativar-bot-telegram.js

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

console.log('🤖 ATIVAÇÃO AUTOMÁTICA DO BOT TELEGRAM');
console.log('=====================================\n');

// Função para fazer requisições HTTP
async function makeRequest(url, options = {}) {
  try {
    const https = require('https');
    const http = require('http');
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    return new Promise((resolve) => {
      const postData = options.body || null;
      
      const reqOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      };
      
      if (postData) {
        reqOptions.headers['Content-Length'] = Buffer.byteLength(postData);
      }
      
      const req = client.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({ success: res.statusCode >= 200 && res.statusCode < 300, data: jsonData, status: res.statusCode });
          } catch (error) {
            resolve({ success: false, error: 'Invalid JSON response', data: data });
          }
        });
      });
      
      req.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });
      
      if (postData) {
        req.write(postData);
      }
      
      req.end();
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Função para verificar se o bot está ativo
async function verificarBot(botToken) {
  console.log('🔍 Verificando bot...');
  
  const result = await makeRequest(`https://api.telegram.org/bot${botToken}/getMe`);
  
  if (result.success) {
    console.log(`✅ Bot encontrado: ${result.data.result.first_name} (@${result.data.result.username})`);
    return true;
  } else {
    console.log('❌ Bot inválido ou token incorreto');
    return false;
  }
}

// Função para verificar chat ID
async function verificarChatId(botToken, chatId) {
  console.log('🔍 Verificando Chat ID...');
  
  const result = await makeRequest(`https://api.telegram.org/bot${botToken}/getChat?chat_id=${chatId}`);
  
  if (result.success) {
    const chat = result.data.result;
    console.log(`✅ Chat encontrado: ${chat.first_name || chat.title || 'Chat'} (ID: ${chat.id})`);
    return true;
  } else {
    console.log('❌ Chat ID inválido ou bot não tem acesso');
    console.log('💡 Dica: Envie /start para o bot primeiro');
    return false;
  }
}

// Função para enviar mensagem de ativação
async function enviarMensagemAtivacao(botToken, chatId) {
  console.log('📤 Enviando mensagem de ativação...');
  
  const mensagem = `🎉 BOT ATIVADO COM SUCESSO!

✅ Seu bot do Telegram está funcionando perfeitamente!

📱 Você receberá notificações quando:
• Preços de produtos monitorados caírem
• Ofertas especiais forem encontradas
• Produtos voltarem ao estoque

🚀 Próximos passos:
1. Acesse http://localhost:3000
2. Adicione produtos para monitorar
3. Aguarde as notificações automáticas!

⏰ Ativado em: ${new Date().toLocaleString('pt-BR')}`;
  
  const result = await makeRequest(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: mensagem,
      parse_mode: 'HTML'
    })
  });
  
  if (result.success) {
    console.log('✅ Mensagem de ativação enviada!');
    console.log('📱 Verifique seu Telegram!');
    return true;
  } else {
    console.log('❌ Erro ao enviar mensagem:', result.data?.description || result.error);
    return false;
  }
}

// Função para atualizar configurações no sistema
async function atualizarConfiguracoes(botToken, chatId) {
  console.log('⚙️ Atualizando configurações do sistema...');
  
  try {
    // Verificar se o servidor está rodando
    const healthCheck = await makeRequest('http://localhost:3000/api/settings');
    
    if (!healthCheck.success) {
      console.log('⚠️ Servidor não está rodando. Inicie com: npm run dev');
      return false;
    }
    
    // Atualizar configurações do Telegram
    const updateResult = await makeRequest('http://localhost:3000/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegram: {
          botToken: botToken,
          chatId: chatId
        },
        enabled: true
      })
    });
    
    if (updateResult.success) {
      console.log('✅ Configurações atualizadas no sistema!');
      return true;
    } else {
      console.log('⚠️ Não foi possível atualizar as configurações automaticamente');
      console.log('💡 Configure manualmente no Dashboard');
      return false;
    }
  } catch (error) {
    console.log('⚠️ Erro ao atualizar configurações:', error.message);
    return false;
  }
}

// Função para verificar arquivo .env.local
function verificarEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ Arquivo .env.local não encontrado');
    return null;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const botTokenMatch = envContent.match(/NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=(.+)/);
  const chatIdMatch = envContent.match(/NEXT_PUBLIC_TELEGRAM_CHAT_ID=(.+)/);
  
  return {
    botToken: botTokenMatch ? botTokenMatch[1].trim() : null,
    chatId: chatIdMatch ? chatIdMatch[1].trim() : null
  };
}

// Função principal
async function ativarBot() {
  try {
    // 1. Verificar configurações no .env.local
    console.log('1️⃣ Verificando configurações...');
    const config = verificarEnvLocal();
    
    if (!config) {
      console.log('❌ Não foi possível ler as configurações');
      return;
    }
    
    if (!config.botToken || config.botToken === 'your_bot_token_here') {
      console.log('❌ Bot Token não configurado');
      console.log('💡 Configure NEXT_PUBLIC_TELEGRAM_BOT_TOKEN no .env.local');
      return;
    }
    
    if (!config.chatId || config.chatId === 'your_chat_id_here') {
      console.log('❌ Chat ID não configurado');
      console.log('💡 Configure NEXT_PUBLIC_TELEGRAM_CHAT_ID no .env.local');
      return;
    }
    
    console.log('✅ Configurações encontradas!');
    console.log(`🤖 Bot Token: ${config.botToken.substring(0, 10)}...`);
    console.log(`💬 Chat ID: ${config.chatId}\n`);
    
    // 2. Verificar bot
    console.log('2️⃣ Verificando bot...');
    const botValido = await verificarBot(config.botToken);
    if (!botValido) return;
    
    // 3. Verificar chat ID
    console.log('\n3️⃣ Verificando Chat ID...');
    const chatValido = await verificarChatId(config.botToken, config.chatId);
    if (!chatValido) return;
    
    // 4. Enviar mensagem de ativação
    console.log('\n4️⃣ Enviando mensagem de ativação...');
    const mensagemEnviada = await enviarMensagemAtivacao(config.botToken, config.chatId);
    if (!mensagemEnviada) return;
    
    // 5. Atualizar configurações do sistema
    console.log('\n5️⃣ Atualizando configurações do sistema...');
    await atualizarConfiguracoes(config.botToken, config.chatId);
    
    // 6. Sucesso!
    console.log('\n🎉 BOT ATIVADO COM SUCESSO!');
    console.log('=====================================');
    console.log('✅ Telegram configurado e funcionando');
    console.log('📱 Mensagem de teste enviada');
    console.log('⚙️ Sistema atualizado');
    console.log('\n🚀 Próximos passos:');
    console.log('1. Acesse http://localhost:3000');
    console.log('2. Adicione produtos para monitorar');
    console.log('3. Aguarde as notificações automáticas!');
    
  } catch (error) {
    console.error('❌ Erro durante a ativação:', error.message);
  }
}

// Executar
if (require.main === module) {
  ativarBot();
}

module.exports = { ativarBot, verificarBot, verificarChatId };