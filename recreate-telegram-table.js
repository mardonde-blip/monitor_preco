// Script para recriar a tabela user_telegram_config com as colunas corretas
const { Pool } = require('pg');

// Usar a mesma configuração do banco
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/monitor_precos'
});

async function recreateTable() {
  const client = await pool.connect();
  
  try {
    console.log('🗑️ Removendo tabela existente...');
    
    // Remover tabela existente
    await client.query('DROP TABLE IF EXISTS user_telegram_config CASCADE');
    console.log('✅ Tabela removida');
    
    // Recriar tabela com estrutura correta
    await client.query(`
      CREATE TABLE user_telegram_config (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE,
        bot_token TEXT,
        chat_id TEXT,
        notifications_enabled BOOLEAN DEFAULT true,
        message_template TEXT,
        notification_settings JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Tabela recriada com sucesso!');
    console.log('📋 Colunas disponíveis:');
    console.log('   - id (SERIAL PRIMARY KEY)');
    console.log('   - user_id (INTEGER NOT NULL UNIQUE)');
    console.log('   - bot_token (TEXT)');
    console.log('   - chat_id (TEXT)');
    console.log('   - notifications_enabled (BOOLEAN)');
    console.log('   - message_template (TEXT)');
    console.log('   - notification_settings (JSONB)');
    console.log('   - created_at (TIMESTAMP)');
    console.log('   - updated_at (TIMESTAMP)');
    
  } catch (error) {
    console.error('❌ Erro ao recriar tabela:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

recreateTable();