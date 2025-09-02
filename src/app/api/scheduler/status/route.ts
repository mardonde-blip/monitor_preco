import { NextResponse } from 'next/server';
import { priceMonitorScheduler } from '@/lib/scheduler';
import { getProductsForAPI } from '../../products/route';
import { getSettings, areNotificationsEnabled } from '../../settings/route';

export async function GET() {
  try {
    const isRunning = priceMonitorScheduler.isSchedulerRunning();
    const products = getProductsForAPI();
    const settings = getSettings();
    const notificationsEnabled = areNotificationsEnabled();
    
    return NextResponse.json({
      success: true,
      isRunning,
      isActive: isRunning,
      productsCount: products.length,
      notificationsEnabled,
      lastRun: priceMonitorScheduler.getLastRun() || null,
      lastCheck: priceMonitorScheduler.getLastRun() || null,
      settings: {
        monitoringInterval: settings.monitoringInterval,
        telegramConfigured: !!(settings.telegram.botToken && 
                              settings.telegram.chatId && 
                              settings.telegram.chatId !== 'your_chat_id_here')
      },
      status: {
        scheduler: isRunning ? 'running' : 'stopped',
        products: products.length,
        notifications: notificationsEnabled ? 'enabled' : 'disabled'
      }
    });
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