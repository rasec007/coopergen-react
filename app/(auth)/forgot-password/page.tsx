'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LogoCoopergen from '@/components/LogoCoopergen';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email === 'rasec007@gmail.com' ? email : email, // Mantém o email original
          phone: email === 'rasec007@gmail.com' ? '5585988584800' : '', // Se for o email do user, envia o fone
          isTest: email === 'rasec007@gmail.com'
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao processar sua solicitação.');
        return;
      }

      setMessage('Se o email estiver cadastrado, você receberá instruções para redefinir sua senha via Email e WhatsApp.');
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

      <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }} className="animate-fade">
        <h2 style={{ 
          fontSize: '24px', 
          marginBottom: '24px', 
          fontWeight: 600, 
          color: '#1D2D50' 
        }}>
          Redefinir minha senha
        </h2>
        
        <form onSubmit={handleSubmit} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '15px', 
              marginBottom: '6px', 
              color: '#1D2D50', 
              fontWeight: 500 
            }}>
              Email
            </label>
            <input
              type="email"
              required
              className="login-input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: '14px', textAlign: 'center' }}>{error}</p>}
          {message && <p style={{ color: '#10b981', fontSize: '14px', textAlign: 'center' }}>{message}</p>}

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button 
              type="submit" 
              className="btn-coopergen-primary" 
              style={{ flex: 1, padding: '12px', fontSize: '16px' }}
              disabled={loading}
            >
              {loading ? '...' : 'Enviar'}
            </button>
            
            <button 
              type="button" 
              className="btn-outline" 
              style={{ flex: 1 }}
              onClick={() => router.push('/login')}
            >
              Voltar
            </button>
          </div>
        </form>
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
          border-color: var(--color-primary);
        }
      `}</style>
    </div>
  );
}
