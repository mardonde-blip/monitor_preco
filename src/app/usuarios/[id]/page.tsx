'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { User } from '@/lib/database';

export default function DetalhesUsuario() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  // Carregar dados do usuário
  const loadUser = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      const result = await response.json();

      if (result.success) {
        setUser(result.data);
      } else {
        setError(result.error || 'Usuário não encontrado');
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
      setError('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Formatar data e hora
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calcular idade
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  // Deletar usuário
  const handleDelete = async () => {
    if (!user || !confirm(`Tem certeza que deseja excluir o usuário "${user.nome_completo}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users?id=${user.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        alert('Usuário excluído com sucesso!');
        router.push('/usuarios');
      } else {
        alert(result.error || 'Erro ao excluir usuário');
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      alert('Erro de conexão');
    }
  };

  useEffect(() => {
    if (userId) {
      loadUser();
    }
  }, [userId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados do usuário...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Usuário não encontrado</h3>
          <p className="text-gray-500 mb-6">{error || 'O usuário solicitado não existe.'}</p>
          <button
            onClick={() => router.push('/usuarios')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Voltar para Lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Detalhes do Usuário</h1>
            <p className="text-gray-600">Informações completas do usuário cadastrado</p>
          </div>
          <button
            onClick={() => router.push('/usuarios')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← Voltar
          </button>
        </div>

        {/* Card do usuário */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header do card */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8 text-white">
            <div className="flex items-center">
              <div className="bg-white bg-opacity-20 rounded-full p-3 mr-4">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{user.nome_completo}</h2>
                <p className="text-blue-100">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Conteúdo do card */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informações pessoais */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Informações Pessoais
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Nome Completo</label>
                    <p className="text-gray-900 font-medium">{user.nome_completo}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Data de Nascimento</label>
                    <p className="text-gray-900">{formatDate(user.data_nascimento)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Sexo</label>
                    <p className="text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.sexo === 'Masculino' ? 'bg-blue-100 text-blue-800' :
                        user.sexo === 'Feminino' ? 'bg-pink-100 text-pink-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.sexo}
                      </span>
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Celular</label>
                    <p className="text-gray-900">{user.celular}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Idade</label>
                    <p className="text-gray-900 font-medium">{calculateAge(user.data_nascimento)} anos</p>
                  </div>
                </div>
              </div>

              {/* Informações do sistema */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Informações do Sistema
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">ID do Usuário</label>
                    <p className="text-gray-900 font-mono">#{user.id}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Data de Cadastro</label>
                    <p className="text-gray-900">
                      {user.created_at ? formatDateTime(user.created_at) : 'Não disponível'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Última Atualização</label>
                    <p className="text-gray-900">
                      {user.updated_at ? formatDateTime(user.updated_at) : 'Não disponível'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="bg-gray-50 px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Usuário cadastrado em {user.created_at ? formatDate(user.created_at) : 'data não disponível'}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors text-sm"
                >
                  Excluir Usuário
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Links de navegação */}
        <div className="flex justify-center space-x-6 mt-8">
          <button
            onClick={() => router.push('/usuarios')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← Lista de Usuários
          </button>
          <button
            onClick={() => router.push('/usuarios/cadastro')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            + Cadastrar Novo Usuário
          </button>
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Lucre Na Promo →
          </button>
        </div>
      </div>
    </div>
  );
}