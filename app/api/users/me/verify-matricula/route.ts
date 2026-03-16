import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cooperados } from '@/lib/db/schema/cooperados';
import { eq } from 'drizzle-orm';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getAccessTokenFromCookies } from '@/lib/auth/cookies';

export async function POST(req: NextRequest) {
  try {
    const token = await getAccessTokenFromCookies();
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const payload = await verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { matricula } = await req.json();
    if (!matricula) {
      return NextResponse.json({ error: 'Matrícula é obrigatória' }, { status: 400 });
    }

    // Find the cooperado linked to this user
    const [coop] = await db
      .select({ matricula: cooperados.matricula })
      .from(cooperados)
      .where(eq(cooperados.userId, payload.userId))
      .limit(1);

    if (!coop) {
      return NextResponse.json({ error: 'Cooperado não vinculado a este usuário' }, { status: 404 });
    }

    // Match matricula (ignoring leading zeros or just exact match as per user recommendation)
    if (coop.matricula === matricula) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Matrícula incorreta' }, { status: 403 });
    }
  } catch (error) {
    console.error('Error verifying matricula:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
