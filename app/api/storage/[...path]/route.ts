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
    const token = await getAccessTokenFromCookies();
    if (!token || !(await verifyAccessToken(token))) {
      return new NextResponse('Não autorizado', { status: 401 });
    }

    const { path } = await params;
    const fileName = path.join('/');
    const storageDir = join(process.cwd(), 'storage-coopergen');
    const filePath = join(storageDir, fileName);

    // Security check: ensure the file is within the storage-coopergen directory
    if (!filePath.startsWith(storageDir)) {
      return new NextResponse('Acesso negado', { status: 403 });
    }

    const fileBuffer = await readFile(filePath);
    
    // Determine content type
    let contentType = 'application/octet-stream';
    if (fileName.endsWith('.pdf')) {
      contentType = 'application/pdf';
    } else if (fileName.endsWith('.png')) {
      contentType = 'image/png';
    } else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    }

    return new NextResponse(fileBuffer, {
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
