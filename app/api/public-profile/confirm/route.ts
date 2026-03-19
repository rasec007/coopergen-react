import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cooperados } from '@/lib/db/schema/cooperados';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { matricula, cpfPrefix, email, phone, birthDate } = await req.json();

    if (!matricula || !cpfPrefix || !email || !phone || !birthDate) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    // 1. Buscar o cooperado e validar identidade (mesma lógica do acesso ao contra cheque)
    const [coop] = await db
      .select({ 
        id: cooperados.id, 
        cpf: cooperados.cpf,
        userId: cooperados.userId 
      })
      .from(cooperados)
      .where(eq(cooperados.matricula, matricula))
      .limit(1);

    if (!coop) {
      return NextResponse.json({ error: 'Matrícula não encontrada' }, { status: 404 });
    }

    const cleanDbCpf = coop.cpf?.replace(/\D/g, '') || '';
    const cleanPrefix = cpfPrefix.replace(/\D/g, '');

    if (!cleanDbCpf.startsWith(cleanPrefix)) {
      return NextResponse.json({ error: 'Dados de validação incorretos' }, { status: 403 });
    }

    // 2. Atualizar tabela de cooperados
    await db.update(cooperados)
      .set({ 
        email, 
        phone, 
        birthDate,
        profileConfirmed: true,
        updatedAt: new Date()
      })
      .where(eq(cooperados.id, coop.id));

    // 3. SE o cooperado tiver um usuário vinculado, atualizar a tabela de users também
    if (coop.userId) {
      try {
        await db.update(users)
          .set({ 
            email, 
            phone,
            birthDate,
            updatedAt: new Date()
          })
          .where(eq(users.id, coop.userId));
      } catch (userError) {
        console.error('Erro ao atualizar tabela users:', userError);
        // Não falhamos a requisição se apenas o user vinculador falhar (ex: email duplicado em users)
      }
    }

    return NextResponse.json({ success: true, message: 'Perfil confirmado com sucesso' });

  } catch (error) {
    console.error('Error confirming profile:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
