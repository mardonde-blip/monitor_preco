'use client';

import { useState } from 'react';
import { Product } from '@/types';

interface ProductListProps {
  products: Product[];
  onRemoveProduct: (productId: string) => void;
  onMonitorProduct: (productId: string) => void;
  onEditProduct: (productId: string, newPrice: number) => void;
}

export default function ProductList({ products, onRemoveProduct, onMonitorProduct, onEditProduct }: ProductListProps) {
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  if (products.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Produtos Monitorados</h2>
        <p className="text-gray-500 text-center py-8">
          Nenhum produto adicionado ainda. Adicione um produto para começar o monitoramento.
        </p>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (date: Date | string) => {
    if (!date) {
      return 'Data não disponível';
    }
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!dateObj || isNaN(dateObj.getTime())) {
      return 'Data inválida';
    }
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  };

  const getPriceStatus = (currentPrice: number | undefined, initialPrice: number) => {
    if (!currentPrice) {
      return { status: 'not-checked', color: 'text-gray-600', icon: '⏳' };
    }
    if (currentPrice < initialPrice) {
      return { status: 'price-drop', color: 'text-green-600', icon: '📉' };
    } else if (currentPrice === initialPrice) {
      return { status: 'same-price', color: 'text-blue-600', icon: '➡️' };
    } else {
      return { status: 'price-increase', color: 'text-red-600', icon: '📈' };
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Produtos Monitorados</h2>
      
      <div className="space-y-4">
        {products.map((product) => {
          const priceStatus = getPriceStatus(product.currentPrice, product.initialPrice);
          
          return (
            <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{product.name}</h3>
                  <a 
                    href={product.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm truncate block max-w-md"
                  >
                    {product.url}
                  </a>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => onMonitorProduct(product.id)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Verificar
                  </button>
                  <button
                    onClick={() => {
                      setEditingProduct(product.id);
                      setEditPrice(product.initialPrice.toString());
                    }}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onRemoveProduct(product.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Remover
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Preço de Referência:</span>
                  {editingProduct === product.id ? (
                    <div className="flex items-center space-x-2 mt-1">
                      <input
                        type="number"
                        step="0.01"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                      <button
                        onClick={() => {
                          const newPrice = parseFloat(editPrice);
                          if (!isNaN(newPrice) && newPrice > 0) {
                            onEditProduct(product.id, newPrice);
                            setEditingProduct(null);
                            setEditPrice('');
                          }
                        }}
                        className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => {
                          setEditingProduct(null);
                          setEditPrice('');
                        }}
                        className="bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <p className="font-semibold text-lg">{formatPrice(product.initialPrice)}</p>
                  )}
                </div>
                
                <div>
                  <span className="text-gray-500">Preço Atual:</span>
                  <p className="font-semibold text-lg">
                    {product.currentPrice ? formatPrice(product.currentPrice) : 'Não verificado'}
                  </p>
                </div>
                
                <div>
                  <span className="text-gray-500">Status:</span>
                  <p className={`font-semibold ${priceStatus.color}`}>
                    {priceStatus.icon} 
                    {priceStatus.status === 'price-drop' && 'Preço baixou!'}
                    {priceStatus.status === 'same-price' && 'Mesmo preço'}
                    {priceStatus.status === 'price-increase' && 'Preço subiu'}
                    {priceStatus.status === 'not-checked' && 'Não verificado'}
                  </p>
                </div>
                
                <div>
                  <span className="text-gray-500">Adicionado:</span>
                  <p className="font-medium">{formatDate(product.addedAt)}</p>
                </div>
              </div>
              
              {product.lastChecked && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    Última verificação: {formatDate(product.lastChecked)}
                  </span>
                </div>
              )}
              
              <div className="mt-2">
                <span className="text-xs text-gray-500">Seletor CSS:</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded ml-2">{product.selector}</code>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}