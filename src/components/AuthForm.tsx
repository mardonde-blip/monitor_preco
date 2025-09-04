'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthFormProps {
  onAuthSuccess: () => void;
}

export default function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const [loginData, setLoginData] = useState({
    email: '',
    senha: ''
  });

  const [registerData, setRegisterData] = useState({
    nome_completo: '',
    email: '',
    senha: '',
    confirmar_senha: '',
    data_nascimento: '',
    sexo: '',
    celular: ''
  });

  // Estados de erro por campo
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});

  // Validação do formulário de login
  const validateLogin = () => {
    const newErrors: Record<string, string> = {};

    if (!loginData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(loginData.email)) {
        newErrors.email = 'Email inválido';
      }
    }

    if (!loginData.senha.trim()) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (loginData.senha.length < 6) {
      newErrors.senha = 'Senha deve ter pelo menos 6 caracteres';
    }

    setLoginErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validação do formulário de cadastro
  const validateRegister = () => {
    const newErrors: Record<string, string> = {};

    if (!registerData.nome_completo.trim()) {
      newErrors.nome_completo = 'Nome completo é obrigatório';
    } else if (registerData.nome_completo.trim().length < 2) {
      newErrors.nome_completo = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!registerData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(registerData.email)) {
        newErrors.email = 'Email inválido';
      }
    }

    if (!registerData.senha.trim()) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (registerData.senha.length < 6) {
      newErrors.senha = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (!registerData.confirmar_senha.trim()) {
      newErrors.confirmar_senha = 'Confirmação de senha é obrigatória';
    } else if (registerData.senha !== registerData.confirmar_senha) {
      newErrors.confirmar_senha = 'As senhas não coincidem';
    }

    if (!registerData.data_nascimento) {
      newErrors.data_nascimento = 'Data de nascimento é obrigatória';
    } else {
      const birthDate = new Date(registerData.data_nascimento);
      const today = new Date();
      if (birthDate >= today) {
        newErrors.data_nascimento = 'Data deve ser anterior à data atual';
      }
    }

    if (!registerData.sexo) {
      newErrors.sexo = 'Sexo é obrigatório';
    }

    if (!registerData.celular.trim()) {
      newErrors.celular = 'Celular é obrigatório';
    } else {
      const celularRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
      if (!celularRegex.test(registerData.celular)) {
        newErrors.celular = 'Formato de celular inválido. Use: (11) 99999-9999';
      }
    }

    setRegisterErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Limpar erro específico do campo de login
  const clearLoginError = (fieldName: string) => {
    if (loginErrors[fieldName]) {
      setLoginErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  // Limpar erro específico do campo de cadastro
  const clearRegisterError = (fieldName: string) => {
    if (registerErrors[fieldName]) {
      setRegisterErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateLogin()) {
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    setLoginErrors({});

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Login realizado com sucesso!');
        setTimeout(() => {
          onAuthSuccess();
          router.push('/cadastro_produtos');
        }, 1000);
      } else {
        setError(data.error || 'Erro no login');
      }
    } catch {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRegister()) {
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    setRegisterErrors({});

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome_completo: registerData.nome_completo,
          email: registerData.email,
          senha: registerData.senha,
          data_nascimento: registerData.data_nascimento,
          sexo: registerData.sexo,
          celular: registerData.celular
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Cadastro realizado com sucesso! Faça login para continuar.');
        setIsLogin(true);
        setRegisterData({
          nome_completo: '',
          email: '',
          senha: '',
          confirmar_senha: '',
          data_nascimento: '',
          sexo: '',
          celular: ''
        });
      } else {
        setError(data.error || 'Erro no cadastro');
      }
    } catch {
        setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-4 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-3 sm:space-y-4">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
            Lucre Na Promo
          </h1>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
          </h2>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8">
          {/* Botões de alternância */}
          <div className="flex mb-4 sm:mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium rounded-l-md border ${
                isLogin
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium rounded-r-md border-t border-r border-b ${
                !isLogin
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Cadastro
            </button>
          </div>

          {/* Mensagens */}
          {message && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Formulário de Login */}
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={loginData.email}
                  onChange={(e) => {
                    setLoginData({ ...loginData, email: e.target.value });
                    clearLoginError('email');
                  }}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    loginErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="seu@email.com"
                />
                {loginErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{loginErrors.email}</p>
                )}
              </div>
              <div>
                <label htmlFor="senha" className="block text-sm font-medium text-gray-700">
                  Senha
                </label>
                <input
                  id="senha"
                  type="password"
                  required
                  value={loginData.senha}
                  onChange={(e) => {
                    setLoginData({ ...loginData, senha: e.target.value });
                    clearLoginError('senha');
                  }}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${                    loginErrors.senha ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Sua senha"
                />
                {loginErrors.senha && (
                  <p className="text-red-500 text-sm mt-1">{loginErrors.senha}</p>
                )}
                <div className="mt-2 text-right">
                  <a
                    href="/forgot-password"
                    className="text-xs sm:text-sm text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Esqueceu a senha?
                  </a>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          ) : (
            /* Formulário de Cadastro */
            <form onSubmit={handleRegister} className="space-y-3 sm:space-y-4">
              <div>
                <label htmlFor="nome_completo" className="block text-sm font-medium text-gray-700">
                  Nome Completo
                </label>
                <input
                  id="nome_completo"
                  type="text"
                  required
                  value={registerData.nome_completo}
                  onChange={(e) => {
                    setRegisterData({ ...registerData, nome_completo: e.target.value });
                    clearRegisterError('nome_completo');
                  }}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    registerErrors.nome_completo ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Seu nome completo"
                />
                {registerErrors.nome_completo && (
                  <p className="text-red-500 text-sm mt-1">{registerErrors.nome_completo}</p>
                )}
              </div>
              <div>
                <label htmlFor="register_email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="register_email"
                  type="email"
                  required
                  value={registerData.email}
                  onChange={(e) => {
                    setRegisterData({ ...registerData, email: e.target.value });
                    clearRegisterError('email');
                  }}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    registerErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="seu@email.com"
                />
                {registerErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{registerErrors.email}</p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label htmlFor="register_senha" className="block text-sm font-medium text-gray-700">
                    Senha
                  </label>
                  <input
                    id="register_senha"
                    type="password"
                    required
                    value={registerData.senha}
                    onChange={(e) => {
                      setRegisterData({ ...registerData, senha: e.target.value });
                      clearRegisterError('senha');
                    }}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      registerErrors.senha ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Mínimo 6 caracteres"
                  />
                  {registerErrors.senha && (
                    <p className="text-red-500 text-sm mt-1">{registerErrors.senha}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="confirmar_senha" className="block text-sm font-medium text-gray-700">
                    Confirmar Senha
                  </label>
                  <input
                    id="confirmar_senha"
                    type="password"
                    required
                    value={registerData.confirmar_senha}
                    onChange={(e) => {
                      setRegisterData({ ...registerData, confirmar_senha: e.target.value });
                      clearRegisterError('confirmar_senha');
                    }}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      registerErrors.confirmar_senha ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Confirme a senha"
                  />
                  {registerErrors.confirmar_senha && (
                    <p className="text-red-500 text-sm mt-1">{registerErrors.confirmar_senha}</p>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="data_nascimento" className="block text-sm font-medium text-gray-700">
                  Data de Nascimento
                </label>
                <input
                  id="data_nascimento"
                  type="date"
                  required
                  value={registerData.data_nascimento}
                  onChange={(e) => {
                    setRegisterData({ ...registerData, data_nascimento: e.target.value });
                    clearRegisterError('data_nascimento');
                  }}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    registerErrors.data_nascimento ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {registerErrors.data_nascimento && (
                  <p className="text-red-500 text-sm mt-1">{registerErrors.data_nascimento}</p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label htmlFor="sexo" className="block text-sm font-medium text-gray-700">
                    Sexo
                  </label>
                  <select
                    id="sexo"
                    required
                    value={registerData.sexo}
                    onChange={(e) => {
                      setRegisterData({ ...registerData, sexo: e.target.value });
                      clearRegisterError('sexo');
                    }}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      registerErrors.sexo ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecione</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro</option>
                  </select>
                  {registerErrors.sexo && (
                    <p className="text-red-500 text-sm mt-1">{registerErrors.sexo}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="celular" className="block text-sm font-medium text-gray-700">
                    Celular
                  </label>
                  <input
                    id="celular"
                    type="tel"
                    required
                    value={registerData.celular}
                    onChange={(e) => {
                      setRegisterData({ ...registerData, celular: e.target.value });
                      clearRegisterError('celular');
                    }}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      registerErrors.celular ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="(11) 99999-9999"
                  />
                  {registerErrors.celular && (
                    <p className="text-red-500 text-sm mt-1">{registerErrors.celular}</p>
                  )}
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Cadastrando...' : 'Cadastrar'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}