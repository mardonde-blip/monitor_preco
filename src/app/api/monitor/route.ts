import { NextRequest, NextResponse } from 'next/server';
import { createPriceScraper } from '@/lib/scraper';
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

    // Create a new scraper instance
    const scraper = createPriceScraper();
    const results: Array<{
      productId: string;
      success: boolean;
      oldPrice?: number;
      newPrice?: number;
      priceDropped?: boolean;
      detectedSelector?: string;
      error?: string;
    }> = [];

    for (const product of products) {
      try {
        // Use automatic detection if selector is 'auto', otherwise use specific selector
        const scrapingResult = product.selector === 'auto' 
          ? await scraper.scrapePriceAuto(product.url)
          : await scraper.scrapePrice(product.url, product.selector);
        
        if (scrapingResult.success && scrapingResult.price !== undefined) {
          const newPrice = scrapingResult.price;
          const currentPrice = product.currentPrice || product.initialPrice;
          
          // Check if price dropped below initial price
          const priceDropped = newPrice < product.initialPrice;
          
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