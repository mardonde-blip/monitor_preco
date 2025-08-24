'use client';

import { useState } from 'react';
import { Tag, Copy, ExternalLink, Clock, Percent, Gift } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  description: string;
  discount: string;
  type: 'percentage' | 'fixed' | 'shipping';
  minValue?: number;
  maxDiscount?: number;
  expiryDate: string;
  store: string;
  verified: boolean;
  usedCount: number;
  successRate: number;
}

interface DiscountCouponsProps {
  productTitle: string;
  store?: string;
}

export default function DiscountCoupons({ productTitle, store }: DiscountCouponsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  // Dados simulados de cupons
  const [coupons] = useState<Coupon[]>([
    {
      id: '1',
      code: 'PRIMEIRA10',
      description: '10% OFF na primeira compra',
      discount: '10%',
      type: 'percentage',
      minValue: 50,
      maxDiscount: 100,
      expiryDate: '2024-02-29',
      store: 'Amazon',
      verified: true,
      usedCount: 1247,
      successRate: 95
    },
    {
      id: '2',
      code: 'FRETEGRATIS',
      description: 'Frete grátis para todo Brasil',
      discount: 'Frete Grátis',
      type: 'shipping',
      minValue: 99,
      expiryDate: '2024-03-15',
      store: 'Mercado Livre',
      verified: true,
      usedCount: 892,
      successRate: 88
    },
    {
      id: '3',
      code: 'SAVE20',
      description: 'R$ 20 OFF em compras acima de R$ 150',
      discount: 'R$ 20',
      type: 'fixed',
      minValue: 150,
      expiryDate: '2024-02-20',
      store: 'Americanas',
      verified: false,
      usedCount: 456,
      successRate: 72
    },
    {
      id: '4',
      code: 'MEGA15',
      description: '15% OFF em eletrônicos',
      discount: '15%',
      type: 'percentage',
      minValue: 200,
      maxDiscount: 300,
      expiryDate: '2024-02-25',
      store: 'Magazine Luiza',
      verified: true,
      usedCount: 2103,
      successRate: 91
    },
    {
      id: '5',
      code: 'CASHBACK5',
      description: '5% de cashback + frete grátis',
      discount: '5% Cashback',
      type: 'percentage',
      minValue: 100,
      expiryDate: '2024-03-01',
      store: 'Casas Bahia',
      verified: true,
      usedCount: 678,
      successRate: 83
    }
  ]);

  const handleCopyCoupon = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCoupon(code);
      setTimeout(() => setCopiedCoupon(null), 2000);
    } catch (err) {
      // Fallback para navegadores que não suportam clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedCoupon(code);
      setTimeout(() => setCopiedCoupon(null), 2000);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDaysUntilExpiry = (dateStr: string) => {
    const today = new Date();
    const expiry = new Date(dateStr);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage':
        return <Percent className="w-4 h-4" />;
      case 'fixed':
        return <Tag className="w-4 h-4" />;
      case 'shipping':
        return <Gift className="w-4 h-4" />;
      default:
        return <Tag className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'percentage':
        return 'bg-green-100 text-green-800';
      case 'fixed':
        return 'bg-blue-100 text-blue-800';
      case 'shipping':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const activeCoupons = coupons.filter(coupon => getDaysUntilExpiry(coupon.expiryDate) > 0);
  const bestCoupons = activeCoupons.filter(coupon => coupon.verified && coupon.successRate > 80);

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <span className="text-lg font-semibold text-gray-900">🎫 Cupons de Desconto</span>
          <div className="flex items-center gap-2">
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
              {activeCoupons.length} cupons ativos
            </span>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
              Buscapé Style
            </span>
          </div>
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
          {/* Best Coupons Highlight */}
          {bestCoupons.length > 0 && (
            <div className="mb-6">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="w-5 h-5 text-yellow-600" />
                  <h4 className="font-semibold text-yellow-800">🔥 Melhores Cupons Verificados</h4>
                </div>
                <div className="grid gap-3">
                  {bestCoupons.slice(0, 2).map((coupon) => (
                    <div key={coupon.id} className="bg-white rounded-lg p-3 border border-yellow-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(coupon.type)}`}>
                              {getTypeIcon(coupon.type)}
                              {coupon.discount}
                            </span>
                            <span className="text-xs text-gray-500">{coupon.store}</span>
                            {coupon.verified && (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                ✓ Verificado
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700">{coupon.description}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span>✅ {coupon.successRate}% sucesso</span>
                            <span>👥 {coupon.usedCount} usos</span>
                            <span>⏰ Válido até {formatDate(coupon.expiryDate)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCopyCoupon(coupon.code)}
                          className="ml-4 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                          {copiedCoupon === coupon.code ? (
                            <>✓ Copiado!</>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              {coupon.code}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* All Coupons */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Todos os Cupons Disponíveis</h4>
            <div className="space-y-3">
              {activeCoupons.map((coupon) => {
                const daysLeft = getDaysUntilExpiry(coupon.expiryDate);
                const isExpiringSoon = daysLeft <= 7;
                
                return (
                  <div key={coupon.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(coupon.type)}`}>
                            {getTypeIcon(coupon.type)}
                            <span className="ml-1">{coupon.discount}</span>
                          </span>
                          <span className="text-sm text-gray-600">{coupon.store}</span>
                          {coupon.verified && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                              ✓ Verificado
                            </span>
                          )}
                          {isExpiringSoon && (
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium animate-pulse">
                              ⚠️ Expira em {daysLeft} dias
                            </span>
                          )}
                        </div>
                        
                        <h5 className="font-medium text-gray-900 mb-1">{coupon.description}</h5>
                        
                        {coupon.minValue && (
                          <p className="text-sm text-gray-600 mb-2">
                            💰 Válido para compras acima de R$ {coupon.minValue}
                            {coupon.maxDiscount && ` (desconto máximo: R$ ${coupon.maxDiscount})`}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Válido até {formatDate(coupon.expiryDate)}
                          </div>
                          <span>✅ {coupon.successRate}% de sucesso</span>
                          <span>👥 {coupon.usedCount} pessoas usaram</span>
                        </div>
                      </div>
                      
                      <div className="ml-4 flex flex-col gap-2">
                        <button
                          onClick={() => handleCopyCoupon(coupon.code)}
                          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${
                            copiedCoupon === coupon.code
                              ? 'bg-green-500 text-white'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                        >
                          {copiedCoupon === coupon.code ? (
                            <>✓ Copiado!</>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copiar {coupon.code}
                            </>
                          )}
                        </button>
                        
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm">
                          <ExternalLink className="w-4 h-4" />
                          Ir à loja
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* How to Use */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-medium text-blue-800 mb-2">💡 Como usar os cupons:</h5>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Clique em "Copiar" no cupom desejado</li>
              <li>2. Vá até a loja clicando em "Ir à loja"</li>
              <li>3. Adicione o produto ao carrinho</li>
              <li>4. Cole o código do cupom no checkout</li>
              <li>5. Aproveite o desconto! 🎉</li>
            </ol>
          </div>

          {/* No Coupons */}
          {activeCoupons.length === 0 && (
            <div className="text-center py-8">
              <Tag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-2">Nenhum cupom ativo no momento</p>
              <p className="text-sm text-gray-400">Volte em breve para conferir novas ofertas!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}