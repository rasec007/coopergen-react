'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Pagination from '@/components/Pagination';
import { useActiveCooperativa } from '@/lib/context/ActiveCooperativaContext';

interface Paystub {
  id: string;
  type: string;
  month: number;
  year: number;
  valorBruto: string;
  valorLiquido: string;
  fileUrl: string;
  cooperado?: {
    name: string;
    cpf: string;
    matricula: string;
  };
  postoTrabalho?: {
    name: string;
  };
}

const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

const TYPES = ['Contra Cheque', 'Rendimento', 'Rateio'];

export default function PaystubsPage() {
  const router = useRouter();
  const { activeCooperativaId } = useActiveCooperativa();
  const [paystubs, setPaystubs] = useState<Paystub[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterType, setFilterType] = useState('all');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterPosto, setFilterPosto] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [postos, setPostos] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    fetchPostos();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterYear, filterMonth, filterPosto, searchTerm, activeCooperativaId]);

  useEffect(() => {
    fetchPaystubs();
  }, [filterType, filterYear, filterMonth, filterPosto, searchTerm, activeCooperativaId]);

  const fetchPostos = async () => {
    try {
      const res = await fetch('/api/postos-trabalho');
      const data = await res.json();
      if (res.ok) setPostos(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPaystubs = async () => {
    setLoading(true);
    try {
      let url = `/api/paystubs?year=${filterYear}&`;
      if (filterType !== 'all') url += `type=${filterType}&`;
      if (filterMonth !== 'all') url += `month=${filterMonth}&`;
      if (filterPosto !== 'all') url += `postoTrabalhoId=${filterPosto}&`;
      if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setPaystubs(data);
    } catch (error) {
      console.error('Error fetching paystubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => (currentYear - i).toString());

  return (
    <div className="paystub-container">
      <div className="header-section">
        <div className="title-row">
           <Link href="/dashboard/paystubs/new" className="btn-add-circle" title="Novo Contra Cheque">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter">
               <line x1="12" y1="5" x2="12" y2="19"></line>
               <line x1="5" y1="12" x2="19" y2="12"></line>
             </svg>
           </Link>
           <h1 className="center-title">Listar Contra Cheque</h1>
           <div style={{ width: '44px' }}></div>
        </div>

        <div className="filters-container">
          <p className="filters-label">FILTROS</p>
          
          <div className="filters-grid">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
              <option value="all">Selecione o tipo</option>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <div className="filter-row-half">
              <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="filter-select">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="filter-select">
                <option value="all">Selecione o Mês</option>
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            <select value={filterPosto} onChange={(e) => setFilterPosto(e.target.value)} className="filter-select">
              <option value="all">Selecione o posto de trabalho</option>
              {postos.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <div className="search-box">
               <input 
                type="text" 
                placeholder="Digite o nome do Cooperado" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="results-list-card">
        {loading ? (
          <div className="loading-state">Carregando...</div>
        ) : paystubs.length === 0 ? (
          <div className="empty-state">Nenhum registro encontrado para os filtros selecionados.</div>
        ) : (
          <>
            <div className="results-list">
              {(pageSize === 0 ? paystubs : paystubs.slice((currentPage - 1) * pageSize, currentPage * pageSize)).map((item) => (
                <div key={item.id} className="paystub-card">
                  <div className="card-content-wrapper">
                    <div className="info-line l1">
                      <span className="info-item"><strong>Cooperado:</strong> {item.cooperado?.name}</span>
                      <span className="info-separator">|</span>
                      <span className="info-item"><strong>Posto:</strong> {item.postoTrabalho?.name || '-'}</span>
                    </div>

                    <div className="info-line l2">
                      <span className="info-item"><strong>Ano:</strong> {item.year}</span>
                      <span className="info-separator">|</span>
                      <span className="info-item"><strong>Mês:</strong> {MONTHS.find(m => m.value === item.month)?.label}</span>
                      <span className="info-separator">|</span>
                      <span className="info-item"><strong>Tipo:</strong> {item.type}</span>
                    </div>
                    
                    <div className="card-actions-row">
                      <Link href={`/dashboard/paystubs/${item.id}/edit`} className="action-btn edit" title="Editar">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </Link>
                      {item.fileUrl && (
                        <a href={item.fileUrl} target="_blank" className="action-btn download" title="Ver Arquivo">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><polyline points="9 15 12 18 15 15"></polyline></svg>
                        </a>
                      )}
                      <Link href={`/dashboard/paystubs/${item.id}/delete`} className="action-btn delete" title="Excluir">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalItems={paystubs.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
            />
          </>
        )}
      </div>

      <style jsx>{`
        .paystub-container { padding: 20px; }
        .header-section { margin-bottom: 24px; }
        .title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        h1.center-title { font-size: 26px; color: #1d2d50; font-weight: 700; flex-grow: 1; text-align: center; }
        
        .btn-add-circle { background-color: transparent; width: 44px; height: 44px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0; transition: all 0.2s; }
        .btn-add-circle svg { stroke: #000000; }
        .btn-add-circle:hover { background-color: #f1f5f9; }

        .filters-container { background: white; padding: 24px; border-radius: 12px; border: 1px solid #f1f5f9; margin-bottom: 32px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
        .filters-label { text-align: center; font-size: 14px; font-weight: 700; color: #475569; margin-bottom: 24px; letter-spacing: 1px; }
        
        .filters-grid { display: flex; flex-direction: column; gap: 16px; }
        .filter-select { width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; color: #475569; background: #fff; }
        .filter-select:focus { outline: none; border-color: #83004c; }
        
        .filter-row-half { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        
        .search-box input { width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; }
        .search-box input:focus { outline: none; border-color: #83004c; }

        .results-list { display: flex; flex-direction: column; gap: 16px; }
        .paystub-card { 
          background: white; 
          border: 1px solid #f1f5f9; 
          border-radius: 12px; 
          padding: 16px; 
          display: flex; 
          flex-direction: column;
          gap: 12px; 
          transition: transform 0.2s; 
          box-shadow: 0 2px 8px rgba(0,0,0,0.02); 
        }
        .paystub-card:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        
        .card-content-wrapper { flex: 1; display: flex; flex-direction: column; gap: 12px; text-align: center; }
        .info-line { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 10px; font-size: 14px; color: #64748b; }
        .info-item strong { color: #1e293b; font-weight: 600; margin-right: 4px; }
        .info-separator { color: #e2e8f0; font-weight: 300; }

        .card-actions-row { 
          display: flex; 
          align-items: center; 
          justify-content: center;
          gap: 12px; 
          padding: 4px 0;
        }
        
        .action-btn { 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          cursor: pointer; 
          transition: transform 0.2s, opacity 0.2s; 
          color: #64748b;
          border-radius: 8px;
          padding: 8px;
          border: 1px solid transparent;
        }
        .action-btn:hover { transform: scale(1.1); opacity: 0.8; }
        .action-btn.edit { color: #3b82f6; border: 1px solid #eff6ff; }
        .action-btn.edit:hover { background-color: #eff6ff; }
        .action-btn.download { color: #10b981; border: 1px solid #f0fdf4; }
        .action-btn.download:hover { background-color: #f0fdf4; }
        .action-btn.delete { color: #ef4444; border: none; }
        .action-btn.delete svg { stroke: #ef4444; }
        .action-btn.delete:hover { background-color: #fee2e2; }

        .loading-state, .empty-state { padding: 80px; text-align: center; color: #94a3b8; background: white; border-radius: 12px; border: 1px solid #f1f5f9; }
        
        @media (min-width: 768px) {
           .filters-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        }
      `}</style>
    </div>
  );
}
