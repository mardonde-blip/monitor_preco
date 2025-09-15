import TelegramBot from 'node-telegram-bot-api';
import { TelegramConfig, Product } from '@/types';
import { getDatabase } from './database-adapter';


export class TelegramNotifier {
  private bot: TelegramBot | null = null;
  private config: TelegramConfig | null = null;

  init(config: TelegramConfig) {
    this.config = config;
    this.bot = new TelegramBot(config.botToken, { polling: false });
  }

  // Método alternativo para inicialização (compatibilidade)
  async initialize(botToken: string, chatId: string): Promise<void> {
    this.config = { botToken, chatId };
    this.bot = new TelegramBot(botToken, { polling: false });
  }

  async sendPriceAlert(product: Product, oldPrice: number, newPrice: number): Promise<void> {
    if (!this.bot || !this.config) {
      throw new Error('Telegram not initialized');
    }

    const discount = ((oldPrice - newPrice) / oldPrice * 100).toFixed(1);
    const message = this.formatPriceAlertMessage(product, oldPrice, newPrice, discount);

    // Log para debug do desconto
    console.log(`\n🎯 CÁLCULO DO DESCONTO:`);
    console.log(`   Produto: ${product.name}`);
    console.log(`   Preço anterior: R$ ${oldPrice.toFixed(2)}`);
    console.log(`   Preço atual: R$ ${newPrice.toFixed(2)}`);
    console.log(`   Desconto calculado: ${discount}%`);

    try {
      await this.bot.sendMessage(this.config.chatId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: false
      });
      console.log(`📱 Mensagem enviada para o Telegram: Desconto ${discount}% para ${product.name}`);
    } catch (error) {
      console.error('Failed to send Telegram message:', error);
      throw error;
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
        '🤖 <b>Lucre Na Promo</b>\n\nBot configurado com sucesso! Você receberá notificações quando os preços dos produtos monitorados baixarem.',
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
           targetPriceText +
           `🔥 <b>Preço atual: R$ ${newPrice.toFixed(2)}</b>\n` +
           `📉 Desconto: <b>${discount}%</b>\n\n` +
           `🛒 <a href="${product.url}">Ver produto</a>\n\n` +
           `⏰ ${new Date().toLocaleString('pt-BR')}`;
  }

  async validateConfig(config: TelegramConfig): Promise<boolean> {
    try {
      const testBot = new TelegramBot(config.botToken, { polling: false });
      
      // Validate bot token
      const botInfo = await testBot.getMe();
      if (!botInfo) {
        console.error('Invalid bot token');
        return false;
      }
      
      // Validate chat ID by trying to get chat info
      try {
        await testBot.getChat(config.chatId);
      } catch (chatError) {
        console.error('Invalid chat ID or bot has no access to chat:', chatError);
        return false;
      }
      
      console.log(`✅ Telegram validation successful: Bot ${botInfo.first_name} (@${botInfo.username})`);
      return true;
    } catch (error) {
      console.error('Invalid Telegram configuration:', error);
      return false;
    }
  }

  async getBotInfo(): Promise<{id: number; is_bot: boolean; first_name: string; username?: string}> {
    if (!this.bot) {
      throw new Error('Telegram bot not initialized');
    }
    
    try {
      return await this.bot.getMe();
    } catch (error) {
      console.error('Failed to get bot info:', error);
      throw error;
    }
  }

  async getChatInfo(): Promise<{id: number; type: string; title?: string; username?: string}> {
    if (!this.bot || !this.config) {
      throw new Error('Telegram not initialized');
    }
    
    try {
      return await this.bot.getChat(this.config.chatId);
    } catch (error) {
      console.error('Failed to get chat info:', error);
      throw error;
    }
  }

  // Verificar se o bot está inicializado
  isInitialized(): boolean {
    return this.bot !== null && this.config !== null;
  }

