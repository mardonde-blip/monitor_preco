import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseAdapter } from '@/lib/database-adapter-fixed';
import { cookies } from 'next/headers';
import { createPriceScraper } from '@/lib/scraper';
import { getHttpScraper } from '@/lib/scraper-http';

export async function GET() {
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

    // Buscar produtos do usuário
    const DatabaseAdapter = getDatabaseAdapter();
    const products = await DatabaseAdapter.getProductsByUserId(userId);

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
    console.log('🔍 Iniciando POST /api/products');
    
    // Verificar autenticação
    const cookieStore = cookies();
    const userIdCookie = cookieStore.get('userId');
    
    if (!userIdCookie) {
      console.log('❌ Usuário não autenticado');
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const userId = parseInt(userIdCookie.value);
    console.log('👤 Usuário autenticado:', userId);

    const body = await request.json();
    console.log('📋 Dados recebidos:', body);
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
        { error: 'URL é obrigatória' },
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

    // Fazer scraping automático do preço atual
    let currentPrice: number | null = null;
    try {
      console.log(`🔍 Fazendo scraping automático da URL: ${url}`);
      
      // Tentar primeiro com HTTP scraper (mais rápido)
      const httpScraper = getHttpScraper();
      const httpResult = await httpScraper.scrapePriceHttp(url);
      
      if (httpResult.success && httpResult.price && httpResult.price > 0) {
        currentPrice = httpResult.price;
        console.log(`✅ Preço atual capturado via HTTP: R$ ${currentPrice}`);
      } else {
        // Fallback para Puppeteer se HTTP falhar
        console.log('⚠️ HTTP falhou, tentando com Puppeteer...');
        const scraper = createPriceScraper();
        const puppeteerResult = await scraper.scrapePrice(url);
        
        if (puppeteerResult.success && puppeteerResult.price && puppeteerResult.price > 0) {
          currentPrice = puppeteerResult.price;
          console.log(`✅ Preço atual capturado via Puppeteer: R$ ${currentPrice}`);
        } else {
          console.log('⚠️ Não foi possível capturar o preço automaticamente');
        }
      }
    } catch (error) {
      console.error('❌ Erro no scraping automático:', error);
    }

    // Criar produto no banco
    const DatabaseAdapter = getDatabaseAdapter();
    const product = await DatabaseAdapter.createProduct({
      user_id: userId,
      name: name.trim(),
      url: url.trim(),
      target_price,
      current_price: currentPrice,
      store: store.trim()
    });

    console.log('✅ Produto criado com sucesso:', product);

    return NextResponse.json({
      message: 'Produto adicionado com sucesso',
      product
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Erro ao criar produto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🔍 PUT /api/products - Iniciando atualização de produto');
    
    // Verificar autenticação
    const cookieStore = await cookies();
    const userIdCookie = cookieStore.get('user_id');
    
    if (!userIdCookie) {
      console.log('❌ Cookie user_id não encontrado');
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const userId = parseInt(userIdCookie.value);
    console.log('👤 User ID obtido:', userId);
    
    if (isNaN(userId)) {
      console.log('❌ User ID inválido');
      return NextResponse.json(
        { error: 'ID de usuário inválido' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('📋 Dados recebidos:', body);
    const { id, name, url, target_price, store, is_active } = body;

    if (!id || typeof id !== 'number') {
      console.log('❌ ID do produto inválido:', id, typeof id);
      return NextResponse.json(
        { error: 'ID do produto é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🔍 Verificando se produto existe e pertence ao usuário...');
    // Verificar se o produto pertence ao usuário
    const DatabaseAdapter = getDatabaseAdapter();
    const existingProduct = await DatabaseAdapter.getProductById(id);
    console.log('📦 Produto existente:', existingProduct);
    
    if (!existingProduct || existingProduct.user_id !== userId) {
      console.log('❌ Produto não encontrado ou não autorizado');
      return NextResponse.json(
        { error: 'Produto não encontrado ou não autorizado' },
        { status: 404 }
      );
    }

    console.log('🔄 Chamando updateProduct com dados:', {
      id,
      userId,
      updateData: {
        name: name?.trim(),
        url: url?.trim(),
        target_price,
        store: store?.trim(),
        is_active
      }
    });

    // Atualizar produto
    const updatedProduct = await DatabaseAdapter.updateProduct(id, userId, {
      name: name?.trim(),
      url: url?.trim(),
      target_price,
      store: store?.trim(),
      is_active
    });

    console.log('✅ Produto atualizado com sucesso:', updatedProduct);

    return NextResponse.json({
      message: 'Produto atualizado com sucesso',
      product: updatedProduct
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar produto:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}