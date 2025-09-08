import { NextResponse } from 'next/server';

// Endpoint para testar variáveis de ambiente no Vercel
export async function GET() {
  try {
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'CONFIGURADA' : 'NÃO CONFIGURADA',
      DATABASE_URL_LENGTH: process.env.DATABASE_URL?.length || 0,
      VERCEL: process.env.VERCEL,
      PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD,
      NEXT_PUBLIC_TELEGRAM_BOT_TOKEN: process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN ? 'CONFIGURADA' : 'NÃO CONFIGURADA',
      // Mostrar apenas os primeiros e últimos caracteres da DATABASE_URL para segurança
      DATABASE_URL_PREVIEW: process.env.DATABASE_URL ? 
        `${process.env.DATABASE_URL.substring(0, 20)}...${process.env.DATABASE_URL.substring(process.env.DATABASE_URL.length - 10)}` : 
        'NÃO CONFIGURADA'
    };

    return NextResponse.json({
      message: 'Teste de variáveis de ambiente',
      environment: envVars,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao verificar variáveis de ambiente:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao verificar variáveis de ambiente',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}