import { NextRequest, NextResponse } from 'next/server';
import { userDb } from '@/lib/database';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { email, senha } = await request.json();

    // Validar campos obrigatórios
    if (!email || !senha) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Autenticar usuário
    const user = userDb.authenticate(email, senha);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      );
    }

    // Criar sessão (cookie)
    const cookieStore = await cookies();
    cookieStore.set('user_id', user.id!.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 dias
    });

    // Retornar dados do usuário (sem senha)
    const { senha, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      message: 'Login realizado com sucesso',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}