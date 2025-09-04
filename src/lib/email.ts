import nodemailer from 'nodemailer';

// Configuração do transportador de email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'lucrenapromo@gmail.com',
    pass: process.env.EMAIL_PASSWORD || '', // Senha de app do Gmail
  },
});

// Interface para dados do email
interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Função para enviar email
export async function sendEmail({ to, subject, html, text }: EmailData) {
  // Verificar se as credenciais de email estão configuradas
  if (!process.env.EMAIL_PASSWORD || process.env.EMAIL_PASSWORD.trim() === '') {
    console.warn('Credenciais de email não configuradas. Email não será enviado.');
    return { success: false, error: 'Credenciais de email não configuradas' };
  }

  try {
    const mailOptions = {
      from: `"Lucre Na Promo" <${process.env.EMAIL_USER || 'lucrenapromo@gmail.com'}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Remove HTML tags para versão texto
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email enviado com sucesso:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// Função para verificar conexão com o servidor de email
export async function verifyEmailConnection() {
  try {
    await transporter.verify();
    console.log('Conexão com servidor de email verificada com sucesso');
    return true;
  } catch (error) {
    console.error('Erro na conexão com servidor de email:', error);
    return false;
  }
}

// Templates de email
export const emailTemplates = {
  // Template de confirmação de cadastro
  welcomeEmail: (userName: string) => ({
    subject: '🎉 Bem-vindo ao Lucre Na Promo!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; font-size: 28px; margin: 0;">🎉 Lucre Na Promo</h1>
          </div>
          
          <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">Olá, ${userName}!</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Seja muito bem-vindo(a) ao <strong>Lucre Na Promo</strong>! 🚀
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Seu cadastro foi realizado com sucesso! Agora você pode:
          </p>
          
          <ul style="color: #666; font-size: 16px; line-height: 1.8; margin-bottom: 30px;">
            <li>📱 Monitorar preços de produtos em tempo real</li>
            <li>🔔 Receber alertas no Telegram quando os preços baixarem</li>
            <li>💰 Economizar dinheiro nas suas compras online</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/cadastro_produtos" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Acessar Dashboard
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 30px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
            Dúvidas? Responda este email que te ajudaremos! 😊
          </p>
        </div>
      </div>
    `,
  }),

  // Template de reset de senha
  resetPasswordEmail: (userName: string, resetToken: string) => ({
    subject: '🔐 Redefinir sua senha - Lucre Na Promo',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; font-size: 28px; margin: 0;">🔐 Lucre Na Promo</h1>
          </div>
          
          <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">Olá, ${userName}!</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Recebemos uma solicitação para redefinir a senha da sua conta.
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Clique no botão abaixo para criar uma nova senha:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}" 
               style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Redefinir Senha
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            <strong>⚠️ Importante:</strong> Este link expira em 1 hora por segurança.
          </p>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            Se você não solicitou esta alteração, pode ignorar este email com segurança.
          </p>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 30px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
            Dúvidas? Responda este email que te ajudaremos! 😊
          </p>
        </div>
      </div>
    `,
  }),

  // Template de alerta de preço
  priceAlertEmail: (userName: string, productName: string, oldPrice: number, newPrice: number, productUrl: string) => ({
    subject: `🔥 Preço baixou! ${productName} - Lucre Na Promo`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; font-size: 28px; margin: 0;">🔥 Lucre Na Promo</h1>
          </div>
          
          <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">Boa notícia, ${userName}! 🎉</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            O preço do produto que você está monitorando baixou:
          </p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; font-size: 18px; margin: 0 0 15px 0;">${productName}</h3>
            
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
              <span style="color: #dc2626; font-size: 14px; text-decoration: line-through;">De: R$ ${oldPrice.toFixed(2)}</span>
              <span style="color: #16a34a; font-size: 20px; font-weight: bold;">Por: R$ ${newPrice.toFixed(2)}</span>
            </div>
            
            <div style="background-color: #16a34a; color: white; padding: 8px 12px; border-radius: 4px; display: inline-block; font-weight: bold;">
              💰 Economia: R$ ${(oldPrice - newPrice).toFixed(2)}
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${productUrl}" 
               style="background-color: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              🛒 Comprar Agora
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 30px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
            ⚡ Aproveite antes que o preço suba novamente!
          </p>
        </div>
      </div>
    `,
  }),
};