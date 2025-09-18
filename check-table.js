const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando estrutura da tabela user_telegram_config...');
    
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'user_telegram_config' 
      ORDER BY ordinal_position
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Tabela user_telegram_config não existe!');
    } else {
      console.log('✅ Colunas da tabela user_telegram_config:');
      result.rows.forEach(row => {
        console.log(`   - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar tabela:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTable();