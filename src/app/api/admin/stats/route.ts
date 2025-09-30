import { NextRequest, NextResponse } from 'next/server';
// import { getDatabase } from '@/lib/database-adapter';
import { cookies } from 'next/headers';

// Verificar se o usuário é administrador
async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const adminAuth = cookieStore.get('admin_auth');
  return adminAuth?.value === 'true';
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação de administrador
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem acessar esta área.' },
        { status: 403 }
      );
    }

    // Funcionalidade temporariamente indisponível
    return NextResponse.json(
      { 
        error: 'Estatísticas administrativas temporariamente indisponíveis',
        message: 'Esta funcionalidade está em manutenção. Tente novamente mais tarde.'
      },
      { status: 503 }
    );

    /* 
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const db = await getDatabase();

    switch (type) {
      case 'system':
        // Estatísticas gerais do sistema
        const systemStats = await db.getSystemStats();
        return NextResponse.json(systemStats);

      case 'users':
        // Lista de usuários com contagem de produtos
        const usersWithProducts = await db.getUsersWithProductCounts();
        return NextResponse.json(usersWithProducts);

      case 'user-details':
        // Detalhes de um usuário específico
        const userId = searchParams.get('userId');
        if (!userId) {
          return NextResponse.json(
            { error: 'ID do usuário é obrigatório' },
            { status: 400 }
          );
        }
        
        const userDetails = await db.getUserDetailedStats(parseInt(userId));
        if (!userDetails) {
          return NextResponse.json(
            { error: 'Usuário não encontrado' },
            { status: 404 }
          );
        }
        
        return NextResponse.json(userDetails);

      default:
        // Retornar todas as estatísticas por padrão
        const allStats = {
          system: await db.getSystemStats(),
          users: await db.getUsersWithProductCounts()
        };
        return NextResponse.json(allStats);
    }
    */

  } catch (error) {
    console.error('Erro ao obter estatísticas administrativas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}