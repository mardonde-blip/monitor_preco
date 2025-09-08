import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Diagnóstico do banco iniciado');
    
    // Verificar variáveis de ambiente
    const databaseUrl = process.env.DATABASE_URL;
    const nodeEnv = process.env.NODE_ENV;
    
    console.log('DATABASE_URL presente:', !!databaseUrl);
    console.log('NODE_ENV:', nodeEnv);
    
    if (!databaseUrl) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL não configurada',
        env: nodeEnv,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    // Tentar conexão básica com PostgreSQL
    console.log('🐘 Testando conexão PostgreSQL...');
    
    try {
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: databaseUrl,
        ssl: nodeEnv === 'production' ? { rejectUnauthorized: false } : false
      });
      
      const client = await pool.connect();
      const result = await client.query('SELECT NOW() as current_time');
      client.release();
      await pool.end();
      
      return NextResponse.json({
        success: true,
        message: 'Conexão PostgreSQL bem-sucedida',
        database_time: result.rows[0].current_time,
        env: nodeEnv,
        timestamp: new Date().toISOString()
      });
      
    } catch (dbError: any) {
      console.error('❌ Erro na conexão PostgreSQL:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Erro na conexão PostgreSQL',
        details: dbError.message,
        env: nodeEnv,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('❌ Erro geral no diagnóstico:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno no diagnóstico',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}