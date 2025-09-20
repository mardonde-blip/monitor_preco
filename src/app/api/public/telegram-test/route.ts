import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 API pública de teste do Telegram iniciada');
    
    const body = await request.json();
    const { botToken, chatId } = body;
    
    console.log('📝 Dados recebidos:', {
      botToken: botToken ? `${botToken.substring(0, 10)}...` : 'NÃO FORNECIDO',
      chatId: chatId || 'NÃO FORNECIDO'
    });
    
    if (!botToken || !chatId) {
      console.log('❌ Dados incompletos');
      return NextResponse.json(
        { 
          success: false,
          error: 'Bot token e chat ID são obrigatórios',
          received: { botToken: !!botToken, chatId: !!chatId }
        },
        { status: 400 }
      );
    }

    // Testar envio direto para o Telegram
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const message = `🎉 *TESTE DE CONEXÃO*\n\n✅ Sistema de monitoramento funcionando!\n⏰ ${new Date().toLocaleString('pt-BR')}\n\n🤖 Esta é uma mensagem de teste do seu bot de monitoramento de preços.`;
    
    console.log('📡 Enviando mensagem para Telegram...');
    console.log('URL:', telegramUrl.replace(botToken, 'BOT_TOKEN_HIDDEN'));
    
    const telegramResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    const telegramData = await telegramResponse.json();
    
    console.log('📨 Resposta do Telegram:', {
      status: telegramResponse.status,
      ok: telegramData.ok,
      description: telegramData.description
    });

    if (telegramData.ok) {
      console.log('✅ Mensagem enviada com sucesso!');
      return NextResponse.json({
        success: true,
        message: 'Mensagem de teste enviada com sucesso!',
        telegramResponse: {
          ok: telegramData.ok,
          message_id: telegramData.result?.message_id,
          chat: telegramData.result?.chat
        },
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('❌ Erro do Telegram:', telegramData);
      return NextResponse.json(
        { 
          success: false,
          error: 'Erro ao enviar mensagem via Telegram',
          telegramError: telegramData.description,
          errorCode: telegramData.error_code
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ Erro na API de teste:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'API pública de teste do Telegram',
    usage: 'Envie uma requisição POST com botToken e chatId',
    timestamp: new Date().toISOString()
  });
}