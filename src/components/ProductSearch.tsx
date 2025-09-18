'use client';

import { useState } from 'react';
import { Search, Loader2, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  site: string;
  title: string;
  price: number;
  url: string;
  image?: string;
  relevanceScore?: number;
}

export default function ProductSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchError, setSearchError] = useState('');
  const [searchStats, setSearchStats] = useState<{
    totalResults: number;
    searchTime: number;
    lowestPrice: number;
    averagePrice: number;
  } | null>(null);
  const router = useRouter();

  const validateSearch = (term: string) => {
    if (!term.trim()) {
      return 'Digite um termo de busca';
    }
    if (term.trim().length < 2) {
      return 'O termo de busca deve ter pelo menos 2 caracteres';
    }
    return '';
  };

  const clearSearchError = () => {
    setSearchError('');
  };

  const handleSearch = async () => {
    const validationError = validateSearch(searchTerm);
    if (validationError) {
      setSearchError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setSearchError('');
    setSearchStats(null);
    
    const searchStartTime = Date.now();

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchTerm }),
      });

      if (!response.ok) {
        throw new Error('Erro na busca');
      }

      const data = await response.json();
      const searchEndTime = Date.now();
      const searchDuration = (searchEndTime - searchStartTime) / 1000;
      
      if (data.results && data.results.length > 0) {
        // Calcular estatísticas da busca
        const prices = data.results.map((r: SearchResult) => r.price);
        const lowestPrice = Math.min(...prices);
        const averagePrice = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
        
        setSearchStats({
          totalResults: data.results.length,
          searchTime: searchDuration,
          lowestPrice,
          averagePrice
        });

        // Aguardar um pouco para mostrar as estatísticas antes de redirecionar
        setTimeout(() => {
          // Criar slug do produto para a URL
          const productSlug = searchTerm
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .trim();
          
          // Redirecionar para a página do produto
          router.push(`/produto/${encodeURIComponent(productSlug)}`);
        }, 1500);
      } else if (data.error) {
        setError(data.error);
      } else {
        setError('Nenhum produto encontrado para esta busca');
      }
    } catch (err) {
      setError('Erro ao realizar busca');
      console.error('Erro na busca:', err);
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="w-full">
      {/* Search Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Busque e Compare Preços
        </h2>
        <p className="text-gray-600">
          Digite o nome do produto e encontre as melhores ofertas
        </p>
      </div>

      {/* Search Form */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              clearSearchError();
            }}
            onKeyPress={handleKeyPress}
            placeholder="Ex: iPhone 15, Samsung Galaxy, Notebook Dell..."
            className={`w-full px-4 py-3 pr-12 border rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              searchError ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-blue-600 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </button>
        </div>
        
        {searchError && (
          <p className="text-red-500 text-sm mt-2">{searchError}</p>
        )}
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Search Stats */}
      {searchStats && (
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-green-800">
                Busca realizada com sucesso!
              </h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-center mb-2">
                  <Search className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {searchStats.totalResults}
                </div>
                <div className="text-sm text-gray-600">Resultados</div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {searchStats.searchTime.toFixed(1)}s
                </div>
                <div className="text-sm text-gray-600">Tempo</div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-center mb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  R$ {searchStats.lowestPrice.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Menor Preço</div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  R$ {searchStats.averagePrice.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Preço Médio</div>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-green-700">
                Redirecionando para os resultados...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}