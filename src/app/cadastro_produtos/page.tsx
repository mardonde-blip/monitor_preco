'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  nome_completo: string;
  email: string;
  telegram_id?: string;
}



export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [productForm, setProductForm] = useState({
    name: '',
    url: '',
    target_price: '',
    store: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    show: boolean;
  }>({ message: '', type: 'success', show: false });

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type, show: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        router.push('/');
      }
    } catch (_) {
      router.push('/');
    } finally {
      setLoading(false);
    }
  };



  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (_) {
      console.error('Erro no logout:', _);
    }
  };

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...productForm,
          target_price: parseFloat(productForm.target_price)
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        showNotification(data.message, 'success');
        setProductForm({ name: '', url: '', target_price: '', store: '' });
      } else {
        if (response.status === 409) {
          showNotification('❌ Este produto já está sendo monitorado! Verifique sua lista de produtos.', 'error');
        } else {
          showNotification(data.error || 'Erro ao adicionar produto', 'error');
        }
      }
    } catch (_) {
      showNotification('Erro de conexão. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
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
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">📦 Cadastro de Produtos</h1>
              <p className="text-sm sm:text-base text-gray-600 truncate">Adicione produtos para monitoramento de preços</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-lg text-gray-600">
                 Olá, <span className="font-medium">{user?.nome_completo?.split(' ')[0]}</span>
               </div>
              <a
                href="/produtos_monitorados"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
              >
                <span>📊</span>
                <span>Produtos Monitorados</span>
              </a>
               <a
                 href="/telegram-config"
                 className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium flex-shrink-0"
               >
                 ⚙️ Configurar Telegram
               </a>
               <button
                 onClick={handleLogout}
                 className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium flex-shrink-0"
               >
                 Sair
               </button>
             </div>
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-full ${
          notification.type === 'success' ? 'bg-green-500' :
          notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        } text-white p-4 rounded-lg shadow-lg transform transition-all duration-300`}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{notification.message}</p>
            <button
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
              className="ml-2 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <div className="py-4 sm:py-6">
          <div className="max-w-2xl mx-auto">
            {/* Adicionar Produto */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-4 sm:px-6 sm:py-5">
                <div className="mb-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                    📋 Adicionar Novo Produto
                  </h3>
                  <p className="text-sm text-gray-600">
                    Preencha as informações do produto que deseja monitorar
                  </p>
                </div>

                <form onSubmit={addProduct} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label htmlFor="product_name" className="block text-sm font-medium text-gray-700 mb-2">
                        🏷️ Nome do Produto *
                      </label>
                      <input
                        type="text"
                        id="product_name"
                        required
                        value={productForm.name}
                        onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-4 py-3"
                        placeholder="Ex: iPhone 15 Pro Max 256GB"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="product_url" className="block text-sm font-medium text-gray-700 mb-2">
                        🔗 URL do Produto *
                      </label>
                      <input
                        type="url"
                        id="product_url"
                        required
                        value={productForm.url}
                        onChange={(e) => setProductForm({...productForm, url: e.target.value})}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-4 py-3"
                        placeholder="https://exemplo.com/produto"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="target_price" className="block text-sm font-medium text-gray-700 mb-2">
                          💰 Preço Alvo (R$) *
                        </label>
                        <input
                          type="number"
                          id="target_price"
                          step="0.01"
                          min="0"
                          required
                          value={productForm.target_price}
                          onChange={(e) => setProductForm({...productForm, target_price: e.target.value})}
                          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-4 py-3"
                          placeholder="1299.99"
                        />
                      </div>
                      <div>
                        <label htmlFor="store" className="block text-sm font-medium text-gray-700 mb-2">
                          🏪 Loja *
                        </label>
                        <input
                          type="text"
                          id="store"
                          required
                          value={productForm.store}
                          onChange={(e) => setProductForm({...productForm, store: e.target.value})}
                          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-4 py-3"
                          placeholder="Ex: Amazon, Mercado Livre"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg text-sm font-medium flex items-center space-x-2"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Adicionando...</span>
                        </>
                      ) : (
                        <>
                          <span>➕</span>
                          <span>Adicionar Produto</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>


        </div>
      </main>
    </div>
  );
}