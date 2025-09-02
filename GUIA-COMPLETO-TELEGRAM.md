# 🤖 Guia Completo: Configuração do Telegram para Notificações

## ✅ Status Atual

**Seu Telegram já está configurado e funcionando!** ✨

- 🤖 **Bot Token**: Configurado
- 💬 **Chat ID**: 8453013986
- 📱 **Status**: Funcionando perfeitamente

---

## 📋 Para Novos Usuários: Como Configurar do Zero

### 1️⃣ Criar um Bot no Telegram

1. **Abra o Telegram** no seu celular ou computador
2. **Procure por**: `@BotFather`
3. **Envie**: `/start`
4. **Envie**: `/newbot`
5. **Digite um nome** para seu bot (ex: "Monitor Preços Bot")
6. **Digite um username** terminado em "bot" (ex: "meumonitorbot")
7. **Copie o token** que aparece (formato: `123456789:ABCdefGHIjklMNOpqrSTUvwxYZ`)

### 2️⃣ Obter seu Chat ID

#### Método 1: Usando @userinfobot (Mais Fácil)
1. **Procure por**: `@userinfobot` no Telegram
2. **Envie**: `/start`
3. **Copie o número** que aparece como "Id"

#### Método 2: Usando a API do Telegram
1. **Envie uma mensagem** para seu bot (qualquer coisa, ex: "oi")
2. **Acesse no navegador**: `https://api.telegram.org/bot<SEU_TOKEN>/getUpdates`
3. **Procure por**: `"chat":{"id":123456789`
4. **Copie o número** após `"id":`

#### Método 3: Usando o script automático
```bash
node obter-chat-id.js
```

### 3️⃣ Configurar no Arquivo .env.local

1. **Abra o arquivo**: `.env.local`
2. **Adicione ou edite**:
```env
NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=seu_token_aqui
NEXT_PUBLIC_TELEGRAM_CHAT_ID=seu_chat_id_aqui
```

**Exemplo**:
```env
NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=8306764040:AAF0N3PSY4TERuU05rcKHsbFBp7u6LQNsts
NEXT_PUBLIC_TELEGRAM_CHAT_ID=8453013986
```

### 4️⃣ Ativar no Sistema

1. **Acesse**: http://localhost:3000
2. **Faça login** na sua conta
3. **Vá para**: Dashboard
4. **Na seção "Configuração do Telegram"**:
   - ✅ Marque "Ativar notificações do Telegram"
   - Digite seu Chat ID: `8453013986`
   - Clique em "Salvar"

---

## 🧪 Testes de Funcionamento

### Teste Rápido
```bash
node test-telegram.js
```

### Teste Completo
```bash
node diagnostico-final-telegram.js
```

### Teste via API
```bash
node teste-telegram-produto.js
```

---

## 🔧 Solução de Problemas

### ❌ "Bot token inválido"
- Verifique se copiou o token completo do @BotFather
- Certifique-se de não ter espaços extras

### ❌ "Chat not found"
- Envie `/start` para seu bot primeiro
- Verifique se o Chat ID está correto
- Use @userinfobot para confirmar seu ID

### ❌ "Forbidden: bot was blocked by the user"
- Desbloqueie o bot no Telegram
- Envie `/start` novamente

### ❌ Notificações não chegam
1. Verifique se o bot está ativo no Dashboard
2. Teste com: `node test-telegram.js`
3. Confirme que o monitoramento está rodando

---

## 📱 Como Usar

### Configurar Produtos
1. **Acesse**: Dashboard
2. **Clique**: "Adicionar Produto"
3. **Cole a URL** do produto
4. **Defina o preço alvo**
5. **Salve**

### Receber Notificações
- O sistema verifica preços automaticamente
- Quando um preço cai abaixo do alvo, você recebe:
  - 📱 Mensagem no Telegram
  - 📧 Email (se configurado)

---

## 🎯 Exemplo de Notificação

```
🎉 PREÇO CAIU!

📦 iPhone 15 Pro Max
💰 De: R$ 8.999,00
🔥 Para: R$ 7.999,00
📊 Desconto: 11%

🛒 Comprar agora:
https://amazon.com.br/produto...

⏰ 15/01/2024 às 14:30
```

---

## 🚀 Próximos Passos

1. ✅ **Telegram configurado**
2. 📦 **Adicione produtos** para monitorar
3. 🎯 **Defina preços alvo**
4. 📱 **Aguarde as notificações**
5. 🛒 **Aproveite as ofertas**!

---

## 📞 Suporte

Se precisar de ajuda:
1. Execute: `node diagnostico-final-telegram.js`
2. Verifique os logs no terminal
3. Consulte este guia novamente

**Seu sistema está funcionando perfeitamente! 🎉**