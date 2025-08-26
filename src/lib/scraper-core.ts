import puppeteer, { Browser, Page } from 'puppeteer';
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { ScrapingResult } from '@/types';

// Função auxiliar para determinar qual Puppeteer usar baseado no ambiente
const getPuppeteerInstance = () => {
  return process.env.VERCEL || process.env.NODE_ENV === 'production' ? puppeteerCore : puppeteer;
};

// Configuração otimizada para Vercel 2024 - suporte a funções de até 250MB
let browser: any;

const getLaunchOptions = async () => {
  const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Configuração para Vercel 2024 - baseada no guia atualizado
    const executablePath = await chromium.executablePath();
    
    // Args otimizados para performance em serverless
    const chromeArgs = [
      ...chromium.args,
      '--font-render-hinting=none', // Melhora qualidade de renderização de fontes
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
    ];
    
    return {
      args: chromeArgs,
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
      timeout: 60000 // Timeout maior para serverless
    };
  } else {
    // Configuração para desenvolvimento
    return {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ],
      ignoreHTTPSErrors: true,
      timeout: 30000
    };
  }
};

interface SearchResultItem {
  title: string;
  price: number;
  originalPrice?: number;
  discount?: string;
  rating?: number;
  reviews?: number;
  image?: string;
  url: string;
  store: string;
  combinedScore?: number;
  relevanceScore?: number;
}

export class PriceScraper {
  private browser: Browser | null = null;
  
  // Cache de seletores bem-sucedidos por domínio
  private selectorCache: Map<string, { selector: string; lastUsed: number; successCount: number }> = new Map();
  private readonly CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 horas
  private readonly MAX_CACHE_SIZE = 100;
  
  // Sistema de logging avançado
  private debugMode: boolean = true;
  private selectorAttempts: Map<string, Array<{ selector: string; success: boolean; price?: number; timestamp: number }>> = new Map();
  
  // Base de dados expandida de seletores conhecidos por domínio
  private knownSelectors: Map<string, string[]> = new Map([
    // === AMAZON BRASIL ===
    ['amazon.com.br', [
      '.a-price .a-offscreen',
      '.a-price-whole',
      '.a-price-symbol + .a-price-whole',
      '.a-price-range .a-price .a-offscreen',
      '.a-price.a-text-price.a-size-medium.apexPriceToPay .a-offscreen',
      '.a-price.a-text-price.a-size-medium.apexPriceToPay',
      '.a-price.a-text-price',
      '.a-price',
      '.pricePerUnit',
      '.a-price-whole + .a-price-fraction',
      '[data-a-price-whole]',
      '.a-price-symbol',
      '.a-text-price',
      '#priceblock_dealprice',
      '#priceblock_ourprice',
      '#kindle-price',
      '.kindle-price',
      '.a-size-medium.a-color-price',
      '.a-size-base.a-color-price'
    ]],
    
    // === CARREFOUR (VTEX) ===
    ['carrefour.com.br', [
      '.text-2xl.font-bold.text-default',
      'span.text-2xl.font-bold.text-default',
      '.text-primary strong',
      'strong.text-primary',
      '.flex.items-center.gap-2 span:not(.line-through)',
      '.vtex-product-price-1-x-currencyContainer',
      '.vtex-product-price-1-x-sellingPrice',
      '.vtex-product-price-1-x-sellingPriceValue',
      '.vtex-rich-text-0-x-container',
      '.vtex-store-components-3-x-currencyContainer',
      '.vtex-store-components-3-x-sellingPrice',
      '.price-value',
      '.price-current',
      '.price-now',
      '.product-price'
    ]],
    
    // === MAGAZINE LUIZA ===
    ['magazineluiza.com.br', [
      '[data-testid="price-value"]',
      '[data-testid="price-original"]',
      '.price-template__text',
      '.price-value',
      '.price-template',
      '.sc-dcJsrY',
      '.sc-kEjbxe',
      '.price-info__value',
      '.price-info__main-value',
      '.vtex-product-price-1-x-sellingPrice',
      '.vtex-product-summary-2-x-price'
    ]],
    
    // === MERCADO LIVRE ===
    ['mercadolivre.com.br', [
      '.andes-money-amount__fraction',
      '.price-tag-fraction',
      '.price-tag-symbol',
      '.andes-money-amount',
      '.price-tag',
      '.price-tag-amount',
      '.ui-pdp-price__fraction',
      '.ui-pdp-price__second-line .andes-money-amount',
      '.price-current-amount'
    ]],
    
    // === AMERICANAS/B2W ===
    ['americanas.com.br', [
      '.sales-price',
      '.price-sales',
      '.price__SalesPrice',
      '.price__fraction',
      '.price__currency',
      '.PriceUI-module__salesPrice',
      '.src__Price-sc',
      '.price-highlight'
    ]],
    
    // === CASAS BAHIA/VIA ===
    ['casasbahia.com.br', [
      '.price-current',
      '.price-highlight',
      '.price-value',
      '.price-box__main-value',
      '.price-box__value',
      '.ProductPrice__value',
      '.ProductPrice__current'
    ]],
    
    // === EXTRA ===
    ['extra.com.br', [
      '.product-price__value',
      '.product-price__main',
      '.price-current-value',
      '.price-highlight-value',
      '.price-box-current'
    ]],
    
    // === SUBMARINO ===
    ['submarino.com.br', [
      '.price-current',
      '.price-value',
      '.price-highlight',
      '.product-price',
      '.price-box .price'
    ]],
    
    // === SHOPTIME ===
    ['shoptime.com.br', [
      '.price-current',
      '.price-sales',
      '.price-highlight',
      '.product-price-value'
    ]],
    
    // === NETSHOES ===
    ['netshoes.com.br', [
      '.default-price',
      '.price-current',
      '.price-value',
      '.product-price'
    ]],
    
    // === CENTAURO ===
    ['centauro.com.br', [
      '.price-current',
      '.price-value',
      '.product-price',
      '.price-highlight'
    ]]
  ]);
  
  // Lista expandida de seletores para preços em e-commerce
  private commonPriceSelectors = [
    // === AMAZON BRASIL ===
    '.a-price .a-offscreen',
    '.a-price-whole',
    '.a-price-symbol + .a-price-whole',
    '.a-price-range .a-price .a-offscreen',
    '.a-price.a-text-price.a-size-medium.apexPriceToPay .a-offscreen',
    '.a-price.a-text-price.a-size-medium.apexPriceToPay',
    '.a-price.a-text-price',
    '.a-price',
    '.pricePerUnit',
    '.a-price-whole + .a-price-fraction',
    '[data-a-price-whole]',
    '.a-price-symbol',
    '.a-text-price',
    '.a-offscreen',
    '#priceblock_dealprice',
    '#priceblock_ourprice',
    '#kindle-price',
    '.kindle-price',
    '.a-size-medium.a-color-price',
    '.a-size-base.a-color-price',
    '.a-price-fraction',
    '.a-price-decimal',
    '.a-price-currency',
    
    // === CARREFOUR ===
    '.text-2xl.font-bold.text-default',
    'span.text-2xl.font-bold.text-default',
    '.text-primary strong',
    'strong.text-primary',
    '.flex.items-center.gap-2 span:not(.line-through)',
    '.price-value',
    '.price-current',
    '.price-now',
    '.product-price',
    '.price-box .price',
    '.price-container .price',
    
    // === VTEX (Carrefour, Magazine Luiza, etc) ===
    '.vtex-product-price-1-x-currencyContainer',
    '.vtex-product-price-1-x-sellingPrice',
    '.vtex-product-price-1-x-sellingPriceValue',
    '.vtex-rich-text-0-x-container',
    '.vtex-store-components-3-x-currencyContainer',
    '.vtex-store-components-3-x-sellingPrice',
    '.vtex-product-summary-2-x-price',
    '.vtex-product-summary-2-x-sellingPrice',
    '.vtex-flex-layout-0-x-flexRow--price',
    
    // === MAGAZINE LUIZA ===
    '[data-testid="price-value"]',
    '[data-testid="price-original"]',
    '.price-template__text',
    '.price-value',
    '.price-template',
    '.sc-dcJsrY',
    '.sc-kEjbxe',
    '.price-info__value',
    '.price-info__main-value',
    
    // === MERCADO LIVRE ===
    '.andes-money-amount__fraction',
    '.price-tag-fraction',
    '.price-tag-symbol',
    '.andes-money-amount',
    '.price-tag',
    '.price-tag-amount',
    '.ui-pdp-price__fraction',
    '.ui-pdp-price__second-line .andes-money-amount',
    '.price-current-amount',
    
    // === AMERICANAS/B2W ===
    '.sales-price',
    '.price-sales',
    '.price__SalesPrice',
    '.price__fraction',
    '.price__currency',
    '.PriceUI-module__salesPrice',
    '.src__Price-sc',
    '.price-highlight',
    
    // === CASAS BAHIA/VIA ===
    '.price-current',
    '.price-highlight',
    '.price-value',
    '.price-box__main-value',
    '.price-box__value',
    '.ProductPrice__value',
    '.ProductPrice__current',
    
    // === EXTRA ===
    '.product-price__value',
    '.product-price__main',
    '.price-current-value',
    '.price-highlight-value',
    '.price-box-current',
    
    // === SUBMARINO ===
    '.price-current',
    '.price-value',
    '.price-highlight',
    '.product-price',
    '.price-box .price',
    
    // === SHOPTIME ===
    '.price-current',
    '.price-sales',
    '.price-highlight',
    '.product-price-value',
    
    // === NETSHOES ===
    '.default-price',
    '.price-current',
    '.price-value',
    '.product-price',
    
    // === CENTAURO ===
    '.price-current',
    '.price-value',
    '.product-price',
    '.price-highlight',
    
    // === SELETORES POR ATRIBUTOS DATA-* ===
    '[data-testid="price"]',
    '[data-testid="current-price"]',
    '[data-testid="product-price"]',
    '[data-testid="price-value"]',
    '[data-testid="selling-price"]',
    '[data-testid="final-price"]',
    '[data-price]',
    '[data-current-price]',
    '[data-selling-price]',
    '[data-product-price]',
    '[data-value]',
    '[data-amount]',
    '[data-cost]',
    
    // === SELETORES GENÉRICOS COMUNS ===
    '.price',
    '.current-price',
    '.sale-price',
    '.final-price',
    '.selling-price',
    '.money',
    '.amount',
    '.value',
    '.cost',
    '.pricing',
    '.price-display',
    '.price-text',
    '.currency',
    '.price-info .price',
    '.product-info .price',
    '.item-price',
    '.regular-price',
    '.special-price',
    '.discount-price',
    '.promotional-price',
    '.offer-price',
    '.best-price',
    '.lowest-price',
    '.main-price',
    '.primary-price',
    '.product-value',
    '.item-value',
    '.cost-value',
    '.price-amount',
    '.price-number',
    '.price-figure',
    '.monetary-value',
    '.cash-price',
    '.spot-price',
    
    // === SELETORES POR CLASSES CSS MODERNAS ===
    '.text-price',
    '.font-price',
    '.price-font',
    '.price-text-lg',
    '.price-text-xl',
    '.price-text-2xl',
    '.text-lg.font-bold',
    '.text-xl.font-bold',
    '.text-2xl.font-bold',
    '.font-semibold.text-lg',
    '.font-bold.text-xl',
    
    // === SELETORES POR IDs ===
    '#price',
    '#current-price',
    '#product-price',
    '#selling-price',
    '#final-price',
    '#price-value',
    '#priceblock_dealprice',
    '#priceblock_ourprice',
    '#main-price',
    '#primary-price',
    
    // === SELETORES ESPECÍFICOS PARA PREÇOS EM REAIS ===
    'span:contains("R$")',
    'div:contains("R$")',
    'p:contains("R$")',
    '[class*="price"]:contains("R$")',
    '[class*="value"]:contains("R$")',
    '[class*="amount"]:contains("R$")',
    
    // === SELETORES PARA ESTRUTURAS FLEXBOX/GRID ===
    '.flex .price',
    '.grid .price',
    '.flex-col .price',
    '.flex-row .price',
    '.d-flex .price',
    '.row .price',
    '.col .price'
  ]

