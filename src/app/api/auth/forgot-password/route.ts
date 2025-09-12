import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-adapter';
import { sendEmail, emailTemplates } from '@/lib/email';
import crypto from 'crypto';
import type { ResetToken } from '@/types/auth';

// POST - Solicitar reset de senha
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validar email
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Buscar usuário pelo email
    const db = await getDatabase();
    const userData = await db.getUserByEmail(email.toLowerCase());

    if (!userData) {
      // Por segurança, não revelamos se o email existe ou não
      return NextResponse.json({
        success: true,
        message: 'Se o email estiver cadastrado, você receberá as instruções para redefinir sua senha.'
      });
    }

    // Cast do tipo para acessar as propriedades
    const user = userData as { id: number; email: string; nome_completo: string };

    // Gerar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    // Salvar token no usuário (simulando - em produção seria no banco de dados)
    // Como não temos campo para isso no banco atual, vamos usar uma estrutura temporária
    if (!global.resetTokens) {
      global.resetTokens = new Map<string, ResetToken>();
    }
    
    if (!user.id) {
      return NextResponse.json(
        { error: 'Erro interno: ID do usuário não encontrado' },
        { status: 500 }
      );
    }

    global.resetTokens.set(resetToken, {
      userId: user.id,
      email: user.email,
      expiry: resetTokenExpiry
    });

    // Enviar email de reset de senha
    try {
      const emailTemplate = emailTemplates.resetPasswordEmail(user.nome_completo, resetToken);
      await sendEmail({
        to: user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html
      });
      
      console.log(`Email de reset de senha enviado para: ${user.email}`);
    } catch (emailError) {
      console.error('Erro ao enviar email de reset:', emailError);
      return NextResponse.json(
        { success: false, error: 'Erro ao enviar email. Tente novamente.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Se o email estiver cadastrado, você receberá as instruções para redefinir sua senha.'
    });

  } catch (error: unknown) {
    console.error('Erro ao processar solicitação de reset:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}