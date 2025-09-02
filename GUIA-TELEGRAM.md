# 🤖 Guia Completo: Configuração do Telegram

## ❌ Problema Identificado
As notificações do Telegram não estão funcionando porque:
1. **Chat ID não configurado** - ainda está como placeholder `your_chat_id_here`
2. **Notificações desabilitadas** - sistema está com `enabled: false`

## ✅ Solução Completa

### Opção 1: Configuração via Interface Web (RECOMENDADO)

1. **Acesse o sistema**: http://localhost:3000
2. **Vá para Configurações** (ícone de engrenagem)
3. **Na seção Telegram**:
   - ✅ Marque "Habilitar notificações do Telegram"
   - 📝 Bot Token: `8306764040:AAF0N3PSY4TERuU05rcKHsbFBp7u6LQNsts`
   - 🆔 Chat ID: **PRECISA SER OBTIDO** (veja passos abaixo)

### Como Obter o Chat ID:

#### Método 1: Usando @userinfobot (MAIS FÁCIL)
1. Abra o Telegram
2. Procure por `@userinfobot`
3. Envie `/start`
4. O bot retornará seu Chat ID
5. Copie o número (ex: `123456789`)

#### Método 2: Usando seu próprio bot
1. Abra o Telegram
2. Procure pelo seu bot (nome que você deu quando criou)
3. Envie `/start` ou qualquer mensagem
4. Acesse: `https://api.telegram.org/bot8306764040:AAF0N3PSY4TERuU05rcKHsbFBp7u6LQNsts/getUpdates`
5. Procure por `"chat":{"id":NUMERO}` - esse NUMERO é seu Chat ID

### Opção 2: Configuração Manual no .env.local

1. **Edite o arquivo `.env.local`**:
```env
NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=8306764040:AAF0N3PSY4TERuU05rcKHsbFBp7u6LQNsts
NEXT_PUBLIC_TELEGRAM_CHAT_ID=SEU_CHAT_ID_AQUI
```

2. **Reinicie o servidor**:
```bash
npm run dev
```

## 🧪 Teste da Configuração

### Via Interface Web:
1. Após configurar, clique em "Testar Conexão"
2. Deve aparecer "✅ Conexão testada com sucesso!"
3. Você deve receber uma mensagem no Telegram

### Via API (alternativo):
```bash
# PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/api/telegram/test" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"botToken":"8306764040:AAF0N3PSY4TERuU05rcKHsbFBp7u6LQNsts","chatId":"SEU_CHAT_ID"}'
```

## 🔍 Verificação Final

1. **Configurações salvas**: Verifique se as configurações foram salvas corretamente
2. **Notificações habilitadas**: Certifique-se que está marcado como "habilitado"
3. **Teste de produto**: Adicione um produto para monitorar e teste o sistema

## 🚨 Solução de Problemas

### Erro 401 (Unauthorized)
- Token do bot inválido
- Verifique se copiou o token completo

### Erro 400 (Bad Request)
- Chat ID inválido
- Certifique-se que é apenas números (sem espaços ou caracteres especiais)
- Verifique se você já enviou uma mensagem para o bot

### Mensagem não chega
- Verifique se o bot não está bloqueado
- Confirme se o Chat ID está correto
- Teste com @userinfobot para confirmar seu ID

## 📱 Próximos Passos

1. **Configure o Chat ID** usando um dos métodos acima
2. **Teste a conexão** na interface web
3. **Adicione um produto** para monitorar
4. **Aguarde as notificações** automáticas

---

**💡 Dica**: Use a interface web em http://localhost:3000 - é mais fácil e seguro!