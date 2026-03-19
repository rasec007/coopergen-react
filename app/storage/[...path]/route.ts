import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const fileName = path.join('/');
    
    const storageDirs = [
      join(process.cwd(), 'storage'),
      join(process.cwd(), 'storage-coopergen')
    ];

    let fileBuffer: Buffer | null = null;

    for (const dir of storageDirs) {
      const testPath = join(dir, fileName);
      if (!testPath.startsWith(dir)) continue;

      try {
        fileBuffer = await readFile(testPath);
        break;
      } catch (e) {
        continue;
      }
    }

    if (!fileBuffer) {
      return new NextResponse('Arquivo não encontrado', { status: 404 });
    }
    
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
