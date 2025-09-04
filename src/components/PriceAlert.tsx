'use client';

import { useState } from 'react';
import { Bell, Mail, MessageSquare, X } from 'lucide-react';

interface PriceAlertProps {
  productTitle: string;
  currentPrice: number;
  productUrl: string;
  onCreateAlert?: (alertData: AlertData) => void;
}

interface AlertData {
  productTitle: string;
  productUrl: string;
  targetPrice: number;
  currentPrice: number;
  email?: string;
  phone?: string;
  notificationMethod: 'email' | 'sms' | 'both';
}

export default function PriceAlert({ productTitle, currentPrice, productUrl, onCreateAlert }: PriceAlertProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState(Math.round(currentPrice * 0.9)); // 10% de desconto por padrão
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notificationMethod, setNotificationMethod] = useState<'email' | 'sms' | 'both'>('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const discountPercentage = Math.round(((currentPrice - targetPrice) / currentPrice) * 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (targetPrice >= currentPrice) {
      alert('O preço alvo deve ser menor que o preço atual');
      return;
    }
    
    if (!email && notificationMethod !== 'sms') {
      alert('Digite um email válido');
      return;
    }
    
    if (!phone && notificationMethod !== 'email') {
      alert('Digite um telefone válido');
      return;
    }

    setIsSubmitting(true);
    
    const alertData: AlertData = {
      productTitle,
      productUrl,
      targetPrice,
      currentPrice,
      email: email || undefined,
      phone: phone || undefined,
      notificationMethod
    };

    try {
      // Simular criação do alerta
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onCreateAlert) {
        onCreateAlert(alertData);
      }
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
      }, 2000);
    } catch {
      alert('Erro ao criar alerta. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
      >
        <Bell className="w-4 h-4" />
        Criar Alerta de Preço
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">Alerta de Preço</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Alerta Criado!</h4>
            <p className="text-gray-600 mb-4">
              Você será notificado quando o preço baixar para {formatPrice(targetPrice)} ou menos.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700">
                ✅ Alerta ativo para: <strong>{productTitle.substring(0, 50)}...</strong>
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Product Info */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">{productTitle}</h4>
              <p className="text-sm text-gray-600">Preço atual: <span className="font-semibold">{formatPrice(currentPrice)}</span></p>
            </div>

            {/* Target Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preço Alvo (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                <input
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  min="1"
                  max={currentPrice - 1}
                  step="0.01"
                  required
                />
              </div>
              {targetPrice < currentPrice && discountPercentage > 0 && (
                <p className="text-sm text-green-600 mt-1">
                  💰 Economia de {discountPercentage}% ({formatPrice(currentPrice - targetPrice)})
                </p>
              )}
              {targetPrice >= currentPrice && (
                <p className="text-sm text-red-600 mt-1">
                  ⚠️ O preço alvo deve ser menor que o preço atual
                </p>
              )}
            </div>

            {/* Notification Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Como você quer ser notificado?
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="notification"
                    value="email"
                    checked={notificationMethod === 'email'}
                    onChange={(e) => setNotificationMethod(e.target.value as 'email')}
                    className="mr-2"
                  />
                  <Mail className="w-4 h-4 mr-1" />
                  Email
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="notification"
                    value="sms"
                    checked={notificationMethod === 'sms'}
                    onChange={(e) => setNotificationMethod(e.target.value as 'sms')}
                    className="mr-2"
                  />
                  <MessageSquare className="w-4 h-4 mr-1" />
                  SMS
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="notification"
                    value="both"
                    checked={notificationMethod === 'both'}
                    onChange={(e) => setNotificationMethod(e.target.value as 'both')}
                    className="mr-2"
                  />
                  <Bell className="w-4 h-4 mr-1" />
                  Email + SMS
                </label>
              </div>
            </div>

            {/* Email Input */}
            {(notificationMethod === 'email' || notificationMethod === 'both') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="seu@email.com"
                  required={['email', 'both'].includes(notificationMethod)}
                />
              </div>
            )}

            {/* Phone Input */}
            {(notificationMethod === 'sms' || notificationMethod === 'both') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone (WhatsApp)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="(11) 99999-9999"
                  required={['sms', 'both'].includes(notificationMethod)}
                />
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                <strong>💡 Como funciona:</strong><br/>
                Monitoramos o preço deste produto 24/7. Quando o preço baixar para {formatPrice(targetPrice)} ou menos, você receberá uma notificação imediatamente!
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Criando...
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    Criar Alerta
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}