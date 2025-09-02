import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// Habilitar foreign keys
db.pragma('foreign_keys = ON');

// Criar tabela de usuários
const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_completo TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    data_nascimento DATE NOT NULL,
    sexo TEXT NOT NULL,
    celular TEXT NOT NULL,
    telegram_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

// Criar tabela de produtos monitorados
const createProductsTable = `
  CREATE TABLE IF NOT EXISTS monitored_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    target_price REAL NOT NULL,
    current_price REAL,
    store TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  )
`;

// Criar tabela de configurações personalizadas do Telegram
const createTelegramConfigTable = `
  CREATE TABLE IF NOT EXISTS user_telegram_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    bot_token TEXT,
    chat_id TEXT,
    is_enabled BOOLEAN DEFAULT 0,
    message_template TEXT DEFAULT '🚨 <b>ALERTA DE PREÇO!</b>\n\n📦 <b>{product_name}</b>\n\n🎯 Preço alvo: R$ {target_price}\n🔥 <b>Preço atual: R$ {current_price}</b>\n📉 Desconto: <b>{discount}%</b>\n\n🛒 <a href="{product_url}">Ver produto</a>\n\n⏰ {timestamp}',
    notification_settings JSON DEFAULT '{"price_drop": true, "target_reached": true, "daily_summary": false}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  )
`;

// Executar criação das tabelas
db.exec(createUsersTable);
db.exec(createProductsTable);
db.exec(createTelegramConfigTable);