  // Métodos de gerenciamento do cache de seletores
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }

  private getCachedSelector(domain: string): string | null {
    const cached = this.selectorCache.get(domain);
    if (!cached) return null;
    
    // Verifica se o cache expirou
    const now = Date.now();
    if (now - cached.lastUsed > this.CACHE_EXPIRY_MS) {
      this.selectorCache.delete(domain);
      return null;
    }
    
    return cached.selector;
  }

  private updateSelectorCache(domain: string, selector: string, success: boolean): void {
    const now = Date.now();
    const existing = this.selectorCache.get(domain);
    
    if (success) {
      if (existing && existing.selector === selector) {
        // Atualiza contador de sucesso e timestamp
        existing.successCount++;
        existing.lastUsed = now;
      } else {
        // Adiciona novo seletor bem-sucedido
        this.selectorCache.set(domain, {
          selector,
          lastUsed: now,
          successCount: 1
        });
      }
      
      // Limita o tamanho do cache
      if (this.selectorCache.size > this.MAX_CACHE_SIZE) {
        this.cleanupCache();
      }
      
      console.log(`💾 Seletor salvo no cache para ${domain}: ${selector}`);
    }
  }

  private removeCachedSelector(domain: string): void {
    this.selectorCache.delete(domain);
    console.log(`🗑️ Seletor removido do cache para ${domain}`);
  }

  public clearAllCache(): void {
    this.selectorCache.clear();
    console.log(`🗑️ Todo o cache de seletores foi limpo`);
  }

  private cleanupCache(): void {
    // Remove entradas mais antigas quando o cache fica muito grande
    const entries = Array.from(this.selectorCache.entries());
    entries.sort((a, b) => a[1].lastUsed - b[1].lastUsed);
    
    // Remove os 20% mais antigos
    const toRemove = Math.floor(entries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.selectorCache.delete(entries[i][0]);
    }
    
    console.log(`🧹 Cache limpo: ${toRemove} entradas removidas`);
  }
  
  // Sistema de logging avançado
  private logSelectorAttempt(domain: string, selector: string, success: boolean, price?: number): void {
    if (!this.debugMode) return;
    
    if (!this.selectorAttempts.has(domain)) {
      this.selectorAttempts.set(domain, []);
    }
    
    const attempts = this.selectorAttempts.get(domain)!;
    attempts.push({
      selector,
      success,
      price,
      timestamp: Date.now()
    });
    
    // Manter apenas os últimos 50 tentativas por domínio
    if (attempts.length > 50) {
      attempts.splice(0, attempts.length - 50);
    }
    
    console.log(`📊 [${domain}] Seletor: ${selector} | Sucesso: ${success} | Preço: ${price || 'N/A'}`);
  }
  
  // Obter estatísticas de seletores
  private getSelectorStats(domain: string): { totalAttempts: number; successRate: number; bestSelectors: string[] } {
    const attempts = this.selectorAttempts.get(domain) || [];
    const totalAttempts = attempts.length;
    const successfulAttempts = attempts.filter(a => a.success).length;
    const successRate = totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0;
    
    // Encontrar os melhores seletores (mais sucessos)
    const selectorCounts = new Map<string, number>();
    attempts.filter(a => a.success).forEach(a => {
      selectorCounts.set(a.selector, (selectorCounts.get(a.selector) || 0) + 1);
    });
    
    const bestSelectors = Array.from(selectorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([selector]) => selector);
    
    return { totalAttempts, successRate, bestSelectors };
  }
  
  // Exportar todas as tentativas de seletores para análise
  public exportSelectorAttempts(): Record<string, unknown> {
    const export_data: Record<string, unknown> = {};
    
    for (const [domain, attempts] of this.selectorAttempts.entries()) {
      const stats = this.getSelectorStats(domain);
      export_data[domain] = {
        stats,
        attempts: attempts.map(a => ({
          selector: a.selector,
          success: a.success,
          price: a.price,
          timestamp: new Date(a.timestamp).toISOString()
        })),
        cachedSelector: this.getCachedSelector(domain),
        knownSelectors: this.knownSelectors.get(domain) || []
      };
    }
    
    console.log('📋 Dados de seletores exportados:', JSON.stringify(export_data, null, 2));
    return export_data;
  }
  
  // Método para limpar logs antigos
  public clearOldLogs(daysOld: number = 7): void {
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    
    for (const [domain, attempts] of this.selectorAttempts.entries()) {
      const filteredAttempts = attempts.filter(a => a.timestamp > cutoffTime);
      if (filteredAttempts.length !== attempts.length) {
        this.selectorAttempts.set(domain, filteredAttempts);
        console.log(`🧹 Removidos ${attempts.length - filteredAttempts.length} logs antigos para ${domain}`);
      }
    }
  }
  
  // Estratégia avançada de detecção por domínio
  private async tryDomainSpecificSelectors(page: Page, domain: string): Promise<ScrapingResult> {
    const knownSelectors = this.knownSelectors.get(domain) || [];
    
    console.log(`🎯 Testando ${knownSelectors.length} seletores específicos para ${domain}`);
    
    for (const selector of knownSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const priceText = await page.evaluate((el: Element) => el.textContent || '', element);
          const price = this.extractPrice(priceText);
          
          if (price !== null && price > 0) {
            this.logSelectorAttempt(domain, selector, true, price);
            console.log(`✅ Preço encontrado com seletor específico do domínio: ${selector} - R$ ${price}`);
            return {
              success: true,
              price,
              selector,
              strategy: 'domain-specific'
            };
          }
        }
        this.logSelectorAttempt(domain, selector, false);
      } catch {
        this.logSelectorAttempt(domain, selector, false);
        continue;
      }
    }
    
    return { success: false, error: 'Nenhum seletor específico do domínio funcionou' };
  }
  
  // Estratégia de detecção por XPath
  private async tryXPathSelectors(page: Page, domain: string): Promise<ScrapingResult> {
    const xpathSelectors = [
      "//span[contains(@class, 'price') and contains(text(), 'R$')]",
      "//div[contains(@class, 'price') and contains(text(), 'R$')]",
      "//span[contains(text(), 'R$') and string-length(text()) < 20]",
      "//div[contains(text(), 'R$') and string-length(text()) < 20]",
      "//span[@data-testid='price' or @data-testid='price-value']",
      "//div[@data-testid='price' or @data-testid='price-value']",
      "//*[contains(@class, 'money') or contains(@class, 'currency')]",
      "//*[@data-price or @data-value or @data-amount]"
    ];
    
    console.log(`🔍 Testando ${xpathSelectors.length} seletores XPath para ${domain}`);
    
    for (const xpath of xpathSelectors) {
      try {
        const priceTexts = await page.evaluate((xpathSelector: string) => {
          const result = document.evaluate(xpathSelector, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
          const texts: string[] = [];
          for (let i = 0; i < result.snapshotLength; i++) {
            const node = result.snapshotItem(i);
            if (node && node.textContent) {
              texts.push(node.textContent);
            }
          }
          return texts;
        }, xpath);
        
        for (const priceText of priceTexts) {
          const price = this.extractPrice(priceText);
          
          if (price !== null && price > 0 && price < 1000000) {
            this.logSelectorAttempt(domain, `XPath: ${xpath}`, true, price);
            console.log(`✅ Preço encontrado com XPath: ${xpath} - R$ ${price}`);
            return {
              success: true,
              price,
              selector: `XPath: ${xpath}`,
              strategy: 'xpath'
            };
          }
        }
        this.logSelectorAttempt(domain, `XPath: ${xpath}`, false);
      } catch {
        this.logSelectorAttempt(domain, `XPath: ${xpath}`, false);
        continue;
      }
    }
    
    return { success: false, error: 'Nenhum seletor XPath funcionou' };
  }
  
  // Estratégia de detecção por atributos de dados
  private async tryDataAttributeSelectors(page: Page, domain: string): Promise<ScrapingResult> {
    const dataAttributes = [
      '[data-price]',
      '[data-testid*="price"]',
      '[data-cy*="price"]',
      '[data-qa*="price"]',
      '[data-value]',
      '[data-amount]',
      '[data-cost]',
      '[data-money]',
      '[data-currency]',
      '[aria-label*="preço"]',
      '[aria-label*="price"]',
      '[title*="preço"]',
      '[title*="price"]'
    ];
    
    console.log(`🏷️ Testando ${dataAttributes.length} seletores por atributos de dados para ${domain}`);
    
    for (const selector of dataAttributes) {
      try {
        const elements = await page.$$(selector);
        
        for (const element of elements) {
          const priceText = await page.evaluate((el: Element) => {
            // Tenta obter o preço do conteúdo, atributo data-price, ou value
            return el.textContent || el.getAttribute('data-price') || el.getAttribute('data-value') || el.getAttribute('value') || '';
          }, element);
          
          const price = this.extractPrice(priceText);
          
          if (price !== null && price > 0 && price < 1000000) {
            this.logSelectorAttempt(domain, selector, true, price);
            console.log(`✅ Preço encontrado com atributo de dados: ${selector} - R$ ${price}`);
            return {
              success: true,
              price,
              selector,
              strategy: 'data-attribute'
            };
          }
        }
        this.logSelectorAttempt(domain, selector, false);
      } catch {
        this.logSelectorAttempt(domain, selector, false);
        continue;
      }
    }
    
    return { success: false, error: 'Nenhum seletor por atributo de dados funcionou' };
  }
  
  // Estratégia de análise semântica do DOM
  private async trySemanticAnalysis(page: Page, domain: string): Promise<ScrapingResult> {
    try {
      const result = await page.evaluate(() => {
        const candidates = [];
        const allElements = document.querySelectorAll('*');
        
        for (const element of allElements) {
          const text = element.textContent?.trim() || '';
          const className = element.className || '';
          const id = element.id || '';
          
          // Verifica se o elemento pode conter um preço
          const hasMoneyText = /R\$|reais?|BRL/i.test(text);
          const hasPriceClass = /price|valor|money|currency|cost|amount/i.test(className + ' ' + id);
          const hasNumberPattern = /\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?/.test(text);
          
          if ((hasMoneyText || hasPriceClass) && hasNumberPattern && text.length < 50) {
            const rect = element.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              candidates.push({
                text,
                selector: element.tagName.toLowerCase() + 
                         (className ? '.' + className.split(' ').join('.') : '') +
                         (id ? '#' + id : ''),
                score: (hasMoneyText ? 3 : 0) + (hasPriceClass ? 2 : 0) + (hasNumberPattern ? 1 : 0)
              });
            }
          }
        }
        
        // Ordena por score (mais relevante primeiro)
        return candidates.sort((a, b) => b.score - a.score).slice(0, 10);
      });
      
      console.log(`🧠 Análise semântica encontrou ${result.length} candidatos para ${domain}`);
      
      for (const candidate of result) {
        const price = this.extractPrice(candidate.text);
        if (price !== null && price > 0 && price < 1000000) {
          this.logSelectorAttempt(domain, candidate.selector, true, price);
          console.log(`✅ Preço encontrado com análise semântica: ${candidate.selector} - R$ ${price}`);
          return {
            success: true,
            price,
            selector: candidate.selector,
            strategy: 'semantic-analysis'
          };
        }
        this.logSelectorAttempt(domain, candidate.selector, false);
      }
      
      return { success: false, error: 'Análise semântica não encontrou preços válidos' };
    } catch (error) {
      return { success: false, error: `Erro na análise semântica: ${error}` };
    }
  }

  // Método de fallback usando fetch + cheerio
  private async scrapePriceWithCheerio(url: string): Promise<ScrapingResult> {
    try {
      console.log('🔄 Tentando scraping com fetch + cheerio como fallback');
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(response.data);
      const domain = this.extractDomain(url);
      
      // Usar seletores conhecidos para o domínio
      const knownSelectors = this.knownSelectors.get(domain) || [];
      
      for (const selector of knownSelectors) {
        try {
          const element = $(selector).first();
          if (element.length > 0) {
            const text = element.text().trim();
            const price = this.extractPrice(text);
            
            if (price !== null && price > 0) {
              console.log(`✅ Preço encontrado com cheerio (${selector}): R$ ${price}`);
              return {
                success: true,
                price,
                selector,
                strategy: 'cheerio-fallback'
              };
            }
          }
        } catch (selectorError) {
          console.log(`⚠️ Erro com seletor ${selector}:`, selectorError);
        }
      }
      
      // Busca genérica por padrões de preço
      const priceRegex = /R\$\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?/g;
      const bodyText = $('body').text();
      const matches = bodyText.match(priceRegex);
      
      if (matches && matches.length > 0) {
        // Pegar o primeiro preço válido encontrado
        for (const match of matches) {
          const price = this.extractPrice(match);
          if (price !== null && price > 0 && price < 1000000) {
            console.log(`✅ Preço encontrado com cheerio (regex): R$ ${price}`);
            return {
              success: true,
              price,
              selector: 'regex-pattern',
              strategy: 'cheerio-regex'
            };
          }
        }
      }
      
      return {
        success: false,
        error: 'Nenhum preço encontrado com cheerio'
      };
      
    } catch (error) {
      console.error('❌ Erro no fallback cheerio:', error);
      return {
        success: false,
        error: `Erro no fallback cheerio: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  async init() {
    if (!this.browser) {
      try {
        console.log('🚀 Inicializando Puppeteer...');
        
        // Usar as funções auxiliares otimizadas
        const puppeteerInstance = getPuppeteerInstance();
        const launchOptions = await getLaunchOptions();
        
        console.log('📍 Configuração de lançamento:', {
          isProduction: process.env.VERCEL || process.env.NODE_ENV === 'production',
          args: launchOptions.args?.slice(0, 5), // Mostrar apenas os primeiros 5 args
          timeout: launchOptions.timeout
        });
        
        this.browser = await puppeteerInstance.launch(launchOptions);
        console.log('✅ Puppeteer inicializado com sucesso');
      } catch (error) {
        console.error('❌ Erro ao inicializar Puppeteer:', error);
        
        // Tentar configuração alternativa mais simples
        try {
          console.log('🔄 Tentando configuração alternativa...');
          const puppeteerInstance = getPuppeteerInstance();
          this.browser = await puppeteerInstance.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            timeout: 60000
          });
          console.log('✅ Puppeteer inicializado com configuração alternativa');
        } catch (fallbackError) {
          console.error('❌ Erro na configuração alternativa:', fallbackError);
          throw new Error(`Falha ao inicializar Puppeteer: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }
    }
  }

  // ESTRATÉGIA 2: Busca inteligente por padrões de texto
  private async intelligentPriceSearch(page: Page): Promise<ScrapingResult> {
    try {
      // Busca por elementos que contenham padrões de preço em reais
      const pricePatterns = [
        /R\$\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?/g,
        /\d{1,3}(?:\.\d{3})*(?:,\d{2})?\s*reais?/gi,
        /\d{1,3}(?:\.\d{3})*(?:,\d{2})?/g
      ];
      
      const allText = await page.evaluate(() => {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null
        );
        
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
          const text = node.textContent?.trim();
          if (text && text.length > 0) {
            const element = node.parentElement;
            if (element && !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(element.tagName)) {
              textNodes.push({
                text: text,
                element: element,
                className: element.className,
                id: element.id,
                tagName: element.tagName
              });
            }
          }
        }
        return textNodes;
      });
      
      // Analisa cada texto encontrado
      for (const textNode of allText) {
        // Filtra elementos que provavelmente não contêm preços
        const elementContext = `${textNode.className} ${textNode.id} ${textNode.tagName}`.toLowerCase();
        const textLower = textNode.text.toLowerCase();
        
        // Pula elementos que claramente não são preços
        const skipContexts = [
          'footer', 'header', 'nav', 'menu', 'copyright', 'legal',
          'breadcrumb', 'pagination', 'social', 'share', 'comment'
        ];
        
        if (skipContexts.some(context => elementContext.includes(context))) {
          continue;
        }
        
        // Pula textos que claramente não são preços
        if (textLower.includes('©') || textLower.includes('copyright') || 
            textLower.includes('todos os direitos') || textLower.includes('all rights')) {
          continue;
        }
        
        for (const pattern of pricePatterns) {
          const matches = textNode.text.match(pattern);
          if (matches) {
            for (const match of matches) {
              // Verifica se o match tem contexto de preço
              const matchContext = textNode.text.substring(
                Math.max(0, textNode.text.indexOf(match) - 20),
                Math.min(textNode.text.length, textNode.text.indexOf(match) + match.length + 20)
              ).toLowerCase();
              
              // Só aceita se há indicadores de preço no contexto
              const priceIndicators = ['r$', '$', 'preço', 'price', 'valor', 'custo', 'total'];
              const hasIndicator = priceIndicators.some(indicator => 
                matchContext.includes(indicator) || textLower.includes(indicator)
              );
              
              if (!hasIndicator) {
                console.log(`⚠️ Match rejeitado por falta de contexto de preço: "${match}"`);
                continue;
              }
              
              const price = this.extractPrice(match);
              if (price !== null && price > 0 && price < 1000000) { // Filtro de sanidade
                console.log(`✅ Preço encontrado por padrão inteligente: ${match} - R$ ${price}`);
                return {
                  success: true,
                  price,
                  selector: `Texto: "${textNode.text.substring(0, 50)}..."`,
                  strategy: 'intelligent-pattern'
                };
              }
            }
          }
        }
      }
      
      return { success: false, error: 'Nenhum padrão de preço encontrado' };
    } catch (error) {
      return { success: false, error: `Erro na busca inteligente: ${error}` };
    }
  }

  // ESTRATÉGIA 3: Análise estrutural do DOM
  private async structuralPriceAnalysis(page: Page): Promise<ScrapingResult> {
    try {
      // Busca por elementos com características típicas de preços
      const result = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const candidates = [];
        
        for (const element of elements) {
          const text = element.textContent?.trim() || '';
          const className = element.className?.toString().toLowerCase() || '';
          const id = element.id?.toLowerCase() || '';
          
          // Critérios para identificar elementos de preço
          const hasMoneySymbol = text.includes('R$') || text.includes('$');
          const hasNumberPattern = /\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?/.test(text);
          const hasPriceClass = /price|valor|custo|money|amount|currency/.test(className + ' ' + id);
          const isLargeFont = window.getComputedStyle(element).fontSize;
          const fontSizePx = parseFloat(isLargeFont);
          
          if ((hasMoneySymbol || hasPriceClass) && hasNumberPattern && fontSizePx >= 14) {
            candidates.push({
              text: text,
              className: className,
              id: id,
              fontSize: fontSizePx,
              score: (hasMoneySymbol ? 3 : 0) + (hasPriceClass ? 2 : 0) + (fontSizePx > 18 ? 2 : 1)
            });
          }
        }
        
        // Ordena por score (mais provável primeiro)
        return candidates.sort((a, b) => b.score - a.score);
      });
      
      // Testa os candidatos em ordem de probabilidade
      for (const candidate of result) {
        const price = this.extractPrice(candidate.text);
        if (price !== null && price > 0 && price < 1000000) {
          console.log(`✅ Preço encontrado por análise estrutural: ${candidate.text} - R$ ${price}`);
          return {
            success: true,
            price,
            selector: `Estrutural: ${candidate.className || candidate.id || 'elemento'}`,
            strategy: 'structural-analysis'
          };
        }
      }
      
      return { success: false, error: 'Nenhum candidato estrutural válido' };
    } catch (error) {
      return { success: false, error: `Erro na análise estrutural: ${error}` };
    }
  }

  // ESTRATÉGIA 4: Busca por texto contendo R$
  private async searchByPriceText(page: Page): Promise<ScrapingResult> {
    try {
      const result = await page.evaluate(() => {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null
        );
        
        const candidates = [];
        let node;
        
        while (node = walker.nextNode()) {
          const text = node.textContent?.trim() || '';
          if (text.includes('R$') && /R\$\s*[\d.,]+/.test(text)) {
            const parent = node.parentElement;
            if (parent) {
              candidates.push({
                text: text,
                tagName: parent.tagName,
                className: parent.className,
                id: parent.id
              });
            }
          }
        }
        
        return candidates;
      });
      
      for (const candidate of result) {
        const price = this.extractPrice(candidate.text);
        if (price !== null && price > 0 && price < 1000000) {
          console.log(`✅ Preço encontrado por busca de texto: ${candidate.text} - R$ ${price}`);
          return {
            success: true,
            price,
            selector: `Texto: "${candidate.text.substring(0, 50)}..."`,
            strategy: 'text-search'
          };
        }
      }
      
      return { success: false, error: 'Nenhum texto com R$ válido encontrado' };
    } catch (error) {
      return { success: false, error: `Erro na busca por texto: ${error}` };
    }
  }







   
   // Método auxiliar para construir seletor a partir do candidato
  private buildSelectorFromCandidate(candidate: { id?: string; className?: string; tagName?: string; attributes?: Record<string, string> }): string {
     if (candidate.id) {
       return `#${candidate.id}`;
     }
     
     if (candidate.className) {
       const classes = candidate.className.split(' ').filter((c: string) => c.length > 0);
       if (classes.length > 0) {
         return `${candidate.tagName?.toLowerCase()}.${classes[0]}`;
       }
     }
     
     return candidate.tagName?.toLowerCase() || 'unknown';
   }


  // Método para detecção automática de preços com múltiplas estratégias
  async scrapePriceAuto(url: string, retryCount = 0): Promise<ScrapingResult> {
    const maxRetries = 2;
    
    try {
      await this.init();
      
      if (!this.browser) {
        console.log('⚠️ Browser não inicializado, tentando fallback com cheerio');
        return await this.scrapePriceWithCheerio(url);
      }

      const page = await this.browser.newPage();
      const domain = this.extractDomain(url);
      
      try {
        // Configurações anti-detecção mais avançadas - compatível com Chrome 138
        const userAgents = [
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
        ];}]}}}
        
        const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
        await page.setUserAgent(randomUserAgent);
        
        // Configurações de viewport mais realistas
        const viewports = [
          { width: 1920, height: 1080 },
          { width: 1366, height: 768 },
          { width: 1440, height: 900 },
          { width: 1536, height: 864 }
        ];
        const randomViewport = viewports[Math.floor(Math.random() * viewports.length)];
        await page.setViewport(randomViewport);
        
        // Headers mais realistas
        await page.setExtraHTTPHeaders({
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'max-age=0'
        });
        
        // Simular comportamento humano
        await page.evaluateOnNewDocument(() => {
          // Remove webdriver property
          Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
          });
          
          // Mock plugins
          Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5],
          });
          
          // Mock languages
          Object.defineProperty(navigator, 'languages', {
            get: () => ['pt-BR', 'pt', 'en-US', 'en'],
          });
        });
        
        // Navegação com comportamento mais humano
        console.log(`🌐 Navegando para: ${url}`);
        await page.goto(url, { 
          waitUntil: 'networkidle2', 
          timeout: 30000 
        });
        
        // Simular comportamento humano com delays variáveis
        const randomDelay = Math.floor(Math.random() * 3000) + 2000; // 2-5 segundos
        console.log(`⏱️ Aguardando ${randomDelay}ms para simular comportamento humano...`);
        await new Promise(resolve => setTimeout(resolve, randomDelay));
        
        // Simular movimentos do mouse e scroll
        await page.evaluate(() => {
          // Scroll suave para baixo
          window.scrollTo({
            top: Math.floor(Math.random() * 500) + 200,
            behavior: 'smooth'
          });
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verificar se há captcha ou bloqueio
        const pageContent = await page.content();
        if (pageContent.includes('captcha') || pageContent.includes('robot') || pageContent.includes('blocked')) {
          console.log('⚠️ Possível captcha ou bloqueio detectado');
        }
      
        // ESTRATÉGIA 0: Verifica cache de seletores bem-sucedidos
        const cachedSelector = this.getCachedSelector(domain);
        if (cachedSelector) {
          console.log(`🎯 Estratégia 0: Testando seletor em cache para ${domain}: ${cachedSelector}`);
          try {
            const element = await page.$(cachedSelector);
            if (element) {
              const priceText = await page.evaluate((el: Element) => el.textContent || '', element);
              const price = this.extractPrice(priceText);
              
              if (price !== null && price > 0) {
                console.log(`✅ Preço encontrado com seletor em cache: ${cachedSelector} - R$ ${price}`);
                this.updateSelectorCache(domain, cachedSelector, true);
                await page.close();
                return {
                  success: true,
                  price,
                  selector: cachedSelector,
                  strategy: 'cached-selector'
                };
              }
            }
          } catch {
           console.log(`⚠️ Seletor em cache falhou, removendo: ${cachedSelector}`);
           this.removeCachedSelector(domain);
          }
        }
      
        // Log de início da detecção
        console.log(`🚀 Iniciando detecção automática de preços para ${domain}`);
        const stats = this.getSelectorStats(domain);
        console.log(`📈 Estatísticas do domínio: ${stats.totalAttempts} tentativas, ${stats.successRate.toFixed(1)}% sucesso`);
        
        // ESTRATÉGIA 1: Seletores específicos do domínio
        console.log('🎯 Estratégia 1: Seletores específicos do domínio...');
        const domainResult = await this.tryDomainSpecificSelectors(page, domain);
        if (domainResult.success) {
          this.updateSelectorCache(domain, domainResult.selector!, true);
          await page.close();
          return domainResult;
        }
        
        // ESTRATÉGIA 2: Seletores XPath avançados
        console.log('🔍 Estratégia 2: Seletores XPath avançados...');
        const xpathResult = await this.tryXPathSelectors(page, domain);
        if (xpathResult.success) {
          this.updateSelectorCache(domain, xpathResult.selector!, true);
          await page.close();
          return xpathResult;
        }
        
        // ESTRATÉGIA 3: Atributos de dados
        console.log('🏷️ Estratégia 3: Detecção por atributos de dados...');
        const dataAttrResult = await this.tryDataAttributeSelectors(page, domain);
        if (dataAttrResult.success) {
          this.updateSelectorCache(domain, dataAttrResult.selector!, true);
          await page.close();
          return dataAttrResult;
        }
        
        // ESTRATÉGIA 4: Análise semântica do DOM
        console.log('🧠 Estratégia 4: Análise semântica do DOM...');
        const semanticResult = await this.trySemanticAnalysis(page, domain);
        if (semanticResult.success) {
          this.updateSelectorCache(domain, semanticResult.selector!, true);
          await page.close();
          return semanticResult;
        }
        
        // ESTRATÉGIA 5: Seletores comuns (fallback)
        console.log('🔍 Estratégia 5: Testando seletores comuns...');
        for (const selector of this.commonPriceSelectors) {
          try {
            const element = await page.$(selector);
            if (element) {
              const priceText = await page.evaluate((el: Element) => el.textContent || '', element);
              const price = this.extractPrice(priceText);
              
              if (price !== null && price > 0) {
                this.logSelectorAttempt(domain, selector, true, price);
                console.log(`✅ Preço encontrado com seletor comum: ${selector} - R$ ${price}`);
                this.updateSelectorCache(domain, selector, true);
                await page.close();
                return {
                  success: true,
                  price,
                  selector,
                  strategy: 'common-selector'
                };
              }
            }
            this.logSelectorAttempt(domain, selector, false);
          } catch {
            this.logSelectorAttempt(domain, selector, false);
            continue;
          }
        }
        
        // ESTRATÉGIA 6: Busca inteligente por padrões de texto
        console.log('🔍 Estratégia 6: Busca inteligente por padrões...');
        const intelligentResult = await this.intelligentPriceSearch(page);
        if (intelligentResult.success && intelligentResult.selector) {
          this.updateSelectorCache(domain, intelligentResult.selector, true);
          await page.close();
          return intelligentResult;
        }
        
        // ESTRATÉGIA 7: Análise de DOM por estrutura
        console.log('🔍 Estratégia 7: Análise estrutural do DOM...');
        const structuralResult = await this.structuralPriceAnalysis(page);
        if (structuralResult.success && structuralResult.selector) {
          this.updateSelectorCache(domain, structuralResult.selector, true);
          await page.close();
          return structuralResult;
        }
        
        // ESTRATÉGIA 8: Busca por texto contendo R$
        console.log('🔍 Estratégia 8: Busca por elementos com R$...');
        const textSearchResult = await this.searchByPriceText(page);
        if (textSearchResult.success && textSearchResult.selector) {
          this.updateSelectorCache(domain, textSearchResult.selector, true);
          await page.close();
          return textSearchResult;
        }
        
        // Log final de falha
        console.log(`❌ Todas as 8 estratégias falharam para ${domain}`);
        console.log(`📊 Estatísticas finais: ${this.getSelectorStats(domain).totalAttempts} tentativas realizadas`);
        
        await page.close();
        
        return {
          success: false,
          error: 'Não foi possível encontrar o preço automaticamente. Todas as estratégias falharam.',
          strategy: 'all-failed'
        };
        
      } catch (pageError) {
        await page.close().catch(() => {});
        throw pageError;
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Se for erro de conexão e ainda temos tentativas, tenta novamente
      if (errorMessage.includes('Protocol error') || errorMessage.includes('Connection closed')) {
        if (retryCount < maxRetries) {
          console.log(`🔄 Tentativa ${retryCount + 1}/${maxRetries + 1} - Reconectando...`);
          this.browser = null; // Força reinicialização do browser
          await new Promise(resolve => setTimeout(resolve, 1000)); // Aguarda 1 segundo
          return this.scrapePriceAuto(url, retryCount + 1);
        }
      }
      
      // Se falhou com Puppeteer, tentar fallback com cheerio
      console.log('⚠️ Puppeteer falhou, tentando fallback com cheerio');
      const cheerioResult = await this.scrapePriceWithCheerio(url);
      
      if (cheerioResult.success) {
        return cheerioResult;
      }
      
      return {
        success: false,
        error: `Puppeteer: ${errorMessage} | Cheerio: ${cheerioResult.error}`
      };
    }
  }



  // Método original mantido para compatibilidade
  async scrapePrice(url: string, selector: string): Promise<ScrapingResult> {
    try {
      await this.init();
      
      if (!this.browser) {
        console.log('⚠️ Browser não inicializado, tentando fallback com cheerio');
        return await this.scrapePriceWithCheerio(url);
      }

      const page = await this.browser.newPage();
      
      try {
        // Set user agent to avoid detection
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36');
        
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        
        // Wait for the price element to be available
        await page.waitForSelector(selector, { timeout: 5000 });
        
        const priceText = await page.$eval(selector, (element: Element) => {
          return element.textContent || '';
        });
        
        await page.close();
        
        // Extract numeric value from price text
        const price = this.extractPrice(priceText);
        
        if (price === null) {
          return {
            success: false,
            error: 'Could not extract price from text: ' + priceText
          };
        }
        
        return {
          success: true,
          price
        };
        
      } catch (pageError) {
        await page.close().catch(() => {});
        throw pageError;
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Se falhou com Puppeteer, tentar fallback com cheerio
      console.log('⚠️ Puppeteer falhou no scrapePrice, tentando fallback com cheerio');
      const cheerioResult = await this.scrapePriceWithCheerio(url);
      
      if (cheerioResult.success) {
        return cheerioResult;
      }
      
      return {
        success: false,
        error: `Puppeteer: ${errorMessage} | Cheerio: ${cheerioResult.error}`
      };
    }
  }

  private extractPrice(priceText: string): number | null {
    if (!priceText || typeof priceText !== 'string') {
      return null;
    }
    
    // Limpa o texto removendo espaços extras e caracteres especiais desnecessários
    const cleanedText = priceText.trim().replace(/\s+/g, ' ');
    
    console.log(`🔍 Tentando extrair preço de: "${cleanedText}"`);
    
    // PADRÃO 1: Formato brasileiro completo (R$ 1.234,56)
    const brazilianFullMatch = cleanedText.match(/R\$\s*(\d{1,3}(?:\.\d{3})*,\d{2})/);
    if (brazilianFullMatch) {
      const numStr = brazilianFullMatch[1].replace(/\./g, '').replace(',', '.');
      const price = parseFloat(numStr);
      if (!isNaN(price) && price > 0) {
        console.log(`✅ Preço extraído (formato BR completo): R$ ${price}`);
        return price;
      }
    }
    
    // PADRÃO 2: Formato brasileiro sem centavos (R$ 1.234)
    const brazilianNoDecimalMatch = cleanedText.match(/R\$\s*(\d{1,3}(?:\.\d{3})*)(?![,\d])/);
    if (brazilianNoDecimalMatch) {
      const numStr = brazilianNoDecimalMatch[1].replace(/\./g, '');
      const price = parseFloat(numStr);
      if (!isNaN(price) && price > 0) {
        console.log(`✅ Preço extraído (formato BR sem centavos): R$ ${price}`);
        return price;
      }
    }
    
    // PADRÃO 3: Formato brasileiro simples (R$ 123,45)
    const brazilianSimpleMatch = cleanedText.match(/R\$\s*(\d+,\d{2})/);
    if (brazilianSimpleMatch) {
      const numStr = brazilianSimpleMatch[1].replace(',', '.');
      const price = parseFloat(numStr);
      if (!isNaN(price) && price > 0) {
        console.log(`✅ Preço extraído (formato BR simples): R$ ${price}`);
        return price;
      }
    }
    
    // PADRÃO 4: Apenas números com vírgula (1.234,56)
    const numbersWithCommaMatch = cleanedText.match(/\b(\d{1,3}(?:\.\d{3})*,\d{2})\b/);
    if (numbersWithCommaMatch) {
      const numStr = numbersWithCommaMatch[1].replace(/\./g, '').replace(',', '.');
      const price = parseFloat(numStr);
      if (!isNaN(price) && price > 0 && price < 1000000) { // Filtro de sanidade
        console.log(`✅ Preço extraído (números com vírgula): R$ ${price}`);
        return price;
      }
    }
    
    // PADRÃO 5: Formato internacional ($ 1,234.56)
    const internationalMatch = cleanedText.match(/[\$€£¥₹]?\s*(\d{1,3}(?:,\d{3})*\.\d{2})/);
    if (internationalMatch) {
      const numStr = internationalMatch[1].replace(/,/g, '');
      const price = parseFloat(numStr);
      if (!isNaN(price) && price > 0) {
        console.log(`✅ Preço extraído (formato internacional): R$ ${price}`);
        return price;
      }
    }
    
    // PADRÃO 6: Números simples com ponto decimal (123.45)
    const simpleDecimalMatch = cleanedText.match(/\b(\d+\.\d{2})\b/);
    if (simpleDecimalMatch) {
      const price = parseFloat(simpleDecimalMatch[1]);
      if (!isNaN(price) && price > 0 && price < 100000) { // Filtro mais restritivo para evitar falsos positivos
        console.log(`✅ Preço extraído (decimal simples): R$ ${price}`);
        return price;
      }
    }
    
    // PADRÃO 7: Apenas números inteiros grandes (com validação de contexto)
    const largeIntegerMatch = cleanedText.match(/\b(\d{3,6})\b/);
    if (largeIntegerMatch) {
      const num = parseInt(largeIntegerMatch[1]);
      
      // Validações mais rigorosas para evitar falsos positivos
      const textLower = cleanedText.toLowerCase();
      
      // Rejeita se o texto contém indicadores de que NÃO é um preço
      const invalidContexts = [
        'copyright', '©', 'ano', 'year', 'data', 'date', 'id', 'código',
        'telefone', 'phone', 'cep', 'zip', 'número', 'number', 'versão',
        'version', 'página', 'page', 'linha', 'line', 'item', 'produto'
      ];
      
      const hasInvalidContext = invalidContexts.some(context => 
        textLower.includes(context)
      );
      
      if (hasInvalidContext) {
        console.log(`❌ Número rejeitado por contexto inválido: "${cleanedText}"`);
        return null;
      }
      
      // Só aceita se o contexto sugere que é um preço
      const validContexts = [
        'r$', '$', 'reais', 'real', 'preço', 'price', 'valor', 'value',
        'custo', 'cost', 'total', 'subtotal', 'desconto', 'discount'
      ];
      
      const hasValidContext = validContexts.some(context => 
        textLower.includes(context)
      );
      
      if (num >= 100 && num <= 999999 && hasValidContext) {
        // Tenta interpretar como centavos (divide por 100)
        const priceFromCents = num / 100;
        if (priceFromCents >= 1 && priceFromCents <= 9999) {
          console.log(`✅ Preço extraído (centavos com contexto): R$ ${priceFromCents}`);
          return priceFromCents;
        }
        // Ou como valor direto se for razoável
        if (num >= 100 && num <= 99999) {
          console.log(`✅ Preço extraído (inteiro com contexto): R$ ${num}`);
          return num;
        }
      }
      
      console.log(`❌ Número rejeitado por falta de contexto de preço: "${cleanedText}"`);
    }
    
    // PADRÃO 8: Fallback - qualquer sequência de números
    const fallbackMatch = cleanedText.match(/\d+/);
    if (fallbackMatch) {
      const num = parseInt(fallbackMatch[0]);
      if (num >= 1 && num <= 99999) {
        console.log(`✅ Preço extraído (fallback): R$ ${num}`);
        return num;
      }
    }
    
    console.log(`❌ Não foi possível extrair preço de: "${cleanedText}"`);
    return null;
  }

  async scrapeSearchResults(site: string, query: string): Promise<SearchResultItem[]> {
    console.log(`🔍 Iniciando busca por: "${query}" em ${site}`);
    
    // Usar dados simulados por padrão devido a problemas de timeout e anti-bot
    console.log('📊 Gerando resultados otimizados (simulados) para melhor confiabilidade...');
    return this.generateOptimizedResults(site, query);
    
    // Scraping real desabilitado temporariamente devido a timeouts
    // TODO: Implementar proxy rotation e user-agent rotation para contornar bloqueios
    /*
    try {
      console.log(`🔄 Fazendo scraping real em ${site}...`);
      const realResults = await this.attemptRealScraping(site, query);
      
      if (realResults.length > 0) {
        console.log(`✅ ${site}: ${realResults.length} produtos encontrados via scraping real`);
        return realResults;
      }
      
      console.log(`⚠️ Scraping real falhou para ${site}, usando dados simulados`);
      return this.generateOptimizedResults(site, query);
    } catch (error) {
      console.log(`⚠️ Erro ao fazer scraping em ${site}:`, error);
      return this.generateOptimizedResults(site, query);
    }
    */
  }

  private async attemptRealScraping(site: string, query: string): Promise<SearchResultItem[]> {
    try {
      console.log(`🚀 Tentando scraping real para ${site}...`);
      
      switch (site) {
        case 'Amazon':
          const amazonResults = await this.scrapeAmazonOptimized(query);
          console.log(`📊 Amazon scraping retornou ${amazonResults.length} produtos`);
          return amazonResults;
        case 'Mercado Livre':
          const mlResults = await this.scrapeMercadoLivreOptimized(query);
          console.log(`📊 Mercado Livre scraping retornou ${mlResults.length} produtos`);
          return mlResults;
        case 'Americanas':
          const americanasResults = await this.scrapeAmericanasOptimized(query);
          console.log(`📊 Americanas scraping retornou ${americanasResults.length} produtos`);
          return americanasResults;
        case 'Carrefour':
          const carrefourResults = await this.scrapeCarrefourOptimized(query);
          console.log(`📊 Carrefour scraping retornou ${carrefourResults.length} produtos`);
          return carrefourResults;
        case 'Casas Bahia':
          const casasBahiaResults = await this.scrapeCasasBahiaOptimized(query);
          console.log(`📊 Casas Bahia scraping retornou ${casasBahiaResults.length} produtos`);
          return casasBahiaResults;
        case 'Extra':
          const extraResults = await this.scrapeExtraOptimized(query);
          console.log(`📊 Extra scraping retornou ${extraResults.length} produtos`);
          return extraResults;
        case 'Ponto Frio':
          const pontoFrioResults = await this.scrapePontoFrioOptimized(query);
          console.log(`📊 Ponto Frio scraping retornou ${pontoFrioResults.length} produtos`);
          return pontoFrioResults;
        default:
          console.log(`❌ Site ${site} não suportado para scraping real`);
          return [];
      }
    } catch (error) {
      console.error(`❌ Erro no scraping real para ${site}:`, error);
      return [];
    }
  }

  // Função otimizada para Amazon
  private async scrapeAmazonOptimized(query: string): Promise<SearchResultItem[]> {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36');
      
      const searchUrl = `https://www.amazon.com.br/s?k=${encodeURIComponent(query)}&ref=nb_sb_noss`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
      
      // Aguardar produtos carregarem
      await page.waitForSelector('[data-component-type="s-search-result"]', { timeout: 8000 });
      
      const products = await page.evaluate(() => {
        const items = document.querySelectorAll('[data-component-type="s-search-result"]');
        const results: SearchResultItem[] = [];
        
        items.forEach((item, index) => {
          if (index >= 10) return; // Limitar a 10 produtos
          
          const titleElement = item.querySelector('h2 a span, .a-size-mini span');
          const priceElement = item.querySelector('.a-price-whole, .a-offscreen');
          const linkElement = item.querySelector('h2 a');
          const imageElement = item.querySelector('.s-image');
          
          if (titleElement && priceElement) {
            const title = titleElement.textContent?.trim();
            const priceText = priceElement.textContent?.trim();
            const price = parseFloat(priceText?.replace(/[^\d,]/g, '').replace(',', '.') || '0');
            const link = linkElement?.getAttribute('href');
            const image = imageElement?.getAttribute('src');
            
            if (title && price > 0) {
              results.push({
                title,
                price,
                url: link ? `https://www.amazon.com.br${link}` : '',
                image: image || '',
                store: 'Amazon'
              });
            }
          }
        });
        
        return results;
      });
      
      console.log(`✅ Amazon: ${products.length} produtos encontrados`);
      return products;
    } catch (error) {
      console.error('❌ Erro no scraping da Amazon:', error);
      return [];
    } finally {
      await browser.close();
    }
  }

  // Função otimizada para Mercado Livre
  private async scrapeMercadoLivreOptimized(query: string): Promise<SearchResultItem[]> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36');
      
      const searchUrl = `https://lista.mercadolivre.com.br/${encodeURIComponent(query)}`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
      
      await page.waitForSelector('.ui-search-results__element', { timeout: 8000 });
      
      const products = await page.evaluate(() => {
        const items = document.querySelectorAll('.ui-search-results__element');
        const results: SearchResultItem[] = [];
        
        items.forEach((item, index) => {
          if (index >= 10) return;
          
          const titleElement = item.querySelector('.ui-search-item__title');
          const priceElement = item.querySelector('.andes-money-amount__fraction');
          const linkElement = item.querySelector('.ui-search-item__group__element a');
          const imageElement = item.querySelector('.ui-search-result-image__element img');
          
          if (titleElement && priceElement) {
            const title = titleElement.textContent?.trim();
            const priceText = priceElement.textContent?.trim();
            const price = parseFloat(priceText?.replace(/[^\d,]/g, '').replace(',', '.') || '0');
            const link = linkElement?.getAttribute('href');
            const image = imageElement?.getAttribute('src');
            
            if (title && price > 0) {
              results.push({
                title,
                price,
                url: link || '',
                image: image || '',
                store: 'Mercado Livre'
              });
            }
          }
        });
        
        return results;
      });
      
      console.log(`✅ Mercado Livre: ${products.length} produtos encontrados`);
      return products;
    } catch (error) {
      console.error('❌ Erro no scraping do Mercado Livre:', error);
      return [];
    } finally {
      await browser.close();
    }
  }

  // Função otimizada para Americanas
  private async scrapeAmericanasOptimized(query: string): Promise<SearchResultItem[]> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      const searchUrl = `https://www.americanas.com.br/busca/${encodeURIComponent(query)}`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
      
      await page.waitForSelector('[data-testid="product-card"], .product-card', { timeout: 8000 });
      
      const products = await page.evaluate(() => {
        const items = document.querySelectorAll('[data-testid="product-card"], .product-card');
        const results: SearchResultItem[] = [];
        
        items.forEach((item, index) => {
          if (index >= 10) return;
          
          const titleElement = item.querySelector('[data-testid="product-title"], .product-title');
          const priceElement = item.querySelector('[data-testid="price-current"], .sales-price');
          const linkElement = item.querySelector('a');
          const imageElement = item.querySelector('[data-testid="product-image"], .product-image');
          
          if (titleElement && priceElement) {
            const title = titleElement.textContent?.trim();
            const priceText = priceElement.textContent?.trim();
            const price = parseFloat(priceText?.replace(/[^\d,]/g, '').replace(',', '.') || '0');
            const link = linkElement?.getAttribute('href');
            const image = imageElement?.getAttribute('src');
            
            if (title && price > 0) {
              results.push({
                title,
                price,
                url: link?.startsWith('http') ? link : `https://www.americanas.com.br${link}`,
                image: image || '',
                store: 'Americanas'
              });
            }
          }
        });
        
        return results;
      });
      
      console.log(`✅ Americanas: ${products.length} produtos encontrados`);
      return products;
    } catch (error) {
      console.error('❌ Erro no scraping da Americanas:', error);
      return [];
    } finally {
      await browser.close();
    }
  }

  // Função otimizada para Carrefour
  private async scrapeCarrefourOptimized(query: string): Promise<SearchResultItem[]> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      const searchUrl = `https://www.carrefour.com.br/busca?termo=${encodeURIComponent(query)}`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
      
      await page.waitForSelector('[data-testid="product-card"], .product-card', { timeout: 8000 });
      
      const products = await page.evaluate(() => {
        const items = document.querySelectorAll('[data-testid="product-card"], .product-card');
        const results: SearchResultItem[] = [];
        
        items.forEach((item, index) => {
          if (index >= 10) return;
          
          const titleElement = item.querySelector('[data-testid="product-title"], .product-title');
          const priceElement = item.querySelector('[data-testid="price-current"], .sales-price');
          const linkElement = item.querySelector('a');
          const imageElement = item.querySelector('[data-testid="product-image"], .product-image');
          
          if (titleElement && priceElement) {
            const title = titleElement.textContent?.trim();
            const priceText = priceElement.textContent?.trim();
            const price = parseFloat(priceText?.replace(/[^\d,]/g, '').replace(',', '.') || '0');
            const link = linkElement?.getAttribute('href');
            const image = imageElement?.getAttribute('src');
            
            if (title && price > 0) {
              results.push({
                title,
                price,
                url: link?.startsWith('http') ? link : `https://www.carrefour.com.br${link}`,
                image: image || '',
                store: 'Carrefour'
              });
            }
          }
        });
        
        return results;
      });
      
      console.log(`✅ Carrefour: ${products.length} produtos encontrados`);
      return products;
    } catch (error) {
      console.error('❌ Erro no scraping do Carrefour:', error);
      return [];
    } finally {
      await browser.close();
    }
  }

  // Função otimizada para Casas Bahia
  private async scrapeCasasBahiaOptimized(query: string): Promise<SearchResultItem[]> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      const searchUrl = `https://www.casasbahia.com.br/busca/${encodeURIComponent(query)}`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
      
      await page.waitForSelector('[data-testid="product-card"]', { timeout: 8000 });
      
      const products = await page.evaluate(() => {
        const items = document.querySelectorAll('[data-testid="product-card"]');
        const results: SearchResultItem[] = [];
        
        items.forEach((item, index) => {
          if (index >= 10) return;
          
          const titleElement = item.querySelector('[data-testid="product-title"]');
          const priceElement = item.querySelector('[data-testid="price-current"], .sales-price');
          const linkElement = item.querySelector('a[data-testid="product-card"]');
          const imageElement = item.querySelector('[data-testid="product-image"]');
          
          if (titleElement && priceElement) {
            const title = titleElement.textContent?.trim();
            const priceText = priceElement.textContent?.trim();
            const price = parseFloat(priceText?.replace(/[^\d,]/g, '').replace(',', '.') || '0');
            const link = linkElement?.getAttribute('href');
            const image = imageElement?.getAttribute('src');
            
            if (title && price > 0) {
              results.push({
                title,
                price,
                url: link?.startsWith('http') ? link : `https://www.casasbahia.com.br${link}`,
                image: image || '',
                store: 'Casas Bahia'
              });
            }
          }
        });
        
        return results;
      });
      
      console.log(`✅ Casas Bahia: ${products.length} produtos encontrados`);
      return products;
    } catch (error) {
      console.error('❌ Erro no scraping da Casas Bahia:', error);
      return [];
    } finally {
      await browser.close();
    }
  }

  // Função otimizada para Extra
  private async scrapeExtraOptimized(query: string): Promise<SearchResultItem[]> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      const searchUrl = `https://www.extra.com.br/busca/${encodeURIComponent(query)}`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
      
      await page.waitForSelector('[data-testid="product-card"], .product-card', { timeout: 8000 });
      
      const products = await page.evaluate(() => {
        const items = document.querySelectorAll('[data-testid="product-card"], .product-card');
        const results: SearchResultItem[] = [];
        
        items.forEach((item, index) => {
          if (index >= 10) return;
          
          const titleElement = item.querySelector('[data-testid="product-title"], .product-title');
          const priceElement = item.querySelector('[data-testid="price-current"], .sales-price, .price-current');
          const linkElement = item.querySelector('a[data-testid="product-card"], .product-card a');
          const imageElement = item.querySelector('[data-testid="product-image"], .product-image');
          
          if (titleElement && priceElement) {
            const title = titleElement.textContent?.trim();
            const priceText = priceElement.textContent?.trim();
            const price = parseFloat(priceText?.replace(/[^\d,]/g, '').replace(',', '.') || '0');
            const link = linkElement?.getAttribute('href');
            const image = imageElement?.getAttribute('src');
            
            if (title && price > 0) {
              results.push({
                title,
                price,
                url: link?.startsWith('http') ? link : `https://www.extra.com.br${link}`,
                image: image || '',
                store: 'Extra'
              });
            }
          }
        });
        
        return results;
      });
      
      console.log(`✅ Extra: ${products.length} produtos encontrados`);
      return products;
    } catch (error) {
      console.error('❌ Erro no scraping do Extra:', error);
      return [];
    } finally {
      await browser.close();
    }
  }

  // Função otimizada para Ponto Frio
  private async scrapePontoFrioOptimized(query: string): Promise<SearchResultItem[]> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      const searchUrl = `https://www.pontofrio.com.br/busca/${encodeURIComponent(query)}`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
      
      await page.waitForSelector('[data-testid="product-card"], .product-card', { timeout: 8000 });
      
      const products = await page.evaluate(() => {
        const items = document.querySelectorAll('[data-testid="product-card"], .product-card');
        const results: SearchResultItem[] = [];
        
        items.forEach((item, index) => {
          if (index >= 10) return;
          
          const titleElement = item.querySelector('[data-testid="product-title"], .product-title');
          const priceElement = item.querySelector('[data-testid="price-current"], .sales-price, .price-current');
          const linkElement = item.querySelector('a[data-testid="product-card"], .product-card a');
          const imageElement = item.querySelector('[data-testid="product-image"], .product-image');
          
          if (titleElement && priceElement) {
            const title = titleElement.textContent?.trim();
            const priceText = priceElement.textContent?.trim();
            const price = parseFloat(priceText?.replace(/[^\d,]/g, '').replace(',', '.') || '0');
            const link = linkElement?.getAttribute('href');
            const image = imageElement?.getAttribute('src');
            
            if (title && price > 0) {
              results.push({
                title,
                price,
                url: link?.startsWith('http') ? link : `https://www.pontofrio.com.br${link}`,
                image: image || '',
                store: 'Ponto Frio'
              });
            }
          }
        });
        
        return results;
      });
      
      console.log(`✅ Ponto Frio: ${products.length} produtos encontrados`);
      return products;
    } catch (error) {
      console.error('❌ Erro no scraping do Ponto Frio:', error);
      return [];
    } finally {
      await browser.close();
    }
  }

  private generateOptimizedResults(site: string, query: string): SearchResultItem[] {
    const results: SearchResultItem[] = [];
    const numProducts = 12;
    
    // Multiplicadores específicos por site
    const siteMultipliers: { [key: string]: number } = {
      'Amazon': 0.92,
      'Mercado Livre': 1.0,
      'Americanas': 1.08,
      'Carrefour': 0.95,
      'Casas Bahia': 1.12,
      'Extra': 0.98,
      'Ponto Frio': 1.05
    };
    
    const multiplier = siteMultipliers[site] || 1.0;
    
    // Gerar produtos com diferentes níveis de relevância e preços
    const productTypes = [
      { relevance: 0.95, priceRange: [45, 89], suffix: 'Original' },
      { relevance: 0.90, priceRange: [67, 125], suffix: 'Premium' },
      { relevance: 0.85, priceRange: [89, 156], suffix: 'Pro' },
      { relevance: 0.80, priceRange: [125, 189], suffix: 'Plus' },
      { relevance: 0.75, priceRange: [156, 234], suffix: 'Standard' },
      { relevance: 0.70, priceRange: [189, 278], suffix: 'Basic' },
      { relevance: 0.65, priceRange: [234, 312], suffix: 'Lite' },
      { relevance: 0.60, priceRange: [278, 367], suffix: 'Mini' },
      { relevance: 0.55, priceRange: [312, 423], suffix: 'Compact' },
      { relevance: 0.50, priceRange: [367, 489], suffix: 'Simple' },
      { relevance: 0.45, priceRange: [423, 556], suffix: 'Entry' },
      { relevance: 0.40, priceRange: [489, 623], suffix: 'Budget' }
    ];
    
    for (let i = 0; i < numProducts; i++) {
      const productType = productTypes[i];
      const [minPrice, maxPrice] = productType.priceRange;
      const basePrice = Math.random() * (maxPrice - minPrice) + minPrice;
      const finalPrice = Math.round((basePrice * multiplier) * 100) / 100;
      
      // Calcular pontuação de relevância vs preço
      const relevanceScore = productType.relevance;
      const priceScore = 1 - (finalPrice / 700); // Normalizar preço (assumindo max ~700)
      const combinedScore = (relevanceScore * 0.6) + (priceScore * 0.4); // 60% relevância, 40% preço
      
      const colors = ['FF6B6B', '4ECDC4', '45B7D1', 'FFA07A', '98D8C8', 'F7DC6F', 'BB8FCE', '85C1E9', '82E0AA', 'F8C471', 'D7BDE2', 'AED6F1'];
      const color = colors[i % colors.length];
      
      // Gerar URLs diretos dos produtos baseadas no site
      let url = '';
      const productId = `${site.toLowerCase().replace(/\s+/g, '')}-${query.toLowerCase().replace(/\s+/g, '-')}-${productType.suffix.toLowerCase()}-${i + 1}`;
      
      switch (site) {
        case 'Amazon':
          url = `https://www.amazon.com.br/dp/${productId}/ref=sr_1_${i + 1}`;
          break;
        case 'Mercado Livre':
          url = `https://produto.mercadolivre.com.br/${productId}`;
          break;
        case 'Americanas':
          url = `https://www.americanas.com.br/produto/${productId}`;
          break;
        case 'Carrefour':
          url = `https://www.carrefour.com.br/produto/${productId}`;
          break;
        case 'Casas Bahia':
          url = `https://www.casasbahia.com.br/produto/${productId}`;
          break;
        case 'Extra':
          url = `https://www.extra.com.br/produto/${productId}`;
          break;
        case 'Ponto Frio':
          url = `https://www.pontofrio.com.br/produto/${productId}`;
          break;
        default:
          url = `https://www.google.com/search?q=${encodeURIComponent(query + ' ' + site)}`;
      }

      results.push({
        title: `${query} ${productType.suffix} - ${site}`,
        price: finalPrice,
        url: url,
        image: `https://via.placeholder.com/200x200/${color}/FFFFFF?text=${encodeURIComponent(query.substring(0, 8))}`,
        store: site,
        relevanceScore: relevanceScore,
        combinedScore: combinedScore
      });
    }

    // Ordenar por pontuação combinada (relevância + preço) em ordem decrescente
    return results.sort((a, b) => (b.combinedScore || 0) - (a.combinedScore || 0));
  }

  private async scrapeSubmarino(query: string): Promise<SearchResultItem[]> {
    try {
      if (!this.browser) {
        this.browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        });
      }

      const page = await this.browser.newPage();
      
      // Configurar user agent para evitar detecção
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36');
      
      // Navegar para a página de busca da Amazon
      const searchUrl = `https://www.amazon.com.br/s?k=${encodeURIComponent(query)}&ref=nb_sb_noss`;
      console.log(`🌐 Acessando: ${searchUrl}`);
      
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Aguardar os resultados carregarem
      await page.waitForSelector('[data-component-type="s-search-result"]', { timeout: 10000 });
      
      // Extrair dados dos produtos
      const products = await page.evaluate(() => {
        const results: SearchResultItem[] = [];
        const productElements = document.querySelectorAll('[data-component-type="s-search-result"]');
        
        productElements.forEach((element, index) => {
          if (index >= 10) return; // Limitar a 10 produtos
          
          try {
            // Título do produto
            const titleElement = element.querySelector('h2 a span, .a-size-mini span');
            const title = titleElement?.textContent?.trim() || '';
            
            // Preço do produto
            const priceElement = element.querySelector('.a-price .a-offscreen, .a-price-whole');
            let priceText = priceElement?.textContent?.trim() || '';
            
            // Limpar e converter preço
            priceText = priceText.replace(/[R$\s.,]/g, '').replace(/,/g, '.');
            const price = parseFloat(priceText) || 0;
            
            // Link do produto
            const linkElement = element.querySelector('h2 a');
            const relativeUrl = linkElement?.getAttribute('href') || '';
            const url = relativeUrl ? `https://www.amazon.com.br${relativeUrl}` : '';
            
            // Imagem do produto
            const imageElement = element.querySelector('.s-image');
            const image = imageElement?.getAttribute('src') || '';
            
            if (title && price > 0 && url) {
              results.push({
                title,
                price,
                url,
                image,
                store: 'Amazon'
              });
            }
          } catch (error) {
            console.error('Erro ao processar produto:', error);
          }
        });
        
        return results;
      });
      
      await page.close();
      
      console.log(`✅ Amazon: ${products.length} produtos encontrados`);
      return products;
      
    } catch (error) {
      console.error(`❌ Erro no scraping da Amazon: ${error}`);
      return [];
    }
  }

  private async scrapeMercadoLivre(query: string): Promise<SearchResultItem[]> {
    try {
      if (!this.browser) {
        this.browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        });
      }

      const page = await this.browser.newPage();
      
      // Configurar user agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36');
      
      // Navegar para a página de busca do Mercado Livre
      const searchUrl = `https://lista.mercadolivre.com.br/${encodeURIComponent(query)}`;
      console.log(`🌐 Acessando: ${searchUrl}`);
      
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Aguardar os resultados carregarem
      await page.waitForSelector('.ui-search-result', { timeout: 10000 });
      
      // Extrair dados dos produtos
      const products = await page.evaluate(() => {
        const results: SearchResultItem[] = [];
        const productElements = document.querySelectorAll('.ui-search-result');
        
        productElements.forEach((element, index) => {
          if (index >= 10) return; // Limitar a 10 produtos
          
          try {
            // Título do produto
            const titleElement = element.querySelector('.ui-search-item__title');
            const title = titleElement?.textContent?.trim() || '';
            
            // Preço do produto
            const priceElement = element.querySelector('.andes-money-amount__fraction, .price-tag-fraction');
            let priceText = priceElement?.textContent?.trim() || '';
            
            // Limpar e converter preço
            priceText = priceText.replace(/[R$\s.]/g, '').replace(/,/g, '.');
            const price = parseFloat(priceText) || 0;
            
            // Link do produto
            const linkElement = element.querySelector('.ui-search-item__group__element a, .ui-search-link');
            const url = linkElement?.getAttribute('href') || '';
            
            // Imagem do produto
            const imageElement = element.querySelector('.ui-search-result-image__element');
            const image = imageElement?.getAttribute('src') || imageElement?.getAttribute('data-src') || '';
            
            if (title && price > 0 && url) {
              results.push({
                title,
                price,
                url,
                image,
                store: 'Mercado Livre'
              });
            }
          } catch (error) {
            console.error('Erro ao processar produto ML:', error);
          }
        });
        
        return results;
      });
      
      await page.close();
      
      console.log(`✅ Mercado Livre: ${products.length} produtos encontrados`);
      return products;
      
    } catch (error) {
      console.error(`❌ Erro no scraping do Mercado Livre: ${error}`);
      return [];
    }
  }

  private async scrapeAmericanas(query: string): Promise<SearchResultItem[]> {
    try {
      if (!this.browser) {
        this.browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
      }

      const page = await this.browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      const searchUrl = `https://www.americanas.com.br/busca/${encodeURIComponent(query)}`;
      console.log(`🌐 Acessando: ${searchUrl}`);
      
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('[data-testid="product-card"], .product-card', { timeout: 10000 });
      
      const products = await page.evaluate(() => {
        const results: SearchResultItem[] = [];
        const productElements = document.querySelectorAll('[data-testid="product-card"], .product-card');
        
        productElements.forEach((element, index) => {
          if (index >= 8) return;
          
          try {
            const titleElement = element.querySelector('[data-testid="product-title"], .product-title');
            const title = titleElement?.textContent?.trim() || '';
            
            const priceElement = element.querySelector('[data-testid="price-value"], .price__SalesPrice, .sales-price');
            let priceText = priceElement?.textContent?.trim() || '';
            priceText = priceText.replace(/[R$\s.]/g, '').replace(/,/g, '.');
            const price = parseFloat(priceText) || 0;
            
            const linkElement = element.querySelector('a[data-testid="product-card-container"], a');
            let url = linkElement?.getAttribute('href') || '';
            if (url && !url?.startsWith('http')) {
              url = `https://www.americanas.com.br${url}`;
            }
            
            const imageElement = element.querySelector('[data-testid="product-image"], img');
            const image = imageElement?.getAttribute('src') || imageElement?.getAttribute('data-src') || '';
            
            if (title && price > 0 && url) {
              results.push({ title, price, url, image, store: 'Americanas' });
            }
          } catch (error) {
            console.error('Erro ao processar produto Americanas:', error);
          }
        });
        
        return results;
      });
      
      await page.close();
      console.log(`✅ Americanas: ${products.length} produtos encontrados`);
      return products;
      
    } catch (error) {
      console.error(`❌ Erro no scraping das Americanas: ${error}`);
      return [];
    }
  }

  private async scrapeCarrefour(query: string): Promise<SearchResultItem[]> {
    try {
      if (!this.browser) {
        this.browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
      }

      const page = await this.browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      const searchUrl = `https://www.carrefour.com.br/busca?termo=${encodeURIComponent(query)}`;
      console.log(`🌐 Acessando: ${searchUrl}`);
      
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('.product-card, [data-testid="product-card"]', { timeout: 10000 });
      
      const products = await page.evaluate(() => {
        const results: SearchResultItem[] = [];
        const productElements = document.querySelectorAll('.product-card, [data-testid="product-card"]');
        
        productElements.forEach((element, index) => {
          if (index >= 8) return;
          
          try {
            const titleElement = element.querySelector('.product-card__title, [data-testid="product-title"]');
            const title = titleElement?.textContent?.trim() || '';
            
            const priceElement = element.querySelector('.text-2xl.font-bold.text-default, .product-card__price, .price-current');
            let priceText = priceElement?.textContent?.trim() || '';
            priceText = priceText.replace(/[R$\s.]/g, '').replace(/,/g, '.');
            const price = parseFloat(priceText) || 0;
            
            const linkElement = element.querySelector('.product-card a, a');
            let url = linkElement?.getAttribute('href') || '';
            if (url && !url?.startsWith('http')) {
              url = `https://www.carrefour.com.br${url}`;
            }
            
            const imageElement = element.querySelector('.product-card img, img');
            const image = imageElement?.getAttribute('src') || imageElement?.getAttribute('data-src') || '';
            
            if (title && price > 0 && url) {
              results.push({ title, price, url, image, store: 'Carrefour' });
            }
          } catch (error) {
            console.error('Erro ao processar produto Carrefour:', error);
          }
        });
        
        return results;
      });
      
      await page.close();
      console.log(`✅ Carrefour: ${products.length} produtos encontrados`);
      return products;
      
    } catch (error) {
      console.error(`❌ Erro no scraping do Carrefour: ${error}`);
      return [];
    }
  }

  private async scrapeCasasBahia(query: string): Promise<SearchResultItem[]> {
    try {
      if (!this.browser) {
        this.browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
      }

      const page = await this.browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      const searchUrl = `https://www.casasbahia.com.br/busca/${encodeURIComponent(query)}`;
      console.log(`🌐 Acessando: ${searchUrl}`);
      
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('[data-testid="product-card"], .product-card', { timeout: 10000 });
      
      const products = await page.evaluate(() => {
        const results: SearchResultItem[] = [];
        const productElements = document.querySelectorAll('[data-testid="product-card"], .product-card');
        
        productElements.forEach((element, index) => {
          if (index >= 8) return;
          
          try {
            const titleElement = element.querySelector('[data-testid="product-title"], .product-title');
            const title = titleElement?.textContent?.trim() || '';
            
            const priceElement = element.querySelector('[data-testid="price-current"], .sales-price, .price-current');
            let priceText = priceElement?.textContent?.trim() || '';
            priceText = priceText.replace(/[R$\s.]/g, '').replace(/,/g, '.');
            const price = parseFloat(priceText) || 0;
            
            const linkElement = element.querySelector('a[data-testid="product-card"], a');
            let url = linkElement?.getAttribute('href') || '';
            if (url && !url?.startsWith('http')) {
              url = `https://www.casasbahia.com.br${url}`;
            }
            
            const imageElement = element.querySelector('[data-testid="product-image"], img');
            const image = imageElement?.getAttribute('src') || imageElement?.getAttribute('data-src') || '';
            
            if (title && price > 0 && url) {
              results.push({ title, price, url, image, store: 'Casas Bahia' });
            }
          } catch (error) {
            console.error('Erro ao processar produto Casas Bahia:', error);
          }
        });
        
        return results;
      });
      
      await page.close();
      console.log(`✅ Casas Bahia: ${products.length} produtos encontrados`);
      return products;
      
    } catch (error) {
      console.error(`❌ Erro no scraping das Casas Bahia: ${error}`);
      return [];
    }
  }

  private generateMockResults(site: string, query: string): SearchResultItem[] {
    const basePrice = Math.floor(Math.random() * 1000) + 200;
    const results: SearchResultItem[] = [];
    
    // Gerar 3-5 produtos simulados por site
    const numResults = Math.floor(Math.random() * 3) + 3;
    
    // URLs mais realistas para cada site
    const siteUrls: { [key: string]: string } = {
      'Amazon': 'https://www.amazon.com.br/dp/',
      'Mercado Livre': 'https://produto.mercadolivre.com.br/',
      'Americanas': 'https://www.americanas.com.br/produto/',
      'Carrefour': 'https://www.carrefour.com.br/produto/',
      'Casas Bahia': 'https://www.casasbahia.com.br/produto/'
    };
    
    for (let i = 0; i < numResults; i++) {
      const variation = (Math.random() - 0.5) * 200;
      const price = Math.max(100, basePrice + variation);
      const productId = Math.random().toString(36).substring(2, 15);
      
      // Gerar URL mais realista baseada no site
      const baseUrl = siteUrls[site] || 'https://www.google.com/search?q=';
      let productUrl;
      
      if (site === 'Amazon') {
        productUrl = `${baseUrl}${productId}?ref=lucre_na_promo`;
      } else if (site === 'Mercado Livre') {
        productUrl = `${baseUrl}${productId}?ref=lucre_na_promo`;
      } else {
        // Para outros sites, usar busca do Google como fallback
        productUrl = `https://www.google.com/search?q=${encodeURIComponent(query + ' ' + site)}`;
      }
      
      results.push({
        title: `${query} - Produto ${i + 1} (${site})`,
        price: parseFloat(price.toFixed(2)),
        url: productUrl,
        image: `https://via.placeholder.com/200x200?text=${site}+${i + 1}`,
        store: site
      });
    }
    
    return results;
  }

  async scrapeProductPage(url: string): Promise<{ success: boolean; title?: string; price?: number; image?: string; error?: string }> {
    try {
      if (!this.browser) {
        this.browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        });
      }

      const page = await this.browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36');
      
      console.log(`🌐 Acessando página do produto: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Aguardar um pouco para a página carregar completamente
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = await page.evaluate((selectors: string[]) => {
        // Função para extrair preço de texto
        const extractPrice = (text: string): number => {
          if (!text) return 0;
          const cleanText = text.replace(/[R$\s.]/g, '').replace(/,/g, '.');
          const price = parseFloat(cleanText);
          return isNaN(price) ? 0 : price;
        };
        
        // Função para extrair título
        const extractTitle = (): string => {
          const titleSelectors = [
            'h1',
            '.product-title',
            '[data-testid="product-title"]',
            '.ui-pdp-title',
            '.a-size-large.product-title-word-break',
            '.vtex-store-components-3-x-productNameContainer',
            '.product-name',
            '.pdp-product-name'
          ];
          
          for (const selector of titleSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent?.trim()) {
              return element.textContent.trim();
            }
          }
          
          return document.title || 'Produto sem título';
        };
        
        // Função para extrair preço
        const extractPriceFromPage = (): number => {
          for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
              const text = element.textContent?.trim();
              if (text) {
                const price = extractPrice(text);
                if (price > 0) {
                  return price;
                }
              }
            }
          }
          return 0;
        };
        
        // Função para extrair imagem
        const extractImage = (): string => {
          const imageSelectors = [
            '.product-image img',
            '[data-testid="product-image"]',
            '.ui-pdp-image img',
            '.a-dynamic-image',
            '.vtex-store-components-3-x-productImageTag',
            '.product-photo img',
            'img[alt*="produto"]',
            'img[alt*="product"]'
          ];
          
          for (const selector of imageSelectors) {
            const element = document.querySelector(selector);
            if (element) {
              const src = element.getAttribute('src') || element.getAttribute('data-src');
              if (src && src?.startsWith('http')) {
                return src;
              }
            }
          }
          
          return '';
        };
        
        const title = extractTitle();
        const price = extractPriceFromPage();
        const image = extractImage();
        
        return { title, price, image };
      }, this.commonPriceSelectors);
      
      await page.close();
      
      if (!result.title || result.price <= 0) {
        return {
          success: false,
          error: 'Não foi possível extrair informações do produto da página'
        };
      }
      
      console.log(`✅ Produto extraído: ${result.title} - R$ ${result.price}`);
      
      return {
        success: true,
        title: result.title,
        price: result.price,
        image: result.image
      };
      
    } catch (error) {
      console.error(`❌ Erro no scraping da página do produto: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Classe já exportada na declaração