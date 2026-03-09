import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getAccessTokenFromCookies } from '@/lib/auth/cookies';

export async function POST(req: NextRequest) {
  try {
    const token = await getAccessTokenFromCookies();
    if (!token || !(await verifyAccessToken(token))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { cooperativaId, cooperativaName } = body;

    if (!cooperativaId || !cooperativaName) {
      return NextResponse.json({ error: 'Cooperativa inválida' }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });
    
    response.cookies.set('active_cooperativa_id', cooperativaId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    response.cookies.set('active_cooperativa_name', encodeURIComponent(cooperativaName), {
      httpOnly: false, // Available to client JS if needed, though we primarily read on server
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error('[SET_ACTIVE_COOP_POST]', error);
    return NextResponse.json({ error: 'Erro ao definir cooperativa' }, { status: 500 });
  }
}
