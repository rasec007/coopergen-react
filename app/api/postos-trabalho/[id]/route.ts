import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { postosTrabalho } from '@/lib/db/schema/postos_trabalho';
import { eq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // @ts-ignore
    const data = await db.query.postosTrabalho.findFirst({
      where: eq(postosTrabalho.id, id),
      with: {
        cooperativa: true,
      }
    });

    if (!data) {
      return NextResponse.json({ error: 'Posto de trabalho não encontrado' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching posto de trabalho:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const [updated] = await db.update(postosTrabalho)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(postosTrabalho.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Posto de trabalho não encontrado' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating posto de trabalho:', error);
    if (error.code === '23505') {
        return NextResponse.json({ error: 'Já existe um posto com este nome nesta cooperativa' }, { status: 400 });
     }
    return NextResponse.json({ error: 'Erro ao atualizar posto de trabalho' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deleted] = await db.delete(postosTrabalho)
      .where(eq(postosTrabalho.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Posto de trabalho não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Posto de trabalho excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting posto de trabalho:', error);
    return NextResponse.json({ error: 'Erro ao excluir posto de trabalho' }, { status: 500 });
  }
}
