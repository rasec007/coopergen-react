'use client';

export const PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100];

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const isAll = pageSize === 0;
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const start = isAll ? 1 : (safePage - 1) * pageSize + 1;
  const end = isAll ? totalItems : Math.min(safePage * pageSize, totalItems);

  function goTo(page: number) {
    onPageChange(Math.max(1, Math.min(page, totalPages)));
  }

  return (
    <div className="pagination-bar">
      {/* Left: page size */}
      <div className="pagination-left">
        <label className="page-size-label">Itens por página:</label>
        <select
          className="page-size-select"
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value));
            onPageChange(1);
          }}
        >
          {PAGE_SIZE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
          <option value={0}>Todas</option>
        </select>
      </div>

      {/* Center: nav buttons */}
      <div className="pagination-center">
        <button
          className="page-btn"
          onClick={() => goTo(1)}
          disabled={isAll || safePage === 1}
          title="Primeira página"
        >
          «
        </button>
        <button
          className="page-btn"
          onClick={() => goTo(safePage - 1)}
          disabled={isAll || safePage === 1}
          title="Página anterior"
        >
          ‹
        </button>
        <span className="page-info">
          {isAll ? 'Todas' : `Página ${safePage} de ${totalPages}`}
        </span>
        <button
          className="page-btn"
          onClick={() => goTo(safePage + 1)}
          disabled={isAll || safePage === totalPages}
          title="Próxima página"
        >
          ›
        </button>
        <button
          className="page-btn"
          onClick={() => goTo(totalPages)}
          disabled={isAll || safePage === totalPages}
          title="Última página"
        >
          »
        </button>
      </div>

      {/* Right: summary */}
      <div className="pagination-right">
        {totalItems > 0 ? (
          <span className="record-count">
            {isAll ? `${totalItems} registros` : `${start}–${end} de ${totalItems} registros`}
          </span>
        ) : (
          <span className="record-count">Nenhum registro</span>
        )}
      </div>

      <style jsx>{`
        .pagination-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          border-radius: 0 0 10px 10px;
          gap: 12px;
          flex-wrap: wrap;
        }

        .pagination-left {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 160px;
        }

        .page-size-label {
          font-size: 12px;
          color: #64748b;
          white-space: nowrap;
        }

        .page-size-select {
          padding: 4px 8px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 13px;
          color: #334155;
          background: white;
          cursor: pointer;
          outline: none;
          transition: border-color 0.2s;
        }
        .page-size-select:focus {
          border-color: #83004c;
        }

        .pagination-center {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .page-btn {
          padding: 5px 10px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: white;
          color: #334155;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s;
          min-width: 34px;
          text-align: center;
          font-weight: 600;
        }
        .page-btn:hover:not(:disabled) {
          background: #83004c;
          color: white;
          border-color: #83004c;
        }
        .page-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .page-info {
          font-size: 13px;
          color: #475569;
          font-weight: 500;
          padding: 0 10px;
          white-space: nowrap;
        }

        .pagination-right {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          min-width: 160px;
        }

        .record-count {
          font-size: 12px;
          color: #64748b;
          text-align: right;
        }

        @media (max-width: 640px) {
          .pagination-bar {
            flex-direction: column;
            align-items: center;
          }
          .pagination-left,
          .pagination-right {
            justify-content: center;
            min-width: unset;
          }
        }
      `}</style>
    </div>
  );
}
