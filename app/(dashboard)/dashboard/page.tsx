import { db } from '@/lib/db';
import { users, refreshTokens, cooperativas, postosTrabalho, paystubs, cooperados } from '@/lib/db/schema';
import { sql, eq, gt, isNull, and } from 'drizzle-orm';
import { cookies } from 'next/headers';

async function getDashboardStats(cooperativaId?: string) {
  try {
    const [[totalUsers], [onlineUsers], [totalCoops], [totalPostos]] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` })
        .from(refreshTokens)
        .where(and(gt(refreshTokens.expiresAt, new Date()), isNull(refreshTokens.revokedAt))),
      db.select({ count: sql<number>`count(*)` }).from(cooperativas),
      db.select({ count: sql<number>`count(*)` }).from(postosTrabalho),
    ]);

    // Detalhamento de documentos (Contra Cheque, Rendimentos, Rateio) por cooperativa
    let baseQuery = db.select({ count: sql<number>`count(*)` }).from(paystubs);
    
    if (cooperativaId && cooperativaId !== 'all') {
      // @ts-ignore - Drizzle join syntax
      baseQuery = db.select({ count: sql<number>`count(*)` })
        .from(paystubs)
        .innerJoin(cooperados, eq(paystubs.cooperadoId, cooperados.id))
        .where(eq(cooperados.cooperativaId, cooperativaId));
    }

    const [[totalPaystubs], [totalRendimentos], [totalRateio]] = await Promise.all([
      // @ts-ignore
      db.select({ count: sql<number>`count(*)` })
        .from(paystubs)
        .innerJoin(cooperados, eq(paystubs.cooperadoId, cooperados.id))
        .where(and(
          eq(paystubs.type, 'Contra Cheque'),
          cooperativaId && cooperativaId !== 'all' ? eq(cooperados.cooperativaId, cooperativaId) : sql`1=1`
        )),
      // @ts-ignore
      db.select({ count: sql<number>`count(*)` })
        .from(paystubs)
        .innerJoin(cooperados, eq(paystubs.cooperadoId, cooperados.id))
        .where(and(
          eq(paystubs.type, 'Rendimento'),
          cooperativaId && cooperativaId !== 'all' ? eq(cooperados.cooperativaId, cooperativaId) : sql`1=1`
        )),
      // @ts-ignore
      db.select({ count: sql<number>`count(*)` })
        .from(paystubs)
        .innerJoin(cooperados, eq(paystubs.cooperadoId, cooperados.id))
        .where(and(
          eq(paystubs.type, 'Rateio'),
          cooperativaId && cooperativaId !== 'all' ? eq(cooperados.cooperativaId, cooperativaId) : sql`1=1`
        )),
    ]);

    return {
      totalUsers: Number(totalUsers.count),
      onlineUsers: Number(onlineUsers.count),
      totalCoops: Number(totalCoops.count),
      totalPostos: Number(totalPostos.count),
      totalPaystubs: Number(totalPaystubs.count),
      totalRendimentos: Number(totalRendimentos.count),
      totalRateio: Number(totalRateio.count),
      dbVersion: 'PostgreSQL 17.9',
    };
  } catch (error) {
    console.error('❌ Dashboard Stats Error:', error);
    return { 
      totalUsers: 0, 
      onlineUsers: 0, 
      totalCoops: 0, 
      totalPostos: 0, 
      totalPaystubs: 0, 
      totalRendimentos: 0, 
      totalRateio: 0, 
      dbVersion: 'PostgreSQL 17.9' 
    };
  }
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const activeCooperativaId = cookieStore.get('active_cooperativa_id')?.value;
  const stats = await getDashboardStats(activeCooperativaId);

  const mainCards = [
    {
      title: 'Usuários Registrados',
      value: stats.totalUsers,
      change: '+100%',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
        </svg>
      ),
      color: '#83004c',
    },
    {
      title: 'Usuários Online',
      value: stats.onlineUsers,
      change: 'Sessões Ativas',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      ),
      color: '#10b981',
    },
  ];

  const summaryItems = [
    { label: 'Cooperativas', value: stats.totalCoops, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M3 7v14M21 7v14M2 3h20M10 21V11m4 10V11m-7 0h10"/></svg> },
    { label: 'Postos de Trabalho', value: stats.totalPostos, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> },
    { label: 'Contra Cheques', value: stats.totalPaystubs, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
    { label: 'Rendimentos', value: stats.totalRendimentos, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
    { label: 'Rateio', value: stats.totalRateio, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg> },
  ];

  return (
    <div className="fade-in">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div className="welcome-text">
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#1e293b',
            letterSpacing: '-0.5px',
            margin: 0
          }}>Olá, Administrador</h1>
          <p style={{
            color: '#64748b',
            fontSize: '15px',
            marginTop: '4px'
          }}>Veja o que está acontecendo na Coopergen hoje.</p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#f0fdf4',
          color: '#166534',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: 600,
          border: '1px solid #dcfce7'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            background: '#22c55e',
            borderRadius: '50%',
            boxShadow: '0 0 0 4px rgba(34, 197, 94, 0.2)'
          }}></span>
          System Online
        </div>
      </div>

      <div className="stats-grid">
        {mainCards.map((card, i) => (
          <div key={i} className="stat-card">
            <div className="stat-header">
              <div className="stat-icon" style={{ backgroundColor: `${card.color}15`, color: card.color }}>
                {card.icon}
              </div>
              <span className="stat-change">{card.change}</span>
            </div>
            <div className="stat-content">
              <div className="stat-value">{card.value}</div>
              <div className="stat-title">{card.title}</div>
            </div>
          </div>
        ))}
        
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
          gridColumn: 'span 1'
        }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: '20px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>Resumo do Sistema</h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {summaryItems.map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#83004c'
                }}>{item.icon}</div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{
                    fontSize: '12px',
                    color: '#64748b',
                    fontWeight: 500
                  }}>{item.label}</span>
                  <span style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#1e293b'
                  }}>{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
