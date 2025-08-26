import { NextRequest, NextResponse } from 'next/server';
import { createPriceScraper } from '@/lib/scraper';
import { getPlaywrightScraper } from '@/lib/scraper-playwright';
import { getHttpScraper } from '@/lib/scraper-http';

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
    
    // Tentar primeiro com Puppeteer
    console.log('🎭 Tentando scraping com Puppeteer...');
    const scraper = createPriceScraper();
    let result = await scraper.scrapeProductPage(url);
    
    // Se Puppeteer falhar, tentar com Playwright
    if (!result.success) {
      console.log('⚠️ Puppeteer falhou, tentando com Playwright...');
      try {
        const playwrightScraper = getPlaywrightScraper();
        const playwrightResult = await playwrightScraper.scrapePriceAuto(url);
        
        if (playwrightResult.success) {
          console.log('✅ Playwright conseguiu extrair o preço!');
          result = {
            success: true,
            title: 'Produto encontrado via Playwright',
            price: playwrightResult.price,
            image: ''
          };
        } else {
          console.log('❌ Playwright também falhou');
        }
        
        // Fechar o browser do Playwright
        await playwrightScraper.close();
      } catch (playwrightError) {
        console.error('❌ Erro no Playwright:', playwrightError);
      }
    }
    
    // Se tanto Puppeteer quanto Playwright falharem, tentar HTTP simples
    if (!result.success) {
      console.log('🌐 Tentando fallback HTTP simples...');
      try {
        const httpScraper = getHttpScraper();
        const httpResult = await httpScraper.scrapePriceHttp(url);
        
        if (httpResult.success) {
          console.log('✅ HTTP scraper conseguiu extrair o preço!');
          result = {
            success: true,
            title: 'Produto encontrado via HTTP',
            price: httpResult.price,
            image: ''
          };
        } else {
          console.log('❌ Todos os métodos falharam');
        }
      } catch (httpError) {
        console.error('❌ Erro no HTTP scraper:', httpError);
      }
    }
    
    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'Não foi possível extrair informações do produto com nenhum método' 
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