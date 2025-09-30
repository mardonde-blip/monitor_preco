require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function testeUsuarios() {
  console.log('🔍 TESTE DE USUÁRIOS NO BANCO');
  console.log('=============================');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Listar todos os usuários
    const result = await pool.query('SELECT id, nome_completo, email FROM users ORDER BY id');
    
    console.log('👥 Usuários encontrados:');
    result.rows.forEach(user => {
      console.log(`- ID: ${user.id}, Nome: ${user.nome_completo}, Email: ${user.email}`);
    });
    
    if (result.rows.length === 0) {
      console.log('❌ Nenhum usuário encontrado no banco de dados');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

testeUsuarios();