import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function extractAllText(path) {
  const data = new Uint8Array(fs.readFileSync(path));
  const pdf = await pdfjsLib.getDocument({ data, useSystemFonts: true, disableFontFace: true }).promise;
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    // Sort by Y (top to bottom), then X (left to right)
    const sorted = [...textContent.items].sort((a, b) => {
      const yDiff = b.transform[5] - a.transform[5];
      if (Math.abs(yDiff) > 3) return yDiff;
      return a.transform[4] - b.transform[4];
    });
    
    // Print all items individually to see ALL the text
    console.log(`\n=== PAGE ${i} ITEMS ===`);
    sorted.forEach(item => {
      if (item.str.trim()) {
        const y = Math.round(item.transform[5]);
        const x = Math.round(item.transform[4]);
        console.log(`[Y:${y} X:${x}] "${item.str}"`);
      }
    });
    
    const fullText = sorted.map(i => i.str).join(' ');
    console.log(`\n=== PAGE ${i} JOINED TEXT ===`);
    console.log(fullText);
    console.log('=== END ===');
  }
}

const filePath = process.argv[2];
extractAllText(filePath).catch(console.error);
