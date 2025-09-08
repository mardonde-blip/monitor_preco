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

if (isProduction) {
  // Usar PostgreSQL em produção
  console.log('🐘 Usando PostgreSQL (Produção)');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  db = require('./database-postgres');
} else {
  // Usar SQLite localmente
  console.log('🗃️ Usando SQLite (Local)');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  db = require('./database');
}

// Interface unificada para ambos os bancos
export class DatabaseAdapter {
  private static checkDb(methodName: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (isProduction && (!db || typeof (db as any)[methodName] !== 'function')) {
      throw new Error(`Database not properly initialized - method ${methodName} not available`);
    }
  }
  static async initDatabase() {
    if (isProduction) {
      this.checkDb('initDatabase');
      if (!db) throw new Error('Database not initialized');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof (db as any).initDatabase === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await (db as any).initDatabase();
      }
      throw new Error('initDatabase method not available');
    } else {
      // SQLite já inicializa automaticamente
      return Promise.resolve();
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