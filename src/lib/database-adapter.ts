type SettingsMap = Map<string, string>;
const memorySettings: SettingsMap = new Map<string, string>();

export const DatabaseAdapter = {
  async getSetting(key: string): Promise<string | undefined> {
    return memorySettings.get(key);
  },
  async setSetting(key: string, value: string): Promise<void> {
    memorySettings.set(key, value);
  },
  async getUserByEmail(email: string): Promise<User | null> {
    for (const user of memoryUsers.values()) {
      if (user.email === email) return user;
    }
    return null;
  },
  async getUserById(id: number): Promise<User | null> {
    return memoryUsers.get(id) ?? null;
  },
  async getTelegramConfigByUserId(userId: number): Promise<TelegramConfig | null> {
    return memoryTelegramConfigs.get(userId) ?? null;
  },
  async upsertTelegramConfig(config: TelegramConfig): Promise<TelegramConfig> {
    memoryTelegramConfigs.set(config.user_id, config);
    return config;
  },
  async deleteTelegramConfig(userId: number): Promise<boolean> {
    return memoryTelegramConfigs.delete(userId);
  }
};

export function getDatabaseAdapter() {
  return DatabaseAdapter;
}

export function getDatabaseInfo() {
  return { type: "memory", status: "ok" };
}

export type User = {
  id: number;
  nome_completo: string;
  email: string;
  senha: string;
  data_nascimento: string;
  sexo: string;
  celular: string;
  telegram_id?: number;
  created_at?: string;
  updated_at?: string;
};
type NewUser = {
  nome_completo: string;
  email: string;
  senha: string;
  data_nascimento: string;
  sexo: string;
  celular: string;
  telegram_id?: number;
};
type TelegramConfig = {
  user_id: number;
  bot_token?: string;
  chat_id?: string;
  is_enabled?: boolean;
  message_template?: string;
  notification_settings?: {
    price_drop: boolean;
    target_reached: boolean;
    daily_summary: boolean;
  };
};

const memoryUsers: Map<number, User> = new Map<number, User>();
const memoryTelegramConfigs: Map<number, TelegramConfig> = new Map<number, TelegramConfig>();
type ProductRecord = {
  id: number;
  user_id: number;
  name: string;
  url: string;
  target_price: number;
  current_price?: number;
  store: string;
  created_at?: string;
};
const memoryProducts: Map<number, ProductRecord> = new Map<number, ProductRecord>();

export async function getDatabase() {
  return {
    async initDatabase(): Promise<void> { /* no-op for memory adapter */ },
    async getAllUsers(): Promise<any[]> {
      return Array.from(memoryUsers.values());
    },
    async getUserByEmail(email: string): Promise<any | null> {
      for (const user of memoryUsers.values()) {
        if (user.email === email) return user;
      }
      return null;
    },
    async getUserById(id: number): Promise<any | null> {
      return memoryUsers.get(id) ?? null;
    },
    async createUser(data: NewUser): Promise<any> {
      // Verifica duplicidade de email
      for (const user of memoryUsers.values()) {
        if ((user as { email?: string }).email?.toLowerCase() === data.email.toLowerCase()) {
          throw new Error('Email já cadastrado');
        }
      }
      const id = memoryUsers.size + 1;
      const newUser: User = { id, ...data, created_at: new Date().toISOString() };
      memoryUsers.set(id, newUser);
      return newUser;
    },
    async updateUser(id: number, data: any): Promise<any | null> {
      const existing = memoryUsers.get(id);
      if (!existing) return null;
      // Se email mudou, checa duplicidade
      if (data.email && typeof data.email === 'string' && data.email.toLowerCase() !== (existing as { email?: string }).email?.toLowerCase()) {
        for (const [otherId, user] of memoryUsers.entries()) {
          if (otherId !== id && (user as { email?: string }).email?.toLowerCase() === data.email.toLowerCase()) {
            throw new Error('Email já cadastrado');
          }
        }
      }
      const { id: _ignoreId, ...restExisting } = existing as User;
      const updated: User = { ...(restExisting as User), ...data, id, updated_at: new Date().toISOString() };
      memoryUsers.set(id, updated);
      return updated;
    },
    async deleteUser(id: number): Promise<boolean> {
      return memoryUsers.delete(id);
    },
    async getTelegramConfigByUserId(userId: number): Promise<TelegramConfig | null> {
      return memoryTelegramConfigs.get(userId) ?? null;
    },
    async upsertTelegramConfig(config: TelegramConfig): Promise<TelegramConfig> {
      memoryTelegramConfigs.set(config.user_id, config);
      return config;
    },
    async deleteTelegramConfig(userId: number): Promise<boolean> {
      return memoryTelegramConfigs.delete(userId);
    }
    ,
    // Produtos (stubs mínimos para scheduler)
    async getAllProducts(): Promise<ProductRecord[]> {
      return Array.from(memoryProducts.values());
    },
    async getProductById(id: number): Promise<ProductRecord | null> {
      return memoryProducts.get(id) ?? null;
    },
    async updateProduct(id: number, userId: number, data: Partial<Omit<ProductRecord, 'id' | 'user_id'>>): Promise<ProductRecord | null> {
      const existing = memoryProducts.get(id);
      if (!existing || existing.user_id !== userId) return null;
      const updated: ProductRecord = { ...existing, ...data };
      memoryProducts.set(id, updated);
      return updated;
    }
  };
}
