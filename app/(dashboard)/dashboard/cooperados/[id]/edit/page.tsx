'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import CooperadoForm from '@/components/CooperadoForm';

export default function EditCooperadoPage() {
  const params = useParams();
  const [cooperado, setCooperado] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCooperado();
  }, [params.id]);

  const fetchCooperado = async () => {
    try {
      const res = await fetch(`/api/cooperados/${params.id}`);
      const data = await res.json();
      if (res.ok) {
        setCooperado(data);
      }
    } catch (error) {
      console.error('Error fetching cooperado:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Carregando...</div>;
  if (!cooperado) return <div style={{ padding: '40px', textAlign: 'center' }}>Cooperado não encontrado.</div>;

  return <CooperadoForm initialData={cooperado} isEdit={true} />;
}
