'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PaystubSingleForm from '@/components/PaystubSingleForm';

export default function EditPaystubPage() {
  const params = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/paystubs/${params.id}`);
      const result = await res.json();
      if (res.ok) setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Carregando...</div>;
  if (!data) return <div style={{ padding: '40px', textAlign: 'center' }}>Contra cheque não encontrado.</div>;

  return <PaystubSingleForm initialData={data} isEdit={true} />;
}
