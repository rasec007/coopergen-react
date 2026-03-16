'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LogoCoopergen from '@/components/LogoCoopergen';
import ActiveCooperativaModal from '@/components/ActiveCooperativaModal';
import ConfirmModal from '@/components/ConfirmModal';
import { useActiveCooperativa } from '@/lib/context/ActiveCooperativaContext';

type TopbarProps = {
  userName: string;
  userRole?: string;
  activeCooperativaName?: string;
};

export default function Topbar({ userName, userRole, activeCooperativaName: propName }: TopbarProps) {
  const router = useRouter();
  const { activeCooperativaName: contextName, openModal } = useActiveCooperativa();
  const [loggingOut, setLoggingOut] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const activeName = contextName || propName;

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Erro ao sair:', error);
      setLoggingOut(false);
    }
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-logo-container">
          <LogoCoopergen size={42} color="#FFFFFF" />
        </div>
        <button className="hamburger-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="topbar-right">
        <div className="user-info-text">
          <p><strong>Usuário:</strong> {userName}</p>
          {userRole !== 'user' && (
            <p>
              <strong>Cooperativa:</strong> {activeName || 'Nenhuma selecionada'}
            </p>
          )}
        </div>
        <div className="topbar-actions">
          {userRole !== 'user' && (
            <button className="btn-change-coop" onClick={openModal}>
              Trocar Cooperativa
            </button>
          )}
          <div className="logout-btn" onClick={() => setIsLogoutModalOpen(true)} title="Clique para Sair">
            Sair
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ marginLeft: '4px' }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={isLogoutModalOpen}
        title="Confirmar Saída"
        message="Deseja realmente sair do sistema?"
        confirmLabel="Sair"
        cancelLabel="Fechar"
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        loading={loggingOut}
      />

      <style jsx>{`
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 24px;
          background-color: var(--color-primary); /* #8B004B */
          color: white;
          position: sticky;
          top: 0;
          z-index: 50;
          height: 64px;
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .topbar-logo-container {
          display: flex;
          align-items: center;
        }

        .hamburger-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 20px;
          text-align: right;
        }

        .user-info-text {
          font-size: 13px;
          line-height: 1.4;
        }

        .user-info-text p {
          margin: 0;
          font-weight: 300;
        }

        .user-info-text strong {
          font-weight: 600;
        }

        .topbar-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
        }

        .btn-change-coop {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.4);
          color: white;
          padding: 4px 10px;
          font-size: 11px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.2s;
        }

        .btn-change-coop:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .logout-btn {
          font-size: 12px;
          display: flex;
          align-items: center;
          cursor: pointer;
          opacity: 0.8;
          transition: opacity 0.2s;
        }

        .logout-btn:hover {
          opacity: 1;
        }
      `}</style>
    </header>
  );
}
