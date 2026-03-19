import sharp from 'sharp';
import path from 'path';

async function getDimensions() {
  const filePath = path.join(process.cwd(), 'public', 'logo.png');
  try {
    const metadata = await sharp(filePath).metadata();
    console.log(`[DIMENSIONS] width: ${metadata.width}, height: ${metadata.height}`);
  } catch (err) {
    console.error("[DIMENSIONS] Erro:", err.message);
  }
}

getDimensions().catch(console.error);
