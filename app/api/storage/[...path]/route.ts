import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { getAccessTokenFromCookies } from '@/lib/auth/cookies';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Acesso público permitido para documentos (validado previamente pela aplicação)
    // Os nomes dos arquivos são UUIDs, dificultando o acesso não autorizado por adivinhação.

    const { path } = await params;
    const fileName = path.join('/');
    
    // Lista de pastas para buscar (Nova primeiro, depois a antiga como fallback)
    const storageDirs = [
      join(process.cwd(), 'storage'),
      join(process.cwd(), 'storage-coopergen')
    ];

    let fileBuffer: Buffer | null = null;
    let currentPath = '';

    for (const dir of storageDirs) {
      const testPath = join(dir, fileName);
      
      // Validação de segurança: garantir que o caminho não saia da pasta permitida
      if (!testPath.startsWith(dir)) continue;

      try {
        fileBuffer = await readFile(testPath);
        currentPath = testPath;
        break; // Encontrou o arquivo, sai do loop
      } catch (e) {
        // Se não encontrou nesta pasta, tenta a próxima
        continue;
      }
    }

    if (!fileBuffer) {
      return new NextResponse('Arquivo não encontrado', { status: 404 });
    }
    
    // Determine content type
    let contentType = 'application/octet-stream';
    if (fileName.endsWith('.pdf')) {
      contentType = 'application/pdf';
    } else if (fileName.endsWith('.png')) {
      contentType = 'image/png';
    } else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    }

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('[STORAGE_ERROR]', error);
    return new NextResponse('Arquivo não encontrado', { status: 404 });
  }
}
