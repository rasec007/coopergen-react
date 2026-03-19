import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paystubs } from '@/lib/db/schema/paystubs';
import { eq, and, ilike, sql } from 'drizzle-orm';
import { cooperados } from '@/lib/db/schema/cooperados';
import { notificationQueue } from '@/lib/db/schema/notifications';
import { cookies } from 'next/headers';
import { getAccessTokenFromCookies } from '@/lib/auth/cookies';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
  try {
    const token = await getAccessTokenFromCookies();
    let userRole = null;
    let userId = null;
    if (token) {
      const payload = await verifyAccessToken(token);
      if (payload) {
        userRole = payload.role;
        userId = payload.userId;
      }
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    let cooperativaId = searchParams.get('cooperativaId');
    const postoTrabalhoId = searchParams.get('postoTrabalhoId');
    
    const cookieStore = await cookies();
    const activeCooperativaId = cookieStore.get('active_cooperativa_id')?.value;

    if (activeCooperativaId) {
      cooperativaId = activeCooperativaId;
    }

    let conditions = [];

    if (type && type !== 'all') {
      conditions.push(eq(paystubs.type, type));
    }
    if (year && year !== 'all') {
      conditions.push(eq(paystubs.year, parseInt(year)));
    }
    if (month && month !== 'all') {
      conditions.push(eq(paystubs.month, parseInt(month)));
    }
    if (postoTrabalhoId && postoTrabalhoId !== 'all') {
      conditions.push(eq(paystubs.postoTrabalhoId, postoTrabalhoId));
    }

    // Security Filter for 'user' role
    if (userRole === 'user' && userId) {
      const [userCooperado] = await db
        .select({ id: cooperados.id })
        .from(cooperados)
        .where(eq(cooperados.userId, userId))
        .limit(1);
      
      if (userCooperado) {
        conditions.push(eq(paystubs.cooperadoId, userCooperado.id));
      } else {
        // If user has no linked cooperado, return empty list
        return NextResponse.json([]);
      }
    }

    // Join with cooperados for search and filtering by cooperativa
    // @ts-ignore
    const data = await db.query.paystubs.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        cooperado: {
          with: {
            cooperativa: true,
          }
        },
        postoTrabalho: true,
      },
      orderBy: (ps, { desc, asc }) => [desc(ps.year), desc(ps.month), asc(ps.id)],
    });

    // Post-filter by cooperativaId and search (since Drizzle relational query doesn't support nested filters easily in this version)
    let filtered = data;
    if (cooperativaId && cooperativaId !== 'all') {
      filtered = filtered.filter((ps: any) => ps.cooperado?.cooperativaId === cooperativaId && ps.cooperado?.isActive);
    } else {
      filtered = filtered.filter((ps: any) => ps.cooperado?.isActive);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((ps: any) => 
        ps.cooperado?.name.toLowerCase().includes(s) || 
        ps.cooperado?.cpf?.includes(s) ||
        ps.cooperado?.matricula?.includes(s)
      );
    }

    // Sort the final results: Year (ASC), Month (ASC), Name (ASC)
    filtered.sort((a: any, b: any) => {
      if (a.year !== b.year) return a.year - b.year;
      if (a.month !== b.month) return a.month - b.month;
      const nameA = a.cooperado?.name?.toLowerCase() || '';
      const nameB = b.cooperado?.name?.toLowerCase() || '';
      return nameA.localeCompare(nameB);
    });

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Error fetching paystubs:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Mês só é obrigatório para Contra Cheque
    const isContraCheque = !body.type || body.type === 'Contra Cheque';
    const isMonthMissing = isContraCheque && (!body.month || body.month === '');
    
    if (!body.cooperadoId || !body.year || isMonthMissing) {
      const missing = [];
      if (!body.cooperadoId) missing.push('Cooperado');
      if (!body.year) missing.push('Ano');
      if (isMonthMissing) missing.push('Mês');
      return NextResponse.json({ error: `${missing.join(', ')} são obrigatórios` }, { status: 400 });
    }

    const [newPaystub] = await db.insert(paystubs).values({
      cooperadoId: body.cooperadoId,
      postoTrabalhoId: body.postoTrabalhoId && body.postoTrabalhoId !== '' ? body.postoTrabalhoId : null,
      type: body.type || 'Contra Cheque',
      month: body.month ? parseInt(body.month) : 0,
      year: parseInt(body.year),
      valorBruto: body.valorBruto || '0',
      valorLiquido: body.valorLiquido || '0',
      fileUrl: body.fileUrl,
    }).returning();

    // ─── Enfileirar Notificações ──────────────────────────────────────────────
    if (body.sendNotifications !== false) {
      // Processamento em segundo plano para não bloquear a resposta da API
      (async () => {
        try {
          console.log(`[Notification] Iniciando enfileiramento em background. Cooperado: ${body.cooperadoId}`);
          
          // Buscar dados do cooperado para notificação
          const [coop] = await db
            .select({ name: cooperados.name, email: cooperados.email, phone: cooperados.phone })
            .from(cooperados)
            .where(eq(cooperados.id, body.cooperadoId))
            .limit(1);

          if (coop) {
            console.log(`[Notification] Cooperado encontrado: ${coop.name}. Email: ${coop.email}, Fone: ${coop.phone}`);
            const itemType = body.type || 'Contra Cheque';
            const fileName = body.fileUrl?.split('/').pop() || '';
            const publicUrl = `https://coopergen-new.c2net.com.br/api/storage/${fileName}`;
            
            const monthNames = [
              'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
              'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
            ];
            
            let detailLine = '';
            if (itemType === 'Contra Cheque') {
              const monthName = monthNames[parseInt(body.month) - 1] || body.month;
              detailLine = `Segue abaixo o Contra Cheque referênte a "${monthName} de ${body.year}".`;
            } else {
              detailLine = `Segue abaixo o ${itemType} referênte a "${body.year}".`;
            }

            const messageText = `Olá, ${coop.name}.\nSeu ${itemType} está disponível na plataforma e já pode ser baixado.\n\n${detailLine}\n${publicUrl}`;

            const notificationsToInsert = [];

            if (coop.email && coop.email.includes('@')) {
              notificationsToInsert.push({
                cooperadoId: body.cooperadoId,
                type: 'email',
                recipient: coop.email,
                payload: {
                  subject: `Novo ${itemType} Disponível - Coopergen`,
                  body: messageText,
                  itemType: itemType
                }
              });
            }

            if (coop.phone) {
              notificationsToInsert.push({
                cooperadoId: body.cooperadoId,
                type: 'whatsapp',
                recipient: coop.phone,
                payload: {
                  body: messageText,
                  itemType: itemType
                }
              });
            }

            if (notificationsToInsert.length > 0) {
              await db.insert(notificationQueue).values(notificationsToInsert);
              console.log(`[Notification] ${notificationsToInsert.length} notificações enfileiradas com sucesso.`);
            } else {
              console.log(`[Notification] Nenhuma notificação gerada (falta email e fone).`);
            }
          } else {
            console.warn(`[Notification] Cooperado não encontrado no banco: ${body.cooperadoId}`);
          }
        } catch (notificationError) {
          console.error('[Notification] Erro ao enfileirar em background:', notificationError);
        }
      })();
    }

  return NextResponse.json(newPaystub);
  } catch (error: any) {
    console.error('Error creating paystub:', error);
    return NextResponse.json({ error: 'Erro ao criar contra cheque' }, { status: 500 });
  }
}
