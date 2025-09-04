import { NextRequest, NextResponse } from 'next/server';
import { productDb } from '@/lib/database';
import { cookies } from 'next/headers';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const resolvedParams = await params;
    const productId = parseInt(resolvedParams.id);
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'ID do produto inválido' },
        { status: 400 }
      );
    }

    // Verificar se o produto pertence ao usuário e deletar
    const deleted = productDb.delete(productId, userId);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Produto não encontrado ou não autorizado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Produto removido com sucesso'
    });

  } catch (error) {
    console.error('Erro ao remover produto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}