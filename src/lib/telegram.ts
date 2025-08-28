import TelegramBot from 'node-telegram-bot-api';
import { TelegramConfig, Product } from '@/types';

export class TelegramNotifier {
  private bot: TelegramBot | null = null;
  private config: TelegramConfig | null = null;

  init(config: TelegramConfig) {
    this.config = config;
    this.bot = new TelegramBot(config.botToken, { polling: false });
  }

  async sendPriceAlert(product: Product, oldPrice: number, newPrice: number): Promise<boolean> {
    if (!this.bot || !this.config) {
      console.error('Telegram bot not initialized');
      return false;
    }

    try {
      const discount = ((oldPrice - newPrice) / oldPrice * 100).toFixed(1);
      const message = this.formatPriceAlertMessage(product, oldPrice, newPrice, discount);
      
      await this.bot.sendMessage(this.config.chatId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: false
      });
      
      return true;
    } catch (error) {
      console.error('Failed to send Telegram message:', error);
      return false;
    }
  }

  async sendTestMessage(): Promise<boolean> {
    if (!this.bot || !this.config) {
      console.error('Telegram bot not initialized');
      return false;
    }

    try {
      await this.bot.sendMessage(
        this.config.chatId,
        '🤖 <b>Monitor de Preços</b>\n\nBot configurado com sucesso! Você receberá notificações quando os preços dos produtos monitorados baixarem.',
        { parse_mode: 'HTML' }
      );
      return true;
    } catch (error) {
      console.error('Failed to send test message:', error);
      return false;
    }
  }

  private formatPriceAlertMessage(product: Product, oldPrice: number, newPrice: number, discount: string): string {
    const targetPriceText = product.targetPrice ? `🎯 Preço alvo: R$ ${product.targetPrice.toFixed(2)}\n` : '';
    return `🚨 <b>ALERTA DE PREÇO!</b>\n\n` +
           `📦 <b>${product.name}</b>\n\n` +
           `📊 Preço de referência: R$ ${product.initialPrice.toFixed(2)}\n` +
           targetPriceText +
           `🔥 <b>Preço atual: R$ ${newPrice.toFixed(2)}</b>\n` +
           `📉 Desconto: <b>${discount}%</b>\n\n` +
           `🛒 <a href="${product.url}">Ver produto</a>\n\n` +
           `⏰ ${new Date().toLocaleString('pt-BR')}`;
  }

  async validateConfig(config: TelegramConfig): Promise<boolean> {
    try {
      const testBot = new TelegramBot(config.botToken, { polling: false });
      await testBot.getMe();
      return true;
    } catch (error) {
      console.error('Invalid Telegram configuration:', error);
      return false;
    }
  }
}

export const telegramNotifier = new TelegramNotifier();