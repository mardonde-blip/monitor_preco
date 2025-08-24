const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const url = 'https://www.amazon.com.br/Whisky-Buchanans-12-Anos-Litro/dp/B00MTFIL0U/ref=sr_1_8?crid=1TM1AGZ2XK460&dib=eyJ2IjoiMSJ9.HfJ5pBZivfonNouCxWjSt0zwwC_3HnQfVqARkrE1vfeLaUpw92A4FbXVnfIoTjioJ7SGCwx1tCQSUoacuG1YGPQwdd-2RcXLbHln1du2rlsfAF_lmSv-p89HS_fat997Shcz-lDLvusvY_qtWF4erSfe0IqVBxZTVuvUwgeG8y2hNQNnjEp6FEt8Wzu10T5sCRX5c3XSBRA5GsBZcF_FyrMsYhCdZh06qNJv_m81A8RDpBbJXnu8WFV5rMCuWwyYlpEhUFTQyfy4TnPtoUrL-XV-0C3NY21SOmTTl7ZUmag.pAEH5jVrvY3tequc2HQ1m-CBQVrbV2mDpQ9ebsUj4u8&dib_tag=se&keywords=whisky&qid=1755918501&sprefix=whi%2Caps%2C1642&sr=8-8&ufe=app_do%3Aamzn1.fos.db68964d-7c0e-4bb2-a95c-e5cb9e32eb12';

async function debugAmazonPrice() {
  console.log('🔍 ANÁLISE DE SELETORES - AMAZON BRASIL');
  console.log('=====================================');
  console.log('');
  console.log('🌐 URL:', url);
  console.log('');
  
  const browser = await puppeteer.launch({ 
    headless: false,
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
    
    // Configurar user agent para evitar bloqueios
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    console.log('📄 Carregando página...');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Aguardar um pouco para garantir que tudo carregou
    await page.waitForTimeout(3000);
    
    const content = await page.content();
    const $ = cheerio.load(content);
    
    console.log('✅ Página carregada com sucesso!');
    console.log('');
    
    // Seletores comuns da Amazon para preços
    const amazonSelectors = [
      '.a-price-whole',
      '.a-price .a-offscreen',
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
      '.a-size-base.a-color-price'
    ];
    
    console.log('🎯 TESTANDO SELETORES DA AMAZON:');
    console.log('================================');
    
    let foundPrices = [];
    
    for (const selector of amazonSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        elements.each((i, el) => {
          const text = $(el).text().trim();
          if (text && (text.includes('R$') || text.includes(',') || /\d/.test(text))) {
            foundPrices.push({
              selector: selector,
              text: text,
              html: $(el).html()
            });
            console.log(`✅ ${selector}: "${text}"`);
          }
        });
      }
    }
    
    if (foundPrices.length === 0) {
      console.log('❌ Nenhum preço encontrado com os seletores padrão.');
      console.log('');
      console.log('🔍 BUSCANDO ELEMENTOS QUE CONTENHAM PREÇOS...');
      
      // Buscar por elementos que contenham R$ ou padrões de preço
      const priceElements = $('*').filter((i, el) => {
        const text = $(el).text();
        return text.includes('R$') && /R\$\s*[\d.,]+/.test(text);
      });
      
      console.log(`📊 Encontrados ${priceElements.length} elementos com R$`);
      
      priceElements.each((i, el) => {
        if (i < 10) { // Limitar a 10 resultados
          const text = $(el).text().trim();
          const tagName = el.tagName;
          const className = $(el).attr('class') || '';
          const id = $(el).attr('id') || '';
          
          let selector = tagName;
          if (id) selector += `#${id}`;
          if (className) selector += `.${className.split(' ').join('.')}`;
          
          console.log(`🔍 ${selector}: "${text.substring(0, 100)}"`);
        }
      });
    }
    
    console.log('');
    console.log('📋 RESUMO:');
    console.log(`✅ Total de preços encontrados: ${foundPrices.length}`);
    
    if (foundPrices.length > 0) {
      console.log('');
      console.log('🎯 MELHORES SELETORES IDENTIFICADOS:');
      const uniqueSelectors = [...new Set(foundPrices.map(p => p.selector))];
      uniqueSelectors.forEach(selector => {
        const prices = foundPrices.filter(p => p.selector === selector);
        console.log(`   ${selector} (${prices.length} ocorrências)`);
      });
      
      console.log('');
      console.log('💡 RECOMENDAÇÃO:');
      console.log('Adicione estes seletores ao arquivo src/lib/scraper.ts na array commonPriceSelectors');
    }
    
  } catch (error) {
    console.log('❌ Erro durante a análise:', error.message);
  } finally {
    await browser.close();
  }
}

debugAmazonPrice().catch(console.error);