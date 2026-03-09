const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function extractText(path) {
  try {
    const data = new Uint8Array(fs.readFileSync(path));
    const loadingTask = pdfjsLib.getDocument({
      data,
      useSystemFonts: true,
      disableFontFace: true
    });
    
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Basic sort by Y then X
      const items = textContent.items.sort((a, b) => {
        if (Math.abs(b.transform[5] - a.transform[5]) > 5) {
          return b.transform[5] - a.transform[5];
        }
        return a.transform[4] - b.transform[4];
      });
      
      fullText += items.map(item => item.str).join(' ') + '\n';
    }
    
    console.log('--- TEXT START ---');
    console.log(fullText);
    console.log('--- TEXT END ---');
  } catch (err) {
    console.error('Error:', err);
  }
}

const filePath = process.argv[2] || 'modelosPDF/Recibo RPA_01.2020_CESAR CALS_1-1.pdf';
extractText(filePath);
