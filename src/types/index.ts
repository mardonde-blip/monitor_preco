export interface Product {
  id: string;
  name: string;
  url: string;
  initialPrice: number;
  currentPrice?: number;
  targetPrice?: number;
  selector: string;
  addedAt: string;
  lastChecked?: string;
  status?: string;
  priceHistory?: PriceHistory[];
}

export interface PriceHistory {
  price: number;
  date: string;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

export interface NotificationSettings {
  enabled: boolean;
  telegram: TelegramConfig;
}

export interface ScrapingResult {
  success: boolean;
  price?: number;
  error?: string;
  selector?: string; // Seletor que funcionou na detecção automática
}

export interface MonitoringJob {
  productId: string;
  status: 'active' | 'paused' | 'error';
  lastRun?: Date;
  nextRun?: Date;
}