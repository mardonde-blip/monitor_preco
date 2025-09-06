# 🗄️ Configuração do Banco de Dados no Vercel

## 📋 Visão Geral

Este projeto agora usa um sistema de banco de dados híbrido:
- **Desenvolvimento Local**: SQLite (arquivo `database.sqlite`)
- **Produção (Vercel)**: PostgreSQL (Neon Database)

## 🚀 Configuração no Vercel

### 1. Criar Banco PostgreSQL Gratuito

1. Acesse [Neon.tech](https://neon.tech)
2. Crie uma conta gratuita
3. Crie um novo projeto/banco de dados
4. Copie a **Connection String** (URL de conexão)

### 2. Configurar Variáveis de Ambiente no Vercel

1. Acesse seu projeto no [Vercel Dashboard](https://vercel.com/dashboard)
2. Vá em **Settings** → **Environment Variables**
3. Adicione as seguintes variáveis:

```bash
# Banco de dados PostgreSQL
DATABASE_URL=postgresql://username:password@host:5432/database_name

# Configurações do Telegram (se ainda não configuradas)
NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=seu_bot_token_aqui
NEXT_PUBLIC_TELEGRAM_CHAT_ID=seu_chat_id_aqui

# Outras configurações
NODE_ENV=production
```

### 3. Inicializar o Banco de Dados

Após o deploy, acesse a rota de inicialização:
```
https://seu-projeto.vercel.app/api/init-db
```

Esta rota criará automaticamente todas as tabelas necessárias.

## 🔧 Estrutura do Banco

O sistema criará automaticamente as seguintes tabelas:

### `users`
- `id` (INTEGER PRIMARY KEY)
- `email` (TEXT UNIQUE)
- `senha` (TEXT)
- `created_at` (TIMESTAMP)

### `products`
- `id` (INTEGER PRIMARY KEY)
- `user_id` (INTEGER)
- `name` (TEXT)
- `url` (TEXT)
- `target_price` (REAL)
- `current_price` (REAL)
- `last_checked` (TIMESTAMP)
- `created_at` (TIMESTAMP)

### `settings`
- `key` (TEXT PRIMARY KEY)
- `value` (TEXT)
- `updated_at` (TIMESTAMP)

## 🐛 Solução de Problemas

### Erro "Erro interno do servidor"

1. **Verifique as variáveis de ambiente**:
   - `DATABASE_URL` está configurada corretamente?
   - A string de conexão está no formato correto?

2. **Inicialize o banco**:
   - Acesse `/api/init-db` após o deploy
   - Verifique os logs no Vercel Dashboard

3. **Verifique os logs**:
   - Vá em **Functions** no Vercel Dashboard
   - Clique em uma função que falhou
   - Analise os logs de erro

### Testando Localmente

Para testar localmente com PostgreSQL:

1. Configure `DATABASE_URL` no seu `.env.local`
2. Execute: `npm run dev`
3. Acesse: `http://localhost:3000/api/init-db`

## 📝 Notas Importantes

- O SQLite é usado automaticamente em desenvolvimento
- O PostgreSQL é usado automaticamente em produção (quando `DATABASE_URL` está presente)
- Todas as operações de banco são abstraídas pelo `DatabaseAdapter`
- As configurações são salvas no banco, não mais em memória

## 🔄 Migração de Dados

Se você tinha dados no localStorage:
1. Os dados serão migrados automaticamente para o banco na primeira execução
2. O sistema detecta automaticamente se é a primeira vez
3. Configurações padrão são criadas se não existirem

---

**✅ Após seguir estes passos, seu sistema estará funcionando perfeitamente no Vercel!**