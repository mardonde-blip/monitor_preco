import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScrapingResult } from '@/types';

// User agents para rotacionar
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
];

export class HttpPriceScraper {
  private debugMode: boolean = true;

  // Seletores conhecidos por domínio
  private knownSelectors: Map<string, string[]> = new Map([
    ['carrefour.com.br', [
      '.text-2xl.font-bold.text-default',
      'span.text-2xl.font-bold.text-default',
      '.text-primary strong',
      'strong.text-primary',
      '.flex.items-center.gap-2 span:not(.line-through)',
      '.vtex-product-price-1-x-currencyContainer',
      '.vtex-product-price-1-x-sellingPrice',
      '.vtex-product-price-1-x-sellingPriceValue',
      '.price-value',
      '.price-current',
      '.price-now',
      '.product-price'
    ]],
    ['amazon.com.br', [
      '.a-price .a-offscreen',
      '.a-price-whole',
      '.a-price-symbol + .a-price-whole',
      '.a-price-range .a-price .a-offscreen',
      '.a-price.a-text-price.a-size-medium.apexPriceToPay .a-offscreen',
      '.a-price.a-text-price',
      '.a-price',
      '#priceblock_dealprice',
      '#priceblock_ourprice'
    ]],
    ['mercadolivre.com.br', [
      '.andes-money-amount__fraction',
      '.price-tag-fraction',
      '.price-tag .andes-money-amount__fraction',
      '.ui-pdp-price__fraction',
      '.price-tag-symbol + .price-tag-fraction'
    ]],
    ['americanas.com.br', [
      '.price-value',
      '.sales-price',
      '.best-price',
      '[data-testid="price-value"]',
      '.src__Wrapper-sc-1d4bfpw-0'
    ]]
  ]);

