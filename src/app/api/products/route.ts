import { NextRequest, NextResponse } from 'next/server';
import { DatabaseAdapter } from '@/lib/database-adapter';
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
        const puppeteerResult = await scraper.scrapeProductPage(url);
        
        if (puppeteerResult.success && puppeteerResult.price && puppeteerResult.price > 0) {
          currentPrice = puppeteerResult.price;
          console.log(`✅ Preço atual capturado via Puppeteer: R$ ${currentPrice}`);
        } else {
          console.log('⚠️ Não foi possível capturar o preço automaticamente');
        }
      }
    } catch (scrapingError) {
      console.error('❌ Erro no scraping automático:', scrapingError);
      // Continuar mesmo se o scraping falhar
    }

    // Criar produto
    try {
      const newProduct = await DatabaseAdapter.createProduct({
        user_id: userId,
        name: name.trim(),
        url: url.trim(),
        target_price,
        current_price: currentPrice ?? undefined,
        store: store.trim()
      });

      const message = currentPrice 
        ? `Produto adicionado com sucesso! Preço atual capturado: R$ ${currentPrice.toFixed(2)}`
        : 'Produto adicionado com sucesso! (Preço atual não pôde ser capturado automaticamente)';

      return NextResponse.json({
        message,
        product: newProduct,
        scrapingSuccess: currentPrice !== null,
        currentPrice
      }, { status: 201 });
    } catch (dbError: unknown) {
      if (dbError instanceof Error && dbError.message === 'Produto com esta URL já existe para este usuário') {
        return NextResponse.json(
          { error: 'Este produto já está sendo monitorado. Verifique sua lista de produtos.' },
          { status: 409 }
        );
      }
      throw dbError;
    }

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

    const body = await request.json();
    const { id, name, url, target_price, store } = body;

    if (!id || typeof id !== 'number') {
      return NextResponse.json(
        { error: 'ID do produto é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o produto pertence ao usuário
    const existingProduct = await DatabaseAdapter.getProductById(id);
    if (!existingProduct || existingProduct.user_id !== userId) {
      return NextResponse.json(
        { error: 'Produto não encontrado ou não autorizado' },
        { status: 404 }
      );
    }

    // Atualizar produto (implementar método update no adapter)
    const updatedProduct = await DatabaseAdapter.updateProduct(id, userId, {
      name: name?.trim(),
      url: url?.trim(),
      target_price,
      store: store?.trim()
    });

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