'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import CooperativaForm from '@/components/CooperativaForm';

export default function EditCooperativaPage() {
  const params = useParams();
  const [cooperativa, setCooperativa] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCooperativa();
  }, [params.id]);

  const fetchCooperativa = async () => {
    try {
      const res = await fetch(`/api/cooperativas/${params.id}`);
      const data = await res.json();
      if (res.ok) {
        setCooperativa(data);
      }
    } catch (error) {
      console.error('Error fetching cooperativa:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Carregando...</div>;
  if (!cooperativa) return <div style={{ padding: '40px', textAlign: 'center' }}>Cooperativa não encontrada.</div>;

  return <CooperativaForm initialData={cooperativa} isEdit={true} />;
}
