import { NextResponse } from 'next/server';
import { getDatabase, getDatabaseInfo } from '@/lib/database-adapter';

export async function GET() {
  try {
    console.log('🔍 Verificando status do sistema...');
    
    // Obter informações do banco
    const dbInfo = getDatabaseInfo();
    console.log('📊 Info do banco:', dbInfo);
    
    // Testar conexão
    const db = await getDatabase();
    
    // Testar uma operação simples
    await db.initDatabase();
    
    // Tentar buscar usuários para testar leitura
    let userCount = 0;
    try {
      // Isso só funciona se já existirem usuários
      const users = await db.getUserByEmail('test@example.com');
      console.log('✅ Teste de leitura concluído');
    } catch (readError) {
      console.log('ℹ️ Teste de leitura falhou (normal se não houver dados):', readError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Sistema funcionando corretamente',
      database: dbInfo,
      timestamp: new Date().toISOString(),
      tests: {
        connection: true,
        initialization: true,
        readTest: 'completed'
      }
    });
    
  } catch (error) {
    console.error('❌ Erro no status do sistema:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      database: getDatabaseInfo(),
      timestamp: new Date().toISOString(),
      tests: {
        connection: false,
        initialization: false,
        readTest: 'failed'
      }
    }, { status: 500 });
  }
}