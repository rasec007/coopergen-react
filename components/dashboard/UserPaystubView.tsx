'use client';

import { useState, useEffect } from 'react';
import LogoCoopergen from '@/components/LogoCoopergen';

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

export default function UserPaystubView({ userName }: { userName: string }) {
  const [loading, setLoading] = useState(false);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterType, setFilterType] = useState('Contra Cheque');
  const [paystubs, setPaystubs] = useState<any[]>([]);

  const years = ['2026', '2025', '2024', '2023', '2022', '2021', '2020'];

  useEffect(() => {
    fetchPaystubs();
  }, [filterYear, filterType]);

  const fetchPaystubs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/paystubs?year=${filterYear}&type=${filterType}`);
      const data = await res.json();
      if (res.ok) {
        setPaystubs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-view-container fade-in">
      <header className="user-header">
        <LogoCoopergen size={40} />
        <h2 className="greeting">Olá, Sr(a). {userName}</h2>
        <div style={{ width: 40 }}></div>
      </header>

      <div className="selection-section">
        <h3 className="section-title">SELECIONE UM PERÍODO</h3>
        <select 
          className="period-select"
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <div className="type-buttons">
          <button 
            className={`type-btn ${filterType === 'Contra Cheque' ? 'active' : ''}`}
            onClick={() => setFilterType('Contra Cheque')}
          >
            Contra Cheque
          </button>
          <button 
            className={`type-btn ${filterType === 'Rendimento' ? 'active' : ''}`}
            onClick={() => setFilterType('Rendimento')}
          >
            Rendimento
          </button>
          <button 
            className={`type-btn ${filterType === 'Rateio' ? 'active' : ''}`}
            onClick={() => setFilterType('Rateio')}
          >
            Rateio
          </button>
        </div>
      </div>

      <div className="results-section">
        <h2 className="results-title">{filterType.toUpperCase()}S</h2>
        <p className="total-count">Total encontrado: {paystubs.length}</p>

        <div className="paystub-list">
          {paystubs.map((item) => (
            <div key={item.id} className="paystub-row">
              <div className="info-col">
                {item.type !== 'Rendimento' && item.type !== 'Rateio' && (
                  <span className="month-label"><strong>Mês:</strong> {MONTHS.find(m => m.value === item.month)?.label}</span>
                )}
                <span className="year-label">Ano: {item.year}</span>
              </div>
              <a href={item.fileUrl} target="_blank" className="download-link">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#83004c"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                <span>Baixar PDF</span>
              </a>
            </div>
          ))}
          {!loading && paystubs.length === 0 && (
            <div className="no-results-card">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="9" y1="15" x2="15" y2="15"></line></svg>
              <p>Nenhum documento encontrado para este período.</p>
            </div>
          )}
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <span>Buscando documentos...</span>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .user-view-container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .user-header { 
          background: #83004c; 
          color: white; 
          padding: 20px; 
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
          box-shadow: 0 4px 12px rgba(131, 0, 76, 0.2);
        }
        .greeting { font-size: 18px; font-weight: 600; margin: 0; }
        
        .selection-section { text-align: center; margin-bottom: 40px; background: white; padding: 24px; border-radius: 16px; border: 1px solid #f1f5f9; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
        .section-title { font-size: 14px; color: #64748b; font-weight: 700; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; }
        
        .period-select {
          width: 100%;
          max-width: 160px;
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          margin-bottom: 24px;
          color: #1e293b;
          font-weight: 600;
          font-size: 16px;
          text-align: center;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 8px center;
          background-size: 16px;
        }
        
        .type-buttons { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
        .type-btn {
          padding: 10px 16px;
          border-radius: 10px;
          border: 1px solid #f1f5f9;
          background: #f8fafc;
          color: #64748b;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          flex: 1;
          min-width: 120px;
        }
        .type-btn.active { background: #83004c; color: white; border-color: #83004c; box-shadow: 0 4px 8px rgba(131, 0, 76, 0.15); }
        
        .results-section { margin-top: 20px; }
        .results-title { text-align: center; color: #1e293b; font-weight: 700; margin-bottom: 4px; font-size: 20px; }
        .total-count { text-align: center; color: #94a3b8; font-size: 13px; margin-bottom: 24px; }
        
        .paystub-list { display: flex; flex-direction: column; gap: 12px; }
        .paystub-row { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          padding: 16px 20px; 
          background: white;
          border-radius: 12px;
          border: 1px solid #f1f5f9;
          transition: transform 0.2s;
        }
        .paystub-row:hover { transform: translateX(4px); border-color: #83004c40; }
        
        .info-col { display: flex; flex-direction: column; gap: 4px; }
        .month-label { color: #1e293b; font-size: 16px; }
        .month-label strong { color: #83004c; }
        .year-label { color: #94a3b8; font-size: 12px; }
        
        .download-link { 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          color: #83004c; 
          text-decoration: none; 
          font-weight: 700;
          font-size: 14px;
          padding: 8px 16px;
          background: #83004c08;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .download-link:hover { background: #83004c15; transform: scale(1.05); }
        
        .no-results-card { text-align: center; color: #94a3b8; padding: 40px 20px; background: white; border-radius: 16px; border: 1px dashed #e2e8f0; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .no-results-card p { font-size: 14px; margin: 0; }
        
        .loading-state { text-align: center; color: #64748b; padding: 40px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .spinner { width: 24px; height: 24px; border: 3px solid #f1f5f9; border-top-color: #83004c; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
