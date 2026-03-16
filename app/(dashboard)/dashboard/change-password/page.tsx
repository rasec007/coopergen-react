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
          <div className="header-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </div>
          <div className="header-text">
            <h1>Segurança</h1>
            <p>Atualize sua senha para manter sua conta segura</p>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="profile-form">
          <div className="form-grid">
            <div className="input-field">
              <label htmlFor="currentPassword">Senha Atual</label>
              <div className="password-wrapper">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  id="currentPassword"
                  placeholder="Digite sua senha atual"
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

            <div className="requirements-card">
              <p className="requirements-title">A nova senha deve conter:</p>
              <div className="requirements-grid">
                <div className={`req-item ${requirements.length ? 'valid' : ''}`}>
                  <div className="req-check">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <span>10+ caracteres</span>
                </div>
                <div className={`req-item ${requirements.lettersAndNumbers ? 'valid' : ''}`}>
                  <div className="req-check">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <span>Letras e números</span>
                </div>
                <div className={`req-item ${requirements.uppercase ? 'valid' : ''}`}>
                  <div className="req-check">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <span>Letra maiúscula</span>
                </div>
                <div className={`req-item ${requirements.special ? 'valid' : ''}`}>
                  <div className="req-check">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <span>Caractere especial</span>
                </div>
              </div>
            </div>

            <div className="input-field">
              <label htmlFor="newPassword">Nova Senha</label>
              <div className="password-wrapper">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  id="newPassword"
                  placeholder="Crie uma senha forte"
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
              <label htmlFor="confirmPassword">Confirmar Nova Senha</label>
              <div className="password-wrapper">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  id="confirmPassword"
                  placeholder="Repita a nova senha"
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  Salvar Nova Senha
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
          max-width: 600px;
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
          gap: 20px;
        }

        .header-icon {
          width: 64px;
          height: 64px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .header-text h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .header-text p {
          font-size: 14px;
          opacity: 0.8;
          margin-top: 5px;
        }

        .profile-form {
          padding: 40px;
        }

        .form-grid {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        .input-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-field label {
          font-size: 13px;
          color: #64748b;
          font-weight: 600;
        }

        .password-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .password-wrapper input {
          width: 100%;
          padding: 14px 48px 14px 16px;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 15px;
          transition: all 0.2s;
          background: #f8fafc;
        }

        .password-wrapper input:focus {
          outline: none;
          border-color: #83004c;
          background: white;
          box-shadow: 0 0 0 4px rgba(131, 0, 76, 0.1);
        }

        .toggle-password {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .toggle-password:hover {
          color: #83004c;
        }

        .requirements-card {
          background: #fdf2f8;
          padding: 20px;
          border-radius: 16px;
          border: 1px solid #fce7f3;
        }

        .requirements-title {
          font-size: 13px;
          font-weight: 700;
          color: #83004c;
          margin-bottom: 12px;
        }

        .requirements-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .req-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: #94a3b8;
          transition: all 0.3s;
        }

        .req-item.valid {
          color: #83004c;
          font-weight: 600;
        }

        .req-check {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          color: transparent;
          transition: all 0.3s;
        }

        .valid .req-check {
          background: #83004c;
          color: white;
        }

        .form-actions {
          margin-top: 40px;
          display: flex;
          justify-content: center;
        }

        .btn-update {
          background: #83004c;
          color: white;
          padding: 15px 40px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 16px;
          border: none;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(131, 0, 76, 0.2);
        }

        .btn-update:hover:not(:disabled) {
          background: #a0005d;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(131, 0, 76, 0.3);
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

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @media (max-width: 480px) {
          .requirements-grid {
            grid-template-columns: 1fr;
          }
          .profile-form {
            padding: 25px;
          }
        }
      `}</style>
    </div>
  );
}
