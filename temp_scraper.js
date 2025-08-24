const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  
  try {
    await page.goto('https://www.carrefour.com.br/whisky-buchanans-deluxe-12-anos-1l-6-unidades-b2-6-164666/p', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Aguarda um pouco para garantir que a página carregou completamente
    await page.waitForTimeout(3000);
    
    const priceElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      return elements.filter(el => {
        const text = el.textContent || '';
        return /R\$\s*\d+[,.]\d{2}/.test(text) && el.children.length === 0;
      }).map(el => ({
        selector: el.tagName.toLowerCase() + 
                 (el.className ? '.' + el.className.split(' ').join('.') : '') + 
                 (el.id ? '#' + el.id : ''),
        text: el.textContent.trim(),
        tagName: el.tagName
      }));
    });
    
    console.log('Elementos com preços encontrados:');
    priceElements.forEach(el => {
      console.log(`Seletor: ${el.selector}`);
      console.log(`Texto: ${el.text}`);
      console.log('---');
    });
    
    // Também vamos tentar seletores comuns do Carrefour
    const commonSelectors = [
      '.price',
      '.product-price', 
      '[data-testid="price"]',
      '.value',
      '.amount',
      '.current-price',
      '.sale-price',
      '.price-value',
      '.price-current',
      '.price-now',
      '.price-box',
      '.product-price-value',
      '.price-display'
    ];
    
    console.log('\nTestando seletores comuns:');
    for (const selector of commonSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await page.evaluate(el => el.textContent, element);
          console.log(`✓ ${selector}: ${text.trim()}`);
        }
      } catch(e) {
        // Ignora erros
      }
    }
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await browser.close();
  }
})();