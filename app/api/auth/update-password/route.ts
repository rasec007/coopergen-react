import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getAccessTokenFromCookies, clearAuthCookiesOnResponse } from '@/lib/auth/cookies';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z
    .string()
    .min(10, 'A nova senha deve ter pelo menos 10 caracteres')
    .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'A senha deve conter pelo menos um número')
    .regex(/[@#$%*.,]/, 'A senha deve conter pelo menos um caractere especial (@#$%*.,)'),
  confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

async function sendWhatsAppNotification(phoneNumber: string, email: string, newPassword: string) {
  const apiUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;

  if (!apiUrl || !apiKey || !phoneNumber || phoneNumber === '-') return;

  // Format phone number: remove non-digits and ensure 55 prefix if not present
  let formattedNumber = phoneNumber.replace(/\D/g, '');
  if (formattedNumber.length === 11) {
    formattedNumber = `55${formattedNumber}`;
  } else if (formattedNumber.length === 10) {
     // Case without the extra 9 digit
     formattedNumber = `55${formattedNumber}`;
  }

  const messageText = `Sua senha foi alterada: 
Para acessar siga as instruções abaixo:
URL: coopergen.com.br
Email: ${email}
Senha: ${newPassword}`;

  try {
    await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      },
      body: JSON.stringify({
        number: formattedNumber,
        text: messageText,
      }),
    });
  } catch (error) {
    console.error('[WHATSAPP_NOTIFICATION_ERROR]', error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = await getAccessTokenFromCookies();
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const payload = await verifyAccessToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await req.json();
    const result = passwordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { currentPassword, newPassword } = result.data;

    // Get current user from DB
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Check current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 401 });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password in DB
    await db
      .update(users)
      .set({ 
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, payload.userId));

    // Send WhatsApp Notification in background (not awaiting to avoid blocking)
    sendWhatsAppNotification(user.phone || '', user.email, newPassword);

    const response = NextResponse.json({ success: true, message: 'Senha atualizada com sucesso. Você será deslogado.' });
    return clearAuthCookiesOnResponse(response);
  } catch (error) {
    console.error('[UPDATE_PASSWORD_PATCH]', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
