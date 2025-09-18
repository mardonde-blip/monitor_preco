import { NextRequest, NextResponse } from 'next/server';
import { createPriceScraper } from '@/lib/scraper';
import { EnhancedProductScraper } from '@/lib/enhanced-scraper';
import { telegramNotifier } from '@/lib/telegram';
import { Product, NotificationSettings } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    console.log('Raw request body:', body);
    
    if (!body || body.trim() === '') {
      console.error('Empty request body');
      return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
    }
    
    const { products, settings }: { products: Product[], settings: NotificationSettings } = JSON.parse(body);
    
    if (!products || !Array.isArray(products)) {
      return NextResponse.json({ error: 'Invalid products data' }, { status: 400 });
    }

    console.log('Received products:', products.length);
    console.log('Settings:', settings);

    // Initialize Telegram if configured
    if (settings && settings.enabled && settings.telegram && settings.telegram.botToken && settings.telegram.chatId) {
      telegramNotifier.init(settings.telegram);
    }

    // Create scraper instances
    const scraper = createPriceScraper();
    const enhancedScraper = new EnhancedProductScraper();
    interface MonitorResult {
      productId: string;
      success: boolean;
      oldPrice?: number;
      newPrice?: number;
      priceDropped?: boolean;
      detectedSelector?: string;
      error?: string;
    }
    
    const results: MonitorResult[] = [];

    for (const product of products) {
      try {
        let scrapingResult;
        
        // Tentar primeiro com o scraper aprimorado (com fallback para Exa)
        try {
          scrapingResult = await enhancedScraper.scrapeWithFallback(product.url);
          console.log(`✅ Scraping aprimorado bem-sucedido para ${product.name}`);
        } catch {
          console.log(`⚠️ Scraper aprimorado falhou, usando método tradicional para ${product.name}`);
          
          // Fallback para o scraper tradicional
          scrapingResult = product.selector === 'auto' 
            ? await scraper.scrapePriceAuto(product.url)
            : await scraper.scrapePrice(product.url, product.selector);
        }
        
        if (scrapingResult.success && scrapingResult.price !== undefined) {
          const newPrice = scrapingResult.price;
          const currentPrice = product.currentPrice || product.initialPrice;
          
          // Check if price dropped below target price
          const priceDropped = product.targetPrice ? newPrice <= product.targetPrice : newPrice < product.initialPrice;
          
          if (priceDropped && settings.enabled) {
            await telegramNotifier.sendPriceAlert(product, currentPrice, newPrice);
          }
          
          results.push({
            productId: product.id,
            success: true,
            oldPrice: currentPrice,
            newPrice,
            priceDropped,
            detectedSelector: scrapingResult.selector // Include detected selector for auto mode
          });
        } else {
          results.push({
            productId: product.id,
            success: false,
            error: scrapingResult.error
          });
        }
      } catch (error) {
        results.push({
          productId: product.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Monitor API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Price monitoring API is running' });
}