import { NextRequest, NextResponse } from 'next/server';
import { createPriceScraper } from '@/lib/scraper';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 });
    }

    console.log(`🔍 Fazendo scraping da URL: ${url}`);
    
    // Determinar o site baseado na URL
    let siteName = 'Desconhecido';
    if (url.includes('amazon.com')) {
      siteName = 'Amazon';
    } else if (url.includes('mercadolivre.com') || url.includes('mercadolibre.com')) {
      siteName = 'Mercado Livre';
    } else if (url.includes('americanas.com')) {
      siteName = 'Americanas';
    } else if (url.includes('carrefour.com')) {
      siteName = 'Carrefour';
    } else if (url.includes('casasbahia.com')) {
      siteName = 'Casas Bahia';
    } else if (url.includes('extra.com')) {
      siteName = 'Extra';
    } else if (url.includes('pontofrio.com')) {
      siteName = 'Ponto Frio';
    }
    
    // Create a new scraper instance
    const scraper = createPriceScraper();
    
    // Fazer o scraping da página do produto
    const result = await scraper.scrapeProductPage(url, siteName);
    
    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'Não foi possível extrair informações do produto' 
      }, { status: 400 });
    }
    
    console.log(`✅ Scraping concluído: ${result.title} - R$ ${result.price}`);
    
    return NextResponse.json({
      success: true,
      title: result.title,
      price: result.price,
      site: siteName,
      url: url,
      image: result.image
    });
    
  } catch (error) {
    console.error('❌ Erro na API de scraping:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'API de scraping de produtos',
    usage: 'POST com { "url": "URL_DO_PRODUTO" }'
  });
}