export type TelegramConfig = {
  botToken: string;
  chatId: string;
};

export async function sendMessage(_config: TelegramConfig, _text: string): Promise<{ ok: boolean; error?: string }>{
  // Stub de Telegram: não envia nada, apenas mantém o build
  return { ok: false, error: 'telegram stub - disabled' };
}