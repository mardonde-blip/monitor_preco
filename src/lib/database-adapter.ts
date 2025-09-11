// Adaptador de banco de dados PostgreSQL

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

// Interface do banco de dados
interface DatabaseInterface {
  initDatabase: () => Promise<void>;
  createUser: (userData: unknown) => Promise<unknown>;
  getUserByEmail: (email: string) => Promise<unknown>;
  getUserById: (id: number) => Promise<unknown>;
  createProduct: (productData: unknown) => Promise<unknown>;
  getProductsByUserId: (userId: number) => Promise<unknown[]>;
  updateProductPrice: (id: number, price: number) => Promise<unknown>;
  updateProduct: (id: number, data: unknown) => Promise<unknown>;
  deleteProduct: (id: number, userId: number) => Promise<unknown>;
  getProductById: (id: number) => Promise<unknown>;
  getAllProducts: () => Promise<unknown[]>;
  getSetting: (key: string) => Promise<unknown>;
  setSetting: (key: string, value: string) => Promise<unknown>;
}

// Inicializar o banco PostgreSQL
let db: DatabaseInterface | null = null;
let dbPromise: Promise<DatabaseInterface>;

// Função para criar adapter PostgreSQL
async function createPostgreSQLAdapter(): Promise<DatabaseInterface> {
  console.log('🐘 Carregando PostgreSQL...');
  const pgModule = await import('./database-postgres');
  console.log('✅ Módulo PostgreSQL carregado:', Object.keys(pgModule));
  
  const adapter = {
    initDatabase: pgModule.initDatabase,
    createUser: pgModule.createUser,
    getUserByEmail: pgModule.getUserByEmail,
    getUserById: pgModule.getUserById,
    createProduct: pgModule.createProduct,
    getProductsByUserId: pgModule.getProductsByUserId,
    updateProductPrice: pgModule.updateProductPrice,
    updateProduct: pgModule.updateProduct,
    deleteProduct: pgModule.deleteProduct,
    getProductById: pgModule.getProductById,
    getAllProducts: pgModule.getAllProducts,
    getSetting: pgModule.getSetting,
    setSetting: pgModule.setSetting
  };
  
  console.log('✅ Adapter PostgreSQL criado:', Object.keys(adapter));
  return adapter;
}

// Usar PostgreSQL em todos os ambientes
console.log('🐘 Usando PostgreSQL exclusivamente');
dbPromise = createPostgreSQLAdapter();

// Aguardar inicialização do banco
dbPromise.then(dbModule => {
  console.log('✅ Database adapter PostgreSQL inicializado com sucesso');
  console.log('Métodos disponíveis:', Object.keys(dbModule));
  db = dbModule;
}).catch(error => {
  console.error('❌ Erro ao carregar módulo PostgreSQL:', error);
  console.error('Stack trace:', error.stack);
});

// Função para obter instância do banco
export async function getDatabase(): Promise<DatabaseInterface> {
  try {
    console.log('🔍 Obtendo instância do PostgreSQL...');
    console.log('🔧 Estado atual - db existe:', !!db);
    console.log('🔧 Estado atual - NODE_ENV:', process.env.NODE_ENV);
    
    if (!db) {
      console.log('⏳ Aguardando inicialização do PostgreSQL...');
      db = await dbPromise;
      console.log('✅ PostgreSQL inicializado:', !!db);
      
      if (db) {
        console.log('🔍 Métodos disponíveis no adapter:', Object.keys(db));
        console.log('🔍 Tipo do método initDatabase:', typeof db.initDatabase);
        console.log('🔍 initDatabase é função:', typeof db.initDatabase === 'function');
      }
    }
    
    if (!db) {
      throw new Error('PostgreSQL instance is null after initialization');
    }
    
    // Verificar se os métodos essenciais existem
    if (!db.initDatabase) {
      console.error('❌ DEBUG: Adapter PostgreSQL sem initDatabase');
      console.error('❌ DEBUG: Métodos disponíveis:', Object.keys(db));
      console.error('❌ DEBUG: Tipo do objeto db:', typeof db);
      console.error('❌ DEBUG: Constructor do db:', db.constructor.name);
      throw new Error('PostgreSQL not properly initialized - method initDatabase not available');
    }
    
    console.log('✅ Instância do PostgreSQL obtida com sucesso');
    console.log('🎯 Tipo de banco: PostgreSQL');
    return db;
  } catch (error) {
    console.error('❌ Erro ao obter instância do PostgreSQL:', error);
    throw error;
  }
}

// Função para verificar qual banco está sendo usado
export function getDatabaseInfo() {
  return {
    environment: process.env.NODE_ENV,
    databaseType: 'PostgreSQL',
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
    const dbInstance = await getDatabase();
    return await dbInstance.createUser(userData) as User;
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const dbInstance = await getDatabase();
    return await dbInstance.getUserByEmail(email) as User | null;
  }

  static async getUserById(id: number): Promise<User | null> {
    const dbInstance = await getDatabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (dbInstance as any).getUserById(id) as User | null;
  }

  static async createProduct(productData: {
    user_id: number;
    name: string;
    url: string;
    target_price: number;
    current_price?: number;
    store: string;
  }): Promise<Product> {
    const dbInstance = await getDatabase();
    return await dbInstance.createProduct(productData) as Product;
  }

  static async getProductsByUserId(userId: number): Promise<Product[]> {
    const dbInstance = await getDatabase();
    return await dbInstance.getProductsByUserId(userId) as Product[];
  }

  static async updateProductPrice(productId: number, price: number): Promise<Product | null> {
    const dbInstance = await getDatabase();
    return await dbInstance.updateProductPrice(productId, price) as Product | null;
  }

  static async deleteProduct(productId: number, userId: number): Promise<Product | null> {
     const dbInstance = await getDatabase();
     return await dbInstance.deleteProduct(productId, userId) as Product | null;
   }

  static async getSetting(key: string): Promise<string | null> {
    const dbInstance = await getDatabase();
    return await dbInstance.getSetting(key) as string | null;
  }

  static async setSetting(key: string, value: string): Promise<void> {
    const dbInstance = await getDatabase();
    return await dbInstance.setSetting(key, value);
  }

  static async getAllProducts(): Promise<Product[]> {
    const dbInstance = await getDatabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (dbInstance as any).getAllProducts() as Product[];
  }

  static async getProductById(id: number): Promise<Product | null> {
    const dbInstance = await getDatabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (dbInstance as any).getProductById(id) as Product | null;
  }

  static async updateProduct(id: number, userId: number, updateData: {
    name?: string;
    url?: string;
    target_price?: number;
    store?: string;
  }): Promise<Product | null> {
    const dbInstance = await getDatabase();
    return await dbInstance.updateProduct(id, updateData) as Product | null;
  }
}

export default DatabaseAdapter;