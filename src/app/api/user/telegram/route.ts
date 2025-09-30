import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Recuperar configurações do Telegram do usuário
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        telegramBotToken: true,
        telegramChatId: true,
        telegramEnabled: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Retorna apenas se está configurado, não os valores reais por segurança
    return NextResponse.json({
      hasToken: !!user.telegramBotToken,
      hasChatId: !!user.telegramChatId,
      enabled: user.telegramEnabled || false,
      // Mostra apenas os últimos 4 caracteres do token para identificação
      tokenPreview: user.telegramBotToken ? 
        `***${user.telegramBotToken.slice(-4)}` : null
    });

  } catch (error) {
    console.error('Erro ao buscar configurações do Telegram:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// POST - Salvar configurações do Telegram do usuário
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { botToken, chatId, enabled } = await request.json();

    // Validação básica
    if (enabled && (!botToken || !chatId)) {
      return NextResponse.json({ 
        error: 'Bot Token e Chat ID são obrigatórios quando habilitado' 
      }, { status: 400 });
    }

    // Validar formato do bot token
    if (botToken && !botToken.match(/^\d+:[A-Za-z0-9_-]+$/)) {
      return NextResponse.json({ 
        error: 'Formato do Bot Token inválido' 
      }, { status: 400 });
    }

    // Validar formato do chat ID
    if (chatId && !chatId.match(/^-?\d+$/)) {
      return NextResponse.json({ 
        error: 'Formato do Chat ID inválido' 
      }, { status: 400 });
    }

    // Testar configuração do Telegram se habilitado
    if (enabled && botToken && chatId) {
      try {
        const testResponse = await fetch(
          `https://api.telegram.org/bot${botToken}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: '✅ Configuração do Telegram testada com sucesso!\n\nSeu bot está configurado e funcionando corretamente.',
              parse_mode: 'HTML'
            })
          }
        );

        if (!testResponse.ok) {
          const errorData = await testResponse.json();
          return NextResponse.json({ 
            error: `Erro ao testar Telegram: ${errorData.description || 'Token ou Chat ID inválidos'}` 
          }, { status: 400 });
        }
      } catch (error) {
        return NextResponse.json({ 
          error: 'Erro ao conectar com a API do Telegram' 
        }, { status: 400 });
      }
    }

    // Atualizar configurações do usuário
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        telegramBotToken: enabled ? botToken : null,
        telegramChatId: enabled ? chatId : null,
        telegramEnabled: enabled || false
      }
    });

    return NextResponse.json({
      success: true,
      message: enabled ? 
        'Configurações do Telegram salvas e testadas com sucesso!' : 
        'Notificações do Telegram desabilitadas',
      hasToken: !!updatedUser.telegramBotToken,
      hasChatId: !!updatedUser.telegramChatId,
      enabled: updatedUser.telegramEnabled
    });

  } catch (error) {
    console.error('Erro ao salvar configurações do Telegram:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// DELETE - Remover configurações do Telegram do usuário
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        telegramBotToken: null,
        telegramChatId: null,
        telegramEnabled: false
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Configurações do Telegram removidas com sucesso'
    });

  } catch (error) {
    console.error('Erro ao remover configurações do Telegram:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}