import fs from 'fs';
import path from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const folder = process.argv[2] || '.';

async function extractTextFromPDF(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const pdf = await pdfjsLib.getDocument({ data, useSystemFonts: true, disableFontFace: true }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    const sorted = [...tc.items].sort((a, b) => {
      const d = b.transform[5] - a.transform[5];
      return Math.abs(d) > 3 ? d : a.transform[4] - b.transform[4];
    });
    fullText += sorted.map(x => x.str).join(' ') + ' ';
  }
  return fullText;
}

function extractName(text) {
  const patterns = [
    /(?:Empregado\s+Cargo\s+Lotação|Empregado\s+Cargo\/Lotação)[\s\d]+([A-ZÀ-Ÿ]{2,}(?:\s+[A-ZÀ-Ÿ]{1,})+)/i,
    /CPF\s+T[íi]tulo\s+de\s+Eleitor\s+Nome\s+Completo[\s\d._\-\/]+([A-ZÀ-Ÿ]{2,}(?:\s+[A-ZÀ-Ÿ]{1,})+)/i,
    /(?:Nome\s+Completo|Empregado)[:\s]+(?:\d+\s+)?(?:Cargo\s+Lotação\s+|Cargo\/Lotação\s+)?(?!(?:Cargo\s+Lotação|Cargo\/Lotação|CNPJ|CPF|Data|Assinatura))([A-ZÀ-Ÿ]{2,}(?:\s+[A-ZÀ-Ÿ]{1,})+)/i,
    /Nome\s+do\s+Cooperado[:\s]+([A-ZÀ-Ÿ]{3,50}(?:\s+[A-ZÀ-Ÿ]{1,50})+)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[1]) {
      let name = m[1].trim().replace(/\s+(TECNICO|ENFERMEIRO|AUXILIAR|COORDENADOR|PROMOTOR|AUX\.|Natureza|DATA|ASSINATURA).*$/i, '');
      if (name.split(/\s+/).length > 7) return null;
      return name;
    }
  }
  return null;
}

const files = fs.readdirSync(folder).filter(f => f.toLowerCase().endsWith('.pdf')).sort();
console.log(`\nAnalisando ${files.length} arquivos em "${folder}"...\n`);
console.log(`${'Arquivo'.padEnd(55)} | ${'Nome Encontrado'}`);
console.log('-'.repeat(110));

let found = 0;
let notFound = 0;
const failedFiles = [];

for (const file of files) {
  const filePath = path.join(folder, file);
  try {
    const text = await extractTextFromPDF(filePath);
    const name = extractName(text);
    const status = name ? `✓ ${name}` : '✗ NÃO IDENTIFICADO';
    if (name) found++; else { notFound++; failedFiles.push(file); }
    console.log(`${file.padEnd(55)} | ${status}`);
    
    // For failed files, show first 500 chars of extracted text for debugging
    if (!name) {
      console.log(`  >> TEXTO (primeiros 500 chars): ${text.substring(0, 500).replace(/\n/g, ' ')}`);
    }
  } catch (e) {
    console.log(`${file.padEnd(55)} | ✗ ERRO: ${e.message}`);
    notFound++;
    failedFiles.push(file);
  }
}

console.log('\n' + '='.repeat(110));
console.log(`RESULTADO: ${found} identificados, ${notFound} NÃO identificados de ${files.length} arquivos`);
if (failedFiles.length > 0) {
  console.log('\nArquivos sem identificação:');
  failedFiles.forEach(f => console.log('  -', f));
}
