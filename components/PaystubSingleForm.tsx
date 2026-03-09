'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PaystubSingleFormProps {
  initialData?: any;
  isEdit?: boolean;
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

export default function PaystubSingleForm({ initialData, isEdit = false }: PaystubSingleFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    type: 'Contra Cheque',
    postoTrabalhoId: '',
    year: new Date().getFullYear().toString(),
    month: (new Date().getMonth() + 1).toString(),
    cooperadoId: '',
    valorBruto: '0',
    valorLiquido: '0',
    fileUrl: '',
  });

  const [cooperados, setCooperados] = useState<any[]>([]);
  const [postos, setPostos] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
    if (initialData) {
      setFormData({
        type: initialData.type || 'Contra Cheque',
        postoTrabalhoId: initialData.postoTrabalhoId || '',
        year: initialData.year?.toString() || new Date().getFullYear().toString(),
        month: initialData.month?.toString() || (new Date().getMonth() + 1).toString(),
        cooperadoId: initialData.cooperadoId || '',
        valorBruto: initialData.valorBruto || '0',
        valorLiquido: initialData.valorLiquido || '0',
        fileUrl: initialData.fileUrl || '',
      });
    }
  }, [initialData]);

  const fetchData = async () => {
    try {
      const [coopRes, postRes] = await Promise.all([
        fetch('/api/cooperados?limit=all'),
        fetch('/api/postos-trabalho')
      ]);
      if (coopRes.ok) setCooperados(await coopRes.json());
      if (postRes.ok) setPostos(await postRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, fileUrl: data.url }));
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao enviar arquivo');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor de upload');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const url = isEdit ? `/api/paystubs/${initialData.id}` : '/api/paystubs';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/dashboard/paystubs');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao salvar contra cheque');
      }
    } catch (err) {
      setError('Erro na conexão com o servidor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="form-container fade-in">
      <div className="card">
        <div className="header">
          <h1>{isEdit ? 'Editar Contra Cheque' : 'Cadastrar Contra Cheque'}</h1>
        </div>

        <form onSubmit={handleSubmit} className="form-content">
          <div className="form-grid">
            <div className="input-field">
              <label htmlFor="cooperadoId">Cooperado *</label>
              <select id="cooperadoId" value={formData.cooperadoId} onChange={handleChange} required>
                <option value="">Selecione o cooperado...</option>
                {cooperados.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="input-field">
              <label htmlFor="type">Tipo</label>
              <select id="type" value={formData.type} onChange={handleChange}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="dual-row">
              <div className="input-field">
                <label htmlFor="year">Ano</label>
                <select id="year" value={formData.year} onChange={handleChange}>
                   {[2026, 2025, 2024, 2023].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="input-field">
                <label htmlFor="month">Mês</label>
                <select id="month" value={formData.month} onChange={handleChange}>
                   {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>

            <div className="input-field">
              <label htmlFor="postoTrabalhoId">Posto de Trabalho</label>
              <select id="postoTrabalhoId" value={formData.postoTrabalhoId} onChange={handleChange}>
                <option value="">Selecione o posto...</option>
                {postos.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="input-field">
              <label htmlFor="file">Arquivo PDF</label>
              <div className="file-upload-wrapper">
                <input 
                  type="file" 
                  id="file" 
                  accept=".pdf" 
                  onChange={handleFileUpload} 
                  disabled={uploading}
                />
                {uploading && <span className="upload-status">Enviando...</span>}
                {formData.fileUrl && !uploading && <span className="upload-success">✅ Arquivo pronto</span>}
              </div>
              <input type="hidden" id="fileUrl" value={formData.fileUrl} />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="actions">
            <button type="button" onClick={() => router.back()} className="btn-cancel">Cancelar</button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Gravando...' : (isEdit ? 'Atualizar' : 'Cadastrar')}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .form-container { display: flex; justify-content: center; padding: 20px; }
        .card { width: 100%; max-width: 600px; background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; overflow: hidden; }
        .header { background: #83004c; color: white; padding: 24px; text-align: center; }
        .header h1 { font-size: 20px; font-weight: 600; margin: 0; }
        .form-content { padding: 32px; }
        .form-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
        .dual-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .input-field { display: flex; flex-direction: column; gap: 6px; }
        .input-field label { font-size: 13px; color: #64748b; font-weight: 500; }
        .input-field select, .input-field input { padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; }
        .file-upload-wrapper { display: flex; align-items: center; gap: 12px; }
        .file-upload-wrapper input { flex: 1; }
        .upload-status { font-size: 12px; color: #3b82f6; font-weight: 500; }
        .upload-success { font-size: 12px; color: #10b981; font-weight: 500; }
        .actions { display: flex; flex-direction: column; gap: 12px; margin-top: 32px; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 24px; }
        .btn-cancel { padding: 10px 30px; border: 1px solid #e2e8f0; background: white; color: #64748b; border-radius: 8px; font-weight: 600; cursor: pointer; width: 100%; max-width: 200px; order: 2; }
        .btn-save { padding: 12px 40px; background: #83004c; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; width: 100%; max-width: 200px; order: 1; }
        .error-message { margin-top: 16px; padding: 10px; background: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; color: #dc2626; text-align: center; font-size: 13px; }
        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @media (min-width: 480px) { .actions { flex-direction: row; justify-content: center; } .btn-cancel { order: 1; } .btn-save { order: 2; } }
      `}</style>
    </div>
  );
}
