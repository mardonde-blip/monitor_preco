type SettingsMap = Map<string, string>;
const memorySettings: SettingsMap = new Map<string, string>();

export function getDatabaseAdapter() {
  return {
    async getSetting(key: string): Promise<string | undefined> {
      return memorySettings.get(key);
    },
    async setSetting(key: string, value: string): Promise<void> {
      memorySettings.set(key, value);
    }
  };
}