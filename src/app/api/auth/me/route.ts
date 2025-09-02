import { NextRequest, NextResponse } from 'next/server';
import { userDb } from '@/lib/database';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Verificar se existe cookie de sessão
    const cookieStore = cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Buscar usuário no banco
    const user = userDb.getById(parseInt(userId));
    
    if (!user) {
      // Cookie inválido, remover
      cookieStore.set('user_id', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0
      });
      
      return NextResponse.json(
        { error: 'Sessão inválida' },
        { status: 401 }
      );
    }

    // Retornar dados do usuário (sem senha)
    const { senha: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}