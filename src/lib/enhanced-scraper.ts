import { createPriceScraper } from './scraper';
import { ExaProductSearch } from './exa-search';

interface ScrapingResult {
  success: boolean;
  price?: number;
  error?: string;
  selector?: string;
  method?: 'traditional' | 'exa' | 'hybrid';
}

interface ProductComparison {
  originalUrl: string;
  originalPrice?: number;
  alternatives: Array<{
    title: string;
    price: number;
    url: string;
    store: string;
    score: number;
  }>;
  bestPrice?: {
    title: string;
    price: number;
    url: string;
    store: string;
    savings: number;
  };
}

interface SimilarProduct {
  title: string;
  url: string;
  score: number;
  content: string;
  highlights: string[];
}

export class EnhancedProductScraper {
  private traditionalScraper;
  private exaSearch: ExaProductSearch;

  constructor() {
    this.traditionalScraper = createPriceScraper();
    this.exaSearch = new ExaProductSearch();
  }

  /**
   * Scraping aprimorado com fallback inteligente
   */
  async scrapeWithFallback(url: string): Promise<ScrapingResult> {
    try {
      // Tentar primeiro o scraping tradicional
      const traditionalResult = await this.traditionalScraper.scrapePriceAuto(url);
      
      if (traditionalResult.success && traditionalResult.price && traditionalResult.price > 0) {
        return {
          ...traditionalResult,
          method: 'traditional'
        };
      }

      // Se falhar, tentar com Exa como fallback
      console.log('🔄 Scraping tradicional falhou, tentando com Exa...');
      return await this.scrapeWithExa(url);

    } catch (error) {
      console.error('❌ Erro no scraping aprimorado:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        method: 'hybrid'
      };
    }
  }

  /**
   * Scraping usando Exa para encontrar informações do produto
   */
  private async scrapeWithExa(url: string): Promise<ScrapingResult> {
    try {
      // Extrair informações básicas da URL para criar uma query
      const domain = new URL(url).hostname;
      const productQuery = this.extractProductQueryFromUrl(url);
      
      if (!productQuery) {
        throw new Error('Não foi possível extrair informações do produto da URL');
      }

      // Buscar informações do produto usando Exa
      const searchResults = await this.exaSearch.searchProducts(
        `${productQuery} site:${domain} preço`,
        {
          maxResults: 3,
          includeDomains: [domain]
        }
      );

      if (searchResults.length === 0) {
        throw new Error('Nenhum resultado encontrado na busca Exa');
      }

      // Tentar extrair preço dos resultados
      for (const result of searchResults) {
        if (result.estimatedPrice) {
          return {
            success: true,
            price: result.estimatedPrice,
            method: 'exa',
            selector: 'exa-extracted'
          };
        }
      }

      throw new Error('Nenhum preço encontrado nos resultados da Exa');

    } catch (error) {
      console.error('❌ Erro no scraping com Exa:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro no scraping com Exa',
        method: 'exa'
      };
    }
  }

  /**
   * Encontrar produtos similares usando Exa
   */
  async findSimilarProducts(originalUrl: string, maxResults: number = 5): Promise<SimilarProduct[]> {
    try {
      const productQuery = this.extractProductQueryFromUrl(originalUrl);
      
      if (!productQuery) {
        throw new Error('Não foi possível extrair informações do produto');
      }

      const searchResults = await this.exaSearch.searchProducts(
        `${productQuery} comprar preço`,
        {
          maxResults,
          excludeDomains: [new URL(originalUrl).hostname] // Excluir o site original
        }
      );

      return searchResults.map(result => ({
        title: result.name, // Usar 'name' em vez de 'title'
        url: result.url,
        score: result.score,
        content: result.description?.substring(0, 200) + '...' || '', // Usar 'description' em vez de 'content'
        highlights: [] // ProductSearchResult não tem highlights
      }));

    } catch (error) {
      console.error('❌ Erro ao buscar produtos similares:', error);
      return [];
    }
  }

