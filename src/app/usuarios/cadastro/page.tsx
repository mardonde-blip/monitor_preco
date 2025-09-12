'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import UserForm from '@/components/UserForm';
import { User } from '@/lib/database-adapter';

export default function CadastroUsuario() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  const handleSubmit = async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Usuário cadastrado com sucesso!' });
        
        // Redirecionar para a lista de usuários após 2 segundos
        setTimeout(() => {
          router.push('/usuarios');
        }, 2000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao cadastrar usuário' });
      }
    } catch (error) {
      console.error('Erro ao cadastrar usuário:', error);
      setMessage({ type: 'error', text: 'Erro de conexão. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/usuarios');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Cadastro de Usuário</h1>
          <p className="text-gray-600">Preencha os dados abaixo para cadastrar um novo usuário</p>
        </div>

        {/* Mensagem de feedback */}
        {message && (
          <div className={`max-w-md mx-auto mb-6 p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-100 border border-green-400 text-green-700'
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {message.type === 'success' ? (
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            </div>
          </div>
        )}

        {/* Formulário */}
        <UserForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />

        {/* Link para voltar */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/usuarios')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            disabled={isLoading}
          >
            ← Voltar para lista de usuários
          </button>
        </div>
      </div>
    </div>
  );
}