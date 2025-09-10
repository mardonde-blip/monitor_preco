// Adaptador de banco de dados que funciona tanto local (SQLite) quanto produção (PostgreSQL)

// Tipos compartilhados
export interface User {
  id: number;
  nome_completo: string;
  email: string;
  senha: string;
  data_nascimento: string;
  sexo: string;
  celular: string;
  telegram_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  user_id: number;
  name: string;
  url: string;
  target_price: number;
  current_price?: number;
  store: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Detectar ambiente
const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

// Interface do banco de dados
interface DatabaseInterface {
  initDatabase: () => Promise<void>;
  createUser: (userData: unknown) => Promise<unknown>;
  getUserByEmail: (email: string) => Promise<unknown>;
  createProduct: (productData: unknown) => Promise<unknown>;
  getProductsByUserId: (userId: number) => Promise<unknown[]>;
  updateProductPrice: (id: number, price: number) => Promise<unknown>;
  updateProduct: (id: number, data: unknown) => Promise<unknown>;
  deleteProduct: (id: number) => Promise<unknown>;
  getTelegramConfig: (userId: number) => Promise<unknown>;
  saveTelegramConfig: (config: unknown) => Promise<unknown>;
  getSetting: (key: string) => Promise<unknown>;
  setSetting: (key: string, value: string) => Promise<unknown>;
}

// Inicializar o banco apropriado
let db: DatabaseInterface | null = null;
let dbPromise: Promise<DatabaseInterface>;
let usingFallback = false;

// Função para criar adapter SQLite
async function createSQLiteAdapter(): Promise<DatabaseInterface> {
  console.log('🗃️ Carregando SQLite...');
  const dbModule = await import('./database');
  return {
    initDatabase: () => Promise.resolve(), // SQLite não precisa de inicialização
    createUser: (userData: unknown) => dbModule.userDb.create(userData),
    getUserByEmail: (email: string) => dbModule.userDb.getByEmail(email),
    createProduct: (productData: unknown) => dbModule.productDb.create(productData),
    getProductsByUserId: (userId: number) => dbModule.productDb.getByUserId(userId),
    updateProductPrice: (id: number, price: number) => dbModule.productDb.updatePrice(id, price),
    updateProduct: (id: number, data: unknown) => dbModule.productDb.update(id, data),
    deleteProduct: (id: number) => dbModule.productDb.delete(id),
    getTelegramConfig: (userId: number) => dbModule.telegramConfigDb.getByUserId(userId),
    saveTelegramConfig: (config: unknown) => dbModule.telegramConfigDb.save(config),
    getSetting: (key: string) => dbModule.adminDb.getSetting(key),
    setSetting: (key: string, value: string) => dbModule.adminDb.setSetting(key, value)
  };
}

// Função para criar adapter PostgreSQL
async function createPostgreSQLAdapter(): Promise<DatabaseInterface> {
  console.log('🐘 Carregando PostgreSQL...');
  const pgModule = await import('./database-postgres');
  console.log('✅ Módulo PostgreSQL carregado:', Object.keys(pgModule));
  
  const adapter = {
    initDatabase: pgModule.initDatabase,
    createUser: pgModule.createUser,
    getUserByEmail: pgModule.getUserByEmail,
    createProduct: pgModule.createProduct,
    getProductsByUserId: pgModule.getProductsByUserId,
    updateProductPrice: pgModule.updateProductPrice,
    updateProduct: pgModule.updateProduct,
    deleteProduct: pgModule.deleteProduct,
    getTelegramConfig: pgModule.getTelegramConfig,
    saveTelegramConfig: pgModule.saveTelegramConfig,
    getSetting: pgModule.getSetting,
    setSetting: pgModule.setSetting
  };
  
  console.log('✅ Adapter PostgreSQL criado:', Object.keys(adapter));
  return adapter;
}

if (process.env.NODE_ENV === 'production') {
  // Tentar PostgreSQL primeiro, com fallback para SQLite
  console.log('🚀 Ambiente de produção detectado');
  console.log('DATABASE_URL presente:', !!process.env.DATABASE_URL);
  console.log('DATABASE_URL prefix:', process.env.DATABASE_URL?.substring(0, 20));
  
  dbPromise = createPostgreSQLAdapter().catch(postgresError => {
    console.error('❌ Falha no PostgreSQL:', postgresError);
    console.log('🔄 Tentando fallback para SQLite...');
    usingFallback = true;
    return createSQLiteAdapter().then(adapter => {
      console.log('✅ Fallback SQLite ativado com sucesso!');
      return adapter;
    });
  });
} else {
  // Usar SQLite localmente
  console.log('🏠 Ambiente local - usando SQLite');
  dbPromise = createSQLiteAdapter();
}

// Aguardar inicialização do banco
dbPromise.then(dbModule => {
  console.log('✅ Database adapter inicializado com sucesso');
  console.log('Métodos disponíveis:', Object.keys(dbModule));
  db = dbModule;
}).catch(error => {
  console.error('❌ Erro ao carregar módulo do banco:', error);
  console.error('Stack trace:', error.stack);
});

// Função para obter instância do banco
export async function getDatabase(): Promise<DatabaseInterface> {
  try {
    console.log('🔍 Obtendo instância do banco de dados...');
    
    if (!db) {
      console.log('⏳ Aguardando inicialização do banco...');
      db = await dbPromise;
      console.log('✅ Banco inicializado:', !!db);
      console.log('📊 Usando fallback SQLite:', usingFallback);
    }
    
    if (!db) {
      throw new Error('Database instance is null after initialization');
    }
    
    // Verificar se os métodos essenciais existem
    if (!db.initDatabase) {
      throw new Error('Database not properly initialized - method initDatabase not available');
    }
    
    console.log('✅ Instância do banco obtida com sucesso');
    console.log('🎯 Tipo de banco:', usingFallback ? 'SQLite (Fallback)' : (process.env.NODE_ENV === 'production' ? 'PostgreSQL' : 'SQLite'));
    return db;
  } catch (error) {
    console.error('❌ Erro ao obter instância do banco:', error);
    throw error;
  }
}

// Função para verificar qual banco está sendo usado
export function getDatabaseInfo() {
  return {
    environment: process.env.NODE_ENV,
    usingFallback,
    databaseType: usingFallback ? 'SQLite (Fallback)' : (process.env.NODE_ENV === 'production' ? 'PostgreSQL' : 'SQLite'),
    hasPostgresUrl: !!process.env.DATABASE_URL
  };
}

// Interface unificada para ambos os bancos
export class DatabaseAdapter {
  static async initDatabase() {
    console.log('🔧 DatabaseAdapter.initDatabase() chamado');
    try {
      // Usar getDatabase() que já implementa o fallback
      const dbModule = await getDatabase();
      console.log('✅ Módulo do banco obtido via getDatabase()');
      
      if (!dbModule || typeof dbModule.initDatabase !== 'function') {
        throw new Error('Database module not properly loaded or initDatabase method not available');
      }
      
      console.log('🚀 Executando initDatabase()...');
      const result = await dbModule.initDatabase();
      console.log('✅ initDatabase() executado com sucesso');
      return result;
    } catch (error) {
      console.error('❌ Erro em DatabaseAdapter.initDatabase():', error);
      throw error;
    }
  }

