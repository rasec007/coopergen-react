'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import { useActiveCooperativa } from '@/lib/context/ActiveCooperativaContext';
import ConfirmModal from '@/components/ConfirmModal';

interface Cooperado {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  matricula: string;
  status: string;
  cooperativa?: { name: string };
  postoTrabalho?: { name: string };
}


export default function CooperadosPage() {
  const { activeCooperativaId } = useActiveCooperativa();
  const [cooperados, setCooperados] = useState<Cooperado[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCooperado, setSelectedCooperado] = useState<{ id: string, name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, activeCooperativaId]);

  useEffect(() => {
    fetchCooperados();
  }, [searchTerm, filterStatus, activeCooperativaId]);

  const fetchCooperados = async () => {
    setLoading(true);
    try {
      let url = `/api/cooperados?`;
      if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;
      if (filterStatus !== 'all') url += `status=${filterStatus}&`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setCooperados(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching cooperados:', error);
      setCooperados([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Ativo' ? 'Inativo' : 'Ativo';
    try {
      const res = await fetch(`/api/cooperados/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setCooperados(cooperados.map(c => c.id === id ? { ...c, status: newStatus } : c));
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const openDeleteModal = (id: string, name: string) => {
    setSelectedCooperado({ id, name });
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedCooperado) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/cooperados/${selectedCooperado.id}`, { method: 'DELETE' });
      if (res.ok) {
        setCooperados(cooperados.filter(c => c.id !== selectedCooperado.id));
        setIsModalOpen(false);
      } else {
        alert('Erro ao excluir cooperado');
      }
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="coop-container">
      <div className="header-section">
        <div className="title-row">
            <Link href="/dashboard/cooperados/new" className="btn-add-circle" title="Novo Cooperado">
              <svg width="37" height="37" viewBox="0 0 37 37" fill="none">
                <circle cx="18.5" cy="18.5" r="18.5" fill="#83004c" />
                <line x1="18.5" y1="10" x2="18.5" y2="27" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                <line x1="10" y1="18.5" x2="27" y2="18.5" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </Link>
           <h1 className="center-title">Listagem de Cooperados</h1>
           <div style={{ width: '44px' }}></div>
        </div>
        
        <div className="filters-row">
          <div className="search-box">
            <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              placeholder="Nome, CPF ou Matrícula..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="select-filters">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">Todos Status</option>
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th className="actions-header">Ações</th>
                <th>Nome</th>
                <th>Matrícula / CPF</th>
                <th>Cooperativa / Posto</th>
                <th>E-mail / Fone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="loading-state">Carregando...</td></tr>
              ) : cooperados.length === 0 ? (
                <tr><td colSpan={6} className="empty-state">Nenhum cooperado encontrado.</td></tr>
              ) : (
                (pageSize === 0 ? cooperados : cooperados.slice((currentPage - 1) * pageSize, currentPage * pageSize)).map((item) => (
                  <tr key={item.id}>
                    <td className="actions-cell">
                      <div className="actions-group-left">
                        <Link href={`/dashboard/cooperados/${item.id}/edit`} className="action-btn edit" title="Editar">
                          <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </Link>
                        <button 
                          onClick={() => openDeleteModal(item.id, item.name)} 
                          className="action-btn delete" 
                          title="Excluir"
                        >
                          <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="name-cell">
                        <span className="main-name">{item.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="info-cell">
                        <span className="info-main">{item.matricula || '-'}</span>
                        <span className="sub-text">{item.cpf || '-'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="info-cell">
                        <span className="info-main">{item.cooperativa?.name || '-'}</span>
                        <span className="sub-text">{item.postoTrabalho?.name || '-'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="info-cell">
                        <span className="info-main">{item.email || '-'}</span>
                        <span className="sub-text">{item.phone || '-'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="status-toggle" onClick={() => handleStatusToggle(item.id, item.status)}>
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
          totalItems={cooperados.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
        />
      </div>

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Cooperado"
        message={`Deseja realmente excluir o cooperado "${selectedCooperado?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={deleting}
      />

      <style jsx>{`
        .coop-container { padding: 20px; }
        .header-section { margin-bottom: 24px; }
        .title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; position: relative; }
        
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
            display: flex; 
            align-items: center; 
            justify-content: center; 
            text-decoration: none; 
            transition: transform 0.2s, opacity 0.2s;
        }

        .btn-add-circle:hover { 
            transform: scale(1.1);
            opacity: 0.9;
        }
        
        .filters-row { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 16px; 
            margin-bottom: 20px; 
            align-items: center; 
            background: white;
            padding: 16px;
            border-radius: 12px;
            border: 1px solid #f1f5f9;
        }

        .search-box { position: relative; flex: 2; min-width: 280px; display: flex; align-items: center; }
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
        
        .select-filters { display: flex; gap: 12px; flex: 1; min-width: 300px; }
        .select-filters select { 
            flex: 1;
            padding: 12px; 
            border: 1px solid #e2e8f0; 
            border-radius: 10px; 
            font-size: 14px; 
            background: white;
            cursor: pointer;
            transition: border-color 0.2s;
        }
        .select-filters select:focus { outline: none; border-color: #83004c; }

        .table-card { 
            background: white; 
            border-radius: 12px; 
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); 
            overflow: hidden; 
            border: 1px solid #f1f5f9; 
        }
        .table-responsive { width: 100%; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th { 
            background-color: #f8fafc; 
            padding: 16px; 
            font-size: 11px; 
            font-weight: 700; 
            color: #64748b; 
            text-transform: uppercase; 
            letter-spacing: 0.05em;
            border-bottom: 1px solid #edf2f7; 
        }
        td { padding: 16px; border-bottom: 1px solid #f8fafc; color: #334155; font-size: 14px; vertical-align: middle; }
        tr:hover td { background-color: #fcfcfd; }

        .main-name { font-weight: 500; color: #1e293b; font-size: 15px; }
        .info-main { font-weight: 500; color: #475569; }
        .sub-text { font-size: 12px; color: #94a3b8; margin-top: 2px; display: block; }
        .info-cell { display: flex; flex-direction: column; }

        .status-toggle { width: 44px; height: 22px; cursor: pointer; }
        .toggle-track { width: 44px; height: 22px; background-color: #e2e8f0; border-radius: 20px; position: relative; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .toggle-track.active { background-color: #83004c; }
        .toggle-thumb { width: 16px; height: 16px; background-color: white; border-radius: 50%; position: absolute; top: 3px; left: 3px; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .active .toggle-thumb { transform: translateX(22px); }

        .action-btn {
            background: none;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 0 !important;
        }

        .actions-group-left { 
            display: flex; 
            align-items: center;
            gap: 8px; 
        }
        .action-btn.edit { color: #3b82f6; border: 1px solid #eff6ff; }
        .action-btn.edit:hover { background-color: #eff6ff; }
        .action-btn.delete { color: #ef4444; border: 1px solid #fef2f2; }
        .action-btn.delete:hover { background-color: #fef2f2; }
        .actions-group-left { display: flex; gap: 8px; }
        
        .loading-state, .empty-state { padding: 80px; text-align: center; color: #94a3b8; font-size: 16px; }

        @media (max-width: 768px) {
            .filters-row { flex-direction: column; align-items: stretch; }
            .search-box { min-width: 100%; }
            .select-filters { min-width: 100%; flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
