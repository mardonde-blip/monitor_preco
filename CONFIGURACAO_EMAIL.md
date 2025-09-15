# Configuração de Email - Lucre Na Promo

## Status Atual ✅

O sistema já está configurado para usar o email **lucrenapromo@gmail.com** como remetente dos emails de:
- Confirmação de cadastro
- Recuperação de senha
- Alertas de preço

## Configuração Necessária 🔧

Para que o sistema possa enviar emails reais, você precisa configurar uma **Senha de Aplicativo** do Gmail.

### Passo a Passo:

#### 1. Ativar Verificação em Duas Etapas
1. Acesse [myaccount.google.com](https://myaccount.google.com)
2. Vá em **Segurança** → **Verificação em duas etapas**
3. Siga as instruções para ativar (se ainda não estiver ativo)

#### 2. Gerar Senha de Aplicativo
1. Ainda em **Segurança**, procure por **Senhas de app**
2. Clique em **Senhas de app**
3. Selecione **Aplicativo**: Outro (nome personalizado)
4. Digite: **Monitor de Preços - Lucre Na Promo**
5. Clique em **Gerar**
6. **COPIE A SENHA GERADA** (16 caracteres sem espaços)

#### 3. Configurar no Sistema
1. Abra o arquivo `.env.local` na raiz do projeto
2. Localize a linha: `EMAIL_PASSWORD=`
3. Cole a senha gerada: `EMAIL_PASSWORD=abcdabcdabcdabcd`
4. Salve o arquivo
5. Reinicie o servidor (`npm run dev`)

## Verificação 🧪

Após configurar a senha, teste o sistema:

```bash
# Teste os templates de email
Invoke-WebRequest -Uri "http://localhost:3000/api/test-email" -Method GET

# Teste um cadastro real (enviará email de confirmação)
# Acesse: http://localhost:3000 e faça um cadastro
```

## Configuração Atual 📋

```env
# ✅ Já configurado
EMAIL_USER=lucrenapromo@gmail.com
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ⚠️ Precisa ser configurado
EMAIL_PASSWORD=
```

## Segurança 🔒

- ✅ A senha de aplicativo é específica para este sistema
- ✅ Pode ser revogada a qualquer momento no Google
- ✅ Não compromete a senha principal da conta
- ✅ Permite controle granular de acesso

## Funcionalidades que Dependem do Email 📧

1. **Confirmação de Cadastro**: Email de boas-vindas automático
2. **Recuperação de Senha**: Link seguro para redefinir senha
3. **Alertas de Preço**: Notificações quando preços baixam
4. **Notificações do Sistema**: Comunicações importantes

---

**Nota**: Sem a configuração da senha, o sistema funcionará normalmente, mas não enviará emails reais (apenas simulará o envio nos logs).