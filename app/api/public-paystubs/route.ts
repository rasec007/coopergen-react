import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paystubs } from '@/lib/db/schema/paystubs';
import { cooperados } from '@/lib/db/schema/cooperados';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { matricula, cpfPrefix, year, type } = await req.json();

    if (!matricula || !cpfPrefix) {
      return NextResponse.json({ error: 'Matrícula e CPF são obrigatórios' }, { status: 400 });
    }

    // Buscar o cooperado pela matrícula
    const [coop] = await db
      .select({ 
        id: cooperados.id, 
        name: cooperados.name, 
        cpf: cooperados.cpf,
        isActive: cooperados.isActive,
        email: cooperados.email,
        phone: cooperados.phone,
        birthDate: cooperados.birthDate,
        profileConfirmed: cooperados.profileConfirmed
      })
      .from(cooperados)
      .where(eq(cooperados.matricula, matricula))
      .limit(1);

    if (!coop) {
      return NextResponse.json({ error: 'Matrícula não encontrada' }, { status: 404 });
    }

    if (!coop.isActive) {
      return NextResponse.json({ error: 'Cadastro inativo. Entre em contato com a cooperativa.' }, { status: 403 });
    }

    // Validar os primeiros 5 dígitos do CPF
    // Remove caracteres não numéricos do CPF do banco e do prefixo enviado
    const cleanDbCpf = coop.cpf?.replace(/\D/g, '') || '';
    const cleanPrefix = cpfPrefix.replace(/\D/g, '');

    if (!cleanDbCpf.startsWith(cleanPrefix)) {
      return NextResponse.json({ error: 'Dados de validação incorretos' }, { status: 403 });
    }

    // Se ano não foi enviado, apenas valida o acesso e retorna o nome
    if (!year) {
      return NextResponse.json({ 
        success: true, 
        name: coop.name,
        email: coop.email,
        phone: coop.phone,
        birthDate: coop.birthDate,
        profileConfirmed: coop.profileConfirmed
      });
    }

    // Se ano foi enviado, busca os documentos
    let conditions = [
      eq(paystubs.cooperadoId, coop.id)
    ];

    if (year !== 'all') {
      conditions.push(eq(paystubs.year, parseInt(year)));
    }

    if (type && type !== 'all') {
      conditions.push(eq(paystubs.type, type));
    }

    const results = await db.query.paystubs.findMany({
      where: and(...conditions),
      orderBy: (ps, { desc, asc }) => [desc(ps.year), desc(ps.month)],
    });

    return NextResponse.json({ 
      success: true, 
      name: coop.name, 
      email: coop.email,
      phone: coop.phone,
      birthDate: coop.birthDate,
      profileConfirmed: coop.profileConfirmed,
      documents: results 
    });

  } catch (error) {
    console.error('Error in public paystub API:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
