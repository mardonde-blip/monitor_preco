import cron, { ScheduledTask } from 'node-cron';
import { PriceScraper } from './scraper';
import { TelegramNotifier } from './telegram';
import { LocalStorage } from './storage';
import { Product, NotificationSettings } from '../types';

export class PriceMonitorScheduler {
  private scraper: PriceScraper;
  private telegramNotifier: TelegramNotifier;
  private isRunning: boolean = false;
  private cronJob: ScheduledTask | null = null;

  constructor() {
    this.scraper = new PriceScraper();
    this.telegramNotifier = new TelegramNotifier();
  }

  /**
   * Inicia o agendamento de monitoramento
   */
  async startScheduler(intervalMinutes: number = 60): Promise<void> {
    if (this.isRunning) {
      console.log('Scheduler já está rodando');
      return;
    }

    // Converte minutos para formato cron (a cada X minutos)
    // Para intervalos maiores que 59 minutos, usa uma abordagem diferente
    let cronExpression: string;
    
    if (intervalMinutes <= 59) {
      cronExpression = `*/${intervalMinutes} * * * *`;
    } else {
      // Para intervalos de horas, converte para horas
      const hours = Math.floor(intervalMinutes / 60);
      cronExpression = `0 */${hours} * * *`;
    }
    
    this.cronJob = cron.schedule(cronExpression, async () => {
      await this.runMonitoringCycle();
    }, {
      timezone: 'America/Sao_Paulo'
    });

    this.cronJob.start();
    this.isRunning = true;
    
    console.log(`Scheduler iniciado - verificando preços a cada ${intervalMinutes} minutos`);
    
    // Executa uma verificação inicial
    await this.runMonitoringCycle();
  }

  /**
   * Para o agendamento
   */
  stopScheduler(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    this.isRunning = false;
    console.log('Scheduler parado');
  }

  /**
   * Executa um ciclo completo de monitoramento
   */
  private async runMonitoringCycle(): Promise<void> {
    try {
      console.log('Iniciando ciclo de monitoramento...', new Date().toISOString());
      
      const products = LocalStorage.getProducts();
      const notificationSettings = LocalStorage.getSettings();
      
      if (!products.length) {
        console.log('Nenhum produto para monitorar');
        return;
      }

      if (!notificationSettings.enabled) {
        console.log('Notificações desabilitadas');
        return;
      }

      // Scraper não precisa de inicialização explícita
      
      const results = await Promise.allSettled(
        products.map(product => this.checkProductPrice(product))
      );
      
      await this.scraper.close();
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`Ciclo concluído: ${successful} sucessos, ${failed} falhas`);
      
    } catch (error) {
      console.error('Erro no ciclo de monitoramento:', error);
    }
  }

  /**
   * Verifica o preço de um produto específico
   */
  private async checkProductPrice(
    product: Product
  ): Promise<void> {
    try {
      // Use automatic detection if selector is 'auto', otherwise use specific selector
      const scrapingResult = product.selector === 'auto'
        ? await this.scraper.scrapePriceAuto(product.url)
        : await this.scraper.scrapePrice(product.url, product.selector);
      
      if (!scrapingResult.success || scrapingResult.price === null) {
        console.error(`Falha ao obter preço para ${product.name}:`, scrapingResult.error);
        return;
      }
      
      const newPrice = scrapingResult.price;
      const previousPrice = product.currentPrice || product.initialPrice;
      
      // Atualiza o preço atual do produto
      const updatedProduct: Product = {
        ...product,
        currentPrice: newPrice,
        lastChecked: new Date().toISOString(),
        priceHistory: [
          ...(product.priceHistory || []),
          {
              price: newPrice || 0,
              date: new Date().toISOString()
            }
        ].slice(-50) // Mantém apenas os últimos 50 registros
      };
      
      LocalStorage.updateProduct(updatedProduct.id, updatedProduct);
      
      // Verifica se houve queda de preço abaixo do valor alvo (ou inicial se não definido)
      const targetPrice = product.targetPrice || product.initialPrice;
      const priceDropped = newPrice !== null && newPrice !== undefined && newPrice <= targetPrice;
      
      if (priceDropped) {
        await this.sendPriceAlert(updatedProduct);
      }
      
      console.log(`${product.name}: R$ ${newPrice?.toFixed(2) || 'N/A'} (alvo: R$ ${targetPrice.toFixed(2)}, anterior: R$ ${previousPrice.toFixed(2)})`);
      
      if (priceDropped) {
        console.log(`🎯 ALERTA: Preço de ${product.name} baixou para R$ ${newPrice?.toFixed(2) || 'N/A'}!`);
      }
      
    } catch (error) {
      console.error(`Erro ao verificar preço de ${product.name}:`, error);
    }
  }

  /**
   * Envia alerta de preço via Telegram
   */
  private async sendPriceAlert(product: Product): Promise<void> {
    try {
      const notificationSettings = LocalStorage.getSettings();
      
      if (!notificationSettings.enabled) {
        return;
      }
      
      this.telegramNotifier.init({
        botToken: notificationSettings.telegram.botToken,
        chatId: notificationSettings.telegram.chatId
      });
      
      const referencePrice = product.targetPrice || product.initialPrice;
      await this.telegramNotifier.sendPriceAlert(
        product,
        referencePrice,
        product.currentPrice!
      );
      
      console.log(`Alerta enviado para ${product.name}`);
      
    } catch (error) {
      console.error('Erro ao enviar alerta:', error);
    }
  }

  /**
   * Verifica se o scheduler está rodando
   */
  isSchedulerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Executa uma verificação manual de todos os produtos
   */
  async runManualCheck(): Promise<void> {
    console.log('Executando verificação manual...');
    await this.runMonitoringCycle();
  }
}

// Instância singleton para uso global
export const priceMonitorScheduler = new PriceMonitorScheduler();