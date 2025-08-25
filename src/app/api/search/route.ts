import { NextRequest, NextResponse } from 'next/server';
import { createPriceScraper } from '@/lib/scraper';

interface SearchResult {
  site: string;
  title: string;
  price: number;
  url: string;
  image?: string;
  success: boolean;
  error?: string;
}

interface SiteConfig {
  name: string;
  searchUrl: (query: string) => string;
  selectors: {
    container: string;
    title: string;
    price: string;
    link: string;
    image?: string;
  };
}

interface SiteResult {
  totalFound: number;
  allProducts: SearchResult[];
  cheapestProduct?: SearchResult | null;
}

const SITES_CONFIG: SiteConfig[] = [
  {
    name: 'Amazon',
    searchUrl: (query: string) => `https://www.amazon.com.br/s?k=${encodeURIComponent(query)}`,
    selectors: {
      container: '[data-component-type="s-search-result"]',
      title: 'h2 a span, .a-size-mini span',
      price: '.a-price .a-offscreen, .a-price-whole',
      link: 'h2 a',
      image: '.s-image'
    }
  },
  {
    name: 'Mercado Livre',
    searchUrl: (query: string) => `https://lista.mercadolivre.com.br/${encodeURIComponent(query)}`,
    selectors: {
      container: '.ui-search-result',
      title: '.ui-search-item__title',
      price: '.andes-money-amount__fraction, .price-tag-fraction',
      link: '.ui-search-item__group__element a',
      image: '.ui-search-result-image__element'
    }
  },
  {
    name: 'Americanas',
    searchUrl: (query: string) => `https://www.americanas.com.br/busca/${encodeURIComponent(query)}`,
    selectors: {
      container: '[data-testid="product-card"]',
      title: '[data-testid="product-title"]',
      price: '[data-testid="price-value"], .price__SalesPrice',
      link: 'a[data-testid="product-card-container"]',
      image: '[data-testid="product-image"]'
    }
  },
  {
    name: 'Carrefour',
    searchUrl: (query: string) => `https://www.carrefour.com.br/busca?termo=${encodeURIComponent(query)}`,
    selectors: {
      container: '.product-card',
      title: '.product-card__title',
      price: '.text-2xl.font-bold.text-default, .product-card__price',
      link: '.product-card a',
      image: '.product-card img'
    }
  },
  {
    name: 'Casas Bahia',
    searchUrl: (query: string) => `https://www.casasbahia.com.br/busca/${encodeURIComponent(query)}`,
    selectors: {
      container: '[data-testid="product-card"]',
      title: '[data-testid="product-title"]',
      price: '[data-testid="price-current"], .sales-price',
      link: 'a[data-testid="product-card"]',
      image: '[data-testid="product-image"]'
    }
  },
  {
    name: 'Extra',
    searchUrl: (query: string) => `https://www.extra.com.br/busca/${encodeURIComponent(query)}`,
    selectors: {
      container: '[data-testid="product-card"], .product-card',
      title: '[data-testid="product-title"], .product-title',
      price: '[data-testid="price-current"], .sales-price, .price-current',
      link: 'a[data-testid="product-card"], .product-card a',
      image: '[data-testid="product-image"], .product-image'
    }
  },
  {
    name: 'Ponto Frio',
    searchUrl: (query: string) => `https://www.pontofrio.com.br/busca/${encodeURIComponent(query)}`,
    selectors: {
      container: '[data-testid="product-card"], .product-card',
      title: '[data-testid="product-title"], .product-title',
      price: '[data-testid="price-current"], .sales-price, .price-current',
      link: 'a[data-testid="product-card"], .product-card a',
      image: '[data-testid="product-image"], .product-image'
    }
  }
];

async function searchInSite(site: SiteConfig, query: string): Promise<SearchResult[]> {
  try {
    console.log(`🔍 Buscando em ${site.name}...`);
    
    // Create a new scraper instance
    const scraper = createPriceScraper();
    
    const results = await scraper.scrapeSearchResults(site.name, query);
    
    return results.map(result => ({
      site: site.name,
      title: result.title,
      price: result.price,
      url: result.url,
      image: result.image,
      relevanceScore: result.relevanceScore,
      combinedScore: result.combinedScore,
      success: true
    }));
  } catch (error) {
    console.error(`❌ Erro ao buscar em ${site.name}:`, error);
    return [{
      site: site.name,
      title: '',
      price: 0,
      url: '',
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }];
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query, sites } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query de busca é obrigatória' }, { status: 400 });
    }

    console.log(`🛒 Iniciando busca comparativa para: "${query}"`);
    
    // Filtrar sites se especificado, senão usar todos
    const sitesToSearch = sites && Array.isArray(sites) 
      ? SITES_CONFIG.filter(site => sites.includes(site.name))
      : SITES_CONFIG;

    // Executar buscas em paralelo
    const searchPromises = sitesToSearch.map(site => searchInSite(site, query));
    const searchResults = await Promise.all(searchPromises);
    
    // Processar resultados para obter o menor preço de cada site
    const siteResults: { [siteName: string]: SiteResult } = {};
    const allValidResults: SearchResult[] = [];
    
    searchResults.forEach((siteProducts, index) => {
      const siteName = sitesToSearch[index].name;
      const validProducts = siteProducts.filter(product => product.price > 0);
      
      if (validProducts.length > 0) {
        // Encontrar o produto com menor preço do site
        const cheapestProduct = validProducts.reduce((min, product) => 
          product.price < min.price ? product : min
        );
        
        siteResults[siteName] = {
          totalFound: validProducts.length,
          allProducts: validProducts.sort((a, b) => a.price - b.price),
          cheapestProduct: cheapestProduct
        };
        
        // Adicionar todos os produtos válidos para a lista geral
        allValidResults.push(...validProducts);
      } else {
        siteResults[siteName] = {
          totalFound: 0,
          allProducts: [],
          cheapestProduct: null
        };
      }
    });
    
    // Ordenar todos os resultados por preço
    const sortedResults = allValidResults.sort((a, b) => a.price - b.price);
    
    // Criar resumo dos menores preços por site
    const siteSummary = Object.entries(siteResults)
      .filter(([, data]) => data.cheapestProduct)
      .map(([siteName, data]) => ({
        site: siteName,
        cheapestPrice: data.cheapestProduct!.price,
        cheapestProduct: data.cheapestProduct!,
        totalProducts: data.totalFound
      }))
      .sort((a, b) => a.cheapestPrice - b.cheapestPrice);
    
    console.log(`✅ Busca concluída. ${sortedResults.length} produtos encontrados em ${siteSummary.length} sites.`);
    console.log(`📊 Menores preços por site:`);
    siteSummary.forEach(summary => {
      console.log(`   ${summary.site}: R$ ${summary.cheapestPrice.toFixed(2)} (${summary.totalProducts} produtos)`);
    });
    
    return NextResponse.json({
      query,
      totalResults: sortedResults.length,
      results: sortedResults,
      siteSummary,
      siteResults,
      searchedSites: sitesToSearch.map(site => site.name)
    });
    
  } catch (error) {
    console.error('❌ Erro na API de busca:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'API de busca comparativa de preços',
    availableSites: SITES_CONFIG.map(site => site.name)
  });
}