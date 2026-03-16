'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LogoCoopergen from '@/components/LogoCoopergen';

export default function LoginPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao entrar');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="full-center animate-fade">
      {/* Logo Section */}
      <div style={{ marginBottom: '40px' }}>
        <LogoCoopergen size={110} />
      </div>

      {!showForm ? (
        <>
          {/* Welcome Text Section (Initial state) */}
          <h1 className="welcome-title">Bem-vindo a Coopergen</h1>
          <p className="welcome-subtitle">Acesse sua conta clicando em ENTRAR</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', alignItems: 'center' }}>
            <button 
              className="btn-coopergen-primary" 
              onClick={() => setShowForm(true)}
            >
              Entrar
            </button>
            
            <button 
              className="btn-coopergen-secondary" 
              onClick={() => router.push('/ctrchequerpa')}
            >
              Baixar Contra Cheque
            </button>
          </div>
        </>
      ) : (
        /* Actual Login Form (Refined for tela-login.jpeg) */
        <div style={{ width: '100%', maxWidth: '340px', textAlign: 'left' }} className="animate-fade">
          <h2 style={{ fontSize: '24px', marginBottom: '24px', textAlign: 'center', fontWeight: 600, color: '#1D2D50' }}>Seja bem-vindo</h2>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '15px', marginBottom: '6px', color: '#1D2D50', fontWeight: 500 }}>Email</label>
              <input
                type="email"
                required
                className="login-input"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '15px', marginBottom: '6px', color: '#1D2D50', fontWeight: 500 }}>Senha</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="login-input"
                  style={{ paddingRight: '45px' }}
                  placeholder="Senha"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    color: '#9CA3AF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px'
                  }}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>

            {error && <p style={{ color: '#ef4444', fontSize: '14px', textAlign: 'center' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button 
                type="submit" 
                className="btn-coopergen-primary" 
                style={{ flex: 1, padding: '12px', fontSize: '16px' }}
                disabled={loading}
              >
                {loading ? '...' : 'Entrar'}
              </button>
              
              <button 
                type="button" 
                className="btn-outline" 
                style={{ flex: 1 }}
                onClick={() => setShowForm(false)}
              >
                Voltar
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <button 
                type="button"
                onClick={() => router.push('/forgot-password')}
                style={{ 
                  background: 'none',
                  border: 'none',
                  color: '#5D3FD3', 
                  fontSize: '14px', 
                  textDecoration: 'none', 
                  opacity: 0.8,
                  cursor: 'pointer'
                }}
              >
                Esqueci minha senha
              </button>
            </div>
          </form>
        </div>
      )}

      <style jsx>{`
        .login-input {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid #D1D5DB;
          border-radius: 8px;
          outline: none;
          font-size: 15px;
          transition: border-color 0.2s;
        }
        .login-input::placeholder {
          color: #9CA3AF;
        }
        .login-input:focus {
          border-color: var(--color-primary);
        }
        .btn-outline {
          background: white;
          border: 1px solid var(--color-primary);
          color: var(--color-primary);
          padding: 12px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-outline:hover {
          background: rgba(139, 0, 75, 0.05);
        }
      `}</style>
    </div>
  );
}
