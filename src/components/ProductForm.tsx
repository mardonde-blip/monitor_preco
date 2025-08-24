'use client';

import { useState } from 'react';
import { Product } from '@/types';

interface ProductFormProps {
  onAddProduct: (product: Omit<Product, 'id' | 'createdAt' | 'priceHistory'>) => void;
}

export default function ProductForm({ onAddProduct }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    initialPrice: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const product = {
        name: formData.name,
        url: formData.url,
        initialPrice: parseFloat(formData.initialPrice),
        selector: 'auto' // Indica detecção automática
      };

      onAddProduct(product);
      
      // Reset form
      setFormData({
        name: '',
        url: '',
        initialPrice: ''
      });
    } catch (error) {
      console.error('Error adding product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Adicionar Produto</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nome do Produto
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: iPhone 15 Pro"
          />
        </div>

        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
            URL do Produto
          </label>
          <input
            type="url"
            id="url"
            name="url"
            value={formData.url}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://exemplo.com/produto"
          />
        </div>

        <div>
          <label htmlFor="initialPrice" className="block text-sm font-medium text-gray-700 mb-1">
            Preço de Referência (R$)
          </label>
          <input
            type="number"
            id="initialPrice"
            name="initialPrice"
            value={formData.initialPrice}
            onChange={handleChange}
            required
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="999.99"
          />
          <p className="text-xs text-gray-500 mt-1">
            Preço atual do produto. Você será notificado quando o preço ficar abaixo deste valor.
          </p>
        </div>

        <div className="bg-blue-50 p-4 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-blue-800">
              <strong>Detecção Automática:</strong> O sistema irá automaticamente encontrar o preço na página usando algoritmos inteligentes.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Adicionando...' : 'Adicionar Produto'}
        </button>
      </form>
    </div>
  );
}