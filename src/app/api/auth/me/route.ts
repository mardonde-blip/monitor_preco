import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-adapter';
import { cookies } from 'next/headers';
import { Pool } from 'pg';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const diagnostic = searchParams.get('diagnostic');
    
    // Modo diagnóstico - executar antes de qualquer verificação de auth
    if (diagnostic === 'true') {
      return await runDiagnostic();
    }
    
    // Verificar se existe cookie de sessão
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Buscar usuário no banco
    const db = await getDatabase();
    const user = await db.getUserById(parseInt(userId));
    
    if (!user) {
      // Cookie inválido, remover
      cookieStore.set('user_id', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0
      });
      
      return NextResponse.json(
        { error: 'Sessão inválida' },
        { status: 401 }
      );
    }

    // Interface específica para o usuário
    interface User {
      id: number;
      email: string;
      nome_completo: string;
      senha: string;
    }
    
    // Verificação de tipo mais segura
    const typedUser = user as User;
    if (!typedUser || typeof typedUser !== 'object' || !typedUser.id) {
      return NextResponse.json(
        { error: 'Dados do usuário inválidos' },
        { status: 500 }
      );
    }
    
    // Retornar dados do usuário (sem senha)
    const { senha, ...userWithoutPassword } = typedUser;
    // senha é removida intencionalmente para segurança
    
    return NextResponse.json({
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

async function runDiagnostic() {
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
      vercelUrl: process.env.VERCEL_URL
    };

    // Se não tiver DATABASE_URL, retorna informação sem erro
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL não configurada',
        message: 'Ambiente local sem DATABASE_URL - isso é normal em desenvolvimento',
        envInfo
      }, { status: 200 });
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
        message: 'Conexão PostgreSQL funcionando!',
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
    console.error('Erro no diagnóstico:', error);
    
    const dbError = error as Error & { code?: string };
    
    return NextResponse.json({
      success: false,
      error: 'Erro na conexão com PostgreSQL',
      errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
      errorCode: dbError.code,
      envInfo: {
        timestamp,
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlLength: process.env.DATABASE_URL?.length || 0
      }
    }, { status: 500 });
  }
}