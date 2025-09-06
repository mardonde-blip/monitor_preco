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
let db: any;

if (isProduction) {
  // Usar PostgreSQL em produção
  console.log('🐘 Usando PostgreSQL (Produção)');
  db = require('./database-postgres');
} else {
  // Usar SQLite localmente
  console.log('🗃️ Usando SQLite (Local)');
  db = require('./database');
}

// Interface unificada para ambos os bancos
export class DatabaseAdapter {
  static async initDatabase() {
    if (isProduction) {
      return await db.initDatabase();
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
      return await db.createUser(userData);
    } else {
      return db.createUser(userData);
    }
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    if (isProduction) {
      return await db.getUserByEmail(email);
    } else {
      return db.getUserByEmail(email);
    }
  }

  static async getUserById(id: number): Promise<User | null> {
    if (isProduction) {
      return await db.getUserById(id);
    } else {
      return db.getUserById(id);
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
      return await db.createProduct(productData);
    } else {
      return db.createProduct(productData);
    }
  }

  static async getProductsByUserId(userId: number): Promise<Product[]> {
    if (isProduction) {
      return await db.getProductsByUserId(userId);
    } else {
      return db.getProductsByUserId(userId);
    }
  }

  static async updateProductPrice(productId: number, price: number): Promise<Product | null> {
    if (isProduction) {
      return await db.updateProductPrice(productId, price);
    } else {
      return db.updateProductPrice(productId, price);
    }
  }

  static async deleteProduct(productId: number, userId: number): Promise<Product | null> {
    if (isProduction) {
      return await db.deleteProduct(productId, userId);
    } else {
      return db.deleteProduct(productId, userId);
    }
  }

  static async getSetting(key: string): Promise<string | null> {
    if (isProduction) {
      return await db.getSetting(key);
    } else {
      return db.getSetting(key);
    }
  }

  static async setSetting(key: string, value: string): Promise<any> {
    if (isProduction) {
      return await db.setSetting(key, value);
    } else {
      return db.setSetting(key, value);
    }
  }

  static async getAllProducts(): Promise<Product[]> {
    if (isProduction) {
      const result = await db.query('SELECT * FROM monitored_products WHERE is_active = true');
      return result.rows;
    } else {
      return db.getAllProducts();
    }
  }

  static async getProductById(id: number): Promise<Product | null> {
    if (isProduction) {
      const result = await db.query('SELECT * FROM monitored_products WHERE id = $1', [id]);
      return result.rows[0] || null;
    } else {
      return db.getProductById(id);
    }
  }

  static async updateProduct(id: number, userId: number, updateData: {
    name?: string;
    url?: string;
    target_price?: number;
    store?: string;
  }): Promise<Product | null> {
    if (isProduction) {
      const setParts = [];
      const values = [];
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
      if (updateData.store !== undefined) {
        setParts.push(`store = $${paramIndex++}`);
        values.push(updateData.store);
      }

      if (setParts.length === 0) {
        return await this.getProductById(id);
      }

      setParts.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id, userId);

      const query = `UPDATE monitored_products SET ${setParts.join(', ')} WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} RETURNING *`;
      const result = await db.query(query, values);
      return result.rows[0] || null;
    } else {
      await db.updateProduct(id, userId, updateData);
      return db.getProductById(id);
    }
  }
}

export default DatabaseAdapter;