  static async createUser(userData: {
    nome_completo: string;
    email: string;
    senha: string;
    data_nascimento: string;
    sexo: string;
    celular: string;
  }): Promise<User> {
    if (isProduction) {
      this.checkDb('createUser');
      if (!db) throw new Error('Database not initialized');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (db as any).createUser(userData);
    } else {
      if (!db || !db.createUser) throw new Error('Database not initialized');
      return await db.createUser(userData);
    }
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    if (isProduction) {
      this.checkDb('getUserByEmail');
      if (!db) throw new Error('Database not initialized');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (db as any).getUserByEmail(email);
    } else {
      if (!db || !db.getUserByEmail) throw new Error('Database not initialized');
      return await db.getUserByEmail(email);
    }
  }

  static async getUserById(id: number): Promise<User | null> {
    if (isProduction) {
      this.checkDb('getUserById');
      if (!db) throw new Error('Database not initialized');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (db as any).getUserById(id);
    } else {
      if (!db || !db.getUserById) throw new Error('Database not initialized');
      return await db.getUserById(id);
    }
  }

  static async createProduct(productData: {
    user_id: number;
    name: string;
    url: string;
    target_price: number;
    current_price?: number;
    store: string;
  }): Promise<Product> {
    if (isProduction) {
      this.checkDb('createProduct');
      if (!db) throw new Error('Database not initialized');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (db as any).createProduct(productData);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { productDb } = require('./database');
      return productDb.create(productData);
    }
  }

