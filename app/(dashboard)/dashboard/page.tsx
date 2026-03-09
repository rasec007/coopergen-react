import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { sql, count } from 'drizzle-orm';

async function getDashboardStats() {
  try {
    const [totalUsers] = await db.select({ count: count() }).from(users);
    const [activeUsers] = await db.select({ count: count() }).from(users)
      .where(sql`is_active = true`);

    return {
      totalUsers: totalUsers.count,
      activeUsers: activeUsers.count,
      dbVersion: 'PostgreSQL 17.9',
    };
  } catch {
    return { totalUsers: 0, activeUsers: 0, dbVersion: 'PostgreSQL 17.9' };
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const cards = [
    {
      title: 'Total de Usuários',
      value: stats.totalUsers,
      change: '+100%',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
        </svg>
      ),
      color: '#8B004B',
    },
    {
      title: 'Usuários Ativos',
      value: stats.activeUsers,
      change: 'Status Online',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      ),
      color: '#10b981',
    },
    {
      title: 'Real-time',
      value: 'Ativo',
      change: 'Pusher WebSocket',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      ),
      color: '#5D3FD3',
    },
  ];

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#1D2D50' }}>Visão Geral</h1>
        <p style={{ color: '#64748b', fontSize: '15px', marginTop: '4px' }}>
          Bem-vindo ao painel de controle da Coopergen.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {cards.map((card, i) => (
          <div
            key={i}
            className="stat-card"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="stat-header">
              <div className="stat-icon" style={{ backgroundColor: `${card.color}15`, color: card.color }}>
                {card.icon}
              </div>
              <span className="stat-change" style={{ color: card.color === '#10b981' ? '#10b981' : '#64748b' }}>
                {card.change}
              </span>
            </div>
            <div className="stat-content">
              <div className="stat-value">{card.value}</div>
              <div className="stat-title">{card.title}</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
