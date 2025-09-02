'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/AuthForm';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        // Usuário já está logado, redirecionar para dashboard
        router.push('/dashboard');
      } else {
        // Usuário não está logado, mostrar formulário de login
        setLoading(false);
      }
    } catch (error) {
      // Erro de conexão, mostrar formulário de login
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-4 px-4 sm:py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <div className="bg-white py-6 px-4 shadow rounded-lg sm:py-8 sm:px-10">
          <AuthForm onAuthSuccess={() => {}} />
        </div>
      </div>

      <div className="mt-4 sm:mt-6 text-center px-4">
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 max-w-2xl mx-auto">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3">
            Como funciona?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold text-sm sm:text-base">1</span>
              </div>
              <p className="text-xs sm:text-sm"><strong>Cadastre-se</strong><br />Crie sua conta gratuita</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold text-sm sm:text-base">2</span>
              </div>
              <p className="text-xs sm:text-sm"><strong>Configure</strong><br />Adicione produtos e seu ID do Telegram</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold text-sm sm:text-base">3</span>
              </div>
              <p className="text-xs sm:text-sm"><strong>Monitore</strong><br />Receba notificações quando o preço baixar</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
