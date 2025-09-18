import { NextRequest, NextResponse } from 'next/server';
import { ExaProductSearch } from '@/lib/exa-search';
import { EnhancedProductScraper } from '@/lib/enhanced-scraper';

export async function POST(request: NextRequest) {
  try {
    const { query, url, testType } = await request.json();

    if (!query && !url) {
      return NextResponse.json(
        { error: 'Query ou URL é obrigatório' },
        { status: 400 }
      );
    }

    const results: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      testType: testType || 'search'
    };

    try {
      if (testType === 'enhanced-scraper' && url) {
        // Testar o scraper aprimorado
        const enhancedScraper = new EnhancedProductScraper();
        const scrapingResult = await enhancedScraper.scrapeWithFallback(url);
        
        results.scrapingResult = scrapingResult;
        
        if (scrapingResult.success) {
          // Buscar produtos similares
          const similarProducts = await enhancedScraper.findSimilarProducts(url, 5);
          results.similarProducts = similarProducts;
          
          // Comparar preços
          const priceComparison = await enhancedScraper.compareProductPrices(url, 3);
          results.priceComparison = priceComparison;
        }
        
      } else if (testType === 'exa-search' && query) {
        // Testar apenas a busca Exa
        const exaSearch = new ExaProductSearch();
        
        const searchResults = await exaSearch.searchProducts(query, {
          maxResults: 10,
          includeDomains: ['amazon.com.br', 'mercadolivre.com.br', 'carrefour.com.br']
        });
        
        results.searchResults = searchResults;
        
        // Extrair informações de produtos
        const productInfo = await Promise.all(
          searchResults.slice(0, 3).map(async (result) => {
            try {
              return {
                url: result.url,
                title: result.name,
                score: result.score,
                store: result.store,
                estimatedPrice: result.estimatedPrice,
                description: result.description
              };
            } catch (error) {
              return {
                url: result.url,
                title: result.name,
                error: error instanceof Error ? error.message : 'Erro desconhecido'
              };
            }
          })
        );
        
        results.productInfo = productInfo;
        
      } else {
        // Teste básico de conectividade
        const exaSearch = new ExaProductSearch();
        const healthCheck = await exaSearch.healthCheck();
        results.healthCheck = healthCheck;
      }

      return NextResponse.json({
        success: true,
        data: results
      });

    } catch (error) {
      console.error('Erro no teste Exa:', error);
      
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        data: results
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Erro na requisição:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint de teste da integração Exa',
    usage: {
      'POST /api/exa-test': {
        description: 'Testa a integração com Exa',
        parameters: {
          query: 'string (opcional) - Termo de busca para produtos',
          url: 'string (opcional) - URL do produto para scraping',
          testType: 'string (opcional) - Tipo de teste: "exa-search", "enhanced-scraper", ou "health-check"'
        },
        examples: [
          {
            testType: 'exa-search',
            query: 'smartphone samsung galaxy'
          },
          {
            testType: 'enhanced-scraper',
            url: 'https://www.amazon.com.br/dp/B08N5WRWNW'
          },
          {
            testType: 'health-check'
          }
        ]
      }
    }
  });
}