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

interface ProductSearchProps {
  onAddToMonitor?: (url: string, title: string, price: number) => void;
}

export default function ProductSearch({ onAddToMonitor }: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchStats, setSearchStats] = useState<{
    totalResults: number;
    searchTime: number;
    lowestPrice: number;
    averagePrice: number;
  } | null>(null);
  const router = useRouter();

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Digite um termo de busca');
      return;
    }

    setLoading(true);
    setError('');
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
    </div>
  );
}