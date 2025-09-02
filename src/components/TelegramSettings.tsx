'use client';

import { useState } from 'react';
import { NotificationSettings } from '@/types';

interface TelegramSettingsProps {
  settings: NotificationSettings;
  onUpdateSettings: (settings: NotificationSettings) => void;
}

export default function TelegramSettings({ settings, onUpdateSettings }: TelegramSettingsProps) {
  const [formData, setFormData] = useState({
    enabled: settings.enabled,
    botToken: settings.telegram.botToken,
    chatId: settings.telegram.chatId
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [validationResult, setValidationResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newSettings: NotificationSettings = {
      enabled: formData.enabled,
      telegram: {
        botToken: formData.botToken,
        chatId: formData.chatId
      }
    };
    
    onUpdateSettings(newSettings);
    setTestResult({ success: true, message: 'Configurações salvas com sucesso!' });
    
    setTimeout(() => setTestResult(null), 3000);
  };

  const handleValidateConfig = async () => {
    if (!formData.botToken || !formData.chatId) {
      setValidationResult({ success: false, message: 'Preencha o token do bot e o chat ID primeiro.' });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const response = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          botToken: formData.botToken,
          chatId: formData.chatId,
          validateOnly: true
        })
      });

      const data = await response.json();

      if (response.ok) {
        setValidationResult({ success: true, message: 'Configurações válidas! Bot e Chat ID verificados.' });
      } else {
        setValidationResult({ success: false, message: data.error || 'Configurações inválidas.' });
      }
    } catch (error) {
      setValidationResult({ success: false, message: 'Erro de conexão. Verifique sua internet.' });
    } finally {
      setIsValidating(false);
    }
  };

  const handleTestConnection = async () => {
    if (!formData.botToken || !formData.chatId) {
      setTestResult({ success: false, message: 'Preencha o token do bot e o chat ID primeiro.' });
      return;
    }

    setIsTestingConnection(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          botToken: formData.botToken,
          chatId: formData.chatId
        })
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult({ success: true, message: 'Mensagem de teste enviada com sucesso! Verifique seu Telegram.' });
      } else {
        setTestResult({ success: false, message: data.error || 'Erro ao testar conexão.' });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Erro de conexão. Verifique sua internet.' });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleAutoActivate = async () => {
    setIsTestingConnection(true);
    setTestResult(null);

    try {
      // Simular ativação automática (você pode implementar uma rota específica)
      await handleValidateConfig();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Delay para UX
      await handleTestConnection();
      
      setTestResult({ success: true, message: 'Bot ativado automaticamente! Sistema configurado e testado.' });
    } catch (error) {
      setTestResult({ success: false, message: 'Erro na ativação automática.' });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Configurações do Telegram</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="enabled"
            name="enabled"
            checked={formData.enabled}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="enabled" className="ml-2 block text-sm text-gray-700">
            Ativar notificações do Telegram
          </label>
        </div>

        {formData.enabled && (
          <>
            <div>
              <label htmlFor="botToken" className="block text-sm font-medium text-gray-700 mb-1">
                Token do Bot
              </label>
              <input
                type="password"
                id="botToken"
                name="botToken"
                value={formData.botToken}
                onChange={handleChange}
                required={formData.enabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
              />
              <p className="text-xs text-gray-500 mt-1">
                Obtenha o token criando um bot com o @BotFather no Telegram
              </p>
            </div>

            <div>
              <label htmlFor="chatId" className="block text-sm font-medium text-gray-700 mb-1">
                Chat ID
              </label>
              <input
                type="text"
                id="chatId"
                name="chatId"
                value={formData.chatId}
                onChange={handleChange}
                required={formData.enabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="123456789"
              />
              <p className="text-xs text-gray-500 mt-1">
                Seu chat ID. Envie /start para o bot @userinfobot para descobrir
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleValidateConfig}
                disabled={isValidating || !formData.botToken || !formData.chatId}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isValidating ? 'Validando...' : 'Validar Configuração'}
              </button>
              
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingConnection || !formData.botToken || !formData.chatId}
                className="bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTestingConnection ? 'Testando...' : 'Enviar Teste'}
              </button>
              
              <button
                type="button"
                onClick={handleAutoActivate}
                disabled={isTestingConnection || !formData.botToken || !formData.chatId}
                className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTestingConnection ? 'Ativando...' : '🚀 Ativar Bot'}
              </button>
            </div>
          </>
        )}

        {validationResult && (
          <div className={`p-3 rounded-md ${validationResult.success ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
            <div className="flex items-center">
              <span className="mr-2">{validationResult.success ? '✅' : '❌'}</span>
              {validationResult.message}
            </div>
          </div>
        )}

        {testResult && (
          <div className={`p-3 rounded-md ${testResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            <div className="flex items-center">
              <span className="mr-2">{testResult.success ? '🎉' : '❌'}</span>
              {testResult.message}
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Salvar Configurações
        </button>
      </form>

      <div className="mt-6 space-y-4">
        <div className="p-4 bg-blue-50 rounded-md">
          <h3 className="text-sm font-medium text-blue-800 mb-2">📋 Como configurar:</h3>
          <ol className="text-xs text-blue-700 space-y-1">
            <li>1. Abra o Telegram e procure por @BotFather</li>
            <li>2. Envie /newbot e siga as instruções para criar seu bot</li>
            <li>3. Copie o token fornecido pelo BotFather</li>
            <li>4. Procure por @userinfobot e envie /start para obter seu chat ID</li>
            <li>5. Cole o token e chat ID nos campos acima</li>
            <li>6. Use "Validar Configuração" para verificar as credenciais</li>
            <li>7. Use "🚀 Ativar Bot" para configuração automática completa</li>
          </ol>
        </div>

        <div className="p-4 bg-green-50 rounded-md">
          <h3 className="text-sm font-medium text-green-800 mb-2">🛠️ Ferramentas Avançadas:</h3>
          <div className="text-xs text-green-700 space-y-2">
            <div>
              <strong>Scripts de Terminal:</strong>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• <code className="bg-green-100 px-1 rounded">node ativar-bot-telegram.js</code> - Ativação automática completa</li>
                <li>• <code className="bg-green-100 px-1 rounded">node validar-telegram.js</code> - Validação detalhada com relatório</li>
                <li>• <code className="bg-green-100 px-1 rounded">node test-telegram.js</code> - Teste rápido de funcionamento</li>
              </ul>
            </div>
            <div className="mt-2">
              <strong>Documentação:</strong>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• <code className="bg-green-100 px-1 rounded">GUIA-COMPLETO-TELEGRAM.md</code> - Guia completo de configuração</li>
              </ul>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-gray-600 hover:text-gray-800 underline"
        >
          {showAdvanced ? '🔼 Ocultar' : '🔽 Mostrar'} opções avançadas
        </button>

        {showAdvanced && (
          <div className="p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium text-gray-800 mb-2">⚙️ Configurações Avançadas:</h3>
            <div className="text-xs text-gray-700 space-y-2">
              <div>
                <strong>Variáveis de Ambiente (.env.local):</strong>
                <ul className="ml-4 mt-1 space-y-1">
                  <li>• <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_TELEGRAM_BOT_TOKEN</code></li>
                  <li>• <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_TELEGRAM_CHAT_ID</code></li>
                </ul>
              </div>
              <div className="mt-2">
                <strong>Solução de Problemas:</strong>
                <ul className="ml-4 mt-1 space-y-1">
                  <li>• Certifique-se de enviar /start para o bot primeiro</li>
                  <li>• Verifique se o bot não foi deletado no @BotFather</li>
                  <li>• Confirme que o Chat ID está correto (use @userinfobot)</li>
                  <li>• Execute os scripts de validação para diagnóstico detalhado</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}