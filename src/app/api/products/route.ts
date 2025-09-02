import { NextRequest, NextResponse } from 'next/server';
import { productDb } from '@/lib/database';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const cookieStore = cookies();
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

    // Buscar produtos do usuário
    const products = await productDb.getByUserId(userId);

    return NextResponse.json({ products });

  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const cookieStore = cookies();
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

    const body = await request.json();
    const { name, url, target_price, store } = body;

    // Validações
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Nome do produto é obrigatório' },
        { status: 400 }
      );
    }

    if (!url || typeof url !== 'string' || url.trim() === '') {
      return NextResponse.json(
        { error: 'URL do produto é obrigatória' },
        { status: 400 }
      );
    }

    // Validar se é uma URL válida
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'URL inválida' },
        { status: 400 }
      );
    }

    if (!target_price || typeof target_price !== 'number' || target_price <= 0) {
      return NextResponse.json(
        { error: 'Preço alvo deve ser um número positivo' },
        { status: 400 }
      );
    }

    if (!store || typeof store !== 'string' || store.trim() === '') {
      return NextResponse.json(
        { error: 'Loja é obrigatória' },
        { status: 400 }
      );
    }

    // Criar produto
    const productId = await productDb.create({
      user_id: userId,
      name: name.trim(),
      url: url.trim(),
      target_price,
      store: store.trim(),
      is_active: true
    });

    // Buscar produto criado
    const newProduct = await productDb.getById(productId);

    return NextResponse.json({
      message: 'Produto adicionado com sucesso',
      product: newProduct
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação
    const cookieStore = cookies();
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

    const body = await request.json();
    const { id, name, url, target_price, store, is_active } = body;

    if (!id || typeof id !== 'number') {
      return NextResponse.json(
        { error: 'ID do produto é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o produto pertence ao usuário
    const existingProduct = await productDb.getById(id);
    if (!existingProduct || existingProduct.user_id !== userId) {
      return NextResponse.json(
        { error: 'Produto não encontrado ou não autorizado' },
        { status: 404 }
      );
    }

    // Atualizar produto
    await productDb.update(id, {
      name: name?.trim(),
      url: url?.trim(),
      target_price,
      store: store?.trim(),
      is_active
    });

    // Buscar produto atualizado
    const updatedProduct = await productDb.getById(id);

    return NextResponse.json({
      message: 'Produto atualizado com sucesso',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    const cookieStore = cookies();
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do produto é obrigatório' },
        { status: 400 }
      );
    }

    const productId = parseInt(id);
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'ID do produto inválido' },
        { status: 400 }
      );
    }

    // Verificar se o produto pertence ao usuário
    const existingProduct = await productDb.getById(productId);
    if (!existingProduct || existingProduct.user_id !== userId) {
      return NextResponse.json(
        { error: 'Produto não encontrado ou não autorizado' },
        { status: 404 }
      );
    }

    // Deletar produto
    await productDb.delete(productId);

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