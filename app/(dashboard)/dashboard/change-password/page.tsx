'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Password requirements check
  const requirements = useMemo(() => {
    const pass = formData.newPassword;
    return {
      length: pass.length >= 10,
      lettersAndNumbers: /[a-zA-Z]/.test(pass) && /[0-9]/.test(pass),
      uppercase: /[A-Z]/.test(pass),
      special: /[@#$%*.,]/.test(pass),
    };
  }, [formData.newPassword]);

  const validatePassword = (password: string) => {
    if (password.length < 10) return "A senha deve ter pelo menos 10 caracteres.";
    if (!/[A-Z]/.test(password)) return "A senha deve conter pelo menos uma letra maiúscula.";
    if (!/[0-9]/.test(password)) return "A senha deve conter pelo menos um número.";
    if (!/[@#$%*.,]/.test(password)) return "A senha deve conter pelo menos um caractere especial (@#$%*.,).";
    return null;
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) {
      setMessage({ type: 'error', text: passwordError });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/auth/update-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Senha atualizada com sucesso! Redirecionando para login...' });
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        
        // Brief delay before redirecting to login
        setTimeout(() => {
          router.push('/login');
          router.refresh();
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao atualizar senha.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro na conexão com o servidor.' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const toggleShow = (field: keyof typeof showPasswords) => {
    setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] });
  };

  return (
    <div className="profile-container fade-in">
      <div className="profile-card">
        <div className="profile-header">
          <h1>Atualizar Senha</h1>
        </div>

        <form onSubmit={handleUpdate} className="profile-form">
          <div className="input-field">
            <label htmlFor="currentPassword">Senha Atual</label>
            <div className="password-wrapper">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                id="currentPassword"
                placeholder="Senha Atual"
                value={formData.currentPassword}
                onChange={handleChange}
                required
              />
              <button 
                type="button" 
                className="toggle-password" 
                onClick={() => toggleShow('current')}
                aria-label={showPasswords.current ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPasswords.current ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>

          <div style={{ padding: '15px 20px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9', marginBottom: '10px' }}>
            <p style={{ fontSize: '14px', color: '#1d2d50', fontWeight: 600, marginBottom: '8px' }}>Requisitos da nova senha:</p>
            <ul style={{ fontSize: '13px', color: '#64748b', listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li style={{ 
                fontWeight: requirements.length ? '700' : '400', 
                color: requirements.length ? '#8B004B' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '10px' }}>{requirements.length ? '●' : '○'}</span>
                Mínimo 10 caracteres
              </li>
              <li style={{ 
                fontWeight: requirements.lettersAndNumbers ? '700' : '400', 
                color: requirements.lettersAndNumbers ? '#8B004B' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '10px' }}>{requirements.lettersAndNumbers ? '●' : '○'}</span>
                Letras e números
              </li>
              <li style={{ 
                fontWeight: requirements.uppercase ? '700' : '400', 
                color: requirements.uppercase ? '#8B004B' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '10px' }}>{requirements.uppercase ? '●' : '○'}</span>
                Pelo menos uma letra maiúscula
              </li>
              <li style={{ 
                fontWeight: requirements.special ? '700' : '400', 
                color: requirements.special ? '#8B004B' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '10px' }}>{requirements.special ? '●' : '○'}</span>
                Pelo menos um caractere especial (@#$%*.,)
              </li>
            </ul>
          </div>

          <div className="input-field">
            <label htmlFor="newPassword">Nova Senha</label>
            <div className="password-wrapper">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                id="newPassword"
                placeholder="Nova Senha"
                value={formData.newPassword}
                onChange={handleChange}
                required
              />
              <button 
                type="button" 
                className="toggle-password" 
                onClick={() => toggleShow('new')}
              >
                {showPasswords.new ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>

          <div className="input-field">
            <label htmlFor="confirmPassword">Confirma Nova Senha</label>
            <div className="password-wrapper">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                id="confirmPassword"
                placeholder="Confirma Nova Senha"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <button 
                type="button" 
                className="toggle-password" 
                onClick={() => toggleShow('confirm')}
              >
                {showPasswords.confirm ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>

          {message.text && (
            <div className={`message-banner ${message.type}`} style={{ marginTop: '10px' }}>
              {message.text}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-update" disabled={saving}>
              {saving ? 'Atualizando...' : 'Atualizar Senha'}
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

        .password-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .password-wrapper input {
          width: 100%;
          padding: 12px 48px 12px 16px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          font-size: 15px;
          transition: border-color 0.2s;
        }

        .password-wrapper input:focus {
          outline: none;
          border-color: #8B004B;
        }

        .toggle-password {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .toggle-password:hover {
          color: #8B004B;
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
