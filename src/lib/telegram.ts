export type TelegramConfig = {
  botToken: string;
  chatId: string;
};

export class TelegramNotifier {
  private config: TelegramConfig | null = null;

  async initialize(botToken: string, chatId: string): Promise<void> {
    if (!botToken || !chatId) throw new Error('Token e Chat ID são obrigatórios');
    this.config = { botToken, chatId };
  }

  async validateConfig(config: TelegramConfig): Promise<boolean> {
    return Boolean(config.botToken && config.chatId);
  }

  init(config: TelegramConfig): void {
    this.config = config;
  }

  async sendMessage(text: string): Promise<{ ok: boolean; error?: string }>{
    if (!this.config) return { ok: false, error: 'não inicializado' };
    // Stub: não envia nada, apenas simula sucesso
    return { ok: true };
  }

  async sendTestMessage(): Promise<boolean> {
    const res = await this.sendMessage('Teste de notificação do Telegram');
    return res.ok;
  }

  async sendPriceAlertToUser(_userId: number | string, _product: any, _previousPrice: number, _currentPrice: number): Promise<boolean> {
    // Stub: simula envio de alerta com sucesso
    return true;
  }
}

export async function sendMessage(_config: TelegramConfig, _text: string): Promise<{ ok: boolean; error?: string }>{
  // Mantém função existente como stub
  return { ok: false, error: 'telegram stub - disabled' };
}

export const telegramNotifier = new TelegramNotifier();