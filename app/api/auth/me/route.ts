import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getAccessTokenFromCookies } from '@/lib/auth/cookies';

export async function GET(req: NextRequest) {
  try {
    const token = await getAccessTokenFromCookies();
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const payload = await verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    return NextResponse.json({
      id: payload.userId,
      name: payload.name,
      email: payload.email,
      role: payload.role
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