  static async getProductsByUserId(userId: number): Promise<Product[]> {
    if (isProduction) {
      this.checkDb('getProductsByUserId');
      if (!db) throw new Error('Database not initialized');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (db as any).getProductsByUserId(userId);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { productDb } = require('./database');
      return productDb.getByUserId(userId);
    }
  }

  static async updateProductPrice(productId: number, price: number): Promise<Product | null> {
    if (isProduction) {
      this.checkDb('updateProductPrice');
      if (!db) throw new Error('Database not initialized');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (db as any).updateProductPrice(productId, price);
    } else {
      if (!db || !db.updateProduct || !db.getProductById) throw new Error('Database not initialized');
      await db.updateProduct(productId, 0, { target_price: price });
      return await db.getProductById(productId);
    }
  }

  static async deleteProduct(productId: number, userId: number): Promise<Product | null> {
    if (isProduction) {
      this.checkDb('deleteProduct');
      if (!db) throw new Error('Database not initialized');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (db as any).deleteProduct(productId, userId);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { productDb } = require('./database');
      const deleted = productDb.delete(productId, userId);
      return deleted ? null : null;
    }
  }

  static async getSetting(key: string): Promise<string | null> {
    if (isProduction) {
      if (!db) throw new Error('Database not initialized');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (db as any).getSetting(key);
    } else {
      if (!db || !db.getSetting) throw new Error('Database not initialized');
      return await db.getSetting(key);
    }
  }

  static async setSetting(key: string, value: string): Promise<void> {
    if (isProduction) {
      if (!db) throw new Error('Database not initialized');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (db as any).setSetting(key, value);
    } else {
      if (!db || !db.setSetting) throw new Error('Database not initialized');
      return await db.setSetting(key, value);
    }
  }

  static async getAllProducts(): Promise<Product[]> {
    if (isProduction) {
      this.checkDb('getAllProducts');
      if (!db) throw new Error('Database not initialized');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (db as any).getAllProducts();
    } else {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { productDb } = require('./database');
      return productDb.getAllActive();
    }
  }

  static async getProductById(id: number): Promise<Product | null> {
    if (isProduction) {
      this.checkDb('getProductById');
      if (!db) throw new Error('Database not initialized');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (db as any).getProductById(id) || null;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { productDb } = require('./database');
      return productDb.getById(id);
    }
  }

  static async updateProduct(id: number, userId: number, updateData: {
    name?: string;
    url?: string;
    target_price?: number;
    store?: string;
  }): Promise<Product | null> {
    if (isProduction) {
      this.checkDb('updateProduct');
      if (!db) throw new Error('Database not initialized');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (db as any).updateProduct(id, userId, updateData) || null;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { productDb } = require('./database');
      return productDb.update(id, userId, updateData);
    }
  }
}

export default DatabaseAdapter;