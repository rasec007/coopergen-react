'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Pagination from '@/components/Pagination';

interface Cooperativa {
  id: string;
  name: string;
  nickname: string;
  phone: string;
  email: string;
  responsible: string;
  status: string;
  createdAt: string;
}

export default function CooperativasPage() {
  const [cooperativas, setCooperativas] = useState<Cooperativa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    fetchCooperativas();
  }, [searchTerm]);

  const fetchCooperativas = async () => {
    try {
      const url = searchTerm 
        ? `/api/cooperativas?search=${encodeURIComponent(searchTerm)}`
        : '/api/cooperativas';
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setCooperativas(data);
      }
    } catch (error) {
      console.error('Error fetching cooperativas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir a cooperativa ${name}?`)) return;

    try {
      const res = await fetch(`/api/cooperativas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCooperativas(cooperativas.filter(c => c.id !== id));
      } else {
        alert('Erro ao excluir cooperativa');
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Ativo' ? 'Inativo' : 'Ativo';
    
    try {
      const res = await fetch(`/api/cooperativas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setCooperativas(cooperativas.map(c => 
          c.id === id ? { ...c, status: newStatus } : c
        ));
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  return (
    <div className="coop-container">
      <div className="header-section">
        <div className="title-row">
           <Link href="/dashboard/cooperativas/new" className="btn-add-circle" title="Nova Unidade">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter">
               <line x1="12" y1="5" x2="12" y2="19"></line>
               <line x1="5" y1="12" x2="19" y2="12"></line>
             </svg>
           </Link>
           <h1 className="center-title">Listagem de Cooperativas</h1>
           <div style={{ width: '44px' }}></div>
        </div>
        
        <div className="search-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input 
            type="text" 
            placeholder="Pesquisar por nome ou email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-card">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th className="actions-header">Ações</th>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Fone</th>
                <th>Responsável</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="loading-state">Carregando...</td></tr>
              ) : cooperativas.length === 0 ? (
                <tr><td colSpan={6} className="empty-state">Nenhuma cooperativa encontrada.</td></tr>
              ) : (
                (pageSize === 0 ? cooperativas : cooperativas.slice((currentPage - 1) * pageSize, currentPage * pageSize)).map((item) => (
                  <tr key={item.id}>
                    <td className="actions-cell">
                      <div className="actions-group-left">
                        <Link href={`/dashboard/cooperativas/${item.id}/edit`} className="action-btn edit" title="Editar">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </Link>
                        <button onClick={() => handleDelete(item.id, item.name)} className="action-btn delete" title="Excluir">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="name-cell">
                        <span className="main-name">{item.name}</span>
                      </div>
                    </td>
                    <td>{item.email}</td>
                    <td>
                      <div className="contact-cell">
                        <span className="phone-num">{item.phone}</span>
                      </div>
                    </td>
                    <td>{item.responsible}</td>
                    <td>
                      <div 
                        className="status-toggle" 
                        onClick={() => handleStatusToggle(item.id, item.status)}
                      >
                        <div className={`toggle-track ${item.status === 'Ativo' ? 'active' : ''}`}>
                          <div className="toggle-thumb"></div>
                        </div>
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
          totalItems={cooperativas.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
        />
      </div>

      <style jsx>{`
        .coop-container {
          padding: 20px;
          display: block !important;
          opacity: 1 !important;
          visibility: visible !important;
        }

        .header-section {
          margin-bottom: 24px;
        }

        .title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        h1.center-title {
          font-size: 26px;
          color: #1d2d50;
          font-weight: 700;
          margin: 0;
          flex-grow: 1;
          text-align: center;
        }

        .btn-add-circle {
          background-color: transparent;
          color: #000000;
          width: 44px;
          height: 44px;
          border-radius: 8px; /* Square with rounded corners */
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: background-color 0.2s;
        }

        .btn-add-circle svg {
          stroke: #000000; /* Black plus sign */
        }

        .btn-add-circle:hover {
          background-color: #f1f5f9;
        }

        .search-box {
          position: relative;
          max-width: 400px;
          display: flex;
          align-items: center;
        }

        .search-box svg {
          position: absolute;
          left: 12px;
          color: #94a3b8;
        }

        .search-box input {
          width: 100%;
          padding: 12px 12px 12px 40px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 15px;
          transition: border-color 0.2s;
        }

        .search-box input:focus {
          outline: none;
          border-color: #83004c;
        }

        .table-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          border: 1px solid #f1f5f9;
        }

        .table-responsive {
          width: 100%;
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        th {
          background-color: #e2e8f0;
          padding: 16px;
          font-size: 13px;
          font-weight: 700;
          color: #334155;
          text-transform: uppercase;
          border-bottom: 1px solid #cbd5e1;
        }

        td {
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
          font-size: 14px;
          vertical-align: middle;
        }

        tr:hover td {
          background-color: #f8fafc;
        }

        .name-cell {
          display: flex;
          flex-direction: column;
        }

        .main-name {
          font-weight: 600;
          color: #1e293b;
        }

        .contact-cell {
          display: flex;
          flex-direction: column;
        }

        .phone-num {
          font-size: 14px;
          color: #334155;
        }

        .status-toggle {
          width: 40px;
          height: 20px;
          cursor: pointer;
        }

        .toggle-track {
          width: 40px;
          height: 20px;
          background-color: #cbd5e1;
          border-radius: 20px;
          position: relative;
          transition: background-color 0.3s;
        }

        .toggle-track.active {
          background-color: #83004c;
        }

        .toggle-thumb {
          width: 14px;
          height: 14px;
          background-color: white;
          border-radius: 50%;
          position: absolute;
          top: 3px;
          left: 3px;
          transition: transform 0.3s;
        }

        .active .toggle-thumb {
          transform: translateX(20px);
        }

        .actions-header {
          text-align: left;
          width: 100px;
        }

        .actions-cell {
          text-align: left;
        }

        .actions-group-left {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 12px;
        }

        .action-btn {
          background: none;
          border: none;
          padding: 6px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-btn.edit {
          color: #3b82f6;
          border: 1px solid #dbeafe;
        }

        .action-btn.edit:hover {
          background-color: #dbeafe;
        }

        .action-btn.delete {
          color: #ef4444;
          border: none;
        }

        .action-btn.delete:hover {
          background-color: #fee2e2;
        }

        .loading-state, .empty-state {
          padding: 60px;
          text-align: center;
          color: #64748b;
        }
      `}</style>
    </div>
  );
}
