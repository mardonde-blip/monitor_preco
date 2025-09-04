'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  nome_completo: string;
  email: string;
  telegram_id?: string;
}

interface Product {
  id: number;
  name: string;
  url: string;
  target_price: number;
  current_price?: number;
  store: string;
  is_active: boolean;
}

export default function ProductsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    show: boolean;
  }>({ message: '', type: 'success', show: false });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [schedulerStatus, setSchedulerStatus] = useState({ isRunning: false, interval: 60 });
  const [monitoringInterval, setMonitoringInterval] = useState(60);

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type, show: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };
  
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          loadProducts();
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        router.push('/');
      }
    };

    const loadSchedulerStatus = async () => {
      try {
        const response = await fetch('/api/scheduler');
        if (response.ok) {
          const data = await response.json();
          setSchedulerStatus({ isRunning: data.isRunning, interval: monitoringInterval });
        }
      } catch (error) {
        console.error('Erro ao carregar status do scheduler:', error);
      }
    };

    checkAuth();
    loadSchedulerStatus();
  }, [router, monitoringInterval]);

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      } else {
        showNotification('Erro ao carregar produtos', 'error');
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      showNotification('Erro de conexão ao carregar produtos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId: number) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        showNotification('🗑️ Produto removido com sucesso!', 'success');
        loadProducts(); // Recarregar a lista
      } else {
        const errorData = await response.json();
        showNotification(`Erro ao remover produto: ${errorData.error || 'Erro desconhecido'}`, 'error');
      }
    } catch (error) {
      console.error('Erro ao remover produto:', error);
      showNotification('Erro de conexão ao remover produto', 'error');
    }
  };

  const updateProductPrice = async () => {
    if (!editingProduct) return;
    
    const newPrice = parseFloat(editPrice);
    if (isNaN(newPrice) || newPrice <= 0) {
      showNotification('Por favor, insira um preço válido', 'error');
      return;
    }

    try {
      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingProduct.id,
          name: editingProduct.name,
          url: editingProduct.url,
          target_price: newPrice,
          store: editingProduct.store,
          is_active: editingProduct.is_active
        }),
      });

      if (response.ok) {
        showNotification('💰 Preço alvo atualizado com sucesso!', 'success');
        setEditingProduct(null);
        setEditPrice('');
        loadProducts(); // Recarregar a lista
      } else {
        const errorData = await response.json();
        showNotification(`Erro ao atualizar preço: ${errorData.error || 'Erro desconhecido'}`, 'error');
      }
    } catch (error) {
      console.error('Erro ao atualizar preço:', error);
      showNotification('Erro de conexão ao atualizar preço', 'error');
    }
  };

  const toggleProductStatus = async (productId: number, currentStatus: boolean) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: product.id,
          name: product.name,
          url: product.url,
          target_price: product.target_price,
          store: product.store,
          is_active: !currentStatus
        }),
      });

      if (response.ok) {
        showNotification(
          `${!currentStatus ? '✅ Monitoramento ativado' : '❌ Monitoramento desativado'} para ${product.name}`,
          'success'
        );
        loadProducts(); // Recarregar a lista
      } else {
        const errorData = await response.json();
        showNotification(`Erro ao alterar status: ${errorData.error || 'Erro desconhecido'}`, 'error');
      }
    } catch (error) {
      console.error('Erro ao alterar status do produto:', error);
      showNotification('Erro de conexão ao alterar status', 'error');
    }
  };



  const toggleScheduler = async () => {
    try {
      const action = schedulerStatus.isRunning ? 'stop' : 'start';
      const response = await fetch('/api/scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          intervalMinutes: monitoringInterval
        }),
      });

      if (response.ok) {
        const data = await response.json();
        showNotification(data.message, 'success');
        setSchedulerStatus({ isRunning: data.isRunning, interval: monitoringInterval });
      } else {
        const errorData = await response.json();
        showNotification(`Erro: ${errorData.error || 'Erro desconhecido'}`, 'error');
      }
    } catch (error) {
      console.error('Erro ao controlar scheduler:', error);
      showNotification('Erro de conexão', 'error');
    }
  };

  const runManualCheck = async () => {
    try {
      const response = await fetch('/api/scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'manual' }),
      });

      if (response.ok) {
        const data = await response.json();
        showNotification(data.message, 'success');
      } else {
        const errorData = await response.json();
        showNotification(`Erro: ${errorData.error || 'Erro desconhecido'}`, 'error');
      }
    } catch (error) {
      console.error('Erro na verificação manual:', error);
      showNotification('Erro de conexão', 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📊 Produtos Monitorados</h1>
              <p className="text-gray-600">Gerencie todos os seus produtos em monitoramento</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-lg text-gray-600">
                 Olá, <span className="font-medium">{user?.nome_completo?.split(' ')[0]}</span>
               </div>
              <a
                href="/telegram-config"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium flex-shrink-0"
              >
                ⚙️ Configurar Telegram
              </a>
              <a
                href="/cadastro_produtos"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                ➕ Adicionar Produto
              </a>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-4 py-3 rounded-md shadow-lg ${
            notification.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' :
            notification.type === 'error' ? 'bg-red-100 border border-red-400 text-red-700' :
            'bg-blue-100 border border-blue-400 text-blue-700'
          }`}>
            <div className="flex items-center">
              <span className="text-sm font-medium">{notification.message}</span>
              <button
                onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                className="ml-3 text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Configurações de Monitoramento */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">⚙️ Configurações de Monitoramento</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-gray-700">Intervalo (minutos):</label>
              <input
                type="number"
                min="1"
                max="1440"
                value={monitoringInterval}
                onChange={(e) => setMonitoringInterval(parseInt(e.target.value) || 60)}
                className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleScheduler}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  schedulerStatus.isRunning
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {schedulerStatus.isRunning ? '⏹️ Parar Monitoramento' : '▶️ Iniciar Monitoramento'}
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={runManualCheck}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                🔍 Verificar Agora
              </button>
              <span className={`px-2 py-1 text-xs rounded-full ${
                schedulerStatus.isRunning ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {schedulerStatus.isRunning ? '🟢 Ativo' : '🔴 Inativo'}
              </span>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">📦</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total de Produtos</dt>
                    <dd className="text-lg font-medium text-gray-900">{products.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">✅</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Produtos Ativos</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {products.filter(p => p.is_active).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">❌</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Produtos Inativos</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {products.filter(p => !p.is_active).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Produtos */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">📋 Lista de Produtos</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {products.length} produto(s) sendo monitorado(s)
                </p>
              </div>
              <a
                href="/cadastro_produtos"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
              >
                <span>➕</span>
                <span>Novo Produto</span>
              </a>
            </div>
            
            {products.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto cadastrado</h3>
                <p className="text-gray-500 text-sm mb-6">Adicione seu primeiro produto para começar o monitoramento de preços</p>
                <a
                  href="/cadastro_produtos"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-sm font-medium inline-flex items-center space-x-2"
                >
                  <span>➕</span>
                  <span>Adicionar Primeiro Produto</span>
                </a>
              </div>
            ) : (
              <div className="grid gap-4">
                {products.map((product) => (
                  <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h5 className="font-medium text-gray-900 truncate">{product.name}</h5>
                          <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                            product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {product.is_active ? '✅ Ativo' : '❌ Inativo'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <span>🏪</span>
                            <span>{product.store}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>🎯</span>
                            <span>Alvo: R$ {product.target_price.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>💰</span>
                            <span>
                              Atual: {product.current_price ? `R$ ${product.current_price.toFixed(2)}` : 'Verificando...'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <a 
                            href={product.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                          >
                            <span>🔗</span>
                            <span>Ver produto</span>
                          </a>
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0 ml-4 flex space-x-2">
                        <button
                          onClick={() => toggleProductStatus(product.id, product.is_active)}
                          className={`p-2 rounded-md transition-colors ${
                            product.is_active
                              ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                              : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                          }`}
                          title={product.is_active ? 'Desativar monitoramento' : 'Ativar monitoramento'}
                        >
                          {product.is_active ? '⏸️' : '▶️'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setEditPrice(product.target_price.toString());
                          }}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-50 transition-colors"
                          title="Editar preço alvo"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-50 transition-colors"
                          title="Remover produto"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Edição de Preço */}
      {editingProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">✏️ Editar Preço Alvo</h3>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setEditPrice('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Produto:</strong> {editingProduct.name}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>Preço atual:</strong> R$ {editingProduct.target_price.toFixed(2)}
                </p>
              </div>

              <div className="mb-4">
                <label htmlFor="editPrice" className="block text-sm font-medium text-gray-700 mb-2">
                  Novo Preço Alvo (R$)
                </label>
                <input
                  type="number"
                  id="editPrice"
                  step="0.01"
                  min="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  autoFocus
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setEditPrice('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={updateProductPrice}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}