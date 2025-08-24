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
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

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
        setTestResult({ success: true, message: 'Mensagem de teste enviada com sucesso!' });
      } else {
        setTestResult({ success: false, message: data.error || 'Erro ao testar conexão.' });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Erro de conexão. Verifique sua internet.' });
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

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingConnection || !formData.botToken || !formData.chatId}
                className="bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTestingConnection ? 'Testando...' : 'Testar Conexão'}
              </button>
            </div>
          </>
        )}

        {testResult && (
          <div className={`p-3 rounded-md ${testResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {testResult.message}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Salvar Configurações
        </button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Como configurar:</h3>
        <ol className="text-xs text-blue-700 space-y-1">
          <li>1. Abra o Telegram e procure por @BotFather</li>
          <li>2. Envie /newbot e siga as instruções para criar seu bot</li>
          <li>3. Copie o token fornecido pelo BotFather</li>
          <li>4. Procure por @userinfobot e envie /start para obter seu chat ID</li>
          <li>5. Cole o token e chat ID nos campos acima</li>
          <li>6. Teste a conexão antes de salvar</li>
        </ol>
      </div>
    </div>
  );
}