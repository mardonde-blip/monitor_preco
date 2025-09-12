'use client';

import { useState } from 'react';
import { User } from '@/lib/database-adapter';

interface UserFormProps {
  user?: User;
  onSubmit: (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export default function UserForm({ user, onSubmit, onCancel, isLoading = false }: UserFormProps) {
  const [formData, setFormData] = useState({
    nome_completo: user?.nome_completo || '',
    email: user?.email || '',
    senha: user?.senha || '',
    data_nascimento: user?.data_nascimento || '',
    sexo: user?.sexo || '',
    celular: user?.celular || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validação individual por campo
  const validateField = (fieldName: string, value: string): string => {
    switch (fieldName) {
      case 'nome_completo':
        if (!value.trim()) {
          return 'Nome completo é obrigatório';
        }
        if (value.trim().length < 2) {
          return 'Nome deve ter pelo menos 2 caracteres';
        }
        if (value.trim().length > 100) {
          return 'Nome deve ter no máximo 100 caracteres';
        }
        if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(value.trim())) {
          return 'Nome deve conter apenas letras e espaços';
        }
        break;

      case 'email':
        if (!value.trim()) {
          return 'Email é obrigatório';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Email inválido';
        }
        if (value.length > 255) {
          return 'Email deve ter no máximo 255 caracteres';
        }
        break;

      case 'data_nascimento':
        if (!value) {
          return 'Data de nascimento é obrigatória';
        }
        const birthDate = new Date(value);
        const today = new Date();
        const minDate = new Date();
        minDate.setFullYear(today.getFullYear() - 120); // Máximo 120 anos
        const minAge = new Date();
        minAge.setFullYear(today.getFullYear() - 13); // Mínimo 13 anos
        
        if (isNaN(birthDate.getTime())) {
          return 'Data inválida';
        }
        if (birthDate >= today) {
          return 'Data deve ser anterior à data atual';
        }
        if (birthDate < minDate) {
          return 'Data muito antiga';
        }
        if (birthDate > minAge) {
          return 'Idade mínima é 13 anos';
        }
        break;

      case 'sexo':
        if (!value) {
          return 'Sexo é obrigatório';
        }
        if (!['Masculino', 'Feminino', 'Outro'].includes(value)) {
          return 'Opção inválida';
        }
        break;

      case 'celular':
        if (!value.trim()) {
          return 'Celular é obrigatório';
        }
        // Regex mais flexível para celular brasileiro
        const phoneRegex = /^\(?\d{2}\)?[\s-]?9?\d{4}[\s-]?\d{4}$/;
        if (!phoneRegex.test(value.replace(/\s+/g, ' ').trim())) {
          return 'Formato inválido. Use: (11) 99999-9999 ou 11999999999';
        }
        break;

      default:
        return '';
    }
    return '';
  };

  // Limpar erro de campo específico
  const clearFieldError = (fieldName: string) => {
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  // Validação completa do formulário
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    Object.keys(formData).forEach(fieldName => {
      const error = validateField(fieldName, formData[fieldName as keyof typeof formData]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    clearFieldError(name);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        {user ? 'Editar Usuário' : 'Cadastrar Usuário'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nome Completo */}
        <div>
          <label htmlFor="nome_completo" className="block text-sm font-medium text-gray-700 mb-1">
            Nome Completo *
          </label>
          <input
            type="text"
            id="nome_completo"
            name="nome_completo"
            value={formData.nome_completo}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.nome_completo ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Digite seu nome completo"
            disabled={isLoading}
          />
          {errors.nome_completo && (
            <p className="text-red-500 text-sm mt-1">{errors.nome_completo}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Digite seu email"
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        {/* Data de Nascimento */}
        <div>
          <label htmlFor="data_nascimento" className="block text-sm font-medium text-gray-700 mb-1">
            Data de Nascimento *
          </label>
          <input
            type="date"
            id="data_nascimento"
            name="data_nascimento"
            value={formData.data_nascimento}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.data_nascimento ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
            max={new Date().toISOString().split('T')[0]} // Não permitir datas futuras
          />
          {errors.data_nascimento && (
            <p className="text-red-500 text-sm mt-1">{errors.data_nascimento}</p>
          )}
        </div>

        {/* Sexo */}
        <div>
          <label htmlFor="sexo" className="block text-sm font-medium text-gray-700 mb-1">
            Sexo *
          </label>
          <select
            id="sexo"
            name="sexo"
            value={formData.sexo}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.sexo ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          >
            <option value="">Selecione o sexo</option>
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
            <option value="Outro">Outro</option>
          </select>
          {errors.sexo && (
            <p className="text-red-500 text-sm mt-1">{errors.sexo}</p>
          )}
        </div>

        {/* Celular */}
        <div>
          <label htmlFor="celular" className="block text-sm font-medium text-gray-700 mb-1">
            Celular *
          </label>
          <input
            type="tel"
            id="celular"
            name="celular"
            value={formData.celular}
            onChange={(e) => {
              // Formatação automática do celular
              let value = e.target.value.replace(/\D/g, '');
              if (value.length <= 11) {
                if (value.length > 6) {
                  value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                } else if (value.length > 2) {
                  value = value.replace(/(\d{2})(\d+)/, '($1) $2');
                }
              }
              const syntheticEvent = {
                ...e,
                target: { ...e.target, value, name: 'celular' }
              };
              handleChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
            }}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.celular ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="(11) 99999-9999"
            disabled={isLoading}
            maxLength={15}
          />
          {errors.celular && (
            <p className="text-red-500 text-sm mt-1">{errors.celular}</p>
          )}
        </div>

        {/* Botões */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Salvando...' : (user ? 'Atualizar' : 'Cadastrar')}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}