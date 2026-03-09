'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PostoTrabalhoForm from '@/components/PostoTrabalhoForm';

export default function EditPostoTrabalhoPage() {
  const params = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/postos-trabalho/${params.id}`);
      const result = await res.json();
      if (res.ok) setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Carregando...</div>;
  if (!data) return <div style={{ padding: '40px', textAlign: 'center' }}>Posto de trabalho não encontrado.</div>;

  return <PostoTrabalhoForm initialData={data} isEdit={true} />;
}
