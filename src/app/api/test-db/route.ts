import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database-postgres';

export async function GET() {
  try {
    console.log('🔍 Testando conexão do Next.js com o banco...');
    console.log('📋 DATABASE_URL configurada:', !!process.env.DATABASE_URL);
    
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        error: 'DATABASE_URL não configurada',
        env: process.env.NODE_ENV
      }, { status: 500 });
    }
    
    // Testar query simples
    const result = await query('SELECT NOW() as current_time, COUNT(*) as total_products FROM monitored_products');
    
    return NextResponse.json({
      success: true,
      message: 'Conexão com banco funcionando',
      data: {
        current_time: result.rows[0].current_time,
        total_products: result.rows[0].total_products,
        env: process.env.NODE_ENV
      }
    });
    
  } catch (error) {
    console.error('❌ Erro no teste de conexão:', error);
    
    return NextResponse.json({
      error: 'Erro na conexão com banco',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      code: error instanceof Error && 'code' in error ? (error as Error & { code?: string }).code : 'UNKNOWN',
      env: process.env.NODE_ENV
    }, { status: 500 });
  }
}