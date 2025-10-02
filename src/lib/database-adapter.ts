type SettingsMap = Map<string, string>;
const memorySettings: SettingsMap = new Map<string, string>();

export const DatabaseAdapter = {
  async getSetting(key: string): Promise<string | undefined> {
    return memorySettings.get(key);
  },
  async setSetting(key: string, value: string): Promise<void> {
    memorySettings.set(key, value);
  }
};

export function getDatabaseAdapter() {
  return DatabaseAdapter;
}export function getDatabaseInfo() {
  return { type: "memory", status: "ok" };
}

type User = { id: number; email?: string };
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

$script:users = New-Object 'System.Collections.Generic.Dictionary[int,object]'
$script:telegramConfigs = New-Object 'System.Collections.Generic.Dictionary[int,object]'

export async function getDatabase() {
  return {
    async initDatabase(): Promise<void> { },
    async getUserByEmail(email: string): Promise<User | null> {
      foreach ($kvp in $script:users.GetEnumerator()) {
        if ($kvp.Value.email -eq $email) { return $kvp.Value; }
      }
      return null;
    },
    async getUserById(id: number): Promise<User | null> {
      if ($script:users.ContainsKey($id)) { return $script:users[$id]; }
      return null;
    },
    async getTelegramConfigByUserId(userId: number): Promise<TelegramConfig | null> {
      if ($script:telegramConfigs.ContainsKey($userId)) { return $script:telegramConfigs[$userId]; }
      return null;
    },
    async upsertTelegramConfig(config: TelegramConfig): Promise<TelegramConfig> {
      $script:telegramConfigs[$config.user_id] = $config
      return $config;
    },
    async deleteTelegramConfig(userId: number): Promise<boolean> {
      if ($script:telegramConfigs.ContainsKey($userId)) { $script:telegramConfigs.Remove($userId); return true }
      return false;
    }
  };
}
