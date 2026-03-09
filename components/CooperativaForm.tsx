'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { maskPhone } from '@/lib/utils/masks';

interface CooperativaFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export default function CooperativaForm({ initialData, isEdit = false }: CooperativaFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    phone: '',
    email: '',
    responsible: '',
    status: 'Ativo',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        nickname: initialData.nickname || '',
        phone: maskPhone(initialData.phone || ''),
        email: initialData.email || '',
        responsible: initialData.responsible || '',
        status: initialData.status || 'Ativo',
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const url = isEdit ? `/api/cooperativas/${initialData.id}` : '/api/cooperativas';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/dashboard/cooperativas');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao salvar cooperativa');
      }
    } catch (err) {
      setError('Erro na conexão com o servidor');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let value = e.target.value;
    if (e.target.id === 'phone') {
      value = maskPhone(value);
    }
    setFormData({ ...formData, [e.target.id]: value });
  };

  return (
    <div className="form-container fade-in">
      <div className="card">
        <div className="header">
          <h1>{isEdit ? 'Editar Cooperativa' : 'Cadastrar Cooperativa'}</h1>
        </div>

        <form onSubmit={handleSubmit} className="form-content">
          <div className="form-grid">
            <div className="input-field">
              <label htmlFor="name">Nome da Cooperativa *</label>
              <input 
                type="text" 
                id="name" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="Ex: Cooperativa Regional" 
                required 
              />
            </div>

            <div className="input-field">
              <label htmlFor="nickname">Apelido</label>
              <input 
                type="text" 
                id="nickname" 
                value={formData.nickname} 
                onChange={handleChange} 
                placeholder="Ex: Coop Regional" 
              />
            </div>

            <div className="input-field">
              <label htmlFor="email">E-mail</label>
              <input 
                type="email" 
                id="email" 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="contato@cooperativa.com" 
              />
            </div>

            <div className="input-field">
              <label htmlFor="phone">Celular / WhatsApp</label>
              <input 
                type="text" 
                id="phone" 
                value={formData.phone} 
                onChange={handleChange} 
                placeholder="(85) 9 0000.0000" 
              />
            </div>

            <div className="input-field">
              <label htmlFor="responsible">Responsável</label>
              <input 
                type="text" 
                id="responsible" 
                value={formData.responsible} 
                onChange={handleChange} 
                placeholder="Nome do gestor" 
              />
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
            <button type="button" onClick={() => router.back()} className="btn-cancel">
              Cancelar
            </button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Carregando...' : (isEdit ? 'Atualizar' : 'Cadastrar')}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .form-container {
          display: flex;
          justify-content: center;
          padding: 20px;
        }

        .card {
          width: 100%;
          max-width: 600px; /* Reduced for better look in single column */
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          border: 1px solid #F1F5F9;
        }

        .header {
          background-color: #83004c;
          color: white;
          padding: 24px;
          text-align: center;
        }

        .header h1 {
          font-size: 22px;
          font-weight: 600;
          margin: 0;
        }

        .form-content {
          padding: 40px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr; /* Single column as requested */
          gap: 24px;
        }

        .input-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-field label {
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }

        .input-field input, .input-field select {
          padding: 12px 16px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          font-size: 15px;
          transition: border-color 0.2s;
        }

        .input-field input:focus, .input-field select:focus {
          outline: none;
          border-color: #83004c;
        }

        .error-message {
          margin-top: 20px;
          padding: 12px;
          background-color: #fef2f2;
          color: #dc2626;
          border: 1px solid #ef4444;
          border-radius: 8px;
          text-align: center;
          font-size: 14px;
        }

        .actions {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 40px;
          padding-top: 24px;
          border-top: 1px solid #f1f5f9;
          align-items: center; /* Center horizontally in column mode */
        }

        .btn-cancel {
          padding: 12px 24px;
          border: 1px solid #e2e8f0;
          background: white;
          color: #64748b;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          order: 2;
          width: 200px; /* Fixed width for better look in single column */
        }

        .btn-cancel:hover {
          background-color: #f8fafc;
          border-color: #cbd5e1;
        }

        .btn-save {
          padding: 14px 32px;
          background-color: #83004c;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s, opacity 0.2s;
          order: 1;
          width: 200px; /* Fixed width for better look in single column */
        }

        .btn-save:hover {
          background-color: #70003c;
        }

        .btn-save:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        @media (min-width: 480px) {
          .actions {
            flex-direction: row;
            justify-content: center; /* Center horizontally on desktop */
          }
          .btn-cancel {
            order: 1;
          }
          .btn-save {
            order: 2;
          }
        }

        .fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
