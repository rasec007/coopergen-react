import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import axios from 'axios';
import { db } from '@/lib/db';
import { users, passwordResetTokens } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const { email, phone, isTest } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    const targetEmail = isTest ? 'rasec007@gmail.com' : email;
    const targetPhone = isTest ? '5585988584800' : phone;

    // 1. Verificar se o usuário existe
    const [user] = await db.select().from(users).where(eq(users.email, targetEmail));

    if (!user) {
      // Por segurança, se for um usuário real, não revelamos que o email não existe
      // Mas como o usuário pediu pra receber a mensagem de teste, vamos prosseguir com o teste se isTest for true
      if (!isTest) {
        return NextResponse.json({ error: 'Se o email estiver cadastrado, você receberá um link.' }, { status: 200 });
      }
    }

    // 2. Gerar Token e Link
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 3600000); // 1 hora de validade

    if (user) {
      // Salvar no banco (apenas se o usuário existir)
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token,
        expiresAt,
      });
    }

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

    const credentialsMessage = `
      Olá! Recebemos uma solicitação para redefinir a sua senha no Coopergen.
      
      Clique no link abaixo para criar uma nova senha:
      ${resetLink}
      
      Este link é válido por 1 hora.
      
      Se você não solicitou isso, por favor ignore este contato.
    `;

    // 3. Enviar Email via SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `Coopergen <${process.env.SMTP_FROM}>`,
      to: targetEmail,
      subject: 'Redefinição de Senha - Coopergen',
      text: credentialsMessage,
    };

    let emailSent = false;
    try {
      await transporter.sendMail(mailOptions);
      emailSent = true;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
    }

    // 4. Enviar WhatsApp via Evolution API
    let whatsappSent = false;
    const phoneNum = targetPhone || user?.phone;
    if (phoneNum) {
      try {
        await axios.post(
          process.env.EVOLUTION_API_URL!,
          {
            number: phoneNum,
            text: credentialsMessage,
          },
          {
            headers: {
              'apikey': process.env.EVOLUTION_API_KEY,
              'Content-Type': 'application/json',
            },
          }
        );
        whatsappSent = true;
      } catch (error) {
        console.error('Erro ao enviar WhatsApp:', error);
      }
    }

    return NextResponse.json({
      success: true,
      emailSent,
      whatsappSent,
      message: 'Instruções enviadas com sucesso.'
    });

  } catch (error) {
    console.error('Erro na rota de forgot-password:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
