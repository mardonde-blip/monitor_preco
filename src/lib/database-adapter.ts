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

// Importar o banco apropriado
let db: {
  initDatabase?: () => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createUser?: (userData: any) => Promise<User>;
  getUserByEmail?: (email: string) => Promise<User | null>;
  getUserById?: (id: number) => Promise<User | null>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createProduct?: (productData: any) => Promise<Product>;
  getAllProducts?: (userId?: number) => Promise<Product[]>;
  getProductById?: (id: number) => Promise<Product | null>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateProduct?: (id: number, userId: number, updateData: any) => Promise<void>;
  deleteProduct?: (id: number, userId: number) => Promise<void>;
  getSetting?: (key: string) => Promise<string | null>;
  setSetting?: (key: string, value: string) => Promise<void>;
};

// Inicializar o banco apropriado
let db: any = null;
let dbPromise: Promise<any>;

if (process.env.NODE_ENV === 'production') {
  // Usar PostgreSQL em produção
  console.log('🐘 Usando PostgreSQL (Produção)');
  dbPromise = import('./database-postgres').then(module => {
    // PostgreSQL exporta funções diretamente
    return {
      initDatabase: module.initDatabase,
      createUser: module.createUser,
      getUserByEmail: module.getUserByEmail,
      createProduct: module.createProduct,
      getProductsByUserId: module.getProductsByUserId,
      updateProductPrice: module.updateProductPrice,
      updateProduct: module.updateProduct,
      deleteProduct: module.deleteProduct,
      getTelegramConfig: module.getTelegramConfig,
      saveTelegramConfig: module.saveTelegramConfig,
      getSetting: module.getSetting,
      setSetting: module.setSetting
    };
  });
} else {
  // Usar SQLite localmente
  console.log('🗃️ Usando SQLite (Local)');
  dbPromise = import('./database').then(module => {
    // SQLite exporta instâncias de classes
    return {
      initDatabase: () => Promise.resolve(), // SQLite não precisa de inicialização
      createUser: (userData: any) => module.userDb.create(userData),
      getUserByEmail: (email: string) => module.userDb.getByEmail(email),
      createProduct: (productData: any) => module.productDb.create(productData),
      getProductsByUserId: (userId: number) => module.productDb.getByUserId(userId),
      updateProductPrice: (id: number, price: number) => module.productDb.updatePrice(id, price),
      updateProduct: (id: number, data: any) => module.productDb.update(id, data),
      deleteProduct: (id: number) => module.productDb.delete(id),
      getTelegramConfig: (userId: number) => module.telegramConfigDb.getByUserId(userId),
      saveTelegramConfig: (config: any) => module.telegramConfigDb.save(config),
      getSetting: (key: string) => module.adminDb.getSetting(key),
      setSetting: (key: string, value: string) => module.adminDb.setSetting(key, value)
    };
  });
}

// Aguardar inicialização do banco
dbPromise.then(dbModule => {
  db = dbModule;
}).catch(error => {
  console.error('❌ Erro ao carregar módulo do banco:', error);
});

// Interface unificada para ambos os bancos
export class DatabaseAdapter {
  static async initDatabase() {
    // Aguardar carregamento do módulo do banco
    const dbModule = await dbPromise;
    if (!dbModule || typeof dbModule.initDatabase !== 'function') {
      throw new Error('Database module not properly loaded or initDatabase method not available');
    }
    return await dbModule.initDatabase();
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