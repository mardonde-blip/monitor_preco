'use client';

import { useState, useEffect } from 'react';
import { TELEGRAM_TEMPLATES, getTemplatesByCategory, validateTemplate } from '@/lib/telegram-templates';

interface UserTelegramConfigProps {
  userId: number;
}

interface TelegramConfig {
  user_id: number;
  bot_token: string;
  chat_id: string;
  is_enabled: boolean;
  message_template: string;
  notification_settings: {
    price_drop: boolean;
    target_reached: boolean;
    daily_summary: boolean;
  };
}

interface TestResult {
  success: boolean;
  message: string;
}

export default function UserTelegramConfig({ userId }: UserTelegramConfigProps) {
  const [config, setConfig] = useState<TelegramConfig>({
    user_id: userId,
    bot_token: '',
    chat_id: '',
    is_enabled: false,
    message_template: '🚨 <b>ALERTA DE PREÇO!</b>\n\n📦 <b>{product_name}</b>\n\n🎯 Preço alvo: R$ {target_price}\n🔥 <b>Preço atual: R$ {current_price}</b>\n📉 Desconto: <b>{discount}%</b>\n\n🛒 <a href="{product_url}">Ver produto</a>\n\n⏰ {timestamp}',
    notification_settings: {
      price_drop: true,
      target_reached: true,
      daily_summary: false
    }
  });

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [saveResult, setSaveResult] = useState<TestResult | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templateValidation, setTemplateValidation] = useState<{valid: boolean; errors: string[]} | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error'; text: string} | null>(null);

  // Carregar configuração existente
  useEffect(() => {
    loadConfig();
  }, [userId]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setMessage(null);
      
      const response = await fetch(`/api/telegram/config?userId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        setMessage({ type: 'error', text: `Erro ao carregar: ${errorData.error}` });
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
      setMessage({ type: 'error', text: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}` });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setMessage(null);
      
      const response = await fetch('/api/telegram/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: config.user_id,
          botToken: config.bot_token,
          chatId: config.chat_id,
          isEnabled: config.is_enabled,
          messageTemplate: config.message_template,
          notificationSettings: config.notification_settings
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        // Recarregar configuração
        await loadConfig();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar configuração' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setIsTesting(true);
      setMessage(null);
      
      const response = await fetch('/api/telegram/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: config.user_id,
          botToken: config.bot_token,
          chatId: config.chat_id
        }),
      });

      const data = await response.json();
      setMessage({ type: response.ok ? 'success' : 'error', text: data.message || data.error });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao testar configuração' });
    } finally {
      setIsTesting(false);
    }
  };

  const resetTemplate = () => {
    setConfig(prev => ({
      ...prev,
      message_template: '🚨 <b>ALERTA DE PREÇO!</b>\n\n📦 <b>{product_name}</b>\n\n🎯 Preço alvo: R$ {target_price}\n🔥 <b>Preço atual: R$ {current_price}</b>\n📉 Desconto: <b>{discount}%</b>\n\n🛒 <a href="{product_url}">Ver produto</a>\n\n⏰ {timestamp}'
    }));
    setSelectedTemplate('');
    validateCurrentTemplate();
  };

  const applyTemplate = (templateId: string) => {
    const template = TELEGRAM_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setConfig(prev => ({
        ...prev,
        message_template: template.template
      }));
      setSelectedTemplate(templateId);
      validateCurrentTemplate(template.template);
    }
  };

  const validateCurrentTemplate = (template?: string) => {
    const templateToValidate = template || config.message_template;
    const validation = validateTemplate(templateToValidate);
    setTemplateValidation(validation);
  };

  // Validar template quando ele mudar
  const handleTemplateChange = (newTemplate: string) => {
    setConfig(prev => ({ ...prev, message_template: newTemplate }));
    validateCurrentTemplate(newTemplate);
    // Limpar seleção de template se foi editado manualmente
    if (selectedTemplate) {
      const currentTemplate = TELEGRAM_TEMPLATES.find(t => t.id === selectedTemplate);
      if (currentTemplate && currentTemplate.template !== newTemplate) {
        setSelectedTemplate('');
      }
    }
  };

  if (loading && !config.bot_token) {
    return (
      <div style={{ 
        backgroundColor: '#fff', 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '1.5rem',
        textAlign: 'center'
      }}>
        Carregando configurações...
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: '#fff', 
      border: '1px solid #ddd', 
      borderRadius: '8px', 
      padding: '1.5rem', 
      marginBottom: '2rem' 
    }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📱 Configuração do Telegram
          {config.is_enabled && <span style={{ backgroundColor: '#10b981', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>✓ Ativo</span>}
        </h2>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          Configure seu bot do Telegram para receber notificações de preços.
        </p>
      </div>
      
        {/* Status de Ativação */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem',
          padding: '1rem',
          backgroundColor: config.is_enabled ? '#f0fdf4' : '#f9fafb',
          border: `1px solid ${config.is_enabled ? '#bbf7d0' : '#e5e7eb'}`,
          borderRadius: '6px'
        }}>
          <input
            id="enabled"
            type="checkbox"
            checked={config.is_enabled}
            onChange={(e) => setConfig(prev => ({ ...prev, is_enabled: e.target.checked }))}
            style={{ width: '18px', height: '18px' }}
          />
          <label htmlFor="enabled" style={{ fontWeight: '500', fontSize: '1rem' }}>
            {config.is_enabled ? '🟢 Notificações ativadas' : '⚪ Ativar notificações do Telegram'}
          </label>
        </div>

        {/* Token do Bot */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="botToken" style={{ fontWeight: '500', fontSize: '1rem' }}>🤖 Token do Bot do Telegram</label>
          <input
            id="botToken"
            type="text"
            placeholder="Cole aqui o token do seu bot (ex: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz)"
            value={config.bot_token}
            onChange={(e) => setConfig(prev => ({ ...prev, bot_token: e.target.value }))}
            disabled={loading}
            style={{
              padding: '0.75rem',
              border: '2px solid #e5e7eb',
              borderRadius: '6px',
              width: '100%',
              fontSize: '0.95rem',
              fontFamily: 'monospace'
            }}
          />
          <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>
            💡 Obtenha o token criando um bot com o @BotFather no Telegram
          </p>
        </div>

        {/* Chat ID */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="chatId" style={{ fontWeight: '500', fontSize: '1rem' }}>💬 ID do Chat do Telegram</label>
          <input
            id="chatId"
            type="text"
            placeholder="Digite seu Chat ID (ex: 123456789)"
            value={config.chat_id}
            onChange={(e) => setConfig(prev => ({ ...prev, chat_id: e.target.value }))}
            disabled={loading}
            style={{
              padding: '0.75rem',
              border: '2px solid #e5e7eb',
              borderRadius: '6px',
              width: '100%',
              fontSize: '0.95rem'
            }}
          />
          <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>
            💡 Envie /start para o @userinfobot no Telegram para descobrir seu Chat ID
          </p>
        </div>

        {/* Template da Mensagem */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label htmlFor="messageTemplate" style={{ fontWeight: '500', fontSize: '1rem' }}>📝 Template da Mensagem</label>
            <button 
              onClick={resetTemplate}
              style={{
                padding: '0.25rem 0.5rem',
                border: '1px solid #ddd',
                backgroundColor: 'white',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Restaurar Padrão
            </button>
          </div>
          <textarea
            id="messageTemplate"
            placeholder="Template da mensagem..."
            value={config.message_template}
            onChange={(e) => handleTemplateChange(e.target.value)}
            rows={6}
            disabled={loading}
            style={{
              padding: '0.75rem',
              border: `2px solid ${templateValidation && !templateValidation.valid ? '#f87171' : '#e5e7eb'}`,
              borderRadius: '6px',
              width: '100%',
              fontFamily: 'monospace',
              fontSize: '0.875rem'
            }}
          />
          
          {templateValidation && !templateValidation.valid && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '4px',
              color: '#dc2626'
            }}>
              <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>❌ Erros no template:</div>
              <ul style={{ listStyle: 'disc', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
                {templateValidation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {templateValidation && templateValidation.valid && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#dcfce7',
              border: '1px solid #bbf7d0',
              borderRadius: '4px',
              color: '#166534'
            }}>
              ✅ Template válido!
            </div>
          )}
        </div>

        {/* Configurações de Notificação */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '500', margin: 0 }}>🔔 Tipos de Notificação</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
            <div>
              <div style={{ fontWeight: '500' }}>📉 Queda de Preço</div>
              <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
                Notificar quando o preço diminuir
              </p>
            </div>
            <input
              type="checkbox"
              checked={config.notification_settings.price_drop}
              onChange={(e) => 
                setConfig(prev => ({
                  ...prev,
                  notification_settings: {
                    ...prev.notification_settings,
                    price_drop: e.target.checked
                  }
                }))
              }
              style={{ width: '18px', height: '18px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
            <div>
              <div style={{ fontWeight: '500' }}>🎯 Meta Atingida</div>
              <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
                Notificar quando o preço atingir a meta
              </p>
            </div>
            <input
              type="checkbox"
              checked={config.notification_settings.target_reached}
              onChange={(e) => 
                setConfig(prev => ({
                  ...prev,
                  notification_settings: {
                    ...prev.notification_settings,
                    target_reached: e.target.checked
                  }
                }))
              }
              style={{ width: '18px', height: '18px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
            <div>
              <div style={{ fontWeight: '500' }}>📊 Resumo Diário</div>
              <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
                Receber resumo diário dos produtos monitorados
              </p>
            </div>
            <input
              type="checkbox"
              checked={config.notification_settings.daily_summary}
              onChange={(e) => 
                setConfig(prev => ({
                  ...prev,
                  notification_settings: {
                    ...prev.notification_settings,
                    daily_summary: e.target.checked
                  }
                }))
              }
              style={{ width: '18px', height: '18px' }}
            />
          </div>
        </div>

        {/* Botões de Ação */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleTest}
            disabled={isTesting || !config.bot_token || !config.chat_id}
            style={{
              padding: '0.75rem 1.5rem',
              border: '2px solid #3b82f6',
              backgroundColor: 'white',
              color: '#3b82f6',
              borderRadius: '6px',
              cursor: (isTesting || !config.bot_token || !config.chat_id) ? 'not-allowed' : 'pointer',
              opacity: (isTesting || !config.bot_token || !config.chat_id) ? 0.5 : 1,
              fontWeight: '500',
              fontSize: '0.95rem'
            }}
          >
            {isTesting ? '🔄 Testando...' : '🧪 Testar Configuração'}
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              backgroundColor: '#10b981',
              color: 'white',
              borderRadius: '6px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.5 : 1,
              fontWeight: '500',
              fontSize: '0.95rem'
            }}
          >
            {isSaving ? '💾 Salvando...' : '💾 Salvar'}
          </button>
        </div>

        {/* Mensagens de Status */}
        {message && (
          <div style={{
            padding: '1rem',
            borderRadius: '6px',
            backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `2px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: message.type === 'success' ? '#166534' : '#dc2626',
            fontSize: '0.95rem'
          }}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </div>
        )}
    </div>
  );
}