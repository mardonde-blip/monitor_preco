# 🛒 Monitor de Preços com Telegram

Uma aplicação Next.js para monitorar preços de produtos online e receber notificações via Telegram quando os preços caem.

## 🚀 Funcionalidades

- ✅ **Interface Web Moderna**: Adicione e gerencie produtos para monitorar
- 🤖 **Monitoramento Automático**: Verificação de preços em intervalos configuráveis
- 📱 **Notificações Telegram**: Alertas instantâneos quando preços caem
- 🎯 **Metas de Preço**: Defina preços alvo para cada produto
- 📊 **Histórico de Preços**: Acompanhe a evolução dos preços
- 🔄 **Verificação Manual**: Verifique preços a qualquer momento
- ⚙️ **Configuração Flexível**: Intervalos personalizáveis de monitoramento

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Web Scraping**: Puppeteer, Cheerio
- **Notificações**: Telegram Bot API
- **Agendamento**: node-cron
- **HTTP Client**: Axios

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Uma conta no Telegram
- Conhecimento básico de seletores CSS (para extrair preços)

## 🔧 Instalação

1. **Clone o repositório**:
   ```bash
   git clone <url-do-repositorio>
   cd monitor-precos
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**:
   ```bash
   cp .env.example .env.local
   ```

4. **Configure seu bot do Telegram**:
   - Abra o Telegram e procure por `@BotFather`
   - Envie `/newbot` e siga as instruções
   - Copie o token do bot
   - Para obter seu Chat ID, envie uma mensagem para `@userinfobot`

5. **Edite o arquivo `.env.local`**:
   ```env
   NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=seu_token_aqui
   NEXT_PUBLIC_TELEGRAM_CHAT_ID=seu_chat_id_aqui
   MONITORING_INTERVAL_MINUTES=60
   ```

6. **Execute a aplicação**:
   ```bash
   npm run dev
   ```

7. **Acesse**: http://localhost:3000

## 📱 Configuração do Telegram

### Criando um Bot

1. No Telegram, procure por `@BotFather`
2. Envie `/newbot`
3. Escolha um nome para seu bot
4. Escolha um username (deve terminar com 'bot')
5. Copie o token fornecido

### Obtendo seu Chat ID

**Método 1 - Usando @userinfobot**:
1. Procure por `@userinfobot` no Telegram
2. Envie qualquer mensagem
3. O bot retornará seu Chat ID

**Método 2 - Usando a API**:
1. Envie uma mensagem para seu bot
2. Acesse: `https://api.telegram.org/bot<SEU_TOKEN>/getUpdates`
3. Procure pelo campo `"id"` dentro de `"chat"`

## 🎯 Como Usar

### 1. Configurar Telegram
- Vá para a aba "📱 Telegram"
- Insira seu Bot Token e Chat ID
- Teste a conexão

### 2. Adicionar Produtos
- Vá para a aba "📦 Produtos"
- Preencha as informações do produto:
  - **Nome**: Nome do produto
  - **URL**: Link da página do produto
  - **Preço Atual**: Preço atual (para referência)
  - **Preço Alvo**: Preço desejado para receber alerta
  - **Seletor CSS**: Como encontrar o preço na página

### 3. Configurar Monitoramento
- Vá para a aba "🤖 Automação"
- Defina o intervalo de verificação (recomendado: 60 minutos)
- Clique em "Iniciar Monitoramento"

### 4. Verificações Manuais
- Use "Verificar Agora" para uma verificação imediata
- Use "Verificar" em produtos específicos na lista

## 🔍 Encontrando Seletores CSS

### Método 1 - DevTools do Navegador
1. Abra a página do produto
2. Pressione F12 (DevTools)
3. Clique no ícone de seleção (🔍)
4. Clique no preço na página
5. No HTML destacado, clique com botão direito
6. Escolha "Copy" > "Copy selector"

### Método 2 - Inspeção Manual
1. Clique com botão direito no preço
2. Escolha "Inspecionar elemento"
3. Identifique classes ou IDs únicos
4. Crie um seletor como `.price` ou `#product-price`

### Exemplos Comuns
```css
/* Por classe */
.price-current
.product-price
.price-value

/* Por ID */
#price
#product-price

/* Por atributo */
[data-price]
[data-testid="price"]

/* Combinações */
.price .value
.product-info .price-current
```

## ⚠️ Considerações Importantes

### Legalidade
- ✅ Respeite os Termos de Serviço dos sites
- ✅ Verifique o arquivo `robots.txt` dos sites
- ✅ Use intervalos razoáveis (60+ minutos)
- ❌ Não sobrecarregue os servidores

### Performance
- Use intervalos de pelo menos 60 minutos
- Monitore no máximo 10-20 produtos simultaneamente
- Sites podem bloquear muitas requisições

### Limitações
- Funciona apenas enquanto a aplicação estiver rodando
- Sites podem mudar estrutura e quebrar seletores
- Alguns sites podem bloquear bots

## 🚀 Deploy

### Vercel (Recomendado)
1. Faça push do código para GitHub
2. Conecte seu repositório no Vercel
3. Configure as variáveis de ambiente
4. Deploy automático

### Outras Opções
- **Netlify**: Para hospedagem estática
- **Railway**: Para aplicações full-stack
- **DigitalOcean**: Para VPS próprio

## 🐛 Solução de Problemas

### Bot não envia mensagens
- ✅ Verifique se o token está correto
- ✅ Verifique se o Chat ID está correto
- ✅ Teste a conexão na aba Telegram
- ✅ Certifique-se de ter enviado `/start` para o bot

### Preços não são encontrados
- ✅ Verifique se o seletor CSS está correto
- ✅ Teste o seletor no DevTools do navegador
- ✅ Alguns sites carregam preços via JavaScript
- ✅ Verifique se o site não bloqueia bots

### Monitoramento não funciona
- ✅ Verifique se a aplicação está rodando
- ✅ Verifique os logs no console
- ✅ Certifique-se de ter produtos cadastrados
- ✅ Verifique se as notificações estão habilitadas

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para:
- Reportar bugs
- Sugerir novas funcionalidades
- Enviar pull requests
- Melhorar a documentação

## 📞 Suporte

Se você encontrar problemas ou tiver dúvidas:
1. Verifique a seção de solução de problemas
2. Abra uma issue no GitHub
3. Consulte a documentação das APIs utilizadas

---

**⚡ Dica**: Para monitoramento 24/7, considere fazer deploy em um servidor ou usar serviços como Railway/Heroku que mantêm a aplicação sempre ativa.
