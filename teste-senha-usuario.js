require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function testeSenhaUsuario() {
  console.log('🔍 TESTE DE SENHA DO USUÁRIO');
  console.log('============================');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Buscar usuário teste@teste.com
    const result = await pool.query('SELECT * FROM users WHERE email = $1', ['teste@teste.com']);
    
    if (result.rows.length === 0) {
      console.log('❌ Usuário teste@teste.com não encontrado');
      return;
    }
    
    const user = result.rows[0];
    console.log('👤 Usuário encontrado:', user.nome_completo);
    console.log('🔑 Hash da senha no banco:', user.senha);
    
    // Testar senhas comuns
    const senhasParaTestar = ['123456', 'teste123', 'password', 'teste'];
    
    for (const senha of senhasParaTestar) {
      const isValid = bcrypt.compareSync(senha, user.senha);
      console.log(`🔐 Senha "${senha}": ${isValid ? '✅ VÁLIDA' : '❌ Inválida'}`);
      
      if (isValid) {
        console.log(`🎯 Senha correta encontrada: "${senha}"`);
        break;
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

testeSenhaUsuario();