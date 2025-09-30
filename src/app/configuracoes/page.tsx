'use client';

import { useState, useEffect } from 'react';
import { Loader2, Check, X, TestTube, Shield, CheckCircle, XCircle, MessageCircle, Info } from 'lucide-react';

interface TelegramConfig {
  enabled: boolean;
  hasToken: boolean;
  hasChatId: boolean;
  tokenPreview?: string;
}

interface Message {
  type: 'success' | 'error';
  text: string;
}

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState<TelegramConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [formData, setFormData] = useState({
    botToken: '',
    chatId: '',
    enabled: false
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/telegram/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        setFormData({
          botToken: '',
          chatId: '',
          enabled: data.enabled || false
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/telegram/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Configuração salva com sucesso!' });
        await loadConfig();
        setFormData(prev => ({ ...prev, botToken: '', chatId: '' }));
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Erro ao salvar configuração' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar configuração' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/telegram/test', {
        method: 'POST',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Mensagem de teste enviada com sucesso!' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Erro ao enviar mensagem de teste' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao enviar mensagem de teste' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Configurações</h1>
        <p className="text-gray-600">
          Configure suas preferências e integrações do sistema.
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <span className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Notificações do Telegram</h2>
          </div>
          <p className="text-gray-600 mt-1">
            Configure seu bot pessoal do Telegram para receber notificações de preços.
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Status atual */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Status Atual</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {config?.hasToken ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span>Bot Token: {config?.hasToken ? `Configurado ${config.tokenPreview}` : 'Não configurado'}</span>
              </div>
              <div className="flex items-center gap-2">
                {config?.hasChatId ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span>Chat ID: {config?.hasChatId ? 'Configurado' : 'Não configurado'}</span>
              </div>
              <div className="flex items-center gap-2">
                {config?.enabled ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-400" />
                )}
                <span>Notificações: {config?.enabled ? 'Habilitadas' : 'Desabilitadas'}</span>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Bot Token
              </label>
              <input
                type="password"
                value={formData.botToken}
                onChange={(e) => setFormData(prev => ({ ...prev, botToken: e.target.value }))}
                placeholder="Cole aqui o token do seu bot"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Chat ID
              </label>
              <input
                type="text"
                value={formData.chatId}
                onChange={(e) => setFormData(prev => ({ ...prev, chatId: e.target.value }))}
                placeholder="ID do chat onde receber as notificações"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enabled"
                checked={formData.enabled}
                onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="enabled" className="text-sm font-medium">
                Habilitar notificações
              </label>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {saving ? 'Salvando...' : 'Salvar Configuração'}
            </button>

            <button
              onClick={handleTest}
              disabled={testing || !config?.hasToken || !config?.hasChatId}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              {testing ? 'Testando...' : 'Testar Notificação'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}