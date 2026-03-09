import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paystubs } from '@/lib/db/schema/paystubs';
import { eq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // @ts-ignore
    const data = await db.query.paystubs.findFirst({
      where: eq(paystubs.id, id),
      with: {
        cooperado: {
          with: {
            cooperativa: true,
          }
        },
        postoTrabalho: true,
      }
    });

    if (!data) {
      return NextResponse.json({ error: 'Contra cheque não encontrado' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching paystub:', error);
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

    const updateData: any = { ...body };
    if (body.month) updateData.month = parseInt(body.month);
    if (body.year) updateData.year = parseInt(body.year);

    const [updated] = await db.update(paystubs)
      .set(updateData)
      .where(eq(paystubs.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Contra cheque não encontrado' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating paystub:', error);
    return NextResponse.json({ error: 'Erro ao atualizar contra cheque' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deleted] = await db.delete(paystubs)
      .where(eq(paystubs.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Contra cheque não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Contra cheque excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting paystub:', error);
    return NextResponse.json({ error: 'Erro ao excluir contra cheque' }, { status: 500 });
  }
}
