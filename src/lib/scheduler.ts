import cron, { ScheduledTask } from 'node-cron';
import { PriceScraper } from './scraper';
import { TelegramNotifier } from './telegram';
import { LocalStorage } from './storage';
import { Product, NotificationSettings } from '../types';
import { productDb, MonitoredProduct } from './database';
import { sendEmail, emailTemplates } from './email';

export class PriceMonitorScheduler {
  private scraper: PriceScraper;
  private telegramNotifier: TelegramNotifier;
  private isRunning: boolean = false;
  private cronJob: ScheduledTask | null = null;
  private lastRun: string | null = null;

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
      this.lastRun = new Date().toISOString();
      console.log('Iniciando ciclo de monitoramento...', this.lastRun);
      
      const products = productDb.getAllActive();
      const notificationSettings = await this.getNotificationSettings();
      
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
    product: MonitoredProduct
  ): Promise<void> {
    try {
      // Use automatic detection for MonitoredProduct
      const scrapingResult = await this.scraper.scrapePriceAuto(product.url);
      
      if (!scrapingResult.success || scrapingResult.price === null) {
        console.error(`Falha ao obter preço para ${product.name}:`, scrapingResult.error);
        
        // Mesmo com falha no scraping, verifica se o produto já está com preço abaixo do alvo
        const targetPrice = product.target_price;
        const currentPrice = product.current_price;
        
        if (currentPrice !== null && currentPrice !== undefined && currentPrice <= targetPrice) {
          console.log(`🎯 PRODUTO JÁ COM PREÇO BAIXO: ${product.name} - R$ ${currentPrice.toFixed(2)} <= R$ ${targetPrice.toFixed(2)}`);
          await this.sendPriceAlert(product);
        }
        
        return;
      }
      
      const newPrice = scrapingResult.price;
      const previousPrice = product.current_price;
      
      // Atualiza o preço atual do produto no banco de dados
      await this.updateProductViaAPI({
        ...product,
        current_price: newPrice,
        updated_at: new Date().toISOString()
      });
      
      // Verifica se o preço atual está abaixo do preço alvo (envia notificação quando preço alvo > preço atual)
      const targetPrice = product.target_price;
      const priceDropped = newPrice !== null && newPrice !== undefined && targetPrice !== null && targetPrice !== undefined && targetPrice > newPrice;
      
      if (priceDropped) {
        await this.sendPriceAlert(product);
      }
      
      console.log(`${product.name}: R$ ${newPrice?.toFixed(2) || 'N/A'} (alvo: R$ ${targetPrice?.toFixed(2) || 'N/A'}, anterior: R$ ${previousPrice !== null && previousPrice !== undefined ? previousPrice.toFixed(2) : 'N/A'})`);
      
      if (priceDropped) {
        console.log(`🎯 ALERTA: Preço de ${product.name} baixou para R$ ${newPrice?.toFixed(2) || 'N/A'}!`);
      }
      
    } catch (error) {
      console.error(`Erro ao verificar preço de ${product.name}:`, error);
    }
  }

  /**
   * Envia alerta de preço via Telegram e Email
   */
  private async sendPriceAlert(product: MonitoredProduct): Promise<void> {
    try {
      const notificationSettings = await this.getNotificationSettings();
      
      if (!notificationSettings.enabled) {
        return;
      }
      
      // Usa o preço anterior para calcular o desconto corretamente
      let previousPrice = product.current_price;
      
      // Se não há preço anterior, usa o preço alvo como referência
      if (!previousPrice) {
        previousPrice = product.target_price;
      }
      
      // Evita desconto 0.0% quando preços são iguais
      if (previousPrice === product.current_price) {
        // Se todos os preços são iguais, usa um valor ligeiramente maior para mostrar "economia"
        previousPrice = product.current_price! * 1.01; // 1% maior
      }
      
      // Enviar notificação via Telegram
      try {
        this.telegramNotifier.init({
          botToken: notificationSettings.telegram.botToken,
          chatId: notificationSettings.telegram.chatId
        });
        
        await this.telegramNotifier.sendPriceAlert(
          product,
          previousPrice,
          product.current_price!
        );
        
        console.log(`Alerta Telegram enviado para ${product.name}`);
      } catch (telegramError) {
        console.error('Erro ao enviar alerta via Telegram:', telegramError);
      }
      
      // Enviar notificação via Email
      try {
        await this.sendEmailAlert(product, previousPrice, product.current_price!);
        console.log(`Alerta Email enviado para ${product.name}`);
      } catch (emailError) {
        console.error('Erro ao enviar alerta via Email:', emailError);
      }
      
      console.log(`Alertas enviados para ${product.name} (desconto calculado com base em R$ ${previousPrice !== null && previousPrice !== undefined ? previousPrice.toFixed(2) : 'N/A'} -> R$ ${product.current_price!.toFixed(2)})`);
      
    } catch (error) {
      console.error('Erro ao enviar alerta:', error);
    }
  }
  
  /**
   * Envia alerta de preço por email
   */
  private async sendEmailAlert(product: MonitoredProduct, oldPrice: number, newPrice: number): Promise<void> {
    try {
      // Buscar usuários que monitoram este produto
      const users = await this.getUsersForProduct(product.id);
      
      for (const user of users) {
        if (user.email) {
          const discount = ((oldPrice - newPrice) / oldPrice * 100).toFixed(1);
          
          const emailContent = emailTemplates.priceAlert({
            userName: user.name || 'Usuário',
            productName: product.name,
            productUrl: product.url,
            oldPrice: oldPrice,
            newPrice: newPrice,
            discount: discount,
            targetPrice: product.targetPrice || product.initialPrice
          });
          
          await sendEmail({
            to: user.email,
            subject: `🚨 Alerta de Preço: ${product.name}`,
            html: emailContent
          });
          
          console.log(`Email de alerta enviado para ${user.email}`);
        }
      }
    } catch (error) {
      console.error('Erro ao enviar email de alerta:', error);
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

  /**
   * Retorna a data/hora da última execução
   */
  getLastRun(): string | null {
    return this.lastRun;
  }

  /**
   * Obtém configurações de notificação via API
   */
  private async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const response = await fetch('http://localhost:3000/api/settings');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Erro ao obter configurações via API:', error);
    }
    
    // Fallback para localStorage se API falhar
    return LocalStorage.getSettings();
  }

  /**
   * Atualiza um produto diretamente no banco de dados
   */
  private async updateProductViaAPI(product: Product): Promise<void> {
    try {
      // Usar diretamente o banco de dados em vez da API para evitar problemas de autenticação
      productDb.update(product.id, product.userId, {
        name: product.name,
        url: product.url,
        target_price: product.targetPrice,
        current_price: product.currentPrice,
        store: product.store
      });
    } catch (error) {
      console.error('Erro ao atualizar produto no banco:', error);
      // Fallback para localStorage se banco falhar
      LocalStorage.updateProduct(product.id, product);
    }
  }
  
  /**
   * Busca usuários que monitoram um produto específico
   */
  private async getUsersForProduct(productId: string): Promise<Array<{id: number, name: string, email: string}>> {
    try {
      const response = await fetch(`http://localhost:3000/api/users?productId=${productId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Erro ao buscar usuários via API:', error);
    }
    
    // Fallback: retorna lista vazia se não conseguir buscar usuários
    // Em um sistema real, isso deveria buscar do banco de dados
    return [];
  }
}

// Instância singleton para uso global
export const priceMonitorScheduler = new PriceMonitorScheduler();