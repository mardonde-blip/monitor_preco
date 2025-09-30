import cron, { ScheduledTask } from 'node-cron';
import { PriceScraper } from './scraper';
import { TelegramNotifier } from './telegram';
import { LocalStorage } from './storage';
import { Product, NotificationSettings } from '../types';
import { getDatabase } from './database-adapter';
import { sendEmail, emailTemplates } from './email';
// import { ExaProductSearch } from './exa-search'; // Temporariamente desabilitado

export class PriceMonitorScheduler {
  private scraper: PriceScraper;
  private telegramNotifier: TelegramNotifier;
  // private exaSearch: ExaProductSearch; // Temporariamente desabilitado
  private isRunning: boolean = false;
  private cronJob: ScheduledTask | null = null;
  private lastRun: string | null = null;

  constructor() {
    this.scraper = new PriceScraper();
    this.telegramNotifier = new TelegramNotifier();
    // this.exaSearch = new ExaProductSearch(); // Temporariamente desabilitado
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
      
      const db = await getDatabase();
      const productsData = await db.getAllProducts();
      const products = productsData as Array<{id: number; name: string; url: string; target_price: number; current_price?: number; store: string}>;
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
        products.map(product => this.checkProductPrice({
          id: product.id.toString(),
          name: product.name,
          url: product.url,
          initialPrice: product.target_price,
          currentPrice: product.current_price,
          targetPrice: product.target_price,
          selector: 'auto',
          addedAt: new Date().toISOString(),
          target_price: product.target_price,
          current_price: product.current_price,
          created_at: new Date().toISOString(),
          user_id: 1
        } as Product & {target_price: number; current_price?: number; created_at: string; user_id: number}))
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
      // Use automatic detection for Product
      const scrapingResult = await this.scraper.scrapePriceAuto(product.url);
      
      if (!scrapingResult.success || scrapingResult.price === null) {
        console.error(`Falha ao obter preço para ${product.name}:`, scrapingResult.error);
        
        // Mesmo com falha no scraping, verifica se o produto já está com preço abaixo do alvo
        const targetPrice = product.targetPrice;
        const currentPrice = product.currentPrice;
        
        if (currentPrice !== null && currentPrice !== undefined && targetPrice !== undefined && currentPrice <= targetPrice) {
          console.log(`🎯 PRODUTO JÁ COM PREÇO BAIXO: ${product.name} - R$ ${currentPrice.toFixed(2)} <= R$ ${Number(targetPrice).toFixed(2)}`);
          await this.sendPriceAlert(product);
        }
        
        return;
      }
      
      const newPrice = scrapingResult.price;
      const previousPrice = product.currentPrice;
      
      // Atualiza o preço atual do produto no banco de dados
      await this.updateProductViaAPI({
        id: product.id.toString(),
        name: product.name,
        url: product.url,
        initialPrice: product.targetPrice,
        currentPrice: newPrice,
        targetPrice: product.targetPrice,
        selector: '',
        addedAt: product.addedAt,
        userId: 1
      } as Product);
      
      // Verifica se o preço atual está abaixo ou igual ao preço alvo (envia notificação quando preço atual <= preço alvo)
      const targetPrice = product.targetPrice;
      const priceDropped = newPrice !== null && newPrice !== undefined && targetPrice !== null && targetPrice !== undefined && newPrice <= targetPrice;
      
      if (priceDropped) {
        await this.sendPriceAlert(product);
      }
      
      console.log(`${product.name}: R$ ${newPrice?.toFixed(2) || 'N/A'} (alvo: R$ ${Number(targetPrice || 0).toFixed(2)}, anterior: R$ ${previousPrice !== null && previousPrice !== undefined ? previousPrice.toFixed(2) : 'N/A'})`);
      
      if (priceDropped) {
        console.log(`🎯 ALERTA: Preço de ${product.name} baixou para R$ ${newPrice?.toFixed(2) || 'N/A'}!`);
      }
      
    } catch (error) {
      console.error(`Erro ao verificar preço de ${product.name}:`, error);
    }
  }

  /**
   * Envia alerta de preço via Telegram e Email para todos os usuários que monitoram o produto
   */
  private async sendPriceAlert(product: Product): Promise<void> {
    try {
      console.log(`🚨 Enviando alerta de preço para ${product.name}`);
      
      // TODO: Implementar busca real de usuários no banco de dados
      // const db = await getDatabase();
      // const usersForProduct = await db.getUsersForProduct(parseInt(product.id));

      // Simulação temporária - usar lista fixa de usuários
      const usersForProduct = [{ id: 'temp-user-id', email: 'user@example.com' }];
      
      if (!usersForProduct || usersForProduct.length === 0) {
        console.log(`Nenhum usuário encontrado para o produto ${product.name}`);
        return;
      }
      
      // Usa o preço anterior para calcular o desconto corretamente
      let previousPrice = product.currentPrice;
      
      // Se não há preço anterior, usa o preço alvo como referência
      if (!previousPrice) {
        previousPrice = product.targetPrice;
      }
      
      // Evita desconto 0.0% quando preços são iguais
      if (previousPrice === product.currentPrice) {
        // Se todos os preços são iguais, usa um valor ligeiramente maior para mostrar "economia"
        previousPrice = product.currentPrice! * 1.01; // 1% maior
      }
      
      // Enviar notificações para cada usuário
      for (const user of usersForProduct) {
        try {
          // Telegram
          const telegramSent = await this.telegramNotifier.sendPriceAlertToUser(
            user.id,
            {
              id: product.id.toString(),
              name: product.name,
              url: product.url,
              initialPrice: product.targetPrice,
              currentPrice: product.currentPrice,
              targetPrice: product.targetPrice,
              selector: '',
              addedAt: product.addedAt
            } as Product,
            previousPrice || 0,
            product.currentPrice || 0
          );
          
          // Email (se configurado)
          // TODO: Implementar notificação por email
          // if (user.emailEnabled) {
          //   await this.emailNotifier.sendPriceAlert(user.email, product, currentPrice, targetPrice);
          // }
          
          console.log(`✅ Alerta enviado para usuário ${user.id} (Telegram: ${telegramSent ? 'Sim' : 'Não'})`);
        } catch (userError) {
          console.error(`❌ Erro ao enviar alerta para usuário ${user.id}:`, userError);
        }
      }
      
      console.log(`📢 Alertas processados para ${usersForProduct.length} usuário(s) do produto ${product.name}`);
      
    } catch (error) {
      console.error('Erro ao enviar alertas de preço:', error);
    }
  }
  
  /**
   * Envia alerta de preço por email
   */
  private async sendEmailAlert(product: Product, oldPrice: number, newPrice: number): Promise<void> {
    try {
      // Buscar usuários que monitoram este produto
      const users = await this.getUsersForProduct(product.id.toString());
      
      for (const user of users) {
        if (user.email) {
          const emailContent = emailTemplates.priceAlertEmail(
            user.name || 'Usuário',
            product.name,
            oldPrice,
            newPrice,
            product.url
          );
          
          await sendEmail({
            to: user.email,
            subject: emailContent.subject,
            html: emailContent.html
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
    console.log('Executando verificação manual com scraper tradicional...');
    
    try {
      const db = await getDatabase();
      const productsData = await db.getAllProducts();
      const products = productsData as Array<{id: number; name: string; url: string; target_price: number; current_price?: number; store: string}>;
      const notificationSettings = await this.getNotificationSettings();
      
      if (!products.length) {
        console.log('Nenhum produto para monitorar');
        return;
      }

      if (!notificationSettings.enabled) {
        console.log('Notificações desabilitadas');
        return;
      }

      // Executa verificação manual usando scraper tradicional para cada produto
      const results = await Promise.allSettled(
        products.map(product => this.checkProductPrice({
          id: product.id.toString(),
          name: product.name,
          url: product.url,
          initialPrice: product.target_price,
          currentPrice: product.current_price,
          targetPrice: product.target_price,
          selector: 'auto',
          addedAt: new Date().toISOString(),
          target_price: product.target_price,
          current_price: product.current_price,
          created_at: new Date().toISOString(),
          user_id: 1
        } as Product & {target_price: number; current_price?: number; created_at: string; user_id: number}))
      );
      
      await this.scraper.close();
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`Verificação manual concluída: ${successful} sucessos, ${failed} falhas`);
      
    } catch (error) {
      console.error('Erro na verificação manual:', error);
    }
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
      // Buscar o produto original para obter o user_id
      const db = await getDatabase();
      const originalProduct = await db.getProductById(parseInt(product.id));
      if (!originalProduct) {
        throw new Error(`Produto com ID ${product.id} não encontrado`);
      }
      
      // Usar diretamente o banco de dados em vez da API para evitar problemas de autenticação
      const dbProduct = originalProduct as { user_id: number; store: string };
      await db.updateProduct(parseInt(product.id), dbProduct.user_id, {
        name: product.name,
        url: product.url,
        target_price: product.targetPrice || 0,
        current_price: product.currentPrice,
        store: dbProduct.store
      });
    } catch (error) {
      console.error('Erro ao atualizar produto no banco:', error);
      // Fallback para localStorage se banco falhar
      LocalStorage.updateProduct(product.id, product);
    }
  }
  
  /**
   * Verifica o preço de um produto específico usando MCP de busca
   * TEMPORARIAMENTE DESABILITADO - Usando apenas scraper tradicional
   */
  /*
  private async checkProductPriceWithMCP(
    product: Product
  ): Promise<void> {
    try {
      console.log(`Buscando preço atual para ${product.name} usando MCP...`);
      
      // Usa o MCP de busca para encontrar o preço atual do produto
      const searchResults = await this.exaSearch.searchProducts(product.name, {
        maxResults: 5,
        includeText: true,
        includeHighlights: true
      });
      
      if (!searchResults.length) {
        console.error(`Nenhum resultado encontrado para ${product.name} via MCP`);
        return;
      }
      
      // Pega o primeiro resultado (melhor score) e tenta extrair o preço
      const bestResult = searchResults[0];
      console.log(`Melhor resultado MCP para ${product.name}: ${bestResult.name} - Score: ${bestResult.score}`);
      
      // Se o resultado tem preço estimado, usa ele
      let currentPrice = bestResult.estimatedPrice;
      
      // Se não tem preço estimado, tenta fazer scraping da URL encontrada
      if (!currentPrice && bestResult.url) {
        console.log(`Fazendo scraping da URL encontrada via MCP: ${bestResult.url}`);
        const scrapingResult = await this.scraper.scrapePriceAuto(bestResult.url);
        if (scrapingResult.success && scrapingResult.price !== null) {
          currentPrice = scrapingResult.price;
        }
      }
      
      if (!currentPrice) {
        console.error(`Não foi possível obter preço para ${product.name} via MCP`);
        return;
      }
      
      console.log(`Preço atual encontrado via MCP para ${product.name}: R$ ${currentPrice.toFixed(2)}`);
      
      // Atualiza o preço atual do produto no banco de dados
      await this.updateProductViaAPI({
        id: product.id.toString(),
        name: product.name,
        url: product.url,
        initialPrice: product.targetPrice,
        currentPrice: currentPrice,
        targetPrice: product.targetPrice,
        selector: '',
        addedAt: product.addedAt,
        userId: 1
      } as Product);
      
      // Verifica se o preço atual está abaixo do preço alvo
      const targetPrice = product.targetPrice;
      const priceDropped = currentPrice !== null && currentPrice !== undefined && targetPrice !== null && targetPrice !== undefined && targetPrice > currentPrice;
      
      console.log(`${product.name}: R$ ${currentPrice.toFixed(2)} (alvo: R$ ${Number(targetPrice || 0).toFixed(2)})`);
      
      if (priceDropped) {
        console.log(`🎯 ALERTA MCP: Preço de ${product.name} está abaixo do alvo! R$ ${currentPrice.toFixed(2)} < R$ ${Number(targetPrice).toFixed(2)}`);
        
        // Cria um produto atualizado com o novo preço para enviar o alerta
        const updatedProduct = {
          ...product,
          currentPrice: currentPrice
        };
        
        await this.sendPriceAlert(updatedProduct);
      }
      
    } catch (error) {
      console.error(`Erro ao verificar preço de ${product.name} via MCP:`, error);
    }
  }
  */
   
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