'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import { useActiveCooperativa } from '@/lib/context/ActiveCooperativaContext';
import ConfirmModal from '@/components/ConfirmModal';

interface PostoTrabalho {
  id: string;
  name: string;
  cooperativa?: { name: string };
}

interface Cooperativa {
  id: string;
  name: string;
}

export default function PostosTrabalhoPage() {
  const { activeCooperativaId } = useActiveCooperativa();
  const [postosTrabalho, setPostosTrabalho] = useState<PostoTrabalho[]>([]);
  const [cooperativas, setCooperativas] = useState<Cooperativa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCoop, setFilterCoop] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPosto, setSelectedPosto] = useState<{ id: string, name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCoop, activeCooperativaId]);

  useEffect(() => {
    fetchCooperativas();
  }, []);

  useEffect(() => {
    fetchPostosTrabalho();
  }, [searchTerm, filterCoop, activeCooperativaId]);

  const fetchCooperativas = async () => {
    try {
      const res = await fetch('/api/cooperativas');
      const data = await res.json();
      if (res.ok) setCooperativas(data);
    } catch (e) {
      console.error('Error fetching coops:', e);
    }
  };

  const fetchPostosTrabalho = async () => {
    setLoading(true);
    try {
      let url = `/api/postos-trabalho?`;
      if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;
      if (filterCoop !== 'all') url += `cooperativaId=${filterCoop}&`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setPostosTrabalho(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching postos de trabalho:', error);
      setPostosTrabalho([]);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (id: string, name: string) => {
    setSelectedPosto({ id, name });
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedPosto) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/postos-trabalho/${selectedPosto.id}`, { method: 'DELETE' });
      if (res.ok) {
        setPostosTrabalho(postosTrabalho.filter(p => p.id !== selectedPosto.id));
        setIsModalOpen(false);
      } else {
        alert('Erro ao excluir posto de trabalho');
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
           <Link href="/dashboard/postos-trabalho/new" className="btn-add-circle" title="Novo Posto">
             <svg width="37" height="37" viewBox="0 0 37 37" fill="none">
               <circle cx="18.5" cy="18.5" r="18.5" fill="#83004c" />
               <line x1="18.5" y1="10" x2="18.5" y2="27" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
               <line x1="10" y1="18.5" x2="27" y2="18.5" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
             </svg>
           </Link>
           <h1 className="center-title">Listar Posto de Trabalho</h1>
           <div style={{ width: '44px' }}></div>
        </div>

        <div className="filters-row">
          <div className="search-box">
            <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              placeholder="Pesquisar posto..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="select-filters">
            <select value={filterCoop} onChange={(e) => setFilterCoop(e.target.value)}>
              <option value="all">Todas Cooperativas</option>
              {cooperativas.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                <th>Cooperativa</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="loading-state">Carregando...</td></tr>
              ) : postosTrabalho.length === 0 ? (
                <tr><td colSpan={3} className="empty-state">Nenhum posto de trabalho encontrado.</td></tr>
              ) : (
                (pageSize === 0 ? postosTrabalho : postosTrabalho.slice((currentPage - 1) * pageSize, currentPage * pageSize)).map((item) => (
                  <tr key={item.id}>
                    <td className="actions-cell">
                      <div className="actions-group-center">
                        <Link href={`/dashboard/postos-trabalho/${item.id}/edit`} className="action-btn edit" title="Editar">
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
                      <span className="main-name">{item.name}</span>
                    </td>
                    <td>{item.cooperativa?.name || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalItems={postosTrabalho.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
        />
      </div>

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Posto de Trabalho"
        message={`Deseja realmente excluir o posto de trabalho "${selectedPosto?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={deleting}
      />

      <style jsx>{`
        .coop-container { padding: 20px; }
        .header-section { margin-bottom: 24px; }
        .title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        h1.center-title { font-size: 26px; color: #1d2d50; font-weight: 700; flex-grow: 1; text-align: center; }
        
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

        .filters-row { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 20px; background: white; padding: 16px; border-radius: 12px; border: 1px solid #f1f5f9; }
        .search-box { position: relative; flex: 2; min-width: 280px; display: flex; align-items: center; }
        .search-box svg { 
          position: absolute; 
          left: 12px; 
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8; 
          display: block;
        }
        .search-box input { width: 100%; padding: 12px 12px 12px 40px; border: 1px solid #e2e8f0; border-radius: 10px; }
        .search-box input:focus { outline: none; border-color: #83004c; }

        .select-filters { flex: 1; min-width: 200px; }
        .select-filters select { width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 10px; }

        .table-card { background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #f1f5f9; }
        .table-responsive { width: 100%; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; text-align: center; }
        th { background-color: #f8fafc; padding: 16px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #edf2f7; text-align: center; }
        td { padding: 16px; border-bottom: 1px solid #f8fafc; font-size: 14px; text-align: center; }
        .main-name { font-weight: 500; color: #1e293b; }

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

        .actions-group-center { 
          display: flex; 
          align-items: center;
          justify-content: center;
          gap: 8px; 
        }
        .action-btn.edit { color: #3b82f6; border: 1px solid #eff6ff; }
        .action-btn.delete { color: #ef4444; border: 1px solid #fef2f2; }
        .actions-group-left { display: flex; gap: 8px; }
        .loading-state, .empty-state { padding: 80px; text-align: center; color: #94a3b8; }
      `}</style>
    </div>
  );
}
