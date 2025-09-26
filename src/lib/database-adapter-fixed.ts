import { Pool } from 'pg';

// Interfaces
export interface User {
  id: number;
  nome_completo: string;
  email: string;
  senha: string;
  created_at: Date;
  updated_at: Date;
}

export interface Product {
  id: number;
  user_id: number;
  name: string;
  url: string;
  target_price: number;
  current_price?: number | null;
  store: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DatabaseInterface {
  initDatabase: () => Promise<void>;
  createUser: (userData: { nome_completo: string; email: string; senha: string }) => Promise<User>;
  getUserByEmail: (email: string) => Promise<User | null>;
  getUserById: (id: number) => Promise<User | null>;
  createProduct: (productData: {
    user_id: number;
    name: string;
    url: string;
    target_price: number;
    current_price?: number;
    store: string;
  }) => Promise<Product>;
  getProductsByUserId: (userId: number) => Promise<Product[]>;
  updateProductPrice: (productId: number, newPrice: number) => Promise<Product>;
  updateProduct: (id: number, userId: number, data: Partial<Product>) => Promise<Product>;
  deleteProduct: (productId: number, userId: number) => Promise<Product>;
  getProductById: (id: number) => Promise<Product | null>;
  getAllProducts: () => Promise<Product[]>;
  getSetting: (key: string) => Promise<string | null>;
  setSetting: (key: string, value: string) => Promise<void>;
  getSystemStats: () => Promise<unknown>;
  getUsersWithProductCounts: () => Promise<unknown[]>;
  getTelegramConfig: (userId: number) => Promise<unknown>;
  upsertTelegramConfig: (configData: unknown) => Promise<unknown>;
  deleteTelegramConfig: (userId: number) => Promise<boolean>;
  getAllUsers: () => Promise<unknown[]>;
  deleteUser: (id: number) => Promise<boolean>;
}

// Pool de conexão
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }
  return pool;
}

async function query(text: string, params?: any[]) {
  const client = getPool();
  return client.query(text, params);
}

// Implementação das funções do banco
async function initDatabase(): Promise<void> {
  // Implementação vazia - tabelas já existem
}

async function createUser(userData: { nome_completo: string; email: string; senha: string }): Promise<User> {
  const result = await query(
    'INSERT INTO users (nome_completo, email, senha) VALUES ($1, $2, $3) RETURNING *',
    [userData.nome_completo, userData.email, userData.senha]
  );
  return result.rows[0];
}

async function getUserByEmail(email: string): Promise<User | null> {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

async function getUserById(id: number): Promise<User | null> {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function createProduct(productData: {
  user_id: number;
  name: string;
  url: string;
  target_price: number;
  current_price?: number;
  store: string;
}): Promise<Product> {
  const result = await query(
    'INSERT INTO monitored_products (user_id, name, url, target_price, current_price, store) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [productData.user_id, productData.name, productData.url, productData.target_price, productData.current_price || null, productData.store]
  );
  return result.rows[0];
}

async function getProductsByUserId(userId: number): Promise<Product[]> {
  const result = await query(
    'SELECT * FROM monitored_products WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

async function getProductById(id: number): Promise<Product | null> {
  const result = await query('SELECT * FROM monitored_products WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function updateProductPrice(productId: number, newPrice: number): Promise<Product> {
  const result = await query(
    'UPDATE monitored_products SET current_price = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
    [newPrice, productId]
  );
  return result.rows[0];
}

async function updateProduct(productId: number, userId: number, updateData: Partial<Product>): Promise<Product> {
  const setParts: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updateData.name !== undefined) {
    setParts.push(`name = $${paramIndex++}`);
    values.push(updateData.name);
  }
  if (updateData.url !== undefined) {
    setParts.push(`url = $${paramIndex++}`);
    values.push(updateData.url);
  }
  if (updateData.target_price !== undefined) {
    setParts.push(`target_price = $${paramIndex++}`);
    values.push(updateData.target_price);
  }
  if (updateData.current_price !== undefined) {
    setParts.push(`current_price = $${paramIndex++}`);
    values.push(updateData.current_price);
  }
  if (updateData.store !== undefined) {
    setParts.push(`store = $${paramIndex++}`);
    values.push(updateData.store);
  }
  if (updateData.is_active !== undefined) {
    setParts.push(`is_active = $${paramIndex++}`);
    values.push(updateData.is_active);
  }

  if (setParts.length === 0) {
    return await getProductById(productId) as Product;
  }

  setParts.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(productId, userId);

  const queryText = `UPDATE monitored_products SET ${setParts.join(', ')} WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} RETURNING *`;
  const result = await query(queryText, values);
  return result.rows[0];
}

async function deleteProduct(productId: number, userId: number): Promise<Product> {
  const result = await query(
    'DELETE FROM monitored_products WHERE id = $1 AND user_id = $2 RETURNING *',
    [productId, userId]
  );
  return result.rows[0];
}

async function getAllProducts(): Promise<Product[]> {
  const result = await query(
    'SELECT * FROM monitored_products WHERE is_active = true ORDER BY created_at DESC'
  );
  return result.rows;
}

async function getSetting(key: string): Promise<string | null> {
  const result = await query('SELECT value FROM settings WHERE key = $1', [key]);
  return result.rows[0]?.value || null;
}

async function setSetting(key: string, value: string): Promise<void> {
  await query(
    'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP',
    [key, value]
  );
}

async function getSystemStats(): Promise<unknown> {
  return {};
}

async function getUsersWithProductCounts(): Promise<unknown[]> {
  return [];
}

async function getTelegramConfig(userId: number): Promise<unknown> {
  return null;
}

async function upsertTelegramConfig(configData: unknown): Promise<unknown> {
  return configData;
}

async function deleteTelegramConfig(userId: number): Promise<boolean> {
  return true;
}

async function getAllUsers(): Promise<unknown[]> {
  const result = await query('SELECT id, nome_completo, email, created_at FROM users ORDER BY created_at DESC');
  return result.rows;
}

async function deleteUser(id: number): Promise<boolean> {
  const result = await query('DELETE FROM users WHERE id = $1', [id]);
  return result.rowCount > 0;
}

// Criar o adapter
export function createPostgreSQLAdapter(): DatabaseInterface {
  return {
    initDatabase,
    createUser,
    getUserByEmail,
    getUserById,
    createProduct,
    getProductsByUserId,
    updateProductPrice,
    updateProduct,
    deleteProduct,
    getProductById,
    getAllProducts,
    getSetting,
    setSetting,
    getSystemStats,
    getUsersWithProductCounts,
    getTelegramConfig,
    upsertTelegramConfig,
    deleteTelegramConfig,
    getAllUsers,
    deleteUser
  };
}

// Instância singleton
let DatabaseAdapter: DatabaseInterface | null = null;

export function getDatabaseAdapter(): DatabaseInterface {
  if (!DatabaseAdapter) {
    DatabaseAdapter = createPostgreSQLAdapter();
  }
  return DatabaseAdapter;
}