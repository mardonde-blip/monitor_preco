import { NextRequest, NextResponse } from 'next/server';
import { telegramNotifier } from '@/lib/telegram';
import { TelegramConfig } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const config: TelegramConfig = await request.json();
    
    if (!config.botToken || !config.chatId) {
      return NextResponse.json(
        { error: 'Bot token and chat ID are required' },
        { status: 400 }
      );
    }

    // Validate configuration
    const isValid = await telegramNotifier.validateConfig(config);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid Telegram configuration' },
        { status: 400 }
      );
    }

    // Initialize and send test message
    telegramNotifier.init(config);
    const success = await telegramNotifier.sendTestMessage();
    
    if (success) {
      return NextResponse.json({ message: 'Test message sent successfully' });
    } else {
      return NextResponse.json(
        { error: 'Failed to send test message' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Telegram test API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}