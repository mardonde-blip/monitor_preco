require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function testeConexao() {
  console.log('🔍 TESTE DE CONEXÃO COM O BANCO DE DADOS');
  console.log('==========================================');
  
  console.log('📋 DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'NÃO CONFIGURADA');
  
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL não está configurada no .env.local');
    return;
  }
  
  // Mascarar a senha na URL para exibição
  const urlMascarada = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':***@');
  console.log('🔗 URL (mascarada):', urlMascarada);
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔌 Tentando conectar...');
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    console.log('📊 Testando query simples...');
    const result = await client.query('SELECT NOW() as current_time');
    console.log('⏰ Hora do servidor:', result.rows[0].current_time);
    
    console.log('📦 Verificando tabela monitored_products...');
    const productsResult = await client.query('SELECT COUNT(*) as total FROM monitored_products');
    console.log('📈 Total de produtos:', productsResult.rows[0].total);
    
    client.release();
    console.log('✅ Teste de conexão concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    console.error('🔍 Código do erro:', error.code);
    console.error('📋 Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

testeConexao();