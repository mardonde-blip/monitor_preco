import { Pool } from 'pg';

interface DatabaseConfig {
  connectionString: string;
}

// Configuração do banco PostgreSQL (Neon)
const config: DatabaseConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://username:password@host:5432/database'
};

const pool = new Pool({
  connectionString: config.connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Função para executar queries
export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// Função para inicializar as tabelas
export async function initDatabase() {
  try {
    // Criar tabela de usuários
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        nome_completo TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        data_nascimento DATE NOT NULL,
        sexo TEXT NOT NULL,
        celular TEXT NOT NULL,
        telegram_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Criar tabela de produtos monitorados
    await query(`
      CREATE TABLE IF NOT EXISTS monitored_products (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        target_price DECIMAL(10,2) NOT NULL,
        current_price DECIMAL(10,2),
        store TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Criar tabela de configurações do Telegram
    await query(`
      CREATE TABLE IF NOT EXISTS user_telegram_config (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        bot_token TEXT,
        chat_id TEXT,
        notifications_enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Criar tabela de configurações globais
    await query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Criar tabela de histórico de preços
    await query(`
      CREATE TABLE IF NOT EXISTS price_history (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES monitored_products (id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Banco de dados PostgreSQL inicializado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

// Funções de usuário
export async function createUser(userData: {
  nome_completo: string;
  email: string;
  senha: string;
  data_nascimento: string;
  sexo: string;
  celular: string;
}) {
  const result = await query(
    `INSERT INTO users (nome_completo, email, senha, data_nascimento, sexo, celular) 
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [userData.nome_completo, userData.email, userData.senha, userData.data_nascimento, userData.sexo, userData.celular]
  );
  return result.rows[0];
}

export async function getUserByEmail(email: string) {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}

export async function getUserById(id: number) {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0];
}

// Funções de produtos
export async function createProduct(productData: {
  user_id: number;
  name: string;
  url: string;
  target_price: number;
  current_price?: number;
  store: string;
}) {
  const result = await query(
    `INSERT INTO monitored_products (user_id, name, url, target_price, current_price, store) 
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [productData.user_id, productData.name, productData.url, productData.target_price, productData.current_price, productData.store]
  );
  return result.rows[0];
}

export async function getProductsByUserId(userId: number) {
  const result = await query(
    'SELECT * FROM monitored_products WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

export async function updateProductPrice(productId: number, price: number) {
  const result = await query(
    'UPDATE monitored_products SET current_price = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
    [price, productId]
  );
  return result.rows[0];
}

export async function deleteProduct(productId: number, userId: number) {
  const result = await query(
    'DELETE FROM monitored_products WHERE id = $1 AND user_id = $2 RETURNING *',
    [productId, userId]
  );
  return result.rows[0];
}

// Funções de configurações
export async function getSetting(key: string) {
  const result = await query('SELECT value FROM settings WHERE key = $1', [key]);
  return result.rows[0]?.value;
}

export async function setSetting(key: string, value: string) {
  const result = await query(
    `INSERT INTO settings (key, value) VALUES ($1, $2) 
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP 
     RETURNING *`,
    [key, value]
  );
  return result.rows[0];
}

export default pool;