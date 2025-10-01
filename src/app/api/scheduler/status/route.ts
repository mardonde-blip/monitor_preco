import { NextResponse } from 'next/server';
// import { priceMonitorScheduler } from '@/lib/scheduler';
// import { DatabaseAdapter } from '@/lib/database-adapter';

export async function GET() {
  try {
    // Funcionalidade de status do scheduler temporariamente indisponível
    return NextResponse.json({
      success: false,
      error: 'Sistema de status do scheduler temporariamente indisponível',
      message: 'Esta funcionalidade está em manutenção. Tente novamente mais tarde.',
      timestamp: new Date().toISOString()
    }, { status: 503 });

    /*
    const isRunning = priceMonitorScheduler.isSchedulerRunning();
    const products = await DatabaseAdapter.getAllProducts();
    const notificationsEnabled = await DatabaseAdapter.getSetting('notifications_enabled') === 'true';
    
    return NextResponse.json({
      success: true,
      isRunning,
      isActive: isRunning,
      productsCount: products.length,
      notificationsEnabled,
      lastRun: priceMonitorScheduler.getLastRun() || null,
      lastCheck: priceMonitorScheduler.getLastRun() || null,
      settings: {
        telegramConfigured: !!(await DatabaseAdapter.getSetting('telegram_bot_token') && 
                              await DatabaseAdapter.getSetting('telegram_chat_id') && 
                              await DatabaseAdapter.getSetting('telegram_chat_id') !== 'your_chat_id_here')
      },
      status: {
        scheduler: isRunning ? 'running' : 'stopped',
        products: products.length,
        notifications: notificationsEnabled ? 'enabled' : 'disabled'
      }
    });
    */
  } catch (error) {
    console.error('Erro ao obter status do scheduler:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}