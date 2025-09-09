import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
  const timestamp = new Date().toISOString();
  
  try {
    // Informações básicas do ambiente
    const envInfo = {
      timestamp,
      nodeEnv: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlLength: process.env.DATABASE_URL?.length || 0,
      databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...',
      vercelEnv: process.env.VERCEL_ENV,
      vercelUrl: process.env.VERCEL_URL,
      hasTelegramToken: !!process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN,
      hasChatId: !!process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID
    };

    // Se não tiver DATABASE_URL, retorna informação sem erro
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL não configurada',
        message: 'DATABASE_URL é necessária para conexão com PostgreSQL',
        envInfo
      });
    }

    // Teste de conexão PostgreSQL
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 1
    });

    const client = await pool.connect();
    
    try {
      // Teste básico de query
      const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
      
      await pool.end();
      
      return NextResponse.json({
        success: true,
        message: 'Sistema funcionando corretamente!',
        envInfo,
        dbInfo: {
          currentTime: result.rows[0].current_time,
          pgVersion: result.rows[0].pg_version
        }
      });
      
    } catch (queryError) {
      await pool.end();
      throw queryError;
    }
    
  } catch (error) {
    console.error('Erro no diagnóstico do sistema:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro na conexão com PostgreSQL',
      errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
      errorCode: (error as { code?: string })?.code,
      envInfo: {
        timestamp,
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlLength: process.env.DATABASE_URL?.length || 0
      }
    }, { status: 500 });
  }
}