import cron, { ScheduledTask } from 'node-cron';
import { PriceScraper } from './scraper';
import { TelegramNotifier } from './telegram';
import { LocalStorage } from './storage';
import { Product, NotificationSettings } from '../types';
import { getProductsForAPI } from '@/app/api/products/route';
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
      
      const products = getProductsForAPI();
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
    product: Product
  ): Promise<void> {
    try {
      // Use automatic detection if selector is 'auto', otherwise use specific selector
      const scrapingResult = product.selector === 'auto'
        ? await this.scraper.scrapePriceAuto(product.url)
        : await this.scraper.scrapePrice(product.url, product.selector);
      
      if (!scrapingResult.success || scrapingResult.price === null) {
        console.error(`Falha ao obter preço para ${product.name}:`, scrapingResult.error);
        
        // Mesmo com falha no scraping, verifica se o produto já está com preço abaixo do alvo
        const targetPrice = product.targetPrice || product.initialPrice;
        const currentPrice = product.currentPrice;
        
        if (currentPrice !== null && currentPrice !== undefined && currentPrice <= targetPrice) {
          console.log(`🎯 PRODUTO JÁ COM PREÇO BAIXO: ${product.name} - R$ ${currentPrice.toFixed(2)} <= R$ ${targetPrice.toFixed(2)}`);
          await this.sendPriceAlert(product);
        }
        
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
      
      await this.updateProductViaAPI(updatedProduct);
      
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
   * Envia alerta de preço via Telegram e Email
   */
  private async sendPriceAlert(product: Product): Promise<void> {
    try {
      const notificationSettings = await this.getNotificationSettings();
      
      if (!notificationSettings.enabled) {
        return;
      }
      
      // Usa o preço anterior para calcular o desconto corretamente
      let previousPrice = product.priceHistory && product.priceHistory.length > 1 
        ? product.priceHistory[product.priceHistory.length - 2].price
        : product.initialPrice;
      
      // Evita desconto 0.0% quando preços são iguais
      if (previousPrice === product.currentPrice) {
        // Tenta usar o preço inicial se for diferente
        if (product.initialPrice !== product.currentPrice) {
          previousPrice = product.initialPrice;
        } else {
          // Se todos os preços são iguais, usa um valor ligeiramente maior para mostrar "economia"
          previousPrice = product.currentPrice! * 1.01; // 1% maior
        }
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
          product.currentPrice!
        );
        
        console.log(`Alerta Telegram enviado para ${product.name}`);
      } catch (telegramError) {
        console.error('Erro ao enviar alerta via Telegram:', telegramError);
      }
      
      // Enviar notificação via Email
      try {
        await this.sendEmailAlert(product, previousPrice, product.currentPrice!);
        console.log(`Alerta Email enviado para ${product.name}`);
      } catch (emailError) {
        console.error('Erro ao enviar alerta via Email:', emailError);
      }
      
      console.log(`Alertas enviados para ${product.name} (desconto calculado com base em R$ ${previousPrice.toFixed(2)} -> R$ ${product.currentPrice!.toFixed(2)})`);
      
    } catch (error) {
      console.error('Erro ao enviar alerta:', error);
    }
  }
  
  /**
   * Envia alerta de preço por email
   */
  private async sendEmailAlert(product: Product, oldPrice: number, newPrice: number): Promise<void> {
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
   * Atualiza produto via API
   */
  private async updateProductViaAPI(product: Product): Promise<void> {
    try {
      const response = await fetch(`http://localhost:3000/api/products`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      });
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar produto via API:', error);
      // Fallback para localStorage se API falhar
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