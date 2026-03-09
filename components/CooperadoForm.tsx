'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { maskPhone, maskCPF } from '@/lib/utils/masks';

interface Cooperativa {
  id: string;
  name: string;
}

interface PostoTrabalho {
  id: string;
  name: string;
}

interface CooperadoFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export default function CooperadoForm({ initialData, isEdit = false }: CooperadoFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    cpf: '',
    apelido: '',
    matricula: '',
    cooperativaId: '',
    postoTrabalhoId: '',
    perfil: 'Cooperado',
    status: 'Ativo',
  });

  const [cooperativas, setCooperativas] = useState<Cooperativa[]>([]);
  const [postosTrabalho, setPostosTrabalho] = useState<PostoTrabalho[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCooperativas();
    if (initialData) {
      setFormData({
        ...formData,
        ...initialData,
        phone: maskPhone(initialData.phone || ''),
        cpf: maskCPF(initialData.cpf || ''),
        password: '', // Don't fill password on edit
        confirmPassword: '',
      });
      if (initialData.cooperativaId) {
        fetchPostosTrabalho(initialData.cooperativaId);
      }
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

  const fetchPostosTrabalho = async (coopId: string) => {
    try {
      const res = await fetch(`/api/postos-trabalho?cooperativaId=${coopId}`);
      const data = await res.json();
      if (res.ok) setPostosTrabalho(data);
    } catch (e) {
      console.error('Error fetching PTs:', e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    let newValue = value;

    if (id === 'phone') {
      newValue = maskPhone(value);
    } else if (id === 'cpf') {
      newValue = maskCPF(value);
    }

    setFormData(prev => ({ ...prev, [id]: newValue }));

    if (id === 'cooperativaId') {
      setFormData(prev => ({ ...prev, postoTrabalhoId: '' }));
      if (value) fetchPostosTrabalho(value);
      else setPostosTrabalho([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      setSaving(false);
      return;
    }

    try {
      const url = isEdit ? `/api/cooperados/${initialData.id}` : '/api/cooperados';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/dashboard/cooperados');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao salvar cooperado');
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
          <h1>{isEdit ? 'Editar Cooperado' : 'Cadastrar Cooperado'}</h1>
        </div>

        <form onSubmit={handleSubmit} className="form-content">
          <div className="form-grid">
            <div className="input-field">
              <label htmlFor="name">Nome Completo *</label>
              <input type="text" id="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="input-field">
              <label htmlFor="email">E-mail *</label>
              <input type="email" id="email" value={formData.email} onChange={handleChange} required />
            </div>

            {!isEdit && (
              <>
                <div className="input-field">
                  <label htmlFor="password">Senha *</label>
                  <input type="password" id="password" value={formData.password} onChange={handleChange} required />
                </div>
                <div className="input-field">
                  <label htmlFor="confirmPassword">Confirmar Senha *</label>
                  <input type="password" id="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
                </div>
              </>
            )}

            <div className="input-field">
              <label htmlFor="phone">Celular / WhatsApp</label>
              <input type="text" id="phone" value={formData.phone} onChange={handleChange} placeholder="(XX) X XXXX.XXXX" />
            </div>

            <div className="input-field">
              <label htmlFor="cpf">CPF</label>
              <input type="text" id="cpf" value={formData.cpf} onChange={handleChange} placeholder="000.000.000-00" />
            </div>

            <div className="input-field">
              <label htmlFor="apelido">Apelido</label>
              <input type="text" id="apelido" value={formData.apelido} onChange={handleChange} />
            </div>

            <div className="input-field">
              <label htmlFor="matricula">Matrícula</label>
              <input type="text" id="matricula" value={formData.matricula} onChange={handleChange} />
            </div>

            <div className="input-field">
              <label htmlFor="cooperativaId">Cooperativa *</label>
              <select id="cooperativaId" value={formData.cooperativaId} onChange={handleChange} required>
                <option value="">Selecione...</option>
                {cooperativas.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="input-field">
              <label htmlFor="postoTrabalhoId">Posto de Trabalho</label>
              <select id="postoTrabalhoId" value={formData.postoTrabalhoId} onChange={handleChange}>
                <option value="">Selecione...</option>
                {postosTrabalho.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
              </select>
            </div>

            <div className="input-field">
              <label htmlFor="perfil">Perfil</label>
              <select id="perfil" value={formData.perfil} onChange={handleChange}>
                <option value="Cooperado">Cooperado</option>
                <option value="ADM">Administrador</option>
              </select>
            </div>

            <div className="input-field">
              <label htmlFor="status">Status</label>
              <select id="status" value={formData.status} onChange={handleChange}>
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="actions">
            <button type="button" onClick={() => router.back()} className="btn-cancel">Cancelar</button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Carregando...' : (isEdit ? 'Atualizar' : 'Cadastrar')}
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
