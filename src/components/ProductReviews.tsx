'use client';

import { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, MessageCircle, User } from 'lucide-react';

interface Review {
  id: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  helpful: number;
  notHelpful: number;
  verified: boolean;
}

interface ProductReviewsProps {
  productTitle: string;
  averageRating?: number;
  totalReviews?: number;
}

export default function ProductReviews({ productTitle, averageRating = 0, totalReviews = 0 }: ProductReviewsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    comment: '',
    userName: ''
  });

  // Dados simulados de reviews
  const [reviews] = useState<Review[]>([
    {
      id: '1',
      userName: 'João Silva',
      rating: 5,
      title: 'Excelente produto!',
      comment: 'Superou minhas expectativas. Qualidade muito boa e entrega rápida. Recomendo!',
      date: '2024-01-15',
      helpful: 12,
      notHelpful: 1,
      verified: true
    },
    {
      id: '2',
      userName: 'Maria Santos',
      rating: 4,
      title: 'Bom custo-benefício',
      comment: 'Produto de boa qualidade pelo preço. Algumas funcionalidades poderiam ser melhores, mas no geral estou satisfeita.',
      date: '2024-01-10',
      helpful: 8,
      notHelpful: 2,
      verified: true
    },
    {
      id: '3',
      userName: 'Pedro Costa',
      rating: 3,
      title: 'Mediano',
      comment: 'Produto ok, mas esperava mais pela descrição. Funciona bem, mas nada excepcional.',
      date: '2024-01-08',
      helpful: 5,
      notHelpful: 3,
      verified: false
    },
    {
      id: '4',
      userName: 'Ana Oliveira',
      rating: 5,
      title: 'Perfeito!',
      comment: 'Chegou rapidinho e exatamente como descrito. Já é o segundo que compro. Qualidade top!',
      date: '2024-01-05',
      helpful: 15,
      notHelpful: 0,
      verified: true
    },
    {
      id: '5',
      userName: 'Carlos Ferreira',
      rating: 2,
      title: 'Não recomendo',
      comment: 'Produto veio com defeito e o atendimento foi péssimo. Tive que devolver.',
      date: '2024-01-03',
      helpful: 3,
      notHelpful: 8,
      verified: true
    }
  ]);

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    };

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const avgRating = calculateAverageRating();
  const distribution = getRatingDistribution();

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <span className="text-lg font-semibold text-gray-900">⭐ Avaliações</span>
          <div className="flex items-center gap-2">
            {renderStars(avgRating)}
            <span className="font-semibold text-gray-900">{avgRating.toFixed(1)}</span>
            <span className="text-gray-500">({reviews.length} avaliações)</span>
          </div>
          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
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
          {/* Rating Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Overall Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">{avgRating.toFixed(1)}</div>
              {renderStars(avgRating, 'lg')}
              <div className="text-gray-600 mt-2">{reviews.length} avaliações</div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = distribution[rating as keyof typeof distribution];
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center gap-2 text-sm">
                    <span className="w-8">{rating}★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="w-8 text-gray-600">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Write Review Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowWriteReview(!showWriteReview)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Escrever Avaliação
            </button>
          </div>

          {/* Write Review Form */}
          {showWriteReview && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-4">Sua Avaliação</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nota</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= newReview.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          } hover:text-yellow-400 transition-colors`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">({newReview.rating}/5)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Seu Nome</label>
                  <input
                    type="text"
                    value={newReview.userName}
                    onChange={(e) => setNewReview({ ...newReview, userName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Digite seu nome"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Título da Avaliação</label>
                  <input
                    type="text"
                    value={newReview.title}
                    onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Resuma sua experiência"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comentário</label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Conte sobre sua experiência com o produto..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowWriteReview(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      // Aqui você salvaria a avaliação
                      console.log('Nova avaliação:', newReview);
                      setShowWriteReview(false);
                      setNewReview({ rating: 5, title: '', comment: '', userName: '' });
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Publicar Avaliação
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Avaliações dos Usuários</h4>
            {reviews.map((review) => (
              <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{review.userName}</span>
                        {review.verified && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                            ✓ Compra Verificada
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {renderStars(review.rating, 'sm')}
                        <span className="text-sm text-gray-500">{formatDate(review.date)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>
                <p className="text-gray-700 mb-3">{review.comment}</p>

                <div className="flex items-center gap-4 text-sm">
                  <button className="flex items-center gap-1 text-gray-600 hover:text-green-600 transition-colors">
                    <ThumbsUp className="w-4 h-4" />
                    Útil ({review.helpful})
                  </button>
                  <button className="flex items-center gap-1 text-gray-600 hover:text-red-600 transition-colors">
                    <ThumbsDown className="w-4 h-4" />
                    Não útil ({review.notHelpful})
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}