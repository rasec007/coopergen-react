import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { whatsappSessions } from '@/lib/db/schema/whatsapp';
import { paystubs } from '@/lib/db/schema/paystubs';
import { cooperados } from '@/lib/db/schema/cooperados';
import { eq, and } from 'drizzle-orm';
import { whatsappService } from '@/lib/coopergenwtz/service';

const MONTHS = [
  { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' }, { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' }, { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' }, { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // De acordo com a Evolution API, a mensagem vem em body.data.message
    // ou similar dependendo da versão. Vamos validar o campo correto.
    const message = body.data?.message?.conversation || body.data?.message?.extendedTextMessage?.text;
    const remoteJid = body.data?.key?.remoteJid; // Ex: 5511999999999@s.whatsapp.net
    
    if (!remoteJid || !message) {
      return NextResponse.json({ success: true }); // Ignorar se não for mensagem de texto
    }

    const phoneNumber = remoteJid.split('@')[0];
    const textReceived = message.trim();

    // 1. Buscar ou criar sessão
    let [session] = await db
      .select()
      .from(whatsappSessions)
      .where(eq(whatsappSessions.phoneNumber, phoneNumber))
      .limit(1);

    if (!session) {
      session = {
        phoneNumber,
        step: 'START',
        data: {},
        updatedAt: new Date()
      };
      await db.insert(whatsappSessions).values(session);
    }

    // 2. Processar Fluxo
    await handleFlow(session, textReceived);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in WhatsApp webhook:', error);
    return NextResponse.json({ success: true }); // Always return 200 to avoiding webhook retries
  }
}

async function handleFlow(session: any, text: string) {
  const { phoneNumber, step, data } = session;
  const normalizedText = text.toLowerCase();

  // Opção Global de Voltar ou Recomeçar
  if (normalizedText === 'sair' || normalizedText === 'recomeçar' || normalizedText === '0') {
    await updateSession(phoneNumber, 'START', {});
    await whatsappService.sendText(phoneNumber, 'Olá! Bem-vindo à *Coopergen*. Vamos iniciar a consulta dos seus documentos.\n\nPor favor, digite o número da sua *MATRÍCULA*:');
    return;
  }

  switch (step) {
    case 'START':
      await updateSession(phoneNumber, 'AWAITING_MATRICULA', {});
      await whatsappService.sendText(phoneNumber, 'Olá! Sou o assistente virtual da *Coopergen*.\n\nPara consultar seus documentos, por favor, digite sua *MATRÍCULA* (apenas números):');
      break;

    case 'AWAITING_MATRICULA':
      await updateSession(phoneNumber, 'AWAITING_CPF', { matricula: text });
      await whatsappService.sendText(phoneNumber, 'Obrigado! Agora, para sua segurança, informe os *5 PRIMEIROS DÍGITOS* do seu CPF:');
      break;

    case 'AWAITING_CPF':
      if (text.replace(/\D/g, '').length < 5) {
        await whatsappService.sendText(phoneNumber, 'Por favor, informe pelo menos os 5 primeiros dígitos do CPF.');
        return;
      }
      await updateSession(phoneNumber, 'AWAITING_YEAR', { ...data, cpfPrefix: text.substring(0, 5) });
      await whatsappService.sendText(phoneNumber, 'Selecione o *ANO* da consulta (Ex: 2025):');
      break;

    case 'AWAITING_YEAR':
      const year = parseInt(text.replace(/\D/g, ''));
      if (isNaN(year) || year < 2020 || year > 2026) {
        await whatsappService.sendText(phoneNumber, 'Ano inválido. Por favor, escolha entre 2020 e 2026:');
        return;
      }
      
      // Validar Matrícula e CPF antes de prosseguir
      const validation = await validateCooperado(data.matricula, data.cpfPrefix);
      if (!validation.success) {
        await whatsappService.sendText(phoneNumber, '❌ ' + (validation.error || 'Dados inválidos.') + '\n\nVamos tentar novamente. Digite sua *MATRÍCULA*:');
        await updateSession(phoneNumber, 'AWAITING_MATRICULA', {});
        return;
      }

      await updateSession(phoneNumber, 'AWAITING_TYPE', { ...data, year, userName: validation.name });
      await whatsappService.sendText(phoneNumber, `Olá Sr(a). *${validation.name}*!\n\nQual documento você deseja?\n\n1 - *Contra Cheque*\n2 - *Rendimento*\n3 - *Rateio*\n\n0 - *Sair*`);
      break;

    case 'AWAITING_TYPE':
      const typeMap: Record<string, string> = { '1': 'Contra Cheque', '2': 'Rendimento', '3': 'Rateio' };
      const selectedType = typeMap[text];
      
      if (!selectedType) {
        await whatsappService.sendText(phoneNumber, 'Opção inválida. Escolha entre 1, 2 ou 3.');
        return;
      }

      await whatsappService.sendText(phoneNumber, `Buscando seu *${selectedType}* de *${data.year}*...`);
      await sendDocuments(phoneNumber, data.matricula, data.cpfPrefix, data.year, selectedType);
      
      // Oferecer nova consulta ou finalizar
      await whatsappService.sendText(phoneNumber, 'Deseja consultar outro documento?\n\n1 - Sim (Mudar Tipo)\n2 - Sim (Mudar Ano)\n0 - Sair');
      await updateSession(phoneNumber, 'AWAITING_FOLLOWUP', { ...data, lastType: selectedType });
      break;

    case 'AWAITING_FOLLOWUP':
      if (text === '1') {
        await updateSession(phoneNumber, 'AWAITING_TYPE', data);
        await whatsappService.sendText(phoneNumber, 'Qual documento você deseja?\n\n1 - *Contra Cheque*\n2 - *Rendimento*\n3 - *Rateio*');
      } else if (text === '2') {
        await updateSession(phoneNumber, 'AWAITING_YEAR', { matricula: data.matricula, cpfPrefix: data.cpfPrefix });
        await whatsappService.sendText(phoneNumber, 'Informe o novo *ANO* da consulta:');
      } else {
        await updateSession(phoneNumber, 'START', {});
        await whatsappService.sendText(phoneNumber, 'Obrigado por utilizar nosso serviço. Quando precisar, é só enviar um "Oi"!');
      }
      break;

    default:
      await updateSession(phoneNumber, 'START', {});
      await whatsappService.sendText(phoneNumber, 'Olá! Digite sua *MATRÍCULA* para iniciar:');
  }
}

