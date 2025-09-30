import { NextResponse } from 'next/server';
// import { query } from '@/lib/database-postgres';

export async function GET() {
  try {
    console.log('🔍 Verificando estrutura da tabela user_telegram_config...');
    
    // Funcionalidade de verificação de tabela temporariamente indisponível
    return NextResponse.json({
      success: false,
      message: 'Sistema de verificação de tabela temporariamente indisponível',
      error: 'Esta funcionalidade está em manutenção. Tente novamente mais tarde.',
      columns: [],
      timestamp: new Date().toISOString()
    }, { status: 503 });
    
    /*
    const result = await query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'user_telegram_config' 
      ORDER BY ordinal_position
    `);
    
    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Tabela user_telegram_config não existe!',
        columns: []
      });
    }
    
    const columns = result.rows.map(row => ({
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === 'YES',
      default: row.column_default
    }));
    
    return NextResponse.json({
      success: true,
      message: 'Estrutura da tabela obtida com sucesso',
      columns,
      timestamp: new Date().toISOString()
    });
    */
    
  } catch (error) {
    console.error('❌ Erro ao verificar tabela:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}