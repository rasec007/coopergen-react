'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LogoCoopergen from '@/components/LogoCoopergen';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token de redefinição inválido ou ausente.');
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao redefinir senha.');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="full-center animate-fade">
      <div style={{ marginBottom: '40px' }}>
        <LogoCoopergen size={110} />
      </div>

      <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }} className="animate-fade">
        <h2 style={{ fontSize: '24px', marginBottom: '24px', fontWeight: 600, color: '#1D2D50' }}>
          Nova Senha
        </h2>
        
        {success ? (
          <div style={{ padding: '20px', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #10b981' }}>
            <p style={{ color: '#065f46', fontWeight: 500 }}>Senha redefinida com sucesso!</p>
            <p style={{ color: '#065f46', fontSize: '14px', marginTop: '8px' }}>Redirecionando para a tela de login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '15px', marginBottom: '6px', color: '#1D2D50', fontWeight: 500 }}>Nova Senha</label>
              <input
                type="password"
                required
                className="login-input"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '15px', marginBottom: '6px', color: '#1D2D50', fontWeight: 500 }}>Confirmar Nova Senha</label>
              <input
                type="password"
                required
                className="login-input"
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && <p style={{ color: '#ef4444', fontSize: '14px', textAlign: 'center' }}>{error}</p>}

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
              <button 
                type="submit" 
                className="btn-coopergen-primary" 
                style={{ padding: '12px 40px', fontSize: '16px' }}
                disabled={loading || !token}
              >
                {loading ? '...' : 'Redefinir Senha'}
              </button>
            </div>
          </form>
        )}
      </div>

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
        .login-input:focus {
          border-color: var(--color-primary);
        }
      `}</style>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
