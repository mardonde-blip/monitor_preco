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

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(true); // Sempre mostrar o formulário
  const [productForm, setProductForm] = useState({
    name: '',
    url: '',
    target_price: '',
    store: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        loadUserProducts();
      } else {
        router.push('/');
      }
    } catch (error) {
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const loadUserProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
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

      if (response.ok) {
        alert('Produto adicionado com sucesso!');
        setProductForm({ name: '', url: '', target_price: '', store: '' });
        loadUserProducts();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erro ao adicionar produto');
      }
    } catch (error) {
      alert('Erro de conexão');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteProduct = async (productId: number) => {
    if (!confirm('Tem certeza que deseja remover este produto?')) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Produto removido com sucesso!');
        loadUserProducts();
      } else {
        alert('Erro ao remover produto');
      }
    } catch (error) {
      alert('Erro de conexão');
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
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">📦 Cadastrar Produtos</h1>
              <p className="text-sm sm:text-base text-gray-600 truncate">Adicione produtos para monitoramento de preços</p>
            </div>
            <div className="flex items-center space-x-4">
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

          {/* Lista de Produtos */}
          <div className="mt-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-4 sm:px-6 sm:py-5">
                <div className="mb-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                    📊 Produtos Monitorados
                  </h3>
                  <p className="text-sm text-gray-600">
                    {products.length} produto(s) sendo monitorado(s)
                  </p>
                </div>
                
                {products.length === 0 ? (
                  <div className="text-center py-12">
                     <div className="text-6xl mb-4">📦</div>
                     <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto cadastrado</h3>
                     <p className="text-gray-500 text-sm mb-4">Adicione seu primeiro produto para começar o monitoramento de preços</p>
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
                          
                          <div className="flex-shrink-0 ml-4">
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
          </div>
        </div>
      </main>
    </div>
  );
}