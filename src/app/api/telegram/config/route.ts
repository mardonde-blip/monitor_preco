import { NextRequest, NextResponse } from 'next/server';
/* import { getDatabase } from '@/lib/database-adapter';
import { TelegramNotifier } from '@/lib/telegram'; */

// GET - Buscar configuração do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const config = await db.getTelegramConfigByUserId(parseInt(userId));
    
    if (!config) {
      // Retornar configuração padrão se não existir
      return NextResponse.json({
        user_id: parseInt(userId),
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
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Erro ao buscar configuração do Telegram:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Salvar configuração do usuário
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, botToken, chatId, isEnabled, messageTemplate, notificationSettings } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const db = await getDatabase();
    const user = await db.getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Validar configurações se habilitado
    if (isEnabled) {
      if (!botToken || !chatId) {
        return NextResponse.json(
          { error: 'Token do bot e Chat ID são obrigatórios quando habilitado' },
          { status: 400 }
        );
      }

      // Testar configurações apenas se ambos estão preenchidos
      if (botToken && chatId) {
        try {
          const telegramNotifier = new TelegramNotifier();
          await telegramNotifier.initialize(botToken, chatId);
          
          // Testar envio de mensagem
          await telegramNotifier.sendTestMessage();
        } catch (error) {
          return NextResponse.json(
            { error: 'Configurações do Telegram inválidas: ' + (error as Error).message },
            { status: 400 }
          );
        }
      }
    }

    // Salvar configuração
    const config = await db.upsertTelegramConfig({
      user_id: userId,
      bot_token: botToken || undefined,
      chat_id: chatId || undefined,
      is_enabled: isEnabled || false,
      message_template: messageTemplate || '🚨 <b>ALERTA DE PREÇO!</b>\n\n📦 <b>{product_name}</b>\n\n🎯 Preço alvo: R$ {target_price}\n🔥 <b>Preço atual: R$ {current_price}</b>\n📉 Desconto: <b>{discount}%</b>\n\n🛒 <a href="{product_url}">Ver produto</a>\n\n⏰ {timestamp}',
      notification_settings: notificationSettings || {
        price_drop: true,
        target_reached: true,
        daily_summary: false
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Configuração salva com sucesso',
      config
    });
  } catch (error) {
    console.error('Erro ao salvar configuração do Telegram:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT - Testar configuração do usuário
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, botToken, chatId } = body;

    if (!userId || !botToken || !chatId) {
      return NextResponse.json(
        { error: 'ID do usuário, token do bot e Chat ID são obrigatórios' },
        { status: 400 }
      );
    }

    // Testar configurações
    const telegramNotifier = new TelegramNotifier();
    await telegramNotifier.initialize(botToken, chatId);
    
    // Testar envio de mensagem
    await telegramNotifier.sendTestMessage();

    return NextResponse.json({
      success: true,
      message: 'Configurações testadas com sucesso! Mensagem enviada para o Telegram.'
    });
  } catch (error) {
    console.error('Erro ao testar configuração do Telegram:', error);
    return NextResponse.json(
      { error: 'Erro ao testar configuração: ' + (error as Error).message },
      { status: 400 }
    );
  }
}

// DELETE - Deletar configuração do usuário
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const success = await db.deleteTelegramConfig(parseInt(userId));
    
    if (!success) {
      return NextResponse.json(
        { error: 'Configuração não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Configuração deletada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar configuração do Telegram:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}