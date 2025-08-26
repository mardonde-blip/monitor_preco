'use client';

import { useState, useEffect } from 'react';
import ProductSearch from '../components/ProductSearch';
import ProductList from '../components/ProductList';
import TelegramSettings from '../components/TelegramSettings';
import SchedulerControl from '../components/SchedulerControl';
import { Product, NotificationSettings } from '../types';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState('add-products');
  const [productName, setProductName] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [referencePrice, setReferencePrice] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    telegram: {
      botToken: '',
      chatId: ''
    }
  });

  // Carregar produtos salvos
  useEffect(() => {
    const savedProducts = localStorage.getItem('monitoredProducts');
    if (savedProducts) {
      try {
        const parsedProducts = JSON.parse(savedProducts);
        // Limpar produtos com histórico corrompido
        const cleanProducts = parsedProducts.map((product: Product) => ({
          ...product,
          priceHistory: (product.priceHistory || []).filter(entry => entry.price !== undefined)
        }));
        setProducts(cleanProducts);
        localStorage.setItem('monitoredProducts', JSON.stringify(cleanProducts));
      } catch (error) {
        console.error('Erro ao carregar produtos salvos:', error);
        localStorage.removeItem('monitoredProducts');
        setProducts([]);
      }
    } else {
      // Produtos de exemplo que estavam funcionando
      const defaultProducts: Product[] = [
        {
          id: '1',
          name: 'Whisky Buchanan\'s Deluxe 12 Anos 1L',
          url: 'https://www.carrefour.com.br/whisky-buchanans-deluxe-12-anos-1l-6-unidades-b2-6-164666/p',
          initialPrice: 200.00,
          currentPrice: 189.90,
          targetPrice: 180.00,
          selector: 'auto',
          addedAt: new Date().toISOString(),
          lastChecked: new Date().toISOString(),
          status: 'active'
        },
        {
          id: '2',
          name: 'iPhone 15 Pro 128GB',
          url: 'https://www.amazon.com.br/dp/B0CHX1W1XY',
          initialPrice: 8999.00,
          currentPrice: 8499.00,
          targetPrice: 7500.00,
          selector: 'auto',
          addedAt: new Date().toISOString(),
          lastChecked: new Date().toISOString(),
          status: 'active'
        }
      ];
      setProducts(defaultProducts);
      localStorage.setItem('monitoredProducts', JSON.stringify(defaultProducts));
    }

    const savedSettings = localStorage.getItem('telegramSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    } else {
      // Configurações padrão do Telegram
      const defaultSettings = {
        telegram: {
          botToken: process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || '',
          chatId: process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID || ''
        },
        enabled: true
      };
      setSettings(defaultSettings);
       localStorage.setItem('telegramSettings', JSON.stringify(defaultSettings));
     }
  }, []);

  const handleAddProduct = async (url: string, title: string, currentPrice: number, referencePrice?: number) => {
    // Usar preço de referência se fornecido, senão usar preço atual
    const initialPriceToUse = referencePrice || currentPrice;
    
    const newProduct: Product = {
      id: Date.now().toString(),
      name: title,
      url,
      initialPrice: initialPriceToUse,
      currentPrice,
      targetPrice: initialPriceToUse * 0.9, // 10% de desconto como meta baseado no preço de referência
      selector: 'auto',
      addedAt: new Date().toISOString(),
      lastChecked: new Date().toISOString(),
      status: 'active',
      priceHistory: [{ price: currentPrice, date: new Date().toISOString() }]
    };

     // Salvar no localStorage
     const updatedProducts = [...products, newProduct];
     setProducts(updatedProducts);
     localStorage.setItem('monitoredProducts', JSON.stringify(updatedProducts));

    // Verificar preco imediatamente
    try {
      await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: [newProduct] })
      });
    } catch (error) {
      console.error('Erro ao verificar preco:', error);
    }

    alert('Produto adicionado ao monitoramento!');
  };

  const fetchProductPrice = async (url: string) => {
    if (!url || !url?.startsWith('http')) return;
    
    setIsLoadingPrice(true);
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.price) {
          setCurrentPrice(data.price.toString());
          if (data.title && !productName) {
            setProductName(data.title);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar preço:', error);
    } finally {
      setIsLoadingPrice(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setProductUrl(url);
    if (url && url?.startsWith('http')) {
      fetchProductPrice(url);
    }
  };

  const handleAddNewProduct = () => {
    if (!productName || !productUrl || !targetPrice) {
      alert('Por favor, preencha todos os campos');
      return;
    }
    
    // Usar preço de referência se fornecido, senão usar preço atual detectado, senão usar preço alvo
    const initialPriceToUse = referencePrice || currentPrice || targetPrice;
    const hasDetectedPrice = !!currentPrice;

    const newProduct: Product = {
      id: Date.now().toString(),
      name: productName,
      url: productUrl,
      initialPrice: parseFloat(initialPriceToUse),
      currentPrice: hasDetectedPrice ? parseFloat(currentPrice) : undefined,
      targetPrice: parseFloat(targetPrice),
      selector: 'auto',
      addedAt: new Date().toISOString(),
      lastChecked: hasDetectedPrice ? new Date().toISOString() : undefined,
      status: 'active',
      priceHistory: hasDetectedPrice ? [{
        price: parseFloat(currentPrice),
        date: new Date().toISOString()
      }] : []
    };

    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    localStorage.setItem('monitoredProducts', JSON.stringify(updatedProducts));
    
    // Limpar formulário
    setProductName('');
    setProductUrl('');
    setCurrentPrice('');
    setReferencePrice('');
    setTargetPrice('');
    
    alert('Produto adicionado ao monitoramento!');
  };

  const handleDeleteProduct = (id: string) => {
    const updatedProducts = products.filter(p => p.id !== id);
    setProducts(updatedProducts);
    localStorage.setItem('monitoredProducts', JSON.stringify(updatedProducts));
  };

  const handleCheckPrice = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    try {
      const requestData = { 
        products: [product],
        settings: settings || { enabled: false, telegram: { botToken: '', chatId: '' } }
      };
      
      console.log('Sending request data:', requestData);
      console.log('Product data:', product);
      
      const response = await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          if (result.success && result.newPrice !== undefined) {
            const currentPrice = product.currentPrice || product.initialPrice;
            const newPrice = result.newPrice;
            
            // Atualizar os produtos
            const updatedProducts = products.map(p => {
              if (p.id === id) {
                return {
                  ...p,
                  currentPrice: result.newPrice,
                  lastChecked: new Date().toISOString(),
                  priceHistory: [...(p.priceHistory || []).filter(entry => entry.price !== undefined), {
                    price: result.newPrice,
                    date: new Date().toISOString()
                  }]
                };
              }
              return p;
            });
            setProducts(updatedProducts);
            localStorage.setItem('monitoredProducts', JSON.stringify(updatedProducts));
            
            // Mostrar mensagem baseada na mudança de preço
            if (Math.abs(newPrice - currentPrice) < 0.01) {
              alert(`✅ Verificação concluída!\n\nO preço não foi alterado.\nPreço atual: R$ ${newPrice.toFixed(2).replace('.', ',')}`);
            } else {
              const diferenca = newPrice - currentPrice;
              const simbolo = diferenca > 0 ? '📈' : '📉';
              const texto = diferenca > 0 ? 'aumentou' : 'diminuiu';
              alert(`${simbolo} Alteração no preço detectada!\n\nPreço anterior: R$ ${currentPrice.toFixed(2).replace('.', ',')}\nPreço atual: R$ ${newPrice.toFixed(2).replace('.', ',')}\n\nO preço ${texto} R$ ${Math.abs(diferenca).toFixed(2).replace('.', ',')}`);
            }
          } else {
            console.error('Erro no scraping:', result.error);
            alert('❌ Não foi possível verificar o preço.\n\nMotivo: ' + (result.error || 'Falha no scraping'));
          }
        }
      } else {
        console.error('Erro na resposta da API:', response.status);
        alert('❌ Não foi possível verificar o preço.\n\nMotivo: Erro na comunicação com o servidor. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao verificar preco:', error);
      alert('❌ Não foi possível verificar o preço.\n\nMotivo: Erro de conexão. Verifique sua internet e tente novamente.');
    }
  };

  const handleUpdateSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    localStorage.setItem('telegramSettings', JSON.stringify(newSettings));
  };

  const categories = [
    { name: 'Celulares', icon: '📱', color: 'bg-blue-500' },
    { name: 'Eletrônicos', icon: '💻', color: 'bg-purple-500' },
    { name: 'Casa', icon: '🏠', color: 'bg-green-500' },
    { name: 'Moda', icon: '👕', color: 'bg-pink-500' },
    { name: 'Esportes', icon: '⚽', color: 'bg-orange-500' },
    { name: 'Livros', icon: '📚', color: 'bg-indigo-500' },
  ];

  const featuredOffers = [
    { title: 'iPhone 15 Pro', originalPrice: 8999, currentPrice: 7499, discount: 17, store: 'Amazon' },
    { title: 'Samsung Galaxy S24', originalPrice: 4999, currentPrice: 3999, discount: 20, store: 'Magazine Luiza' },
    { title: 'Notebook Dell', originalPrice: 3499, currentPrice: 2799, discount: 20, store: 'Casas Bahia' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-3xl font-bold text-white flex items-center">
                🔍 <span className="ml-2">Lucre Na Promo</span>
            </h1>
              </div>
            </div>
            <nav className="hidden md:flex space-x-6">
              <button
                onClick={() => setActiveTab('add-products')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'add-products'
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-blue-100 hover:text-white hover:bg-blue-700'
                }`}
              >
                ➕ Adicionar Produtos
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'products'
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-blue-100 hover:text-white hover:bg-blue-700'
                }`}
              >
                📋 Monitorados ({products.length})
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'settings'
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-blue-100 hover:text-white hover:bg-blue-700'
                }`}
              >
                ⚙️ Configurações
              </button>
              <button
                onClick={() => setActiveTab('automation')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'automation'
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-blue-100 hover:text-white hover:bg-blue-700'
                }`}
              >
                🤖 Automação
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {activeTab === 'add-products' ? (
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Hero Section */}
            <div className="text-center mb-12">
            </div>

            {/* Add Product Section */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Adicionar Produtos para Monitoramento
                </h2>
                <p className="text-gray-600">
                  Adicione produtos que você deseja monitorar os preços
                </p>
              </div>
              
              <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Produto
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Ex: iPhone 15 Pro, Notebook Dell, Smart TV Samsung..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL do Produto
                  </label>
                  <input
                    type="url"
                    value={productUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://www.exemplo.com/produto"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {isLoadingPrice && (
                    <p className="text-sm text-blue-600 mt-2">🔍 Buscando preço automaticamente...</p>
                  )}
                </div>
                
                {currentPrice && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-800">Preço encontrado:</span>
                      <span className="text-lg font-bold text-green-600">R$ {parseFloat(currentPrice).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                    </div>
                  </div>
                )}
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço de Referência (R$) - Opcional
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={referencePrice}
                    onChange={(e) => setReferencePrice(e.target.value)}
                    placeholder="0,00 - Deixe vazio para usar o preço atual detectado"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Este será o preço usado como base para comparação. Se não preenchido, usará o preço atual detectado automaticamente.
                  </p>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço Alvo (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="0,00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <button 
                  onClick={handleAddNewProduct}
                  disabled={isLoadingPrice}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingPrice ? '🔍 Buscando preço...' : '➕ Adicionar ao Monitoramento'}
                </button>
              </div>
            </div>




          </div>
        </main>
      ) : (
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                {activeTab === 'products' && 'Produtos Monitorados'}
                {activeTab === 'settings' && 'Configuracoes do Telegram'}
                {activeTab === 'automation' && 'Automacao de Precos'}
              </h2>
              <p className="text-gray-600 text-lg">Compare precos e encontre as melhores ofertas</p>
            </div>
            
            {activeTab === 'products' ? (
              <ProductList 
                products={products}
                onRemoveProduct={handleDeleteProduct}
                onMonitorProduct={handleCheckPrice}
                onEditProduct={(productId: string, newPrice: number) => {
                  const updatedProducts = products.map(product => {
                    if (product.id === productId) {
                      return {
                        ...product,
                        initialPrice: newPrice,
                        targetPrice: newPrice * 0.9
                      };
                    }
                    return product;
                  });
                  setProducts(updatedProducts);
                  localStorage.setItem('monitoredProducts', JSON.stringify(updatedProducts));
                }}
              />
            ) : activeTab === 'settings' ? (
              <TelegramSettings 
                settings={settings} 
                onUpdateSettings={handleUpdateSettings}
              />
            ) : (
              <SchedulerControl />
            )}
          </div>
        </main>
      )}
    </div>
  );
}
