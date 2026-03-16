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
          <div className="avatar-circle">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="header-text">
            <h1>Meu Perfil</h1>
            <p>Gerencie suas informações pessoais</p>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="profile-form">
          <div className="form-grid">
            <div className="info-section">
              <h2 className="section-title">Dados de Identificação</h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Nome Completo</span>
                  <span className="info-value">{profile.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">E-mail</span>
                  <span className="info-value">{profile.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Matrícula</span>
                  <span className="info-value">{profile.registrationNumber}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">CPF</span>
                  <span className="info-value">{profile.cpf}</span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h2 className="section-title">Vínculo Profissional</h2>
              <div className="info-grid">
                <div className="info-item full">
                  <span className="info-label">Posto de Trabalho</span>
                  <span className="info-value">{profile.workplace}</span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h2 className="section-title">Contato</h2>
              <div className="input-field">
                <label htmlFor="phone">Celular para Notificações</label>
                <div className="input-icon-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  <input
                    type="text"
                    id="phone"
                    placeholder="(##) # ####.####"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: maskPhone(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>

          {message.text && (
            <div className={`message-banner ${message.type}`}>
              {message.type === 'success' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              )}
              {message.text}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-update" disabled={saving}>
              {saving ? (
                <span className="loader-inline"></span>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .profile-container {
          display: flex;
          justify-content: center;
          padding: 20px;
          min-height: calc(100vh - 100px);
        }

        .profile-card {
          width: 100%;
          max-width: 800px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .profile-header {
          background: linear-gradient(135deg, #83004c 0%, #a0005d 100%);
          color: white;
          padding: 40px 30px;
          display: flex;
          align-items: center;
          gap: 25px;
        }

        .avatar-circle {
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 700;
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.4);
        }

        .header-text h1 {
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .header-text p {
          font-size: 15px;
          opacity: 0.8;
          margin-top: 5px;
        }

        .profile-form {
          padding: 40px;
        }

        .form-grid {
          display: flex;
          flex-direction: column;
          gap: 35px;
        }

        .section-title {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #83004c;
          font-weight: 700;
          margin-bottom: 20px;
          padding-bottom: 8px;
          border-bottom: 2px solid #fce7f3;
          display: inline-block;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 25px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .info-item.full {
          grid-column: 1 / -1;
        }

        .info-label {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }

        .info-value {
          font-size: 16px;
          color: #1e293b;
          font-weight: 600;
        }

        .input-field {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .input-field label {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }

        .input-icon-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon-wrapper svg {
          position: absolute;
          left: 15px;
          color: #94a3b8;
          transition: color 0.2s;
        }

        .input-icon-wrapper input {
          width: 100%;
          padding: 14px 15px 14px 45px;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 16px;
          color: #1e293b;
          transition: all 0.2s;
          background: #f8fafc;
        }

        .input-icon-wrapper input:focus {
          outline: none;
          border-color: #83004c;
          background: white;
          box-shadow: 0 0 0 4px rgba(131, 0, 76, 0.1);
        }

        .input-icon-wrapper input:focus + svg {
          color: #83004c;
        }

        .form-actions {
          margin-top: 40px;
          display: flex;
          justify-content: flex-end;
        }

        .btn-update {
          background: #83004c;
          color: white;
          padding: 14px 30px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          border: none;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 15px rgba(131, 0, 76, 0.2);
        }

        .btn-update:hover:not(:disabled) {
          background: #a0005d;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(131, 0, 76, 0.3);
        }

        .btn-update:active {
          transform: translateY(0);
        }

        .btn-update:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .message-banner {
          margin-top: 25px;
          padding: 15px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 12px;
          animation: slideIn 0.3s ease-out;
        }

        .message-banner.success {
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .message-banner.error {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .loader-inline {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.8s linear infinite;
        }

        .fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .profile-header {
            flex-direction: column;
            text-align: center;
            padding: 30px 20px;
          }
          .profile-form {
            padding: 25px;
          }
          .info-grid {
            grid-template-columns: 1fr;
          }
          .form-actions {
            justify-content: center;
          }
          .btn-update {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
