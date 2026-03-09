'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Cooperativa {
  id: string;
  name: string;
}

interface PostoTrabalhoFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export default function PostoTrabalhoForm({ initialData, isEdit = false }: PostoTrabalhoFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    cooperativaId: '',
  });

  const [cooperativas, setCooperativas] = useState<Cooperativa[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCooperativas();
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        cooperativaId: initialData.cooperativaId || '',
      });
    }
  }, [initialData]);

  const fetchCooperativas = async () => {
    try {
      const res = await fetch('/api/cooperativas');
      const data = await res.json();
      if (res.ok) setCooperativas(data);
    } catch (e) {
      console.error('Error fetching coops:', e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const url = isEdit ? `/api/postos-trabalho/${initialData.id}` : '/api/postos-trabalho';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/dashboard/postos-trabalho');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao salvar posto de trabalho');
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
          <h1>{isEdit ? 'Editar Posto de Trabalho' : 'Cadastrar Posto de Trabalho'}</h1>
        </div>

        <form onSubmit={handleSubmit} className="form-content">
          <div className="form-grid">
            <div className="input-field">
              <label htmlFor="name">Posto de Trabalho *</label>
              <input 
                type="text" 
                id="name" 
                value={formData.name} 
                onChange={handleChange} 
                required 
                placeholder="Posto de Trabalho"
              />
            </div>

            <div className="input-field">
              <label htmlFor="cooperativaId">Cooperativa *</label>
              <select 
                id="cooperativaId" 
                value={formData.cooperativaId} 
                onChange={handleChange} 
                required
              >
                <option value="">Selecione a Cooperativa...</option>
                {cooperativas.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="actions">
            <button type="button" onClick={() => router.back()} className="btn-cancel">Cancelar</button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Cadastrar')}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .form-container { display: flex; justify-content: center; padding: 20px; }
        .card { width: 100%; max-width: 600px; background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #F1F5F9; }
        .header { background-color: #83004c; color: white; padding: 24px; text-align: center; }
        .header h1 { font-size: 20px; font-weight: 600; margin: 0; }
        .form-content { padding: 32px; }
        .form-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
        .input-field { display: flex; flex-direction: column; gap: 6px; }
        .input-field label { font-size: 13px; color: #64748b; font-weight: 500; }
        .input-field input, .input-field select { padding: 10px 14px; border: 1px solid #E2E8F0; border-radius: 8px; font-size: 14px; transition: border-color 0.2s; }
        .input-field input:focus, .input-field select:focus { outline: none; border-color: #83004c; }
        .error-message { margin-top: 16px; padding: 10px; background-color: #fef2f2; color: #dc2626; border: 1px solid #ef4444; border-radius: 8px; text-align: center; font-size: 13px; }
        .actions { display: flex; flex-direction: column; gap: 12px; margin-top: 32px; padding-top: 24px; border-top: 1px solid #f1f5f9; align-items: center; }
        .btn-cancel { padding: 10px 24px; border: 1px solid #e2e8f0; background: white; color: #64748b; border-radius: 8px; font-weight: 600; cursor: pointer; width: 100%; max-width: 200px; order: 2; }
        .btn-save { padding: 12px 32px; background-color: #83004c; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; width: 100%; max-width: 200px; order: 1; }
        .btn-save:hover { background-color: #70003c; }
        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @media (min-width: 480px) { .actions { flex-direction: row; justify-content: center; } .btn-cancel { order: 1; } .btn-save { order: 2; } }
      `}</style>
    </div>
  );
}
