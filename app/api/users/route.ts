import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getAccessTokenFromCookies } from '@/lib/auth/cookies';
import { desc, ilike, or, and, SQL, asc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const token = await getAccessTokenFromCookies();
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado - Apenas administradores' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');

    let conditions: SQL[] = [];
    if (search) {
      conditions.push(
        or(
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`)
        ) as SQL
      );
    }

    const allUsers = await db.query.users.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [asc(users.name)],
    });

    // Remove sensitive information
    const sanitizedUsers = allUsers.map(({ passwordHash, ...rest }) => rest);

    return NextResponse.json(sanitizedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
