'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Option {
  id: string;
  name: string;
  matricula?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecione...',
  className = '',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options
    .filter((opt) =>
      opt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opt.matricula && opt.matricula.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleSelect = (option: Option) => {
    onChange(option.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  };

  return (
    <div className={`searchable-select-container ${className}`} ref={containerRef}>
      <div className={`select-trigger ${isOpen ? 'active' : ''}`} onClick={toggleDropdown}>
        <span className={selectedOption ? 'selected-text' : 'placeholder-text'}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`arrow-icon ${isOpen ? 'rotate' : ''}`}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      {isOpen && (
        <div className="select-dropdown">
          <div className="search-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              className="search-input"
              placeholder="Digite para filtrar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="options-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  className={`option-item ${option.id === value ? 'selected' : ''}`}
                  onClick={() => handleSelect(option)}
                >
                  <span className="option-name">{option.name}</span>
                </div>
              ))
            ) : (
              <div className="no-options">Nenhum resultado encontrado</div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .searchable-select-container {
          position: relative;
          width: 100%;
        }
        .select-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          min-height: 38px;
          transition: border-color 0.2s;
        }
        .select-trigger:hover {
          border-color: #cbd5e1;
        }
        .select-trigger.active {
          border-color: #83004c;
        }
        .selected-text {
          font-size: 14px;
          color: #1e293b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .placeholder-text {
          font-size: 14px;
          color: #94a3b8;
        }
        .arrow-icon {
          color: #64748b;
          transition: transform 0.2s;
          flex-shrink: 0;
        }
        .arrow-icon.rotate {
          transform: rotate(180deg);
        }
        .select-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          overflow: hidden;
        }
        .search-input-wrapper {
          padding: 8px;
          border-bottom: 1px solid #f1f5f9;
        }
        .search-input {
          width: 100%;
          padding: 6px 10px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 13px;
        }
        .search-input:focus {
          outline: none;
          border-color: #83004c;
        }
        .options-list {
          max-height: 250px;
          overflow-y: auto;
        }
        .option-item {
          padding: 10px 12px;
          cursor: pointer;
          font-size: 13px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          transition: background 0.2s;
        }
        .option-item:hover {
          background: #f8fafc;
        }
        .option-item.selected {
          background: #fdf2f8;
          color: #83004c;
        }
        .option-name {
          font-weight: 500;
        }
        .option-subtext {
          font-size: 11px;
          color: #64748b;
        }
        .no-options {
          padding: 12px;
          font-size: 13px;
          color: #94a3b8;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
