'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  nome_completo: string;
  email: string;
  telegram_id?: string;
}

interface SystemStats {
  users: {
    total_users: number;
    users_last_7_days: number;
    users_last_30_days: number;
  };
  products: {
    total_products: number;
    active_products: number;
    products_last_7_days: number;
  };
  telegram: {
    total_telegram_configs: number;
    enabled_telegram_configs: number;
  };
}

interface UserWithProducts {
  id: number;
  email: string;
  created_at: string;
  product_count: number;
  active_product_count: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<UserWithProducts[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  useEffect(() => {
    loadStats();
    if (userId) {
      loadUser();
    }
  }, [userId, loadStats, loadUser]);

  const loadUser = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      const result = await response.json();
      if (result.success) {
        setUser(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
    }
  }, [userId]);

  const loadStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/stats');
      
      if (response.status === 403) {
        router.push('/admin');
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.system);
        setUsers(data.users);
      } else {
        setError('Erro ao carregar estatísticas');
      }
    } catch (statsError) {
      setError('Erro de conexão');
    } finally {
        setLoading(false);
      }
    }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
      router.push('/admin');
    } catch (logoutError) {
      console.error('Erro no logout:', logoutError);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Carregando estatísticas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">🔐 Painel Administrativo</h1>
                <p className="text-gray-600">Visão geral do sistema de monitoramento</p>
              </div>
              <div className="text-lg text-gray-700">
                {loading ? 'Carregando...' : `Olá, ${user?.nome_completo?.split(' ')[0] || 'Admin'}! 👋`}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                🏠 Site Principal
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">👥</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total de Usuários</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats?.users.total_users || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="text-green-600 font-medium">+{stats?.users.users_last_7_days || 0}</span>
                <span className="text-gray-500"> últimos 7 dias</span>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">📦</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total de Produtos</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats?.products.total_products || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="text-blue-600 font-medium">{stats?.products.active_products || 0}</span>
                <span className="text-gray-500"> ativos</span>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">📱</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Configs Telegram</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats?.telegram.total_telegram_configs || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="text-green-600 font-medium">{stats?.telegram.enabled_telegram_configs || 0}</span>
                <span className="text-gray-500"> habilitadas</span>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">📈</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Novos Produtos</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats?.products.products_last_7_days || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="text-gray-500">últimos 7 dias</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Usuários */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">👥 Usuários e Produtos Monitorados</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Lista completa de usuários cadastrados e quantidade de produtos que cada um monitora
            </p>
          </div>
          <ul className="divide-y divide-gray-200">
            {users.map((user) => (
              <li key={user.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{user.email}</div>
                          <div className="ml-2 text-xs text-gray-500">ID: {user.id}</div>
                        </div>
                        <div className="text-sm text-gray-500">
                          Cadastrado em {formatDate(user.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {user.product_count} produto{user.product_count !== 1 ? 's' : ''}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.active_product_count} ativo{user.active_product_count !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {user.product_count > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Sem produtos
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {users.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              Nenhum usuário cadastrado no sistema
            </div>
          )}
        </div>
      </main>
    </div>
  );
}