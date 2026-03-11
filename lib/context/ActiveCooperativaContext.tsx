'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import ActiveCooperativaModal from '@/components/ActiveCooperativaModal';

interface ActiveCooperativaContextType {
  activeCooperativaId: string | null;
  activeCooperativaName: string | null;
  setActiveCooperativa: (id: string, name: string) => void;
  openModal: () => void;
  closeModal: () => void;
}

const ActiveCooperativaContext = createContext<ActiveCooperativaContextType>({
  activeCooperativaId: null,
  activeCooperativaName: null,
  setActiveCooperativa: () => {},
  openModal: () => {},
  closeModal: () => {},
});

export function ActiveCooperativaProvider({
  children,
  initialId,
  initialName,
}: {
  children: ReactNode;
  initialId?: string;
  initialName?: string;
}) {
  const [activeCooperativaId, setId] = useState<string | null>(initialId ?? null);
  const [activeCooperativaName, setName] = useState<string | null>(initialName ?? null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const setActiveCooperativa = useCallback((id: string, name: string) => {
    setId(id);
    setName(name);
    setIsModalOpen(false);
  }, []);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  // Auto-open modal if no cooperative is selected
  const shouldShowModal = isModalOpen || !activeCooperativaId;

  return (
    <ActiveCooperativaContext.Provider value={{ 
      activeCooperativaId, 
      activeCooperativaName, 
      setActiveCooperativa,
      openModal,
      closeModal
    }}>
      {children}
      <ActiveCooperativaModal 
        isOpen={shouldShowModal} 
        onClose={activeCooperativaId ? closeModal : undefined}
        forceSelection={!activeCooperativaId}
      />
    </ActiveCooperativaContext.Provider>
  );
}

export function useActiveCooperativa() {
  return useContext(ActiveCooperativaContext);
}
