import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, passwordResetTokens } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token e senha são obrigatórios' }, { status: 400 });
    }

    // 1. Validar Token
    const [resetRecord] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      );

    if (!resetRecord) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 400 });
    }

    // 2. Hash da nova senha
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Atualizar usuário
    await db.update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, resetRecord.userId));

    // 4. Remover o token usado (ou invalidar)
    await db.delete(passwordResetTokens)
      .where(eq(passwordResetTokens.id, resetRecord.id));

    return NextResponse.json({ success: true, message: 'Senha redefinida com sucesso!' });

  } catch (error) {
    console.error('Erro na rota de reset-password:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