  /**
   * Comparar preços de um produto em diferentes lojas
   */
  async compareProductPrices(originalUrl: string, maxAlternatives: number = 3): Promise<ProductComparison> {
    try {
      // Obter preço original
      const originalResult = await this.scrapeWithFallback(originalUrl);
      const originalPrice = originalResult.price;

      // Buscar alternativas
      const alternatives = await this.findSimilarProducts(originalUrl, maxAlternatives * 2);
      
      // Extrair preços das alternativas
      const alternativesWithPrices = await Promise.all(
        alternatives.slice(0, maxAlternatives).map(async (alt) => {
          try {
            // Usar dados já disponíveis do ProductSearchResult
            return {
              title: alt.title,
              price: 0, // Preço será obtido por scraping tradicional se necessário
              url: alt.url,
              store: new URL(alt.url).hostname,
              score: alt.score
            };
          } catch {
            return null;
          }
        })
      );

      const validAlternatives = alternativesWithPrices
        .filter(alt => alt && alt.price > 0)
        .sort((a, b) => a!.price - b!.price);

      // Encontrar melhor preço
      let bestPrice;
      if (validAlternatives.length > 0 && originalPrice) {
        const cheapest = validAlternatives[0]!;
        if (cheapest.price < originalPrice) {
          bestPrice = {
            ...cheapest,
            savings: originalPrice - cheapest.price
          };
        }
      }

      return {
        originalUrl,
        originalPrice,
        alternatives: validAlternatives.filter((alt): alt is NonNullable<typeof alt> => alt !== null),
        bestPrice
      };

    } catch (error) {
      console.error('❌ Erro na comparação de preços:', error);
      return {
        originalUrl,
        alternatives: []
      };
    }
  }

  /**
   * Extrair query de busca da URL do produto
   */
  private extractProductQueryFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // Tentar extrair nome do produto da URL
      // Remover caracteres especiais e números de ID
      let productName = pathname
        .split('/')
        .filter(segment => segment.length > 3) // Filtrar segmentos muito curtos
        .join(' ')
        .replace(/[-_]/g, ' ')
        .replace(/\d+/g, '') // Remover números
        .replace(/[^\w\s]/g, '') // Remover caracteres especiais
        .trim();

      // Se não conseguir extrair da URL, tentar do domínio
      if (!productName) {
        const domain = urlObj.hostname;
        productName = domain.split('.')[0];
      }

      return productName || null;

    } catch (error) {
      console.error('❌ Erro ao extrair query da URL:', error);
      return null;
    }
  }

  /**
   * Monitoramento inteligente com múltiplas fontes
   */
  async smartMonitoring(url: string): Promise<{
    currentPrice?: number;
    priceHistory: Array<{ price: number; timestamp: Date; method: string }>;
    alerts: string[];
  }> {
    const results: {
      currentPrice?: number;
      priceHistory: Array<{ price: number; timestamp: Date; method: string }>;
      alerts: string[];
    } = {
      priceHistory: [],
      alerts: []
    };

    try {
      // Tentar múltiplos métodos
      const methods = ['traditional', 'exa'];
      
      for (const method of methods) {
        try {
          let result;
          
          if (method === 'traditional') {
            result = await this.traditionalScraper.scrapePriceAuto(url);
          } else {
            result = await this.scrapeWithExa(url);
          }

          if (result.success && result.price && result.price > 0) {
            results.priceHistory.push({
              price: result.price,
              timestamp: new Date(),
              method: method
            });
          }
        } catch (error) {
          results.alerts.push(`Método ${method} falhou: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }

      // Definir preço atual (média ou mais confiável)
      if (results.priceHistory.length > 0) {
        results.currentPrice = results.priceHistory[0].price; // Usar o primeiro resultado válido
      }

      return results;

    } catch (error) {
      results.alerts.push(`Erro no monitoramento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return results;
    }
  }
}