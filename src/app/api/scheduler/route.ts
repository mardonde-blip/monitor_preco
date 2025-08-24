import { NextRequest, NextResponse } from 'next/server';
import { priceMonitorScheduler } from '../../../lib/scheduler';

/**
 * GET /api/scheduler - Verifica o status do scheduler
 */
export async function GET() {
  try {
    const isRunning = priceMonitorScheduler.isSchedulerRunning();
    
    return NextResponse.json({
      success: true,
      isRunning,
      message: isRunning ? 'Scheduler está rodando' : 'Scheduler está parado'
    });
  } catch (error) {
    console.error('Erro ao verificar status do scheduler:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scheduler - Controla o scheduler (start/stop/manual)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, intervalMinutes } = body;
    
    switch (action) {
      case 'start':
        const interval = intervalMinutes || parseInt(process.env.MONITORING_INTERVAL_MINUTES || '60');
        await priceMonitorScheduler.startScheduler(interval);
        return NextResponse.json({
          success: true,
          message: `Scheduler iniciado com intervalo de ${interval} minutos`,
          isRunning: true
        });
        
      case 'stop':
        priceMonitorScheduler.stopScheduler();
        return NextResponse.json({
          success: true,
          message: 'Scheduler parado',
          isRunning: false
        });
        
      case 'manual':
        // Executa uma verificação manual sem afetar o scheduler
        await priceMonitorScheduler.runManualCheck();
        return NextResponse.json({
          success: true,
          message: 'Verificação manual executada',
          isRunning: priceMonitorScheduler.isSchedulerRunning()
        });
        
      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Ação inválida. Use: start, stop ou manual' 
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Erro ao controlar scheduler:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}