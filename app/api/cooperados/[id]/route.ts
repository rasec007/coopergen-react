import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cooperados } from '@/lib/db/schema/cooperados';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // @ts-ignore
    const data = await db.query.cooperados.findFirst({
      where: eq(cooperados.id, id),
      with: {
        cooperativa: true,
        postoTrabalho: true,
      }
    });

    if (!data) {
      return NextResponse.json({ error: 'Cooperado não encontrado' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching cooperado:', error);
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

    // 1. Fetch current data to check for userId
    const current = await db.query.cooperados.findFirst({
      where: eq(cooperados.id, id),
    });

    if (!current) {
      return NextResponse.json({ error: 'Cooperado não encontrado' }, { status: 404 });
    }

    // 2. Update Cooperado explicitly selecting fields to avoid schema errors
    const [updated] = await db.update(cooperados)
      .set({
        name: body.name || current.name,
        email: body.email || current.email,
        phone: body.phone !== undefined ? (body.phone || null) : current.phone,
        cpf: body.cpf !== undefined ? (body.cpf || null) : current.cpf,
        apelido: body.apelido !== undefined ? (body.apelido || null) : current.apelido,
        matricula: body.matricula !== undefined ? (body.matricula || null) : current.matricula,
        cooperativaId: body.cooperativaId !== undefined ? (body.cooperativaId || null) : current.cooperativaId,
        postoTrabalhoId: body.postoTrabalhoId !== undefined ? (body.postoTrabalhoId || null) : current.postoTrabalhoId,
        perfil: body.perfil || current.perfil,
        status: body.status || current.status,
        updatedAt: new Date(),
      })
      .where(eq(cooperados.id, id))
      .returning();

    // 3. Update linked User if exists
    if (current.userId) {
      await db.update(users)
        .set({
          name: body.name || current.name,
          email: body.email || current.email,
          role: body.perfil === 'ADM' ? 'admin' : 'user',
          registrationNumber: body.matricula || null,
          cpf: body.cpf || null,
          phone: body.phone || null,
        })
        .where(eq(users.id, current.userId));
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating cooperado:', error);
    if (error.code === '23505' || error?.message?.includes('duplicate key value') || error?.cause?.code === '23505') {
        return NextResponse.json({ error: 'CPF, Matrícula ou E-mail já cadastrado' }, { status: 400 });
     }
    return NextResponse.json({ error: 'Erro ao atualizar cooperado' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Fetch current data to check for userId
    const current = await db.query.cooperados.findFirst({
      where: eq(cooperados.id, id),
    });

    if (!current) {
      return NextResponse.json({ error: 'Cooperado não encontrado' }, { status: 404 });
    }

    // 2. Soft delete the cooperado
    const [deleted] = await db.update(cooperados)
      .set({ 
        isActive: false, 
        status: 'Inativo',
        updatedAt: new Date() 
      })
      .where(eq(cooperados.id, id))
      .returning();

    // 3. Deactivate linked User if exists
    if (current.userId) {
      await db.update(users)
        .set({ 
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(users.id, current.userId));
    }

    return NextResponse.json({ message: 'Cooperado desativado com sucesso' });
  } catch (error) {
    console.error('Error deleting cooperado:', error);
    return NextResponse.json({ error: 'Erro ao desativar cooperado' }, { status: 500 });
  }
}
