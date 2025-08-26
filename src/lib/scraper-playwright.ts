import { chromium, Browser, Page } from 'playwright';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { ScrapingResult } from '@/types';

// Configuração otimizada para Playwright no Vercel
const getPlaywrightOptions = () => {
  const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    return {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--run-all-compositor-stages-before-draw',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--disable-ipc-flooding-protection'
      ],
      timeout: 60000
    };
  } else {
    return {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ],
      timeout: 30000
    };
  }
};

export class PlaywrightPriceScraper {
  private browser: Browser | null = null;
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
    'span:has-text("R$")',
    'div:has-text("R$")',
    '.text-2xl.font-bold',
    '.text-xl.font-bold',
    '.font-bold:has-text("R$")'
  ];

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return '';
    }
  }

  async init() {
    if (!this.browser) {
      try {
        console.log('🚀 Inicializando Playwright...');
        const options = getPlaywrightOptions();
        
        console.log('📍 Configuração Playwright:', {
          isProduction: process.env.VERCEL || process.env.NODE_ENV === 'production',
          timeout: options.timeout,
          argsCount: options.args?.length
        });
        
        this.browser = await chromium.launch(options);
        console.log('✅ Playwright inicializado com sucesso');
      } catch (error) {
        console.error('❌ Erro ao inicializar Playwright:', error);
        throw new Error(`Falha ao inicializar Playwright: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }
  }

  async scrapePriceAuto(url: string, retryCount = 0): Promise<ScrapingResult> {
    const maxRetries = 2;
    
    try {
      await this.init();
      
      if (!this.browser) {
        throw new Error('Browser não inicializado');
      }

      const context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        extraHTTPHeaders: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });

      const page = await context.newPage();
      
      try {
        console.log(`🔍 Navegando para: ${url}`);
        await page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 30000 
        });
        
        // Aguardar um pouco para o conteúdo carregar
        await page.waitForTimeout(2000);
        
        const domain = this.extractDomain(url);
        console.log(`🏪 Domínio detectado: ${domain}`);
        
        // Tentar seletores específicos do domínio primeiro
        const domainResult = await this.tryDomainSpecificSelectors(page, domain);
        if (domainResult.success) {
          console.log(`✅ Preço encontrado com seletor específico: R$ ${domainResult.price}`);
          return domainResult;
        }
        
        // Tentar seletores genéricos
        const genericResult = await this.tryGenericSelectors(page);
        if (genericResult.success) {
          console.log(`✅ Preço encontrado com seletor genérico: R$ ${genericResult.price}`);
          return genericResult;
        }
        
        // Fallback: buscar por texto que contenha R$
        const textResult = await this.searchByPriceText(page);
        if (textResult.success) {
          console.log(`✅ Preço encontrado por busca de texto: R$ ${textResult.price}`);
          return textResult;
        }
        
        return {
          success: false,
          price: 0,
          error: 'Preço não encontrado com nenhum método'
        };
        
      } finally {
        await context.close();
      }
      
    } catch (error) {
      console.error(`❌ Erro no scraping (tentativa ${retryCount + 1}):`, error);
      
      if (retryCount < maxRetries) {
        console.log(`🔄 Tentando novamente... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.scrapePriceAuto(url, retryCount + 1);
      }
      
      return {
        success: false,
        price: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido no scraping'
      };
    }
  }

  private async tryDomainSpecificSelectors(page: Page, domain: string): Promise<ScrapingResult> {
    const selectors = this.knownSelectors.get(domain) || [];
    
    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
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

  private async tryGenericSelectors(page: Page): Promise<ScrapingResult> {
    for (const selector of this.commonPriceSelectors) {
      try {
        const elements = await page.$$(selector);
        
        for (const element of elements) {
          const text = await element.textContent();
          if (text) {
            const price = this.extractPrice(text);
            if (price > 0) {
              return { success: true, price, selector };
            }
          }
        }
      } catch (error) {
        // Continuar tentando outros seletores
      }
    }
    
    return { success: false, price: 0 };
  }

  private async searchByPriceText(page: Page): Promise<ScrapingResult> {
    try {
      // Buscar por elementos que contenham "R$"
      const elements = await page.$$('*:has-text("R$")');
      
      for (const element of elements) {
        const text = await element.textContent();
        if (text) {
          const price = this.extractPrice(text);
          if (price > 0) {
            return { success: true, price, selector: 'text-search' };
          }
        }
      }
      
      // Fallback: buscar no HTML completo
      const content = await page.content();
      const $ = cheerio.load(content);
      
      const allElements = $('*');
      for (let i = 0; i < allElements.length; i++) {
        const element = allElements.eq(i);
        const text = element.text();
        if (text.includes('R$')) {
          const price = this.extractPrice(text);
          if (price > 0) {
            return { success: true, price, selector: 'cheerio-search' };
          }
        }
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

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('🔒 Playwright browser fechado');
    }
  }
}

// Instância singleton
let playwrightScraperInstance: PlaywrightPriceScraper | null = null;

export function getPlaywrightScraper(): PlaywrightPriceScraper {
  if (!playwrightScraperInstance) {
    playwrightScraperInstance = new PlaywrightPriceScraper();
  }
  return playwrightScraperInstance;
}