'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SearchableSelect from './SearchableSelect';

// Importação dinâmica do PDF.js
let pdfjsLib: any = null;

const initPdfJS = async () => {
  if (typeof window === 'undefined') return null;
  if (pdfjsLib) return pdfjsLib;
  
  pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  return pdfjsLib;
};

interface Cooperado {
  id: string;
  name: string;
  cpf: string;
  matricula: string;
}

interface PostoTrabalho {
  id: string;
  name: string;
}

const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

const TYPES = ['Contra Cheque', 'Rendimento', 'Rateio'];

export default function PaystubBatchForm() {
  const router = useRouter();
  const [commonData, setCommonData] = useState({
    type: 'Contra Cheque',
    postoTrabalhoId: '',
    year: new Date().getFullYear().toString(),
    month: (new Date().getMonth() + 1).toString(),
  });
  const [sendNotifications, setSendNotifications] = useState(true);

  const [cooperados, setCooperados] = useState<Cooperado[]>([]);
  const [postos, setPostos] = useState<PostoTrabalho[]>([]);
  const [pendingFiles, setPendingFiles] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [processingFiles, setProcessingFiles] = useState(false);
  const isDataLoaded = useRef(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Efeito para re-identificar arquivos quando a lista de cooperados chegar
  useEffect(() => {
    if (cooperados.length > 0 && !isDataLoaded.current) {
      isDataLoaded.current = true;
      if (pendingFiles.length > 0) {
        console.log('[Batch] Re-processando identificação após carregamento de dados...');
        reIdentifyFiles();
      }
    }
  }, [cooperados]);

  const reIdentifyFiles = async () => {
    setPendingFiles(prev => {
        return prev.map(item => {
            if (item.linkedCooperadoId) return item;
            
            const fileMatch = matchCooperadoByFileName(item.fileName);
            if (fileMatch) {
                return { ...item, extractedName: fileMatch.name, linkedCooperadoId: fileMatch.id };
            }
            return item;
        });
    });
  };

  const fetchData = async () => {
    try {
      const [coopRes, postRes] = await Promise.all([
        fetch('/api/cooperados'),
        fetch('/api/postos-trabalho')
      ]);
      const [coopData, postData] = await Promise.all([coopRes.json(), postRes.json()]);
      
      if (coopRes.ok) {
        const sortedCoops = Array.isArray(coopData) 
          ? [...coopData].sort((a, b) => a.name.localeCompare(b.name))
          : [];
        setCooperados(sortedCoops);
      }
      if (postRes.ok) setPostos(postData);
    } catch (err: any) {
      console.error(err);
    }
  };

  const extractNameFromText = useCallback((text: string) => {
    // Regex para encontrar o nome do cooperado (ordem de especificidade decrescente)
    const patterns = [
      // 1. MDB (Recibo de Cooperados): "Empregado Cargo Lotação 002376 NOME CARGO"
      /(?:Empregado\s+Cargo\s+Lotação|Empregado\s+Cargo\/Lotação)[\s\d]+([A-ZÀ-Ÿ]{2,}(?:\s+[A-ZÀ-Ÿ]{1,})+)/i,

      // 2. Coopassend/Comprovante RF: "CPF Título de Eleitor Nome Completo" + números (ou ___ quando em branco) + NOME
      /CPF\s+T[íi]tulo\s+de\s+Eleitor\s+Nome\s+Completo[\s\d._\-\/]+([A-ZÀ-Ÿ]{2,}(?:\s+[A-ZÀ-Ÿ]{1,})+)/i,

      // 3. Coopsic e outros: "Nome Completo:" ou "Empregado:" + nome direto
      /(?:Nome\s+Completo|Empregado)[:\s]+(?:\d+\s+)?(?:Cargo\s+Lotação\s+|Cargo\/Lotação\s+)?(?!(?:Cargo\s+Lotação|Cargo\/Lotação|CNPJ|CPF|Data|Assinatura))([A-ZÀ-Ÿ]{2,}(?:\s+[A-ZÀ-Ÿ]{1,})+)/i,

      // 4. Nome do Cooperado explícito
      /Nome\s+do\s+Cooperado[:\s]+([A-ZÀ-Ÿ]{3,50}(?:\s+[A-ZÀ-Ÿ]{1,50})+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let name = match[1].trim();
        // Remove cargos e termos que aparecem colados ao nome no modelo MDB
        name = name.replace(/\s+(TECNICO|ENFERMEIRO|AUXILIAR|COORDENADOR|PROMOTOR|AUX\.|M\s+DIAS|BRANCO|Natureza|DATA|ASSINATURA).*$/i, '');
        // Rejeita se ficou muito longo (>7 palavras = provavelmente capturou texto errado)
        if (name.split(/\s+/).length > 7) return null;
        return name;
      }
    }
    return null;
  }, []);

  const extractTextFromPDF = async (file: File) => {
    try {
      const lib = await initPdfJS();
      if (!lib) return '';

      console.log(`[PDF] Lendo arquivo: ${file.name}`);
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      const maxPages = pdf.numPages;
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Ordenar itens por posição (Y decrescente, X crescente) para texto coerente
        const sortedItems = [...textContent.items].sort((a: any, b: any) => {
          const yDiff = b.transform[5] - a.transform[5];
          if (Math.abs(yDiff) > 5) return yDiff;
          return a.transform[4] - b.transform[4];
        });
        
        const pageText = sortedItems.map((item: any) => item.str).join(' ');
        fullText += pageText + ' ';
      }
      
      console.log(`[PDF] Texto extraído (${file.name}):`, fullText.substring(0, 3000));
      return fullText;
    } catch (err: any) {
      console.error('Erro ao ler PDF:', err);
      return '';
    }
  };

  const matchCooperadoByFileName = (fileName: string) => {
    const cleanFileName = fileName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    console.log(`[Batch] Tentando coincidir arquivo: "${fileName}" (Limpo: "${cleanFileName}")`);
    
    if (cooperados.length === 0) {
      console.warn('[Batch] Lista de cooperados ainda está vazia!');
    }

    const match = cooperados.find((c: Cooperado) => {
      const coopNameClean = c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      
      // Evita confundir anos comuns com matrícula no nome do arquivo
      const isYear = ['2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030'].includes(c.matricula);
      const matriculaMatch = !isYear && c.matricula && new RegExp(`\\b${c.matricula}\\b`).test(cleanFileName);
      
      const cpfMatch = c.cpf && cleanFileName.includes(c.cpf.replace(/\D/g, ''));
      
      // Busca pelo nome completo ou pelo menos os dois primeiros nomes
      const nameParts = coopNameClean.split(/\s+/).filter(p => p.length > 2);
      const firstNameMatch = nameParts.length >= 2 && cleanFileName.includes(`${nameParts[0]} ${nameParts[1]}`);
      const fullNameMatch = cleanFileName.includes(coopNameClean);

      if (matriculaMatch || cpfMatch || fullNameMatch || firstNameMatch) {
         console.log(`[Batch] Encontrado via arquivo! Nome: ${c.name} (Tipo: ${matriculaMatch ? 'Matrícula' : cpfMatch ? 'CPF' : 'Nome'})`);
         return true;
      }
      return false;
    });

    return match;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    setProcessingFiles(true);
    setError('');
    
    const newPendingItems: {
      file: File,
      fileName: string,
      extractedName: string,
      linkedCooperadoId: string,
      fileUrl: string,
    }[] = [];
    
    for (const file of files) {
      let extractedName = '';
      let linkedId = '';
      
      const fileNameMatch = matchCooperadoByFileName(file.name);
      if (fileNameMatch) {
         linkedId = fileNameMatch.id;
         extractedName = fileNameMatch.name;
      }

      if (file.type === 'application/pdf') {
        const pdfText = await extractTextFromPDF(file);
        const pdfTextClean = pdfText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        let nameFound = extractNameFromText(pdfText);
        
        // Segundo passo: Se não achou por regex, busca se algum nome de cooperado existe no texto
        // IMPORTANTE: só busca na primeira metade do texto para evitar pegar nomes de rodapé/assinatura
        if (!nameFound) {
          const firstHalfText = pdfTextClean.substring(0, Math.floor(pdfTextClean.length * 0.5));
          const foundInContent = cooperados.find((c: Cooperado) => {
            const coopNameClean = c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            // Nome deve ter pelo menos 12 chars para reduzir falsos positivos
            return coopNameClean.length >= 12 && firstHalfText.includes(coopNameClean);
          });
          if (foundInContent) {
            nameFound = foundInContent.name;
          }
        }
        
        if (nameFound) {
          extractedName = nameFound;
          // Se encontramos um nome no PDF, tentamos encontrar o cooperado correspondente abaixo.
          // Isso tem prioridade sobre a identificação feita pelo nome do arquivo acima.
          const nameMatch = cooperados.find((c: Cooperado) => {
             const n1 = c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
             const n2 = nameFound!.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
             return n1 === n2 || n2.includes(n1) || n1.includes(n2);
          });
          if (nameMatch) {
            linkedId = nameMatch.id;
          } else {
            // Se achou o nome mas não deu match exato com nenhum cooperado ID
            linkedId = '';
          }
        } else {
          // Se é um PDF e não conseguimos extrair o nome de dentro dele,
          // limpamos o vínculo que veio do nome do arquivo para evitar falsos positivos
          extractedName = 'Nome não encontrado';
          linkedId = '';
        }
      }

      const formData = new FormData();
      formData.append('file', file);
      
      let finalFileUrl = '';
      try {
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalFileUrl = uploadData.url;
        }
      } catch (err) {
        console.error('Erro no upload:', err);
      }

      newPendingItems.push({
        file,
        fileName: file.name,
        extractedName: extractedName || 'Não identificado',
        linkedCooperadoId: linkedId,
        fileUrl: finalFileUrl,
      });
    }

    setPendingFiles(prev => [...prev, ...newPendingItems]);
    setProcessingFiles(false);
  };

  const handleLinkedChange = (index: number, id: string) => {
    setPendingFiles(prev => prev.map((item, i) => i === index ? { ...item, linkedCooperadoId: id } : item));
  };

  const removeFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações de campos obrigatórios
    if (!commonData.type || commonData.type === '') {
      setError('O campo Tipo é obrigatório.');
      return;
    }
    // Validações condicionais baseada no tipo
    if (commonData.type === 'Contra Cheque') {
      if (!commonData.postoTrabalhoId || commonData.postoTrabalhoId === '') {
        setError('O campo Posto de Trabalho é obrigatório.');
        return;
      }
      if (!commonData.month || commonData.month === '') {
        setError('O campo Mês é obrigatório.');
        return;
      }
    }

    if (!commonData.year || commonData.year === '') {
      setError('O campo Ano é obrigatório.');
      return;
    }

    if (pendingFiles.length === 0) {
      setError('Por favor, selecione ao menos um arquivo.');
      return;
    }

    if (pendingFiles.some(f => !f.linkedCooperadoId)) {
      setError('Todos os arquivos devem estar vinculados a um cooperado.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const promises = pendingFiles.map(item => {
        return fetch('/api/paystubs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...commonData,
            postoTrabalhoId: commonData.postoTrabalhoId && commonData.postoTrabalhoId !== '' ? commonData.postoTrabalhoId : null,
            month: commonData.type === 'Contra Cheque' ? commonData.month : '0',
            cooperadoId: item.linkedCooperadoId,
            fileUrl: item.fileUrl, 
            valorBruto: '0',
            valorLiquido: '0',
            sendNotifications,
          }),
        });
      });

      const results = await Promise.all(promises);
      if (results.every(r => r.ok)) {
        router.push('/dashboard/paystubs');
        router.refresh();
      } else {
        setError('Alguns registros não puderam ser salvos.');
      }
    } catch (err) {
      setError('Erro ao salvar lote de contra cheques.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="form-container fade-in">
      <div className="card">
        <div className="header">
          <h1>Cadastrar Contra Cheque/Rendimento/Rateio</h1>
        </div>

        <form onSubmit={handleSubmit} className="form-content">
          <div className="common-grid">
            <div className="input-field">
              <label>Tipo *</label>
              <select value={commonData.type} onChange={e => setCommonData({...commonData, type: e.target.value})}>
                <option value="">Selecione...</option>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {commonData.type === 'Contra Cheque' && (
              <div className="input-field animate-in">
                <label>Posto de Trabalho *</label>
                <select value={commonData.postoTrabalhoId} onChange={e => setCommonData({...commonData, postoTrabalhoId: e.target.value})}>
                  <option value="">Selecione o posto...</option>
                  {postos.map((p: PostoTrabalho) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
            <div className="input-field">
              <label>Ano *</label>
              <select value={commonData.year} onChange={e => setCommonData({...commonData, year: e.target.value})}>
                <option value="">Selecione...</option>
                {['2026', '2025', '2024', '2023', '2022', '2021', '2020'].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            {commonData.type === 'Contra Cheque' && (
              <div className="input-field animate-in">
                <label>Mês *</label>
                <select value={commonData.month} onChange={e => setCommonData({...commonData, month: e.target.value})}>
                  {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="dropzone-area">
            <label htmlFor="file-upload" className="dropzone-label">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              <span>{processingFiles ? 'Processando arquivos...' : 'Solte aqui seus arquivos ou clique para selecionar'}</span>
              <span className="hint">Apenas arquivos PDF são recomendados</span>
            </label>

            <div className="notification-toggle">
              <label className="checkbox-container">
                <input 
                  type="checkbox" 
                  checked={sendNotifications} 
                  onChange={(e) => setSendNotifications(e.target.checked)} 
                />
                <span className="checkbox-label">Enviar notificações via E-mail e WhatsApp</span>
              </label>
            </div>
            <input 
              id="file-upload" 
              type="file" 
              multiple 
              onChange={handleFileChange} 
              className="hidden-input"
              accept=".pdf,.jpg,.jpeg,.png"
              disabled={processingFiles}
            />
          </div>

          {pendingFiles.length > 0 && (
            <div className="files-table-container">
              <table className="files-table">
                <thead>
                  <tr>
                    <th>Nº</th>
                    <th style={{ width: '25%' }}>Arquivo</th>
                    <th style={{ width: '25%' }}>Cooperado Encontrado</th>
                    <th style={{ width: '40%' }}>Cooperado Vinculado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {pendingFiles.map((item, index) => (
                    <tr key={index}>
                      <td className="center">{index + 1}</td>
                      <td>
                        <div className="file-info-cell">
                          <span className="file-name">{item.fileName}</span>
                          {!item.fileUrl && <span className="upload-error">Erro no upload</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`found-name ${item.extractedName === 'Nome não encontrado' ? 'error' : ''}`}>
                          {item.extractedName}
                        </span>
                      </td>
                      <td>
                        <SearchableSelect 
                          options={cooperados}
                          value={item.linkedCooperadoId}
                          onChange={(id) => handleLinkedChange(index, id)}
                          placeholder="Nome não encontrado"
                        />
                      </td>
                      <td className="center">
                        <button type="button" onClick={() => removeFile(index)} className="btn-remove" title="Remover">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {error && <div className="error-box">{error}</div>}

          <div className="form-actions">
             <button type="submit" className="btn-save" disabled={saving || pendingFiles.length === 0 || processingFiles}>
               {saving ? 'Gravando...' : 'Cadastrar'}
             </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .form-container { display: flex; justify-content: center; padding: 20px; }
        .card { width: 100%; max-width: 900px; background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; overflow: hidden; }
        .header { background: #83004c; color: white; padding: 24px; text-align: center; }
        .header h1 { font-size: 20px; font-weight: 600; margin: 0; }
        .form-content { padding: 32px; }
        
        .common-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 32px; }
        .input-field { display: flex; flex-direction: column; gap: 6px; }
        .input-field label { font-size: 13px; color: #64748b; font-weight: 500; }
        .input-field select { padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; transition: border-color 0.2s; }
        .input-field select:focus { outline: none; border-color: #83004c; }
        
        .dropzone-area { border: 2px dashed #e2e8f0; border-radius: 12px; padding: 40px; text-align: center; margin-bottom: 32px; background: #f8fafc; transition: all 0.2s; position: relative; }
        .dropzone-area:hover { border-color: #83004c; background: #fff; }
        .dropzone-label { display: flex; flex-direction: column; align-items: center; gap: 12px; cursor: pointer; color: #64748b; }
        .dropzone-label span { font-size: 14px; font-weight: 500; }
        .dropzone-label .hint { font-size: 12px; opacity: 0.7; }
        .hidden-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }

        .files-table-container { margin-bottom: 32px; border: 1px solid #f1f5f9; border-radius: 8px; overflow: visible; }
        .files-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .files-table th { background: #f8fafc; padding: 12px; font-size: 12px; text-align: left; color: #64748b; border-bottom: 1px solid #f1f5f9; }
        .files-table td { padding: 12px; border-bottom: 1px solid #f8fafc; font-size: 14px; vertical-align: middle; }
        .file-info-cell { display: flex; flex-direction: column; gap: 4px; }
        .upload-error { color: #dc2626; font-size: 11px; font-weight: 600; }
        .file-name { font-weight: 500; color: #334155; word-break: break-all; }
        .found-name { color: #166534; font-weight: 600; font-size: 13px; }
        .found-name.error { color: #991b1b; opacity: 0.7; }
        
        .btn-remove { background: none; border: none; color: #94a3b8; cursor: pointer; padding: 4px; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; }
        .btn-remove:hover { color: #ef4444; background: #fef2f2; }

        .error-box { padding: 12px; background: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; color: #dc2626; text-align: center; margin-bottom: 24px; font-size: 14px; }
        
        .form-actions { display: flex; justify-content: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #f1f5f9; }
        .btn-save { padding: 12px 60px; background: #83004c; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 16px; transition: background 0.2s; }
        .btn-save:hover { background: #70003c; }
        .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .animate-in { animation: slideIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }

        .notification-toggle { margin-top: 20px; display: flex; justify-content: center; }
        .checkbox-container { display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; }
        .checkbox-container input { cursor: pointer; width: 18px; height: 18px; accent-color: #83004c; }
        .checkbox-label { font-size: 14px; color: #334155; font-weight: 500; }

        @media (max-width: 768px) {
          .common-grid { grid-template-columns: 1fr; }
          .form-content { padding: 20px; }
          .btn-save { width: 100%; }
        }
      `}</style>
    </div>
  );
}
