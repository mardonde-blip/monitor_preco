import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Iniciando diagnóstico do banco...');
    
    // Verificar variáveis de ambiente
    const databaseUrl = process.env.DATABASE_URL;
    console.log('DATABASE_URL presente:', !!databaseUrl);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    if (!databaseUrl) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL não configurada',
        env: process.env.NODE_ENV
      }, { status: 500 });
    }
    
    // Tentar importar e testar conexão PostgreSQL
    console.log('🐘 Tentando conectar ao PostgreSQL...');
    
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    // Teste simples de conexão
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    client.release();
    
    console.log('✅ Conexão PostgreSQL bem-sucedida!');
    
    return NextResponse.json({
      success: true,
      message: 'Conexão com PostgreSQL estabelecida com sucesso',
      currentTime: result.rows[0].current_time,
      env: process.env.NODE_ENV,
      hasDatabase: !!databaseUrl
    });
    
  } catch (error: any) {
    console.error('❌ Erro no diagnóstico:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      env: process.env.NODE_ENV,
      hasDatabase: !!process.env.DATABASE_URL
    }, { status: 500 });
  }
}