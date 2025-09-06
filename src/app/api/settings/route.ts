import { NextRequest, NextResponse } from 'next/server';
import { NotificationSettings } from '@/types';
import { DatabaseAdapter } from '@/lib/database-adapter';

// Função para obter configurações do banco
async function getSettings(): Promise<NotificationSettings> {
  try {
    const enabled = await DatabaseAdapter.getSetting('notifications_enabled');
    const botToken = await DatabaseAdapter.getSetting('telegram_bot_token');
    const chatId = await DatabaseAdapter.getSetting('telegram_chat_id');
    
    return {
      enabled: enabled === 'true' || !!(process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN && 
               process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID && 
               process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID !== 'your_chat_id_here'),
      telegram: {
        botToken: botToken || process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || '',
        chatId: chatId || process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID || ''
      }
    };
  } catch (error) {
    console.error('Erro ao buscar configurações do banco:', error);
    // Fallback para variáveis de ambiente
    return {
      enabled: !!(process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN && 
                 process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID && 
                 process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID !== 'your_chat_id_here'),
      telegram: {
        botToken: process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || '',
        chatId: process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID || ''
      }
    };
  }
}

export async function GET() {
  try {
    const settings = await getSettings();
    
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
    const currentSettings = await getSettings();
    
    // Atualizar configurações no banco
    const updatedSettings = {
      ...currentSettings,
      ...newSettings,
      telegram: {
        ...currentSettings.telegram,
        ...newSettings.telegram
      }
    };
    
    // Salvar no banco de dados
    if (updatedSettings.enabled !== undefined) {
      await DatabaseAdapter.setSetting('notifications_enabled', updatedSettings.enabled.toString());
    }
    if (updatedSettings.telegram?.botToken !== undefined) {
      await DatabaseAdapter.setSetting('telegram_bot_token', updatedSettings.telegram.botToken);
    }
    if (updatedSettings.telegram?.chatId !== undefined) {
      await DatabaseAdapter.setSetting('telegram_chat_id', updatedSettings.telegram.chatId);
    }
    
    console.log('✅ Configurações atualizadas:', {
      enabled: updatedSettings.enabled,
      telegramConfigured: !!(updatedSettings.telegram.botToken && updatedSettings.telegram.chatId)
    });
    
    return NextResponse.json(updatedSettings);
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
    
    // Salvar todas as configurações no banco
    await DatabaseAdapter.setSetting('notifications_enabled', updatedSettings.enabled.toString());
    await DatabaseAdapter.setSetting('telegram_bot_token', updatedSettings.telegram?.botToken || '');
    await DatabaseAdapter.setSetting('telegram_chat_id', updatedSettings.telegram?.chatId || '');
    
    console.log('✅ Configurações substituídas completamente');
    
    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Erro ao substituir configurações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
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