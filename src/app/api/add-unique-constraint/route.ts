import { NextResponse } from 'next/server';
import { query } from '@/lib/database-postgres';

export async function POST() {
  try {
    console.log('🔧 Adicionando constraint única na tabela user_telegram_config...');
    
    // Primeiro, verificar se já existe uma constraint única
    const existingConstraints = await query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'user_telegram_config' 
      AND constraint_type = 'UNIQUE'
    `);
    
    console.log('Constraints existentes:', existingConstraints.rows);
    
    // Adicionar constraint única no user_id se não existir
    try {
      await query(`
        ALTER TABLE user_telegram_config 
        ADD CONSTRAINT user_telegram_config_user_id_unique 
        UNIQUE (user_id)
      `);
      console.log('✅ Constraint única adicionada no user_id');
    } catch (error: unknown) {
      const pgError = error as { code?: string; message?: string };
      if (pgError.code === '42P07') {
        console.log('ℹ️ Constraint única já existe');
      } else {
        console.log('❌ Erro ao adicionar constraint:', pgError.message || 'Erro desconhecido');
        throw error;
      }
    }
    
    // Verificar constraints finais
    const finalConstraints = await query(`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'user_telegram_config'
    `);
    
    return NextResponse.json({
      success: true,
      message: 'Constraint única configurada com sucesso!',
      constraints: finalConstraints.rows,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao configurar constraint:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}