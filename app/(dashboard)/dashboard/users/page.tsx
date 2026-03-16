'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import ConfirmModal from '@/components/ConfirmModal';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
  }>({
    isOpen: false,
    userId: '',
    userName: ''
  });

  useEffect(() => {
    fetchUsers();
  }, [searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let url = `/api/users?`;
      if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === id ? { ...u, isActive: newStatus } : u));
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao atualizar status');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleImpersonate = async () => {
    const { userId } = confirmModal;
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    
    try {
      const res = await fetch('/api/auth/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      const data = await res.json();
      if (res.ok) {
        window.location.href = '/dashboard';
      } else {
        alert(data.error || 'Erro ao realizar login automático');
      }
    } catch (error) {
      console.error('Error during impersonation:', error);
      alert('Erro de conexão');
    }
  };

  return (
    <div className="users-container">
      <div className="header-section">
        <div className="title-row">
           <div style={{ width: '37px' }}></div>
           <h1 className="center-title">Gerenciamento de Usuários</h1>
           <div style={{ width: '37px' }}></div>
        </div>
        
        <div className="filters-row">
          <div className="search-box">
            <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              placeholder="Nome ou E-mail..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="loading-state">Carregando...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="empty-state">Nenhum usuário encontrado.</td></tr>
              ) : (
                (pageSize === 0 ? users : users.slice((currentPage - 1) * pageSize, currentPage * pageSize)).map((item) => (
                  <tr key={item.id}>
                    <td><span className="main-name">{item.name}</span></td>
                    <td>{item.email}</td>
                    <td>
                      <span className={`role-badge ${item.role}`}>
                        {item.role === 'admin' ? 'Administrador' : item.role === 'manager' ? 'Gestor' : 'Usuário'}
                      </span>
                    </td>
                    <td>
                      <div className="status-toggle-container">
                        <div className="status-toggle" onClick={() => handleStatusToggle(item.id, item.isActive)}>
                          <div className={`toggle-track ${item.isActive ? 'active' : ''}`}>
                            <div className="toggle-thumb"></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button 
                          className="btn-action impersonate" 
                          onClick={() => setConfirmModal({ isOpen: true, userId: item.id, userName: item.name })}
                          title="Acesso Rápido (Logar como este usuário)"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#83004c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                            <polyline points="10 17 15 12 10 7"></polyline>
                            <line x1="15" y1="12" x2="3" y2="12"></line>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalItems={users.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
        />
      </div>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title="Acesso Rápido"
        message={`Deseja realmente acessar o sistema como o usuário ${confirmModal.userName}?`}
        confirmLabel="Acessar"
        cancelLabel="Fechar"
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleImpersonate}
      />

      <style jsx>{`
        .users-container { padding: 20px; }
        .header-section { margin-bottom: 24px; }
        .title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        
        h1.center-title { 
            font-size: 26px; 
            color: #1d2d50; 
            font-weight: 700; 
            margin: 0; 
            flex-grow: 1; 
            text-align: center; 
        }

        .filters-row { 
            display: flex; 
            justify-content: center;
            gap: 16px; 
            margin-bottom: 20px; 
            background: white;
            padding: 16px;
            border-radius: 12px;
            border: 1px solid #f1f5f9;
        }

        .search-box { 
          position: relative; 
          flex: 0 1 400px; 
          display: flex; 
          align-items: center; 
        }
        .search-box svg { 
          position: absolute; 
          left: 12px; 
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8; 
          display: block;
        }
        .search-box input { 
            width: 100%; 
            padding: 12px 12px 12px 40px; 
            border: 1px solid #e2e8f0; 
            border-radius: 10px; 
            font-size: 15px; 
            transition: border-color 0.2s;
        }
        .search-box input:focus { outline: none; border-color: #83004c; }
        
        .table-card { 
            background: white; 
            border-radius: 12px; 
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); 
            overflow: hidden; 
            border: 1px solid #f1f5f9; 
        }
        .table-responsive { width: 100%; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; text-align: center; }
        th { 
            background-color: #f8fafc; 
            padding: 16px; 
            font-size: 11px; 
            font-weight: 700; 
            color: #64748b; 
            text-transform: uppercase; 
            border-bottom: 1px solid #edf2f7; 
            text-align: center;
        }
        td { padding: 16px; border-bottom: 1px solid #f8fafc; color: #334155; font-size: 14px; vertical-align: middle; text-align: center; }
        tr:hover td { background-color: #fcfcfd; }

        .main-name { font-weight: 500; color: #1e293b; font-size: 15px; }

        .role-badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
        .role-badge.admin { background-color: #fee2e2; color: #ef4444; }
        .role-badge.manager { background-color: #e0e7ff; color: #4338ca; }
        .role-badge.user { background-color: #f1f5f9; color: #64748b; }

        .status-toggle-container {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .status-toggle { width: 44px; height: 22px; cursor: pointer; }
        .toggle-track { width: 44px; height: 22px; background-color: #e2e8f0; border-radius: 20px; position: relative; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .toggle-track.active { background-color: #83004c; }
        .toggle-thumb { width: 16px; height: 16px; background-color: white; border-radius: 50%; position: absolute; top: 3px; left: 3px; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .active .toggle-thumb { transform: translateX(22px); }
        
         .loading-state, .empty-state { padding: 80px; text-align: center; color: #94a3b8; font-size: 16px; }

        .actions-cell {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
        }

        .btn-action {
          background: white;
          border: 1px solid #e2e8f0;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .btn-action:hover {
          background: #f8fafc;
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          border-color: #83004c;
        }

        .btn-action.impersonate svg {
          stroke: #83004c;
        }

        @media (max-width: 768px) {
            .filters-row { padding: 12px; }
            .search-box { min-width: 100%; }
        }
      `}</style>
    </div>
  );
}
