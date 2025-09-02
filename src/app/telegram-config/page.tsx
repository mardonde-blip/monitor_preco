'use client';

import UserTelegramConfig from '@/components/UserTelegramConfig';

export default function TelegramConfigPage() {
  // Usar ID fixo do usuário (em produção, seria obtido da sessão)
  const userId = 1;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>📱 Configuração Personalizada do Telegram</h1>
        <p style={{ fontSize: '1.1rem', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
          Agora cada usuário pode personalizar suas próprias configurações de notificação do Telegram,
          incluindo templates de mensagens customizados e preferências individuais.
        </p>
      </div>

      <div style={{ 
        backgroundColor: '#e3f2fd', 
        border: '1px solid #90caf9', 
        borderRadius: '8px', 
        padding: '1.5rem', 
        marginBottom: '2rem' 
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#1565c0' }}>🎉 Novidades implementadas:</div>
        <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', color: '#1565c0' }}>
          <li><strong>Configurações individuais:</strong> Cada usuário tem suas próprias configurações</li>
          <li><strong>Templates personalizáveis:</strong> 10+ templates predefinidos para escolher</li>
          <li><strong>Validação em tempo real:</strong> Verificação automática de templates</li>
          <li><strong>Notificações granulares:</strong> Controle fino sobre tipos de notificação</li>
          <li><strong>Interface intuitiva:</strong> Abas organizadas para fácil configuração</li>
        </ul>
      </div>



      <UserTelegramConfig userId={userId} />

      <div style={{ 
        backgroundColor: '#fff', 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '1.5rem', 
        marginBottom: '2rem' 
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>📋 Recursos Implementados</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.5rem' }}>🗄️ Banco de Dados</h3>
            <ul style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
              <li>✅ Nova tabela <code>user_telegram_config</code></li>
              <li>✅ Configurações por usuário</li>
              <li>✅ Templates personalizados</li>
              <li>✅ Preferências de notificação</li>
            </ul>
          </div>
          
          <div>
            <h3 style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.5rem' }}>🔧 API</h3>
            <ul style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
              <li>✅ <code>GET /api/telegram/config</code> - Buscar configuração</li>
              <li>✅ <code>POST /api/telegram/config</code> - Salvar configuração</li>
              <li>✅ <code>PUT /api/telegram/config</code> - Testar configuração</li>
              <li>✅ <code>DELETE /api/telegram/config</code> - Deletar configuração</li>
            </ul>
          </div>
          
          <div>
            <h3 style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.5rem' }}>🎨 Interface</h3>
            <ul style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
              <li>✅ Componente <code>UserTelegramConfig</code></li>
              <li>✅ Abas organizadas (Configuração, Template, Notificações)</li>
              <li>✅ Templates predefinidos</li>
              <li>✅ Validação em tempo real</li>
              <li>✅ Prévia de mensagens</li>
            </ul>
          </div>
          
          <div>
            <h3 style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.5rem' }}>📱 Notificações</h3>
            <ul style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
              <li>✅ Sistema personalizado por usuário</li>
              <li>✅ Templates com variáveis dinâmicas</li>
              <li>✅ Configurações granulares</li>
              <li>✅ Resumos diários opcionais</li>
            </ul>
          </div>
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#fff', 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '1.5rem' 
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>🚀 Como Usar</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ borderLeft: '4px solid #2563eb', paddingLeft: '1rem' }}>
            <h4 style={{ fontWeight: '500', marginBottom: '0.5rem' }}>1. Configuração Básica</h4>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>
              Na aba "Configuração", insira seu Token do Bot e Chat ID do Telegram.
              Use o botão "Testar Configuração" para verificar se está funcionando.
            </p>
          </div>
          
          <div style={{ borderLeft: '4px solid #16a34a', paddingLeft: '1rem' }}>
            <h4 style={{ fontWeight: '500', marginBottom: '0.5rem' }}>2. Personalizar Template</h4>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>
              Na aba "Template", escolha um template predefinido ou crie o seu próprio.
              Use as variáveis disponíveis para personalizar as mensagens.
            </p>
          </div>
          
          <div style={{ borderLeft: '4px solid #9333ea', paddingLeft: '1rem' }}>
            <h4 style={{ fontWeight: '500', marginBottom: '0.5rem' }}>3. Configurar Notificações</h4>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>
              Na aba "Notificações", escolha quais tipos de alertas você deseja receber:
              quedas de preço, metas atingidas ou resumos diários.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}