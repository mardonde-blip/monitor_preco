import { NextRequest, NextResponse } from 'next/server';
import { userDb } from '@/lib/database';
import { cookies } from 'next/headers';

export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação
    const cookieStore = await cookies();
    const userIdCookie = cookieStore.get('user_id');
    
    if (!userIdCookie) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const userId = parseInt(userIdCookie.value);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'ID de usuário inválido' },
        { status: 401 }
      );
    }

    // Verificar se o usuário existe
    const user = userDb.getById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { telegram_id } = body;

    // Validar telegram_id
    if (!telegram_id || typeof telegram_id !== 'string' || telegram_id.trim() === '') {
      return NextResponse.json(
        { error: 'ID do Telegram é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar usuário existente
    const existingUser = userDb.getById(userId);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar telegram_id
    const updatedUser = userDb.update(userId, {
      nome_completo: existingUser.nome_completo,
      email: existingUser.email,
      senha: existingUser.senha,
      data_nascimento: existingUser.data_nascimento,
      sexo: existingUser.sexo,
      celular: existingUser.celular,
      telegram_id: telegram_id.trim()
    });
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Erro ao buscar usuário atualizado' },
        { status: 500 }
      );
    }

    // Retornar usuário sem senha
    const { senha, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      message: 'ID do Telegram atualizado com sucesso',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Erro ao atualizar telegram_id:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}