  private commonPriceSelectors = [
    // Seletores genéricos de preço
    '.price',
    '.current-price',
    '.sale-price',
    '.final-price',
    '.selling-price',
    '.price-value',
    '.price-current',
    '.product-price',
    '[data-testid="price"]',
    '[data-testid="current-price"]',
    '[data-testid="price-value"]',
    '[data-price]',
    '[class*="price"]:not([class*="old"]):not([class*="original"])',
    '.text-2xl.font-bold',
    '.text-xl.font-bold',
    '.font-bold',
    'strong',
    'b'
  ];

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return '';
    }
  }

  private getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  async scrapePriceHttp(url: string, retryCount = 0): Promise<ScrapingResult> {
    const maxRetries = 2;
    
    try {
      console.log(`🌐 Fazendo scraping HTTP da URL: ${url}`);
      
      const userAgent = this.getRandomUserAgent();
      console.log(`🤖 User Agent: ${userAgent.substring(0, 50)}...`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0'
        },
        timeout: 30000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500 // Aceitar redirects e 4xx
      });
      
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const $ = cheerio.load(response.data);
      const domain = this.extractDomain(url);
      
      console.log(`🏪 Domínio detectado: ${domain}`);
      console.log(`📄 HTML recebido: ${response.data.length} caracteres`);
      
      // Tentar seletores específicos do domínio primeiro
      const domainResult = this.tryDomainSpecificSelectors($, domain);
      if (domainResult.success) {
        console.log(`✅ Preço encontrado com seletor específico: R$ ${domainResult.price}`);
        return domainResult;
      }
      
      // Tentar seletores genéricos
      const genericResult = this.tryGenericSelectors($);
      if (genericResult.success) {
        console.log(`✅ Preço encontrado com seletor genérico: R$ ${genericResult.price}`);
        return genericResult;
      }
      
      // Fallback: buscar por texto que contenha R$
      const textResult = this.searchByPriceText($);
      if (textResult.success) {
        console.log(`✅ Preço encontrado por busca de texto: R$ ${textResult.price}`);
        return textResult;
      }
      
      return {
        success: false,
        price: 0,
        error: 'Preço não encontrado com nenhum método HTTP'
      };
      
    } catch (error) {
      console.error(`❌ Erro no scraping HTTP (tentativa ${retryCount + 1}):`, error);
      
      if (retryCount < maxRetries) {
        console.log(`🔄 Tentando novamente... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.scrapePriceHttp(url, retryCount + 1);
      }
      
      return {
        success: false,
        price: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido no scraping HTTP'
      };
    }
  }

  private tryDomainSpecificSelectors($: cheerio.CheerioAPI, domain: string): ScrapingResult {
    const selectors = this.knownSelectors.get(domain) || [];
    
    for (const selector of selectors) {
      try {
        const elements = $(selector);
        
        for (let i = 0; i < elements.length; i++) {
          const element = elements.eq(i);
          const text = element.text().trim();
          if (text) {
            const price = this.extractPrice(text);
            if (price > 0) {
              return { success: true, price, selector };
            }
          }
        }
      } catch (error) {
        console.log(`⚠️ Erro com seletor ${selector}:`, error);
      }
    }
    
    return { success: false, price: 0 };
  }

  private tryGenericSelectors($: cheerio.CheerioAPI): ScrapingResult {
    for (const selector of this.commonPriceSelectors) {
      try {
        const elements = $(selector);
        
        let foundPrice = 0;
        let foundSelector = '';
        
        elements.each((_, element) => {
          const text = $(element).text().trim();
          if (text) {
            const price = this.extractPrice(text);
            if (price > 0) {
              foundPrice = price;
              foundSelector = selector;
              return false; // Break the loop
            }
          }
        });
        
        if (foundPrice > 0) {
          return { success: true, price: foundPrice, selector: foundSelector };
        }
      } catch {
        // Continuar tentando outros seletores
      }
    }
    
    return { success: false, price: 0 };
  }

  private searchByPriceText($: cheerio.CheerioAPI): ScrapingResult {
    try {
      // Buscar por elementos que contenham "R$"
      let foundPrice = 0;
      
      $('*').each((_, element) => {
        const text = $(element).text();
        if (text.includes('R$') && text.length < 100) { // Evitar textos muito longos
          const price = this.extractPrice(text);
          if (price > 0) {
            foundPrice = price;
            return false; // Break the loop
          }
        }
      });
      
      if (foundPrice > 0) {
        return { success: true, price: foundPrice, selector: 'text-search' };
      }
      
    } catch (error) {
      console.error('Erro na busca por texto:', error);
    }
    
    return { success: false, price: 0 };
  }

  private extractPrice(text: string): number {
    if (!text) return 0;
    
    // Remover espaços e normalizar
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    // Padrões para encontrar preços em reais
    const patterns = [
      /R\$\s*([\d.,]+)/,
      /([\d.,]+)\s*reais?/i,
      /([\d.,]+)\s*R\$/,
      /\$\s*([\d.,]+)/,
      /([\d]+[.,]\d{2})/
    ];
    
    for (const pattern of patterns) {
      const match = cleanText.match(pattern);
      if (match) {
        let priceStr = match[1] || match[0];
        
        // Limpar e converter
        priceStr = priceStr.replace(/[^\d.,]/g, '');
        
        // Tratar vírgula como separador decimal se for o último
        if (priceStr.includes(',') && priceStr.includes('.')) {
          // Formato: 1.234,56
          priceStr = priceStr.replace(/\./g, '').replace(',', '.');
        } else if (priceStr.includes(',')) {
          // Verificar se é separador de milhares ou decimal
          const parts = priceStr.split(',');
          if (parts.length === 2 && parts[1].length === 2) {
            // É decimal: 123,45
            priceStr = priceStr.replace(',', '.');
          } else {
            // É separador de milhares: 1,234
            priceStr = priceStr.replace(/,/g, '');
          }
        }
        
        const price = parseFloat(priceStr);
        if (!isNaN(price) && price > 0 && price < 1000000) {
          return price;
        }
      }
    }
    
    return 0;
  }
}

// Instância singleton
let httpScraperInstance: HttpPriceScraper | null = null;

export function getHttpScraper(): HttpPriceScraper {
  if (!httpScraperInstance) {
    httpScraperInstance = new HttpPriceScraper();
  }
  return httpScraperInstance;
}