import { NextRequest, NextResponse } from 'next/server';
import { userDb } from '@/lib/database';

// POST - Redefinir senha com token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    // Validar dados
    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Token e nova senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar senha
    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Nova senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Verificar se o token existe e é válido
    if (!(global as any).resetTokens || !(global as any).resetTokens.has(token)) {
      return NextResponse.json(
        { success: false, error: 'Token inválido ou expirado' },
        { status: 400 }
      );
    }

    const tokenData = (global as any).resetTokens.get(token);
    
    // Verificar se o token não expirou
    if (new Date() > tokenData.expiry) {
      (global as any).resetTokens.delete(token);
      return NextResponse.json(
        { success: false, error: 'Token expirado. Solicite um novo reset de senha.' },
        { status: 400 }
      );
    }

    // Buscar usuário
    const users = userDb.getAll();
    const user = users.find(u => u.id === tokenData.userId);

    if (!user) {
      (global as any).resetTokens.delete(token);
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar senha do usuário
    try {
      userDb.update(user.id, { senha: newPassword });
      
      // Remover token usado
      (global as any).resetTokens.delete(token);
      
      console.log(`Senha redefinida com sucesso para usuário: ${user.email}`);
      
      return NextResponse.json({
        success: true,
        message: 'Senha redefinida com sucesso! Você já pode fazer login com a nova senha.'
      });
      
    } catch (updateError) {
      console.error('Erro ao atualizar senha:', updateError);
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar senha' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Erro ao redefinir senha:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET - Verificar se token é válido
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o token existe e é válido
    if (!(global as any).resetTokens || !(global as any).resetTokens.has(token)) {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 400 }
      );
    }

    const tokenData = (global as any).resetTokens.get(token);
    
    // Verificar se o token não expirou
    if (new Date() > tokenData.expiry) {
      (global as any).resetTokens.delete(token);
      return NextResponse.json(
        { success: false, error: 'Token expirado' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Token válido',
      email: tokenData.email
    });

  } catch (error: any) {
    console.error('Erro ao verificar token:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}