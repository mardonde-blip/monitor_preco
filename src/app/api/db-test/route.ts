import { NextResponse } from 'next/server';

export async function GET() {
  const hasDbUrl = !!process.env.DATABASE_URL;
  
  try {
    if (!hasDbUrl) {
      return NextResponse.json({
        success: false,
        message: 'DATABASE_URL não configurada',
        database: 'Nenhum',
        environment: process.env.NODE_ENV,
        hasDbUrl: false,
        instructions: [
          '1. Configure DATABASE_URL no .env.local para desenvolvimento local',
          '2. Ou configure no Vercel para produção',
          '3. Use PostgreSQL (recomendado: Neon Database gratuito)'
        ]
      }, { status: 400 });
    }

    // Testar PostgreSQL
    const dbModule = await import('../../../lib/database-postgres');
    
    // Testar conexão básica
    await dbModule.query('SELECT 1 as test');
    
    // Testar inicialização
    await dbModule.initDatabase();
    
    return NextResponse.json({
      success: true,
      message: 'Conexão PostgreSQL funcionando',
      database: 'PostgreSQL',
      environment: process.env.NODE_ENV,
      hasDbUrl: true,
      dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...'
    });
    
  } catch (error) {
    console.error('Erro no teste de DB:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      database: 'PostgreSQL',
      environment: process.env.NODE_ENV,
      hasDbUrl,
      dbUrlPrefix: hasDbUrl ? process.env.DATABASE_URL?.substring(0, 20) + '...' : 'N/A'
    }, { status: 500 });
  }
}