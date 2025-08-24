// Script para debugar e encontrar seletores específicos do Carrefour
// Execute com: node debug-carrefour.js

const puppeteer = require('puppeteer');

const productUrl = 'https://www.carrefour.com.br/whisky-buchanans-deluxe-12-anos-1l-6-unidades-b2-6-164666/p';

// Seletores específicos para testar no Carrefour
const carrefourSelectors = [
  // Seletores comuns do Carrefour
  '.price-value',
  '.price-current',
  '.price-now',
  '.product-price',
  '.price-box .price',
  '.price-container .price',
  '[data-testid="price"]',
  '[data-testid="current-price"]',
  '[data-testid="product-price"]',
  '.vtex-product-price',
  '.vtex-store-components',
  '.vtex-flex-layout',
  // Seletores VTEX (plataforma do Carrefour)
  '.vtex-product-price-1-x-currencyContainer',
  '.vtex-product-price-1-x-sellingPrice',
  '.vtex-product-price-1-x-sellingPriceValue',
  '.vtex-rich-text-0-x-container',
  // Seletores mais específicos
  '[class*="price"]',
  '[class*="Price"]',
  '[class*="valor"]',
  '[class*="Valor"]',
  // Seletores por texto
  'span:contains("R$")',
  'div:contains("R$")',
  'p:contains("R$")',
  // Seletores por atributos
  '[aria-label*="preço"]',
  '[aria-label*="price"]',
  '[title*="preço"]',
  '[title*="price"]'
];

async function debugCarrefour() {
  console.log('🔍 ANÁLISE ESPECÍFICA DO CARREFOUR');
  console.log('=' .repeat(50));
  console.log(`🔗 URL: ${productUrl}`);
  console.log('');
  
  let browser;
  try {
    console.log('🚀 Iniciando navegador...');
    browser = await puppeteer.launch({ 
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
    
    const page = await browser.newPage();
    
    // Configurar user agent para evitar detecção de bot
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    console.log('📄 Carregando página...');
    await page.goto(productUrl, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Aguardar um pouco para JavaScript carregar
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🔍 Analisando estrutura da página...');
    
    // Primeiro, vamos ver todos os elementos que contêm "R$"
    const elementsWithPrice = await page.evaluate(() => {
      const elements = [];
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent.includes('R$')) {
          const parent = node.parentElement;
          if (parent) {
            elements.push({
              text: node.textContent.trim(),
              tagName: parent.tagName,
              className: parent.className,
              id: parent.id,
              selector: parent.tagName.toLowerCase() + 
                       (parent.id ? '#' + parent.id : '') + 
                       (parent.className ? '.' + parent.className.split(' ').join('.') : '')
            });
          }
        }
      }
      return elements;
    });
    
    console.log('💰 ELEMENTOS COM "R$" ENCONTRADOS:');
    elementsWithPrice.forEach((el, index) => {
      console.log(`${index + 1}. Texto: "${el.text}"`);
      console.log(`   Tag: ${el.tagName}`);
      console.log(`   Classe: ${el.className}`);
      console.log(`   ID: ${el.id}`);
      console.log(`   Seletor: ${el.selector}`);
      console.log('');
    });
    
    console.log('🎯 TESTANDO SELETORES ESPECÍFICOS DO CARREFOUR:');
    
    for (const selector of carrefourSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await page.evaluate(el => el.textContent, element);
          if (text && text.includes('R$')) {
            console.log(`✅ SUCESSO: ${selector}`);
            console.log(`   Preço encontrado: "${text.trim()}"`);
            
            // Extrair apenas o valor numérico
            const priceMatch = text.match(/R\$\s*([\d.,]+)/i);
            if (priceMatch) {
              const price = priceMatch[1].replace(/\./g, '').replace(',', '.');
              console.log(`   Valor numérico: R$ ${price}`);
            }
            console.log('');
          }
        }
      } catch (error) {
        // Seletor inválido, continuar
      }
    }
    
    // Tentar encontrar elementos por atributos data-*
    console.log('🔍 PROCURANDO ATRIBUTOS DATA-*:');
    const dataAttributes = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const dataAttrs = [];
      
      elements.forEach(el => {
        Array.from(el.attributes).forEach(attr => {
          if (attr.name.startsWith('data-') && 
              (attr.value.includes('price') || attr.value.includes('valor') || 
               el.textContent.includes('R$'))) {
            dataAttrs.push({
              selector: `[${attr.name}="${attr.value}"]`,
              text: el.textContent.trim().substring(0, 100),
              attribute: `${attr.name}="${attr.value}"`
            });
          }
        });
      });
      
      return dataAttrs.slice(0, 10); // Limitar a 10 resultados
    });
    
    dataAttributes.forEach((attr, index) => {
      console.log(`${index + 1}. Atributo: ${attr.attribute}`);
      console.log(`   Seletor: ${attr.selector}`);
      console.log(`   Texto: "${attr.text}"`);
      console.log('');
    });
    
    // Analisar a estrutura HTML ao redor dos preços
    console.log('🏗️ ESTRUTURA HTML DOS PREÇOS:');
    const priceStructure = await page.evaluate(() => {
      const priceElements = [];
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent.includes('R$') && node.textContent.match(/R\$\s*[\d.,]+/)) {
          let parent = node.parentElement;
          let structure = [];
          
          // Subir 3 níveis na hierarquia
          for (let i = 0; i < 3 && parent; i++) {
            structure.push({
              tag: parent.tagName,
              classes: parent.className,
              id: parent.id
            });
            parent = parent.parentElement;
          }
          
          priceElements.push({
            text: node.textContent.trim(),
            structure: structure
          });
        }
      }
      
      return priceElements.slice(0, 5); // Limitar a 5 resultados
    });
    
    priceStructure.forEach((price, index) => {
      console.log(`${index + 1}. Preço: "${price.text}"`);
      console.log('   Estrutura HTML:');
      price.structure.forEach((level, levelIndex) => {
        console.log(`     Nível ${levelIndex + 1}: <${level.tag}${level.id ? ' id="' + level.id + '"' : ''}${level.classes ? ' class="' + level.classes + '"' : ''}>`);  
      });
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Erro durante a análise:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

console.log('🎯 INICIANDO ANÁLISE ESPECÍFICA DO CARREFOUR');
console.log('Este script irá:');
console.log('1. Carregar a página do produto');
console.log('2. Encontrar todos os elementos com "R$"');
console.log('3. Testar seletores específicos do Carrefour');
console.log('4. Analisar atributos data-*');
console.log('5. Mostrar a estrutura HTML dos preços');
console.log('');

debugCarrefour().then(() => {
  console.log('🎉 ANÁLISE CONCLUÍDA!');
  console.log('');
  console.log('📋 PRÓXIMOS PASSOS:');
  console.log('1. Identifique o seletor que funcionou');
  console.log('2. Adicione-o à lista de seletores do sistema');
  console.log('3. Teste novamente com o sistema principal');
}).catch(error => {
  console.error('💥 Erro fatal:', error);
});