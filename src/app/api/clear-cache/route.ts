import { NextRequest, NextResponse } from 'next/server';
import { createPriceScraper } from '@/lib/scraper';

export async function POST(request: NextRequest) {
  try {
    const scraper = createPriceScraper();
    scraper.clearAllCache();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cache limpo com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'API de limpeza de cache disponível' });
}