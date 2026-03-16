import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function extractText(path) {
  try {
    const data = new Uint8Array(fs.readFileSync(path));
    const loadingTask = pdfjsLib.getDocument({
      data,
      useSystemFonts: true,
      disableFontFace: true,
      verbos: 0
    });
    
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      console.log(`--- PAGE ${i} ITEMS START ---`);
      textContent.items.forEach(item => {
        if (item.str.trim()) {
            const x = item.transform[4];
            const y = item.transform[5];
            console.log(`[X:${x.toFixed(2)}, Y:${y.toFixed(2)}] '${item.str}'`);
        }
      });
      console.log(`--- PAGE ${i} ITEMS END ---`);
      
      const pageTextNoSpace = textContent.items.map(item => item.str).join('');
      const pageTextWithSpace = textContent.items.map(item => item.str).join(' ');
      
      console.log(`--- PAGE ${i} RAW JOIN START ---`);
      console.log(pageTextNoSpace);
      console.log(`--- PAGE ${i} RAW JOIN END ---`);
      
      fullText += pageTextWithSpace + '\n';
    }
    
    console.log('--- FULL TEXT START ---');
    console.log(fullText);
    console.log('--- FULL TEXT END ---');
  } catch (err) {
    console.error('Error:', err);
  }
}

const filePath = process.argv[2] || 'modelosPDF/Recibo RPA_01.2020_CESAR CALS_1-1.pdf';
extractText(filePath);
