import { NextResponse } from 'next/server';
import { query } from '@/lib/database-postgres';

export async function POST() {
  try {
    console.log('🔧 Adicionando colunas faltantes na tabela user_telegram_config...');
    
    // Adicionar coluna message_template
    try {
      await query(`
        ALTER TABLE user_telegram_config 
        ADD COLUMN IF NOT EXISTS message_template TEXT
      `);
      console.log('✅ Coluna message_template adicionada');
    } catch (error) {
      console.log('ℹ️ Coluna message_template já existe ou erro:', error);
    }
    
    // Adicionar coluna notification_settings
    try {
      await query(`
        ALTER TABLE user_telegram_config 
        ADD COLUMN IF NOT EXISTS notification_settings JSONB
      `);
      console.log('✅ Coluna notification_settings adicionada');
    } catch (error) {
      console.log('ℹ️ Coluna notification_settings já existe ou erro:', error);
    }
    
    // Verificar estrutura final
    const result = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_telegram_config' 
      ORDER BY ordinal_position
    `);
    
    const columns = result.rows.map(row => ({
      name: row.column_name,
      type: row.data_type
    }));
    
    return NextResponse.json({
      success: true,
      message: 'Colunas adicionadas com sucesso!',
      columns,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao adicionar colunas:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}