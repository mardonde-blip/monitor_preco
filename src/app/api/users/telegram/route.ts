import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-adapter';
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
    const db = await getDatabase();
    const user = await db.getUserById(userId);
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
    const existingUser = await db.getUserById(userId);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const typedExistingUser = existingUser as {
      nome_completo: string;
      email: string;
      senha: string;
      data_nascimento: string;
      sexo: string;
      celular: string;
      [key: string]: unknown;
    };

    // Atualizar telegram_id
    const updatedUser = await db.updateUser(userId, {
      nome_completo: typedExistingUser.nome_completo,
      email: typedExistingUser.email,
      senha: typedExistingUser.senha,
      data_nascimento: typedExistingUser.data_nascimento,
      sexo: typedExistingUser.sexo,
      celular: typedExistingUser.celular,
      telegram_id: telegram_id.trim()
    });
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Erro ao buscar usuário atualizado' },
        { status: 500 }
      );
    }

    // Retornar usuário sem senha
    const typedUpdatedUser = updatedUser as { senha: string; [key: string]: unknown };
    const { senha: _, ...userWithoutPassword } = typedUpdatedUser;

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