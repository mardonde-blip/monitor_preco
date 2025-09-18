// Script para adicionar colunas faltantes na tabela user_telegram_config
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addMissingColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adicionando colunas faltantes na tabela user_telegram_config...');
    
    // Adicionar coluna message_template
    try {
      await client.query(`
        ALTER TABLE user_telegram_config 
        ADD COLUMN IF NOT EXISTS message_template TEXT
      `);
      console.log('✅ Coluna message_template adicionada');
    } catch (error) {
      console.log('ℹ️ Coluna message_template já existe ou erro:', error.message);
    }
    
    // Adicionar coluna notification_settings
    try {
      await client.query(`
        ALTER TABLE user_telegram_config 
        ADD COLUMN IF NOT EXISTS notification_settings JSONB
      `);
      console.log('✅ Coluna notification_settings adicionada');
    } catch (error) {
      console.log('ℹ️ Coluna notification_settings já existe ou erro:', error.message);
    }
    
    // Verificar estrutura final
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_telegram_config' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Estrutura final da tabela:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name} (${row.data_type})`);
    });
    
    console.log('\n✅ Colunas adicionadas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao adicionar colunas:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

addMissingColumns();