// Interface para usuário
export interface User {
  id?: number;
  nome_completo: string;
  email: string;
  senha: string;
  data_nascimento: string;
  sexo: string;
  celular: string;
  telegram_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Interface para produto monitorado
export interface MonitoredProduct {
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

// Interface para configurações do Telegram
export interface UserTelegramConfig {
  id: number;
  user_id: number;
  bot_token?: string;
  chat_id?: string;
  is_enabled: boolean;
  message_template: string;
  notification_settings: {
    price_drop: boolean;
    target_reached: boolean;
    daily_summary: boolean;
  };
  created_at: string;
  updated_at: string;
}

// Classe para gerenciar usuários
export class UserDatabase {
  private insertUser = db.prepare(`
    INSERT INTO users (nome_completo, email, senha, data_nascimento, sexo, celular, telegram_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  private selectAllUsers = db.prepare('SELECT * FROM users ORDER BY created_at DESC');
  
  private selectUserById = db.prepare('SELECT * FROM users WHERE id = ?');
  
  private selectUserByEmail = db.prepare('SELECT * FROM users WHERE email = ?');
  
  private updateUser = db.prepare(`
    UPDATE users 
    SET nome_completo = ?, email = ?, senha = ?, data_nascimento = ?, sexo = ?, celular = ?, telegram_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  private updateTelegramId = db.prepare(`
    UPDATE users 
    SET telegram_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  private deleteUser = db.prepare('DELETE FROM users WHERE id = ?');

  // Criar usuário
  create(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): User {
    try {
      const result = this.insertUser.run(
        user.nome_completo, 
        user.email, 
        user.senha, 
        user.data_nascimento, 
        user.sexo, 
        user.celular, 
        user.telegram_id || null
      );
      return this.getById(result.lastInsertRowid as number)!;
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error('Email já cadastrado');
      }
      throw error;
    }
  }

  // Autenticar usuário
  authenticate(email: string, senha: string): User | null {
    const user = this.getByEmail(email);
    if (user && user.senha === senha) {
      return user;
    }
    return null;
  }

  // Buscar todos os usuários
  getAll(): User[] {
    return this.selectAllUsers.all() as User[];
  }

  // Buscar usuário por ID
  getById(id: number): User | null {
    return this.selectUserById.get(id) as User || null;
  }

  // Buscar usuário por email
  getByEmail(email: string): User | null {
    return this.selectUserByEmail.get(email) as User || null;
  }

  // Atualizar usuário
  update(id: number, user: Omit<User, 'id' | 'created_at' | 'updated_at'>): User | null {
    try {
      const result = this.updateUser.run(
        user.nome_completo, 
        user.email, 
        user.senha, 
        user.data_nascimento, 
        user.sexo, 
        user.celular, 
        user.telegram_id || null, 
        id
      );
      if (result.changes === 0) {
        return null;
      }
      return this.getById(id);
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error('Email já cadastrado');
      }
      throw error;
    }
  }

  // Atualizar Telegram ID
  updateTelegramId(id: number, telegramId: string): User | null {
    const result = this.updateTelegramId.run(telegramId, id);
    if (result.changes === 0) {
      return null;
    }
    return this.getById(id);
  }

  // Deletar usuário
  delete(id: number): boolean {
    const result = this.deleteUser.run(id);
    return result.changes > 0;
  }
}

// Classe para gerenciar produtos monitorados
export class ProductDatabase {
  private insertProduct = db.prepare(`
    INSERT INTO monitored_products (user_id, name, url, target_price, current_price, store)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  private selectProductsByUserId = db.prepare('SELECT * FROM monitored_products WHERE user_id = ? ORDER BY created_at DESC');
  
  private selectProductById = db.prepare('SELECT * FROM monitored_products WHERE id = ?');
  
  private updateProduct = db.prepare(`
    UPDATE monitored_products 
    SET name = ?, url = ?, target_price = ?, current_price = ?, store = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `);
  
  private updateProductPrice = db.prepare(`
    UPDATE monitored_products 
    SET current_price = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  private deleteProduct = db.prepare('DELETE FROM monitored_products WHERE id = ? AND user_id = ?');
  
  private toggleProductActive = db.prepare(`
    UPDATE monitored_products 
    SET is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `);

  // Criar produto monitorado
  create(product: Omit<MonitoredProduct, 'id' | 'created_at' | 'updated_at' | 'is_active'>): MonitoredProduct {
    const result = this.insertProduct.run(
      product.user_id,
      product.name,
      product.url,
      product.target_price,
      product.current_price || null,
      product.store
    );
    return this.getById(result.lastInsertRowid as number)!;
  }

  // Buscar produtos por usuário
  getByUserId(userId: number): MonitoredProduct[] {
    return this.selectProductsByUserId.all(userId) as MonitoredProduct[];
  }

  // Buscar produto por ID
  getById(id: number): MonitoredProduct | null {
    return this.selectProductById.get(id) as MonitoredProduct || null;
  }

  // Atualizar produto
  update(id: number, userId: number, product: Omit<MonitoredProduct, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_active'>): MonitoredProduct | null {
    const result = this.updateProduct.run(
      product.name,
      product.url,
      product.target_price,
      product.current_price || null,
      product.store,
      id,
      userId
    );
    if (result.changes === 0) {
      return null;
    }
    return this.getById(id);
  }

  // Atualizar preço do produto
  updatePrice(id: number, currentPrice: number): boolean {
    const result = this.updateProductPrice.run(currentPrice, id);
    return result.changes > 0;
  }

  // Deletar produto
  delete(id: number, userId: number): boolean {
    const result = this.deleteProduct.run(id, userId);
    return result.changes > 0;
  }

  // Ativar/desativar monitoramento
  toggleActive(id: number, userId: number, isActive: boolean): boolean {
    const result = this.toggleProductActive.run(isActive ? 1 : 0, id, userId);
    return result.changes > 0;
  }
}

// Classe para gerenciar configurações do Telegram
export class TelegramConfigDatabase {
  private insertConfig = db.prepare(`
    INSERT INTO user_telegram_config (user_id, bot_token, chat_id, is_enabled, message_template, notification_settings)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  private selectConfigByUserId = db.prepare('SELECT * FROM user_telegram_config WHERE user_id = ?');
  
  private updateConfig = db.prepare(`
    UPDATE user_telegram_config 
    SET bot_token = ?, chat_id = ?, is_enabled = ?, message_template = ?, notification_settings = ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `);
  
  private deleteConfig = db.prepare('DELETE FROM user_telegram_config WHERE user_id = ?');

  // Criar ou atualizar configuração
  upsert(config: Omit<UserTelegramConfig, 'id' | 'created_at' | 'updated_at'>): UserTelegramConfig {
    const existing = this.getByUserId(config.user_id);
    
    if (existing) {
      // Atualizar configuração existente
      const result = this.updateConfig.run(
        config.bot_token || null,
        config.chat_id || null,
        config.is_enabled ? 1 : 0,
        config.message_template,
        JSON.stringify(config.notification_settings),
        config.user_id
      );
      if (result.changes === 0) {
        throw new Error('Falha ao atualizar configuração');
      }
      return this.getByUserId(config.user_id)!;
    } else {
      // Criar nova configuração
      const result = this.insertConfig.run(
        config.user_id,
        config.bot_token || null,
        config.chat_id || null,
        config.is_enabled ? 1 : 0,
        config.message_template,
        JSON.stringify(config.notification_settings)
      );
      return this.getByUserId(config.user_id)!;
    }
  }

  // Buscar configuração por usuário
  getByUserId(userId: number): UserTelegramConfig | null {
    const result = this.selectConfigByUserId.get(userId) as any;
    if (!result) return null;
    
    return {
      ...result,
      is_enabled: Boolean(result.is_enabled),
      notification_settings: JSON.parse(result.notification_settings)
    };
  }

  // Deletar configuração
  delete(userId: number): boolean {
    const result = this.deleteConfig.run(userId);
    return result.changes > 0;
  }

  // Atualizar apenas o status de habilitado
  updateEnabled(userId: number, isEnabled: boolean): boolean {
    const config = this.getByUserId(userId);
    if (!config) return false;
    
    const result = this.updateConfig.run(
      config.bot_token,
      config.chat_id,
      isEnabled ? 1 : 0,
      config.message_template,
      JSON.stringify(config.notification_settings),
      userId
    );
    return result.changes > 0;
  }
}

// Instâncias singleton
export const userDb = new UserDatabase();
export const productDb = new ProductDatabase();
export const telegramConfigDb = new TelegramConfigDatabase();

export default db;