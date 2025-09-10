import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Testar se conseguimos importar o módulo PostgreSQL
    const dbModule = await import('../../../lib/database-postgres');
    
    // Testar conexão básica
    await dbModule.query('SELECT 1 as test');
    
    // Testar inicialização
    await dbModule.initDatabase();
    
    return NextResponse.json({
      success: true,
      message: 'Conexão PostgreSQL funcionando',
      environment: process.env.NODE_ENV,
      hasDbUrl: !!process.env.DATABASE_URL,
      dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...'
    });
  } catch (error) {
    console.error('Erro no teste de DB:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      environment: process.env.NODE_ENV,
      hasDbUrl: !!process.env.DATABASE_URL,
      dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...'
    }, { status: 500 });
  }
}