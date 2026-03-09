'use client';

import { useState, useEffect } from 'react';
import { maskPhone } from '@/lib/utils/masks';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    registrationNumber: '',
    cpf: '',
    workplace: '',
    phone: '',
  });


  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile({
          name: data.name || '',
          email: data.email || '',
          registrationNumber: data.registrationNumber || '-',
          cpf: data.cpf || '-',
          workplace: data.workplace || '-',
          phone: maskPhone(data.phone || ''),
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: profile.phone }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Dados atualizados com sucesso!' });
      } else {
        setMessage({ type: 'error', text: 'Erro ao atualizar dados.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro na conexão com o servidor.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B004B]"></div>
      </div>
    );
  }

  return (
    <div className="profile-container fade-in">
      <div className="profile-card">
        <div className="profile-header">
          <h1>Meu Perfil</h1>
        </div>

        <form onSubmit={handleUpdate} className="profile-form">
          <div className="info-group">
            <span className="info-label">Nome:</span>
            <span className="info-value">{profile.name}</span>
          </div>

          <div className="info-group">
            <span className="info-label">Email:</span>
            <span className="info-value">{profile.email}</span>
          </div>

          <div className="info-group">
            <span className="info-label">Matrícula:</span>
            <span className="info-value">{profile.registrationNumber}</span>
          </div>

          <div className="info-group">
            <span className="info-label">CPF:</span>
            <span className="info-label">{profile.cpf}</span>
          </div>

          <div className="info-group">
            <span className="info-label">Posto de Trabalho:</span>
            <span className="info-value">{profile.workplace}</span>
          </div>

          <div className="input-field">
            <label htmlFor="phone">Celular</label>
            <input
              type="text"
              id="phone"
              placeholder="(##) # ####.####"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: maskPhone(e.target.value) })}
            />
          </div>

          {message.text && (
            <div className={`message-banner ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-update" disabled={saving}>
              {saving ? 'Salvando...' : 'Atualizar Dados'}
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
          background-color: #83004c;
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

        .info-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .info-label {
          font-weight: 700;
          font-size: 16px;
          color: #000;
        }

        .info-value {
          font-size: 16px;
          color: #333;
          margin-bottom: 8px;
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
          background-color: #83004c;
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
