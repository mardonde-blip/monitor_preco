import { NextResponse } from 'next/server';
import { DatabaseAdapter } from '@/lib/database-adapter';

// Rota para inicializar o banco de dados PostgreSQL
export async function GET() {
  try {
    // Verificar se estamos em produção (Vercel)
    if (process.env.NODE_ENV !== 'production' && !process.env.DATABASE_URL) {
      return NextResponse.json({
        message: 'Inicialização do banco só é necessária em produção (PostgreSQL)',
        environment: 'development',
        database: 'SQLite (local)'
      });
    }

    // Inicializar banco PostgreSQL
    await DatabaseAdapter.initDatabase();

    return NextResponse.json({
      message: 'Banco de dados PostgreSQL inicializado com sucesso!',
      environment: 'production',
      database: 'PostgreSQL (Neon)'
    });

  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
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