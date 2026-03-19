import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paystubs } from '@/lib/db/schema/paystubs';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

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
    
    if (body.month !== undefined) {
      updateData.month = body.month && body.month !== '' ? parseInt(body.month) : 0;
    }
    
    if (body.year !== undefined) {
      updateData.year = body.year !== '' ? parseInt(body.year) : new Date().getFullYear();
    }
    
    if (body.postoTrabalhoId !== undefined) {
      updateData.postoTrabalhoId = body.postoTrabalhoId && body.postoTrabalhoId !== '' ? body.postoTrabalhoId : null;
    }

    // 1. Buscar o registro atual para saber qual era o arquivo antigo
    const [existing] = await db
      .select({ fileUrl: paystubs.fileUrl })
      .from(paystubs)
      .where(eq(paystubs.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Contra cheque não encontrado' }, { status: 404 });
    }

    // 2. Realizar o update no banco
    const [updated] = await db.update(paystubs)
      .set(updateData)
      .where(eq(paystubs.id, id))
      .returning();

    // 3. Se o arquivo mudou, excluir o antigo para evitar órfãos
    if (body.fileUrl && existing.fileUrl && body.fileUrl !== existing.fileUrl) {
      try {
        const fileName = existing.fileUrl.split('/').pop();
        if (fileName) {
          const filePath = path.join(process.cwd(), 'storage', fileName);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[UPDATE] Arquivo antigo removido: ${filePath}`);
          } else {
            const oldPath = path.join(process.cwd(), 'storage-coopergen', fileName);
            if (fs.existsSync(oldPath)) {
              fs.unlinkSync(oldPath);
              console.log(`[UPDATE] Arquivo antigo removido (pasta legada): ${oldPath}`);
            }
          }
        }
      } catch (fsError) {
        console.error('[UPDATE] Erro ao excluir arquivo antigo:', fsError);
      }
    }

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

    // Buscar o registro para obter o fileUrl antes de deletar
    const [existing] = await db
      .select({ fileUrl: paystubs.fileUrl })
      .from(paystubs)
      .where(eq(paystubs.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Contra cheque não encontrado' }, { status: 404 });
    }

    // Excluir do banco
    await db.delete(paystubs).where(eq(paystubs.id, id));

    // Excluir arquivo físico se houver
    if (existing.fileUrl) {
      try {
        // Extrair o nome do arquivo da URL (ex: /storage/arquivo.pdf)
        const fileName = existing.fileUrl.split('/').pop();
        if (fileName) {
          const filePath = path.join(process.cwd(), 'storage', fileName);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Arquivo excluído: ${filePath}`);
          } else {
            // Tenta na pasta antiga por compatibilidade
            const oldPath = path.join(process.cwd(), 'storage-coopergen', fileName);
            if (fs.existsSync(oldPath)) {
              fs.unlinkSync(oldPath);
              console.log(`Arquivo excluído (pasta antiga): ${oldPath}`);
            }
          }
        }
      } catch (fsError) {
        console.error('Erro ao excluir arquivo físico:', fsError);
        // Não retorna erro pois o registro no banco já foi removido
      }
    }

    return NextResponse.json({ message: 'Contra cheque excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting paystub:', error);
    return NextResponse.json({ error: 'Erro ao excluir contra cheque' }, { status: 500 });
  }
}
