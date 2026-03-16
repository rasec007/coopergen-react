import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, refreshTokens } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAccessToken, createTokenPair } from '@/lib/auth/jwt';
import { getAccessTokenFromCookies, setAuthCookiesOnResponse } from '@/lib/auth/cookies';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify if the sender is an admin
    const token = await getAccessTokenFromCookies();
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const adminPayload = await verifyAccessToken(token);
    if (!adminPayload || adminPayload.role !== 'admin') {
      return NextResponse.json({ error: 'Apenas administradores podem realizar esta ação' }, { status: 403 });
    }

    // 2. Get target user ID from body
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    // 3. Find the target user
    const [targetUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (!targetUser.isActive) {
      return NextResponse.json({ error: 'Não é possível acessar uma conta desativada' }, { status: 403 });
    }

    // 4. Create new tokens for the target user
    const tokens = await createTokenPair({
      id: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
      name: targetUser.name,
    });

    // 5. Revoke old refresh tokens for target user (optional, but good for security)
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.userId, targetUser.id));

    // 6. Save new refresh token
    await db.insert(refreshTokens).values({
      userId: targetUser.id,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const response = NextResponse.json({ success: true, message: 'Sucesso' });
    
    // 7. Set new cookies
    return setAuthCookiesOnResponse(response, tokens);
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
