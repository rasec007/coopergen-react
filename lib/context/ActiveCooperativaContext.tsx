'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ActiveCooperativaContextType {
  activeCooperativaId: string | null;
  activeCooperativaName: string | null;
  setActiveCooperativa: (id: string, name: string) => void;
}

const ActiveCooperativaContext = createContext<ActiveCooperativaContextType>({
  activeCooperativaId: null,
  activeCooperativaName: null,
  setActiveCooperativa: () => {},
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

  const setActiveCooperativa = useCallback((id: string, name: string) => {
    setId(id);
    setName(name);
  }, []);

  return (
    <ActiveCooperativaContext.Provider value={{ activeCooperativaId, activeCooperativaName, setActiveCooperativa }}>
      {children}
    </ActiveCooperativaContext.Provider>
  );
}

export function useActiveCooperativa() {
  return useContext(ActiveCooperativaContext);
}
