'use client';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  loading = false
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content fade-in">
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose} className="close-btn" type="button">&times;</button>
        </div>
        
        <div className="modal-body">
          <p className="helper-text">{message}</p>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel" disabled={loading}>
              {cancelLabel}
            </button>
            <button type="button" onClick={onConfirm} className="btn-save" disabled={loading}>
              {loading ? 'Processando...' : confirmLabel}
            </button>
          </div>
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
          max-width: 440px;
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
          color: #334155;
          font-size: 16px;
          margin-bottom: 32px;
          text-align: center;
          line-height: 1.5;
        }
        
        .modal-actions {
          display: flex;
          justify-content: center;
          gap: 16px;
        }
        
        .btn-cancel {
          padding: 10px 24px;
          background: white;
          border: 1px solid #e2e8f0;
          color: #64748b;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          flex: 1;
          transition: background 0.2s;
        }
        .btn-cancel:hover { background: #f8fafc; }
        
        .btn-save {
          padding: 10px 24px;
          background: var(--color-primary, #83004c);
          border: none;
          color: white;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          flex: 1;
          transition: opacity 0.2s;
        }
        .btn-save:hover { opacity: 0.9; }
        .btn-save:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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
