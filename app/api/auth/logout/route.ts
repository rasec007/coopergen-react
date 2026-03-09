import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { refreshTokens } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getRefreshTokenFromCookies } from '@/lib/auth/cookies';
import { clearAuthCookiesOnResponse } from '@/lib/auth/cookies';

export async function POST() {
  try {
    const token = await getRefreshTokenFromCookies();

    if (token) {
      // Revoke the refresh token in DB
      await db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.token, token));
    }

    const response = NextResponse.json({ message: 'Sessão encerrada com sucesso' });
    return clearAuthCookiesOnResponse(response);
  } catch (error) {
    console.error('[POST /api/auth/logout]', error);
    const response = NextResponse.json({ error: 'Erro ao encerrar sessão' }, { status: 500 });
    return clearAuthCookiesOnResponse(response);
  }
}
