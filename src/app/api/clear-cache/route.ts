import { NextResponse } from 'next/server';
// import { createPriceScraper } from '@/lib/scraper';

export async function POST() {
  try {
    // Funcionalidade de limpeza de cache temporariamente indisponível
    return NextResponse.json({ 
      success: false, 
      error: 'Sistema de limpeza de cache temporariamente indisponível',
      message: 'Esta funcionalidade está em manutenção. Tente novamente mais tarde.'
    }, { status: 503 });
    
    /*
    const scraper = createPriceScraper();
    scraper.clearAllCache();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cache limpo com sucesso' 
    });
    */
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'API de limpeza de cache temporariamente indisponível',
    status: 'Em manutenção'
  });
}