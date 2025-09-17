import Exa from 'exa-js';

interface ExaSearchResult {
  title: string;
  url: string;
  publishedDate?: string;
  text?: string;
  highlights?: string[];
  score?: number;
}

interface ExaSearchResponse {
  results: ExaSearchResult[];
  autopromptString?: string;
}

interface ProductSearchResult {
  name: string;
  url: string;
  store: string;
  estimatedPrice?: number;
  description?: string;
  score: number;
}

export class ExaProductSearch {
  private exa: Exa;

  constructor() {
    const apiKey = process.env.EXA_API_KEY;
    if (!apiKey) {
      throw new Error('EXA_API_KEY não encontrada nas variáveis de ambiente');
    }
    this.exa = new Exa(apiKey);
  }

  /**
   * Busca produtos usando a API da Exa com filtros específicos para e-commerce
   */
  async searchProducts(
    query: string,
    options: {
      maxResults?: number;
      includeDomains?: string[];
      excludeDomains?: string[];
      includeText?: boolean;
      includeHighlights?: boolean;
    } = {}
  ): Promise<ProductSearchResult[]> {
    try {
      const {
        maxResults = 10,
        includeDomains = [
          'amazon.com.br',
          'mercadolivre.com.br',
          'americanas.com.br',
          'magazineluiza.com.br',
          'casasbahia.com.br',
          'extra.com.br',
          'carrefour.com.br',
          'submarino.com.br'
        ],
        excludeDomains = [],
        includeText = true,
        includeHighlights = true
      } = options;

      // Melhora a query para buscar produtos específicos
      const enhancedQuery = `${query} preço comprar produto loja`;

      const searchOptions = {
        query: enhancedQuery,
        numResults: maxResults,
        includeDomains: includeDomains,
        excludeDomains: excludeDomains,
        useAutoprompt: true,
        contents: {
          text: includeText,
          highlights: includeHighlights ? {
            numSentences: 3,
            highlightsPerUrl: 2
          } : undefined
        }
      };

      const response = await this.exa.searchAndContents(searchOptions);
      
      return this.parseProductResults(response.results);
    } catch (error) {
      console.error('Erro na busca da Exa:', error);
      throw new Error('Falha na busca de produtos');
    }
  }

  /**
   * Busca produtos similares baseado em uma URL existente
   */
  async findSimilarProducts(
    productUrl: string,
    maxResults: number = 5
  ): Promise<ProductSearchResult[]> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/find_similar`,
        {
          url: productUrl,
          num_results: maxResults,
          include_text: true,
          include_highlights: true
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      const data: ExaSearchResponse = response.data;
      return this.parseProductResults(data.results);
    } catch (error) {
      console.error('Erro na busca de produtos similares:', error);
      throw new Error('Falha na busca de produtos similares');
    }
  }

  /**
   * Converte os resultados da Exa em formato de produtos
   */
  private parseProductResults(results: ExaSearchResult[]): ProductSearchResult[] {
    return results.map(result => {
      const store = this.extractStoreName(result.url);
      const estimatedPrice = this.extractPriceFromText(result.text || '');
      
      return {
        name: result.title,
        url: result.url,
        store,
        estimatedPrice,
        description: result.text?.substring(0, 200) + '...',
        score: result.score || 0
      };
    });
  }

  /**
   * Extrai o nome da loja baseado na URL
   */
  private extractStoreName(url: string): string {
    const domain = new URL(url).hostname.toLowerCase();
    
    const storeMap: { [key: string]: string } = {
      'amazon.com.br': 'Amazon',
      'mercadolivre.com.br': 'Mercado Livre',
      'americanas.com.br': 'Americanas',
      'magazineluiza.com.br': 'Magazine Luiza',
      'casasbahia.com.br': 'Casas Bahia',
      'extra.com.br': 'Extra',
      'carrefour.com.br': 'Carrefour',
      'submarino.com.br': 'Submarino'
    };

    return storeMap[domain] || domain;
  }

  /**
   * Tenta extrair preços do texto usando regex
   */
  private extractPriceFromText(text: string): number | undefined {
    // Regex para capturar preços em formato brasileiro
    const priceRegex = /R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/g;
    const matches = text.match(priceRegex);
    
    if (matches && matches.length > 0) {
      // Pega o primeiro preço encontrado
      const priceStr = matches[0].replace('R$', '').trim();
      const price = parseFloat(priceStr.replace(/\./g, '').replace(',', '.'));
      return isNaN(price) ? undefined : price;
    }
    
    return undefined;
  }

  /**
   * Busca preços atuais de um produto específico
   */
  async searchCurrentPrices(productName: string): Promise<ProductSearchResult[]> {
    const query = `${productName} preço atual comprar`;
    
    return this.searchProducts(query, {
      maxResults: 15,
      includeText: true,
      includeHighlights: true
    });
  }

  /**
   * Verifica se a API está funcionando
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.searchProducts('teste', { maxResults: 1 });
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default ExaProductSearch;