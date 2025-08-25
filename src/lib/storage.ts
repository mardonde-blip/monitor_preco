import { Product, NotificationSettings } from '@/types';

const PRODUCTS_KEY = 'monitored-products';
const SETTINGS_KEY = 'notification-settings';

export class LocalStorage {
  static getProducts(): Product[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(PRODUCTS_KEY);
      if (!stored) return [];
      
      const products = JSON.parse(stored);
      // Convert date strings back to Date objects
      return products.map((product: Record<string, unknown>) => ({
        ...product,
        createdAt: new Date(product.createdAt as string),
        lastChecked: product.lastChecked ? new Date(product.lastChecked as string) : undefined,
        priceHistory: (product.priceHistory as Record<string, unknown>[]).map((history: Record<string, unknown>) => ({
          ...history,
          timestamp: new Date(history.timestamp as string)
        }))
      }));
    } catch (error) {
      console.error('Error loading products from localStorage:', error);
      return [];
    }
  }

  static saveProducts(products: Product[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    } catch (error) {
      console.error('Error saving products to localStorage:', error);
    }
  }

  static addProduct(product: Product): void {
    const products = this.getProducts();
    products.push(product);
    this.saveProducts(products);
  }

  static updateProduct(productId: string, updates: Partial<Product>): void {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === productId);
    
    if (index !== -1) {
      products[index] = { ...products[index], ...updates };
      this.saveProducts(products);
    }
  }

  static removeProduct(productId: string): void {
    const products = this.getProducts();
    const filtered = products.filter(p => p.id !== productId);
    this.saveProducts(filtered);
  }

  static getSettings(): NotificationSettings {
    if (typeof window === 'undefined') {
      return {
        enabled: false,
        telegram: {
          botToken: '',
          chatId: ''
        }
      };
    }
    
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (!stored) {
        return {
          enabled: false,
          telegram: {
            botToken: '',
            chatId: ''
          }
        };
      }
      
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error loading settings from localStorage:', error);
      return {
        enabled: false,
        telegram: {
          botToken: '',
          chatId: ''
        }
      };
    }
  }

  static saveSettings(settings: NotificationSettings): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
    }
  }

  static clearAll(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(PRODUCTS_KEY);
    localStorage.removeItem(SETTINGS_KEY);
  }
}