'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function DeletePostoTrabalhoPage() {
  const router = useRouter();
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/postos-trabalho/${params.id}`);
      const result = await res.json();
      if (res.ok) setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/postos-trabalho/${params.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/dashboard/postos-trabalho');
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Carregando...</div>;
  if (!data) return <div style={{ padding: '40px', textAlign: 'center' }}>Posto de trabalho não encontrado.</div>;

  return (
    <div className="delete-container">
      <div className="card">
        <div className="header">
          <h1>Excluir Posto de Trabalho</h1>
        </div>
        <div className="content">
          <p>Tem certeza que deseja excluir o Posto de Trabalho:</p>
          <p className="item-name"><strong>Nome:</strong> {data.name}</p>
          <p className="item-name"><strong>Cooperativa:</strong> {data.cooperativa?.name}</p>
          <p className="warning">Esta ação não pode ser desfeita.</p>
          
          <div className="actions">
            <button onClick={handleDelete} className="btn-delete">Excluir</button>
          </div>
          
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
             <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#64748b', textDecoration: 'underline', cursor: 'pointer' }}>Cancelar e Voltar</button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .delete-container { display: flex; justify-content: center; padding: 20px; }
        .card { width: 100%; max-width: 600px; background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #f1f5f9; }
        .header { background-color: #83004c; color: white; padding: 24px; text-align: center; }
        .header h1 { font-size: 22px; margin: 0; font-weight: 600; }
        .content { padding: 40px; }
        .content p { font-size: 16px; color: #475569; margin-bottom: 8px; }
        .item-name { font-size: 18px !important; color: #1e293b !important; }
        .warning { color: #dc2626 !important; margin-top: 24px !important; font-size: 14px !important; }
        .actions { display: flex; justify-content: center; margin-top: 40px; }
        .btn-delete { padding: 14px 60px; background-color: #83004c; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; font-size: 16px; }
        .btn-delete:hover { background-color: #70003c; }
      `}</style>
    </div>
  );
}