async function updateSession(phoneNumber: string, step: string, data: any) {
  await db
    .update(whatsappSessions)
    .set({ step, data, updatedAt: new Date() })
    .where(eq(whatsappSessions.phoneNumber, phoneNumber));
}

async function validateCooperado(matricula: string, cpfPrefix: string) {
  const [coop] = await db
    .select()
    .from(cooperados)
    .where(eq(cooperados.matricula, matricula))
    .limit(1);

  if (!coop) return { success: false, error: 'Matrícula não encontrada.' };
  if (!coop.isActive) return { success: false, error: 'Cadastro inativo.' };

  const cleanDbCpf = coop.cpf?.replace(/\D/g, '') || '';
  if (!cleanDbCpf.startsWith(cpfPrefix)) {
    return { success: false, error: 'Informações de segurança não conferem.' };
  }

  return { success: true, name: coop.name, id: coop.id };
}

async function sendDocuments(phoneNumber: string, matricula: string, cpfPrefix: string, year: number, type: string) {
  const validation = await validateCooperado(matricula, cpfPrefix);
  if (!validation.success) return;

  const results = await db
    .select()
    .from(paystubs)
    .where(and(
      eq(paystubs.cooperadoId, validation.id as string),
      eq(paystubs.year, year),
      eq(paystubs.type, type)
    ))
    .orderBy(paystubs.month);

  if (results.length === 0) {
    await whatsappService.sendText(phoneNumber, `Nenhum documento do tipo *${type}* encontrado para o ano *${year}*.`);
    return;
  }

  for (const doc of results) {
    const monthName = MONTHS.find(m => m.value === doc.month)?.label;
    const caption = `${type} - ${monthName}/${year}`;
    const fileName = `${type}_${monthName}_${year}.pdf`.replace(/\s+/g, '_');
    
    // Envia o link do arquivo (Evolution API vai baixar e enviar como documento)
    await whatsappService.sendMedia(phoneNumber, doc.fileUrl!, caption, fileName);
  }
}
