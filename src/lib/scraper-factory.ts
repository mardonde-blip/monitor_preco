import { PriceScraper } from './scraper-core';

// Factory function para criar instâncias do scraper
export function createPriceScraper() {
  return new PriceScraper();
}

// Re-exporta a classe para compatibilidade
export { PriceScraper } from './scraper-core';