import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getAccessTokenFromCookies } from '@/lib/auth/cookies';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const token = await getAccessTokenFromCookies();
    if (!token || !(await verifyAccessToken(token))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Correct way for multipart/form-data:
    const data = await req.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure directory exists
    const storageDir = join(process.cwd(), 'storage');
    await mkdir(storageDir, { recursive: true });
    
    // Create unique filename
    const originalName = file.name;
    const extension = originalName.split('.').pop();
    const fileName = `${uuidv4()}.${extension}`;
    const path = join(storageDir, fileName);

    await writeFile(path, buffer);
    
    // Return the virtual path (the one we'll use in our storage API)
    return NextResponse.json({ 
      url: `/api/storage/${fileName}`,
      fileName: originalName 
    });
  } catch (error) {
    console.error('[UPLOAD_ERROR]', error);
    return NextResponse.json({ error: 'Erro ao fazer upload do arquivo' }, { status: 500 });
  }
}
