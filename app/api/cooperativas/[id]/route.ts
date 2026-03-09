import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cooperativas } from '@/lib/db/schema/cooperativas';
import { eq } from 'drizzle-orm';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getAccessTokenFromCookies } from '@/lib/auth/cookies';
import { z } from 'zod';

const cooperativaUpdateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  nickname: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  responsible: z.string().optional(),
  status: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getAccessTokenFromCookies();
    if (!token || !(await verifyAccessToken(token))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const [cooperativa] = await db
      .select()
      .from(cooperativas)
      .where(eq(cooperativas.id, id))
      .limit(1);

    if (!cooperativa) {
      return NextResponse.json({ error: 'Cooperativa não encontrada' }, { status: 404 });
    }

    return NextResponse.json(cooperativa);
  } catch (error) {
    console.error('[COOPERATIVA_ID_GET]', error);
    return NextResponse.json({ error: 'Erro ao buscar cooperativa' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getAccessTokenFromCookies();
    if (!token || !(await verifyAccessToken(token))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const result = cooperativaUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const [updatedCooperativa] = await db
      .update(cooperativas)
      .set({
        ...result.data,
        email: result.data.email || null,
        updatedAt: new Date(),
      })
      .where(eq(cooperativas.id, id))
      .returning();

    if (!updatedCooperativa) {
      return NextResponse.json({ error: 'Cooperativa não encontrada' }, { status: 404 });
    }

    return NextResponse.json(updatedCooperativa);
  } catch (error) {
    console.error('[COOPERATIVA_ID_PATCH]', error);
    return NextResponse.json({ error: 'Erro ao atualizar cooperativa' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getAccessTokenFromCookies();
    if (!token || !(await verifyAccessToken(token))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Soft delete
    const [deletedCooperativa] = await db
      .update(cooperativas)
      .set({ 
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(cooperativas.id, id))
      .returning();

    if (!deletedCooperativa) {
      return NextResponse.json({ error: 'Cooperativa não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Cooperativa excluída com sucesso' });
  } catch (error) {
    console.error('[COOPERATIVA_ID_DELETE]', error);
    return NextResponse.json({ error: 'Erro ao excluir cooperativa' }, { status: 500 });
  }
}
