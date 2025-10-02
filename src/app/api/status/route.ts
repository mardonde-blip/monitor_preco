import { NextResponse } from 'next/server';
/* import { getDatabase, getDatabaseInfo } from '@/lib/database-adapter'; */

export async function GET() {
  return NextResponse.json(
    {
      message: 'Endpoint de status em manutenção temporária. Tente novamente mais tarde.'
    },
    { status: 503 }
  );
}