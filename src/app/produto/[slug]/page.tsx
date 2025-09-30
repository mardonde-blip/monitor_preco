'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ArrowLeft, ExternalLink, Heart, Share2, ShoppingCart, Star, TrendingDown, TrendingUp } from 'lucide-react';
// import PriceHistory from '@/components/PriceHistory';
// import PriceAlert from '@/components/PriceAlert';
// import ProductReviews from '@/components/ProductReviews';
// import DiscountCoupons from '@/components/DiscountCoupons';

interface ProductOffer {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  store: string;
  url: string;
  shipping?: string;
  rating?: number;
  availability: 'in_stock' | 'limited' | 'out_of_stock';
  seller?: string;
  installments?: string;
}

interface ProductDetails {
  title: string;
  description: string;
  category: string;
  brand: string;
  model: string;
  image: string;
  averageRating: number;
  totalReviews: number;
  lowestPrice: number;
  highestPrice: number;
  offers: ProductOffer[];
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'store'>('price');
  const [showOnlyInStock, setShowOnlyInStock] = useState(false);

  useEffect(() => {
    // Simular carregamento dos dados do produto
    const loadProduct = async () => {
      setLoading(true);
      
      // Simular dados do produto baseado no slug
      const slug = params.slug as string;
      const productTitle = decodeURIComponent(slug).replace(/-/g, ' ');
      
      // Simular ofertas de diferentes lojas
      const mockOffers: ProductOffer[] = [
        {
          id: '1',
          title: productTitle,
          price: 299.99,
          originalPrice: 399.99,
          store: 'Amazon',
          url: 'https://amazon.com.br',
          shipping: 'Frete GRÁTIS',
          rating: 4.5,
          availability: 'in_stock',
          seller: 'Amazon',
          installments: '12x de R$ 25,00'
        },
        {
          id: '2',
          title: productTitle,
          price: 319.90,
          store: 'Mercado Livre',
          url: 'https://mercadolivre.com.br',
          shipping: 'Frete R$ 15,90',
          rating: 4.2,
          availability: 'in_stock',
          seller: 'Loja Oficial',
          installments: '10x de R$ 31,99'
        },
        {
          id: '3',
          title: productTitle,
          price: 334.99,
          store: 'Magazine Luiza',
          url: 'https://magazineluiza.com.br',
          shipping: 'Frete GRÁTIS',
          rating: 4.3,
          availability: 'limited',
          seller: 'Magazine Luiza',
          installments: '15x de R$ 22,33'
        },
        {
          id: '4',
          title: productTitle,
          price: 289.99,
          originalPrice: 349.99,
          store: 'Carrefour',
          url: 'https://carrefour.com.br',
          shipping: 'Frete R$ 12,90',
          rating: 4.1,
          availability: 'in_stock',
          seller: 'Carrefour',
          installments: '8x de R$ 36,25'
        },
        {
          id: '5',
          title: productTitle,
          price: 345.00,
          store: 'Casas Bahia',
          url: 'https://casasbahia.com.br',
          shipping: 'Frete GRÁTIS',
          rating: 3.9,
          availability: 'in_stock',
          seller: 'Casas Bahia',
          installments: '18x de R$ 19,17'
        }
      ];

      const mockProduct: ProductDetails = {
        title: productTitle,
        description: `${productTitle} com excelente qualidade e ótimo custo-benefício. Produto com garantia e entrega rápida.`,
        category: 'Eletrônicos',
        brand: 'Marca Premium',
        model: 'Modelo 2024',
        image: '/api/placeholder/400/400',
        averageRating: 4.2,
        totalReviews: 127,
        lowestPrice: Math.min(...mockOffers.map(o => o.price)),
        highestPrice: Math.max(...mockOffers.map(o => o.price)),
        offers: mockOffers
      };

      setTimeout(() => {
        setProduct(mockProduct);
        setLoading(false);
      }, 1000);
    };

    loadProduct();
  }, [params.slug]);

