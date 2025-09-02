// Script para debugar configurações do Telegram
const fs = require('fs');
const path = require('path');

console.log('=== DEBUG TELEGRAM CONFIGURAÇÕES ===');

// Simular localStorage (já que estamos no Node.js)
const mockLocalStorage = {
  getItem: (key) => {
    // Em um ambiente real, isso viria do navegador
    console.log(`Tentando obter: ${key}`);
    return null; // Simula que não há dados salvos
  }
};

// Função para verificar configurações padrão
function getDefaultSettings() {
  return {
    enabled: false,
    telegram: {
      botToken: '',
      chatId: ''
    }
  };
}

const settings = getDefaultSettings();
console.log('Configurações padrão:', JSON.stringify(settings, null, 2));

// Verificar se há variáveis de ambiente
console.log('\n=== VARIÁVEIS DE AMBIENTE ===');
console.log('NEXT_PUBLIC_TELEGRAM_BOT_TOKEN:', process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || 'NÃO DEFINIDA');
console.log('NEXT_PUBLIC_TELEGRAM_CHAT_ID:', process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID || 'NÃO DEFINIDA');

// Verificar se o arquivo .env.local existe
const envPath = path.join(__dirname, '.env.local');
console.log('\n=== ARQUIVO .env.local ===');
if (fs.existsSync(envPath)) {
  console.log('Arquivo .env.local encontrado');
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('Conteúdo:');
  console.log(envContent);
} else {
  console.log('Arquivo .env.local NÃO encontrado');
}

console.log('\n=== DIAGNÓSTICO ===');
if (!settings.enabled) {
  console.log('❌ Notificações do Telegram estão DESABILITADAS');
}
if (!settings.telegram.botToken) {
  console.log('❌ Bot Token NÃO configurado');
}
if (!settings.telegram.chatId) {
  console.log('❌ Chat ID NÃO configurado');
}

console.log('\n=== PRÓXIMOS PASSOS ===');
console.log('1. Acesse http://localhost:3000');
console.log('2. Role até a seção "Configurações do Telegram"');
console.log('3. Configure o Bot Token e Chat ID');
console.log('4. Ative as notificações');
console.log('5. Teste a conexão');