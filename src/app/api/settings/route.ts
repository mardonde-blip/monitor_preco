import { NextRequest, NextResponse } from 'next/server';
import { NotificationSettings } from '@/types';

// Configurações padrão do sistema
let settings: NotificationSettings = {
  enabled: !!(process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN && 
             process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID && 
             process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID !== 'your_chat_id_here'),
  telegram: {
    botToken: process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID || ''
  }
};

export async function GET() {
  try {
    // Verificar se as configurações do Telegram estão válidas
    const telegramEnabled = !!(settings.telegram.botToken && 
                              settings.telegram.chatId && 
                              settings.telegram.chatId !== 'your_chat_id_here');
    
    const response = {
      ...settings,
      telegramEnabled,
      telegramConfigured: telegramEnabled
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const newSettings: Partial<NotificationSettings> = await request.json();
    
    // Atualizar configurações
    settings = {
      ...settings,
      ...newSettings,
      telegram: {
        ...settings.telegram,
        ...newSettings.telegram
      }
    };
    
    console.log('✅ Configurações atualizadas:', {
      enabled: settings.enabled,
      telegramConfigured: !!(settings.telegram.botToken && settings.telegram.chatId)
    });
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updatedSettings: NotificationSettings = await request.json();
    
    // Validar configurações obrigatórias
    if (updatedSettings.enabled) {
      if (!updatedSettings.telegram?.botToken || !updatedSettings.telegram?.chatId) {
        return NextResponse.json(
          { error: 'Bot Token e Chat ID são obrigatórios quando as notificações estão habilitadas' },
          { status: 400 }
        );
      }
      
      if (updatedSettings.telegram.chatId === 'your_chat_id_here') {
        return NextResponse.json(
          { error: 'Chat ID deve ser configurado com um valor real' },
          { status: 400 }
        );
      }
    }
    
    settings = updatedSettings;
    
    console.log('✅ Configurações substituídas completamente');
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Erro ao substituir configurações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função auxiliar para obter configurações (para uso interno)
export function getSettings(): NotificationSettings {
  return settings;
}

// Função auxiliar para definir configurações (para uso interno)
export function setSettings(newSettings: NotificationSettings): void {
  settings = newSettings;
}

// Função para verificar se as notificações estão habilitadas e configuradas
export function areNotificationsEnabled(): boolean {
  return settings.enabled && 
         !!(settings.telegram.botToken && 
            settings.telegram.chatId && 
            settings.telegram.chatId !== 'your_chat_id_here');
}