  const sortedOffers = product?.offers ? [...product.offers]
    .filter(offer => !showOnlyInStock || offer.availability === 'in_stock')
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'store':
          return a.store.localeCompare(b.store);
        default:
          return 0;
      }
    }) : [];

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'in_stock': return 'text-green-600';
      case 'limited': return 'text-yellow-600';
      case 'out_of_stock': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getAvailabilityText = (availability: string) => {
    switch (availability) {
      case 'in_stock': return 'Em estoque';
      case 'limited': return 'Últimas unidades';
      case 'out_of_stock': return 'Fora de estoque';
      default: return 'Consultar';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando produto...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Produto não encontrado</h1>
          <button 
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </button>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-red-600 transition-colors">
                <Heart className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Product Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <Image 
                src={product.image} 
                alt={product.title}
                width={400}
                height={320}
                className="w-full h-80 object-cover rounded-lg bg-gray-100"
              />
            </div>
            <div>
              <nav className="text-sm text-gray-500 mb-2">
                <span>{product.category}</span> &gt; <span>{product.brand}</span>
              </nav>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{product.title}</h1>
              
              <div className="flex items-center mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-5 h-5 ${i < Math.floor(product.averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
                <span className="ml-2 text-gray-600">({product.totalReviews} avaliações)</span>
              </div>

              <div className="mb-6">
                <p className="text-gray-700">{product.description}</p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Menor preço encontrado:</span>
                  <div className="flex items-center">
                    <TrendingDown className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-2xl font-bold text-green-600">
                      R$ {product.lowestPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Maior preço encontrado:</span>
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 text-red-600 mr-1" />
                    <span className="text-lg text-red-600">
                      R$ {product.highestPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <span className="text-sm font-medium text-blue-800">
                    Economia de até R$ {(product.highestPrice - product.lowestPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <span className="font-medium text-gray-700">Ordenar por:</span>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as 'price' | 'rating' | 'store')}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="price">Menor preço</option>
                <option value="rating">Melhor avaliação</option>
                <option value="store">Loja (A-Z)</option>
              </select>
            </div>
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="inStock" 
                checked={showOnlyInStock}
                onChange={(e) => setShowOnlyInStock(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="inStock" className="text-gray-700">Apenas em estoque</label>
            </div>
          </div>
        </div>

        {/* Offers List */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Ofertas encontradas ({sortedOffers.length})</h2>
          </div>
          <div className="divide-y">
            {sortedOffers.map((offer, index) => (
              <div key={offer.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="font-bold text-lg text-gray-900 mr-3">{offer.store}</span>
                      {index === 0 && (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                          MELHOR PREÇO
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center mb-2">
                      <div className="mr-4">
                        {offer.originalPrice && (
                          <span className="text-gray-500 line-through text-sm mr-2">
                            R$ {offer.originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                        <span className="text-2xl font-bold text-gray-900">
                          R$ {offer.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {offer.installments && (
                        <span className="text-sm text-gray-600">{offer.installments}</span>
                      )}
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{offer.shipping}</span>
                      <span className={getAvailabilityColor(offer.availability)}>
                        {getAvailabilityText(offer.availability)}
                      </span>
                      {offer.rating && (
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                          <span>{offer.rating}</span>
                        </div>
                      )}
                      {offer.seller && (
                        <span>Vendido por: {offer.seller}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <button 
                      onClick={() => window.open(offer.url, '_blank')}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                      disabled={offer.availability === 'out_of_stock'}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Ir à loja
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Components */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            {/* <PriceHistory 
              productTitle={product.title}
              currentPrice={product.lowestPrice}
              productUrl={sortedOffers[0]?.url || ''}
            /> */}
            <h3 className="text-lg font-semibold mb-4">Histórico de Preços</h3>
            <p className="text-gray-600">Funcionalidade temporariamente indisponível</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            {/* <PriceAlert 
              productTitle={product.title}
              currentPrice={product.lowestPrice}
              productUrl={sortedOffers[0]?.url || ''}
            /> */}
            <h3 className="text-lg font-semibold mb-4">Alerta de Preço</h3>
            <p className="text-gray-600">Funcionalidade temporariamente indisponível</p>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          {/* <ProductReviews 
            productTitle={product.title}
            averageRating={product.averageRating}
            totalReviews={product.totalReviews}
          /> */}
          <h3 className="text-lg font-semibold mb-4">Avaliações</h3>
          <p className="text-gray-600">Funcionalidade temporariamente indisponível</p>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          {/* <DiscountCoupons 
            productTitle={product.title}
            store={sortedOffers[0]?.store || 'Lojas Parceiras'}
          /> */}
          <h3 className="text-lg font-semibold mb-4">Cupons de Desconto</h3>
          <p className="text-gray-600">Funcionalidade temporariamente indisponível</p>
        </div>
      </main>
    </div>
  );
}