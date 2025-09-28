import { NextResponse } from 'next/server';
import { getDatabaseAdapter } from '@/lib/database-adapter-fixed';

export async function GET() {
  try {
    console.log('🔍 Debug: Listando todos os produtos');
    
    const DatabaseAdapter = getDatabaseAdapter();
    
    // Buscar todos os produtos (sem filtro de usuário para debug)
    const products = await DatabaseAdapter.getAllProducts();
    
    console.log(`📊 Total de produtos encontrados: ${products.length}`);
    
    return NextResponse.json({
      success: true,
      total: products.length,
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        url: product.url,
        currentPrice: product.currentPrice,
        targetPrice: product.targetPrice,
        store: product.store,
        userId: product.userId,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      }))
    });

  } catch (error) {
    console.error('❌ Erro no debug de produtos:', error);
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