'use client';

import { useState } from 'react';

export default function ChangeEmailPage() {
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage({ type: 'error', text: 'Por favor, digite um novo e-mail' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/auth/update-email', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'E-mail atualizado com sucesso!' });
        setEmail('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao atualizar e-mail.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro na conexão com o servidor.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-container fade-in">
      <div className="profile-card">
        <div className="profile-header">
          <h1>Atualizar Email</h1>
        </div>

        <form onSubmit={handleUpdate} className="profile-form">
          <div className="input-field">
            <label htmlFor="email">Digite Novo Email</label>
            <input
              type="email"
              id="email"
              placeholder="Digite Novo Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {message.text && (
            <div className={`message-banner ${message.type}`} style={{ marginTop: '10px' }}>
              {message.text}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-update" disabled={saving}>
              {saving ? 'Atualizando...' : 'Atualizar Email'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .profile-container {
          display: flex;
          justify-content: center;
          padding-top: 20px;
        }

        .profile-card {
          width: 100%;
          max-width: 900px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          border: 1px solid #F1F5F9;
        }

        .profile-header {
          background-color: #8B004B;
          color: white;
          padding: 24px;
          text-align: center;
        }

        .profile-header h1 {
          font-size: 24px;
          font-weight: 600;
          margin: 0;
        }

        .profile-form {
          padding: 40px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 10px;
        }

        .input-field label {
          font-size: 14px;
          color: #64748b;
        }

        .input-field input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          font-size: 15px;
          transition: border-color 0.2s;
        }

        .input-field input:focus {
          outline: none;
          border-color: #8B004B;
        }

        .form-actions {
          display: flex;
          justify-content: center;
          margin-top: 20px;
        }

        .btn-update {
          background-color: #8B004B;
          color: white;
          padding: 14px 40px;
          border-radius: 8px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s, opacity 0.2s;
        }

        .btn-update:hover {
          background-color: #70003c;
        }

        .btn-update:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .message-banner {
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
          text-align: center;
        }

        .message-banner.success {
          background-color: #ecfdf5;
          color: #059669;
          border: 1px solid #10b981;
        }

        .message-banner.error {
          background-color: #fef2f2;
          color: #dc2626;
          border: 1px solid #ef4444;
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
