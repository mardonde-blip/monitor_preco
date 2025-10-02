import { NextRequest, NextResponse } from 'next/server';
/* import { createPriceScraper } from '@/lib/scraper'; */

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
    // Funcionalidade desativada temporariamente por manutenção de módulos
    throw new Error('Scraper indisponível no momento');
  } catch (error) {
    console.error(`❌ Erro ao buscar em ${site.name}:`, error);
    return [{
      site: site.name,
      title: '',
      price: 0,
      url: '',
      success: false,
      error: 'Funcionalidade em manutenção'
    }];
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'Funcionalidade de busca está temporariamente em manutenção. Tente novamente mais tarde.'
    },
    { status: 503 }
  );
}

export async function GET() {
  return NextResponse.json({ 
    message: 'API de busca comparativa de preços',
    availableSites: SITES_CONFIG.map(site => site.name)
  });
}