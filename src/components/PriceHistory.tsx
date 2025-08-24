'use client';

import { useState, useEffect } from 'react';
import PriceAlert from './PriceAlert';

interface PricePoint {
  date: string;
  price: number;
  store: string;
}

interface PriceHistoryProps {
  productTitle: string;
  currentPrice: number;
  productUrl?: string;
}

export default function PriceHistory({ productTitle, currentPrice, productUrl }: PriceHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<'40d' | '3m' | '6m' | '1y'>('40d');
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(false);

  // Gerar dados simulados de histórico de preços
  const generatePriceHistory = (range: '40d' | '3m' | '6m' | '1y') => {
    const now = new Date();
    const points: PricePoint[] = [];
    const stores = ['Amazon', 'Mercado Livre', 'Americanas', 'Casas Bahia', 'Magazine Luiza'];
    
    let days: number;
    let interval: number;
    
    switch (range) {
      case '40d':
        days = 40;
        interval = 2;
        break;
      case '3m':
        days = 90;
        interval = 3;
        break;
      case '6m':
        days = 180;
        interval = 7;
        break;
      case '1y':
        days = 365;
        interval = 14;
        break;
    }
    
    // Gerar pontos de preço com variação realística
    const basePrice = currentPrice;
    let currentPricePoint = basePrice * (0.8 + Math.random() * 0.4); // Variação inicial
    
    for (let i = days; i >= 0; i -= interval) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Variação de preço mais realística
      const variation = (Math.random() - 0.5) * 0.2; // ±10%
      currentPricePoint = Math.max(basePrice * 0.6, currentPricePoint * (1 + variation));
      
      const store = stores[Math.floor(Math.random() * stores.length)];
      
      points.push({
        date: date.toISOString().split('T')[0],
        price: Math.round(currentPricePoint * 100) / 100,
        store
      });
    }
    
    // Adicionar preço atual
    points.push({
      date: now.toISOString().split('T')[0],
      price: currentPrice,
      store: 'Atual'
    });
    
    return points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      // Simular carregamento
      setTimeout(() => {
        setPriceHistory(generatePriceHistory(timeRange));
        setLoading(false);
      }, 500);
    }
  }, [isOpen, timeRange, currentPrice]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: timeRange === '1y' ? '2-digit' : undefined
    });
  };

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '40d': return '40 dias';
      case '3m': return '3 meses';
      case '6m': return '6 meses';
      case '1y': return '1 ano';
      default: return range;
    }
  };

  const minPrice = Math.min(...priceHistory.map(p => p.price));
  const maxPrice = Math.max(...priceHistory.map(p => p.price));
  const avgPrice = priceHistory.length > 0 ? priceHistory.reduce((sum, p) => sum + p.price, 0) / priceHistory.length : 0;

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg font-semibold text-gray-900">📈 Histórico de Preços</span>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
            Buscapé Style
          </span>
        </div>
        <svg
          className={`w-5 h-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="border-t border-gray-200 p-4">
          {/* Time Range Selector */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(['40d', '3m', '6m', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getTimeRangeLabel(range)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Carregando histórico...</span>
            </div>
          ) : (
            <>
              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <div className="text-green-700 font-semibold text-sm">MENOR PREÇO</div>
                  <div className="text-green-800 font-bold text-lg">{formatPrice(minPrice)}</div>
                  <div className="text-green-600 text-xs">Nos últimos {getTimeRangeLabel(timeRange)}</div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="text-blue-700 font-semibold text-sm">PREÇO MÉDIO</div>
                  <div className="text-blue-800 font-bold text-lg">{formatPrice(avgPrice)}</div>
                  <div className="text-blue-600 text-xs">Média do período</div>
                </div>
                
                <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                  <div className="text-red-700 font-semibold text-sm">MAIOR PREÇO</div>
                  <div className="text-red-800 font-bold text-lg">{formatPrice(maxPrice)}</div>
                  <div className="text-red-600 text-xs">Pico do período</div>
                </div>
              </div>

              {/* Simple Chart */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-800 mb-3">Variação de Preços</h4>
                <div className="relative h-32">
                  <div className="absolute inset-0 flex items-end justify-between">
                    {priceHistory.slice(0, 20).map((point, index) => {
                      const height = ((point.price - minPrice) / (maxPrice - minPrice)) * 100;
                      return (
                        <div
                          key={index}
                          className="bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-colors cursor-pointer group relative"
                          style={{ 
                            height: `${Math.max(height, 5)}%`, 
                            width: `${100 / Math.min(priceHistory.length, 20) - 1}%` 
                          }}
                          title={`${formatDate(point.date)}: ${formatPrice(point.price)}`}
                        >
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {formatDate(point.date)}<br/>
                            {formatPrice(point.price)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>{formatDate(priceHistory[0]?.date || '')}</span>
                  <span>{formatDate(priceHistory[priceHistory.length - 1]?.date || '')}</span>
                </div>
              </div>

              {/* Recent Price Points */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Últimas Variações</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {priceHistory.slice(-10).reverse().map((point, index) => (
                    <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                      <div>
                        <span className="text-sm font-medium">{formatDate(point.date)}</span>
                        <span className="text-xs text-gray-500 ml-2">{point.store}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{formatPrice(point.price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alert Setup */}
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-yellow-800">🔔 Alerta de Preço</h5>
                    <p className="text-sm text-yellow-700">Seja notificado quando o preço baixar</p>
                  </div>
                  <PriceAlert 
                    productTitle={productTitle}
                    currentPrice={currentPrice}
                    productUrl={productUrl || ''}
                    onCreateAlert={(alertData) => {
                      console.log('Alerta criado:', alertData);
                      // Aqui você pode integrar com sua API de alertas
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}