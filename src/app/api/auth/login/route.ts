import { NextRequest, NextResponse } from 'next/server';
import { DatabaseAdapter } from '@/lib/database-adapter';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

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

    // Buscar usuário por email
    const user = await DatabaseAdapter.getUserByEmail(email);
    
    // Verificar se usuário existe e senha está correta
     if (!user || !bcrypt.compareSync(senha, user.senha)) {
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { senha: _senha, ...userWithoutPassword } = user;
    // _senha é removida intencionalmente para segurança
    
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