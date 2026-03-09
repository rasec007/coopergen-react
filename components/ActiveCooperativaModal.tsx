'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveCooperativa } from '@/lib/context/ActiveCooperativaContext';

interface Cooperativa {
  id: string;
  name: string;
}

interface ActiveCooperativaModalProps {
  isOpen: boolean;
  onClose?: () => void;
  forceSelection?: boolean;
}

export default function ActiveCooperativaModal({ 
  isOpen, 
  onClose, 
  forceSelection = false 
}: ActiveCooperativaModalProps) {
  const router = useRouter();
  const { setActiveCooperativa } = useActiveCooperativa();
  const [cooperativas, setCooperativas] = useState<Cooperativa[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCooperativas();
    }
  }, [isOpen]);

  const fetchCooperativas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cooperativas');
      const data = await res.json();
      if (res.ok) {
        setCooperativas(data);
      }
    } catch (err) {
      setError('Erro ao carregar cooperativas');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;

    const selectedCoop = cooperativas.find(c => c.id === selectedId);
    if (!selectedCoop) return;

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/auth/active-coop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cooperativaId: selectedCoop.id,
          cooperativaName: selectedCoop.name
        }),
      });

      if (res.ok) {
        setActiveCooperativa(selectedCoop.id, selectedCoop.name);
        if (onClose) onClose();
      } else {
        setError('Erro ao selecionar cooperativa');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content fade-in">
        <div className="modal-header">
          <h2>Selecione uma Cooperativa</h2>
          {!forceSelection && onClose && (
            <button onClick={onClose} className="close-btn" type="button">&times;</button>
          )}
        </div>
        
        <div className="modal-body">
          {forceSelection && (
            <p className="helper-text">Você precisa selecionar uma cooperativa para continuar usando o sistema.</p>
          )}

          {loading ? (
            <div className="loading-spinner">Carregando cooperativas...</div>
          ) : (
            <form onSubmit={handleSelect}>
              <div className="input-field">
                <select 
                  value={selectedId} 
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="coop-select"
                  required
                >
                  <option value="" disabled>Selecione a cooperativa...</option>
                  {cooperativas.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="modal-actions">
                {!forceSelection && onClose && (
                  <button type="button" onClick={onClose} className="btn-cancel">
                    Cancelar
                  </button>
                )}
                <button type="submit" className="btn-save" disabled={saving || !selectedId}>
                  {saving ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        .modal-content {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          overflow: hidden;
        }
        .modal-header {
          background: var(--color-primary, #83004c);
          color: white;
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }
        .close-btn {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          opacity: 0.8;
          transition: opacity 0.2s;
        }
        .close-btn:hover { opacity: 1; }
        
        .modal-body {
          padding: 32px 24px;
        }
        
        .helper-text {
          color: #64748b;
          font-size: 14px;
          margin-bottom: 24px;
          text-align: center;
        }
        
        .input-field {
          margin-bottom: 24px;
        }
        
        .coop-select {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 15px;
          color: #334155;
          background-color: #f8fafc;
          outline: none;
          transition: border-color 0.2s;
        }
        .coop-select:focus {
          border-color: #83004c;
        }
        
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        
        .btn-cancel {
          padding: 10px 20px;
          background: white;
          border: 1px solid #e2e8f0;
          color: #64748b;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
        }
        
        .btn-save {
          padding: 10px 24px;
          background: var(--color-primary, #83004c);
          border: none;
          color: white;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }
        .btn-save:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .loading-spinner {
          text-align: center;
          color: #64748b;
          padding: 20px;
        }
        
        .error-message {
          color: #dc2626;
          background: #fef2f2;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 24px;
          font-size: 14px;
          text-align: center;
        }
        
        .fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
