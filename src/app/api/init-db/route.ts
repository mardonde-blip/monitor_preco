import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-adapter';

// Rota para inicializar o banco de dados PostgreSQL
export async function GET() {
  try {
    console.log('🚀 Iniciando processo de inicialização do banco...');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('DATABASE_URL presente:', !!process.env.DATABASE_URL);
    
    // Verificar se estamos em produção (Vercel)
    if (process.env.NODE_ENV !== 'production' && !process.env.DATABASE_URL) {
      return NextResponse.json({
        message: 'Inicialização do banco só é necessária em produção (PostgreSQL)',
        environment: 'development',
        database: 'SQLite (local)'
      });
    }

    // Obter instância do banco com logs detalhados
    console.log('📦 Obtendo instância do banco...');
    const db = await getDatabase();
    
    console.log('🔧 Executando inicialização do banco...');
    await db.initDatabase();
    
    console.log('✅ Banco inicializado com sucesso!');
    return NextResponse.json({
      message: 'Banco de dados PostgreSQL inicializado com sucesso!',
      environment: process.env.NODE_ENV,
      database: 'PostgreSQL (Neon)',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    console.error('Stack trace completo:', error instanceof Error ? error.stack : 'N/A');
    return NextResponse.json(
      { 
        error: 'Erro ao inicializar banco de dados',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// Também permitir POST para flexibilidade
export async function POST() {
  return GET();
}