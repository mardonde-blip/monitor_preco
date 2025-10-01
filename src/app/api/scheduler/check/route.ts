import { NextResponse } from 'next/server';
// import { priceMonitorScheduler } from '@/lib/scheduler';
// import { DatabaseAdapter } from '@/lib/database-adapter';

export async function POST() {
  try {
    // Funcionalidade de verificação manual temporariamente indisponível
    return NextResponse.json({
      success: false,
      error: 'Sistema de verificação manual temporariamente indisponível',
      message: 'Esta funcionalidade está em manutenção. Tente novamente mais tarde.',
      timestamp: new Date().toISOString()
    }, { status: 503 });

    /*
    const products = await DatabaseAdapter.getAllProducts();
    const notificationsEnabled = await DatabaseAdapter.getSetting('notifications_enabled') === 'true';
    
    if (products.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhum produto cadastrado para monitorar',
        productsCount: 0
      });
    }
    
    if (!notificationsEnabled) {
      return NextResponse.json({
        success: false,
        error: 'Notificações do Telegram não estão habilitadas ou configuradas',
        notificationsEnabled: false
      });
    }
    
    console.log('🔄 Executando verificação manual de preços...');
    
    // Executar verificação manual
    await priceMonitorScheduler.runManualCheck();
    
    return NextResponse.json({
      success: true,
      message: 'Verificação manual executada com sucesso',
      productsChecked: products.length,
      timestamp: new Date().toISOString(),
      result: 'Verificação concluída'
    });
    */
    
  } catch (error) {
    console.error('Erro ao executar verificação manual:', error);
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
  try {
    // Funcionalidade de status do scheduler temporariamente indisponível
    return NextResponse.json({
      success: false,
      error: 'Sistema de status do scheduler temporariamente indisponível',
      message: 'Esta funcionalidade está em manutenção. Tente novamente mais tarde.',
      timestamp: new Date().toISOString()
    }, { status: 503 });

    /*
    const products = await DatabaseAdapter.getAllProducts();
    const notificationsEnabled = await DatabaseAdapter.getSetting('notifications_enabled') === 'true';
    const isRunning = priceMonitorScheduler.isSchedulerRunning();
    
    return NextResponse.json({
      success: true,
      canCheck: products.length > 0 && notificationsEnabled,
      productsCount: products.length,
      notificationsEnabled,
      schedulerRunning: isRunning,
      lastRun: priceMonitorScheduler.getLastRun() || null,
      message: products.length === 0 
        ? 'Nenhum produto cadastrado' 
        : !notificationsEnabled 
        ? 'Notificações não configuradas'
        : 'Pronto para verificar preços'
    });
    */
    
  } catch (error) {
    console.error('Erro ao verificar status da verificação:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}