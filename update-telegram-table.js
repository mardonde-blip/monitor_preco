// Script para atualizar a tabela user_telegram_config
const { Pool } = require('pg');

// Configuração do banco local (SQLite não suporta ALTER TABLE ADD COLUMN IF NOT EXISTS)
// Este script é para PostgreSQL em produção
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/monitor_precos'
});

async function updateTelegramTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Atualizando tabela user_telegram_config...');
    
    // Adicionar colunas se não existirem
    await client.query(`
      ALTER TABLE user_telegram_config 
      ADD COLUMN IF NOT EXISTS message_template TEXT,
      ADD COLUMN IF NOT EXISTS notification_settings JSONB;
    `);
    
    // Adicionar constraint UNIQUE se não existir
    await client.query(`
      ALTER TABLE user_telegram_config 
      ADD CONSTRAINT user_telegram_config_user_id_unique 
      UNIQUE (user_id);
    `).catch(() => {
      console.log('⚠️ Constraint já existe ou erro esperado');
    });
    
    console.log('✅ Tabela atualizada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao atualizar tabela:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

updateTelegramTable();