  // Enviar alerta personalizado para usuário específico
  async sendPersonalizedAlert(
    userId: number, 
    product: Product, 
    oldPrice?: number
  ): Promise<void> {
    try {
      // Buscar configuração do usuário
      const db = await getDatabase();
      const userConfig = await db.getTelegramConfigByUserId(userId);
      
      const config = userConfig as { is_enabled: boolean; bot_token: string; chat_id: string; message_template: string };
      if (!userConfig || !config.is_enabled) {
        console.log(`Notificações do Telegram desabilitadas para usuário ${userId}`);
        return;
      }

      if (!config.bot_token || !config.chat_id) {
        console.log(`Configurações do Telegram incompletas para usuário ${userId}`);
        return;
      }

      // Inicializar bot com configurações do usuário
      const userBot = new TelegramBot(config.bot_token, { polling: false });

      // Calcular desconto
      const discount = oldPrice && product.currentPrice
        ? ((oldPrice - product.currentPrice) / oldPrice * 100).toFixed(1)
        : '0';

      // Substituir variáveis no template
      const message = config.message_template
        .replace('{product_name}', product.name)
        .replace('{target_price}', (product.targetPrice || 0).toFixed(2))
        .replace('{current_price}', (product.currentPrice || 0).toFixed(2))
        .replace('{discount}', discount)
        .replace('{product_url}', product.url)
        .replace('{timestamp}', new Date().toLocaleString('pt-BR'));

      // Verificar configurações de notificação
      const telegramConfig: TelegramConfig = {
        botToken: config.bot_token,
        chatId: config.chat_id
      };
      const shouldNotify = this.shouldSendNotification(telegramConfig, product, oldPrice);
      
      if (shouldNotify) {
        await userBot.sendMessage(config.chat_id, message, { 
          parse_mode: 'HTML',
          disable_web_page_preview: false
        });
        console.log(`Alerta personalizado enviado para usuário ${userId}`);
      }
    } catch (error) {
      console.error(`Erro ao enviar alerta personalizado para usuário ${userId}:`, error);
      throw error;
    }
  }

  // Verificar se deve enviar notificação baseado nas configurações
  private shouldSendNotification(
    config: TelegramConfig,
    product: Product,
    oldPrice?: number
  ): boolean {
    // Se atingiu o preço alvo
    if (product.currentPrice && product.targetPrice && product.currentPrice <= product.targetPrice) {
      return true;
    }
    
    // Se houve queda de preço
    if (oldPrice && product.currentPrice && product.currentPrice < oldPrice) {
      return true;
    }
    
    return false;
  }

  // Enviar resumo diário para usuário
  async sendDailySummary(userId: number, products: Product[]): Promise<void> {
    try {
      const db = await getDatabase();
      const userConfig = await db.getTelegramConfigByUserId(userId);
      
      const config = userConfig as { is_enabled: boolean; bot_token: string; chat_id: string; message_template: string };
      if (!userConfig || !config.is_enabled) {
        return;
      }

      if (!config.bot_token || !config.chat_id) {
        console.log(`Configurações do Telegram incompletas para usuário ${userId}`);
        return;
      }

      const userBot = new TelegramBot(config.bot_token, { polling: false });
      
      const activeProducts = products.filter(p => p.status === 'active');
      const targetReached = activeProducts.filter(p => p.currentPrice && p.targetPrice && p.currentPrice <= p.targetPrice);
      
      let message = `📊 <b>RESUMO DIÁRIO</b>\n\n`;
      message += `📦 Produtos monitorados: ${activeProducts.length}\n`;
      message += `🎯 Metas atingidas: ${targetReached.length}\n\n`;
      
      if (targetReached.length > 0) {
        message += `<b>🔥 OPORTUNIDADES:</b>\n`;
        targetReached.forEach(product => {
          message += `• ${product.name} - R$ ${(product.currentPrice || 0).toFixed(2)}\n`;
        });
        message += `\n`;
      }
      
      message += `⏰ ${new Date().toLocaleString('pt-BR')}`;

      await userBot.sendMessage(config.chat_id, message, { 
        parse_mode: 'HTML'
      });
      
      console.log(`Resumo diário enviado para usuário ${userId}`);
    } catch (error) {
      console.error(`Erro ao enviar resumo diário para usuário ${userId}:`, error);
    }
  }

  // Testar configuração de usuário específico
  async testUserConfiguration(userId: number): Promise<void> {
    const db = await getDatabase();
    const userConfig = await db.getTelegramConfigByUserId(userId);
    
    if (!userConfig) {
      throw new Error('Configuração não encontrada para este usuário');
    }

    const config = userConfig as { bot_token: string; chat_id: string };
    if (!config.bot_token || !config.chat_id) {
      throw new Error('Token do bot ou Chat ID não configurados');
    }

    const userBot = new TelegramBot(config.bot_token, { polling: false });
    
    const testMessage = `✅ <b>TESTE DE CONFIGURAÇÃO</b>\n\nSuas notificações personalizadas do Telegram estão funcionando!\n\n⏰ ${new Date().toLocaleString('pt-BR')}`;
    
    await userBot.sendMessage(config.chat_id, testMessage, { 
      parse_mode: 'HTML'
    });
  }
}

export const telegramNotifier = new TelegramNotifier();