import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas que requerem autenticação
const protectedRoutes = [
  '/dashboard',
  '/api/products',
  '/api/users/telegram'
];

// Rotas de autenticação (não devem ser acessadas por usuários logados)
const authRoutes = [
  '/login',
  '/register'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userIdCookie = request.cookies.get('user_id');
  const isAuthenticated = !!userIdCookie;

  // Verificar se é uma rota protegida
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Verificar se é uma rota de autenticação
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Se é uma rota protegida e o usuário não está autenticado
  if (isProtectedRoute && !isAuthenticated) {
    // Para rotas de API, retornar 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }
    
    // Para páginas, redirecionar para a página inicial
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Se é uma rota de autenticação e o usuário já está logado
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};