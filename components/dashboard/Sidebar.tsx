'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = {
  label: string;
  href: string;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Meu Perfil', href: '/dashboard/profile' },
  { label: 'Atualizar Senha', href: '/dashboard/change-password' },
  { label: 'Atualizar E-mail', href: '/dashboard/change-email' },
  { label: 'Cooperativa', href: '/dashboard/cooperativas' },
  { label: 'Cooperado', href: '/dashboard/cooperados' },
  { label: 'Contra Cheque', href: '/dashboard/paystubs' },
  { label: 'Posto de Trabalho', href: '/dashboard/postos-trabalho' },
  { label: 'Gerenciar Usuários', href: '/dashboard/users', adminOnly: true },
];

export default function Sidebar({ userRole }: { userRole: string }) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          // Admin-only check
          if (item.adminOnly && userRole !== 'admin') return null;

          // Specific restriction for 'user' role
          if (userRole === 'user') {
            const allowedLabels = ['Meu Perfil', 'Atualizar Senha', 'Atualizar E-mail', 'Contra Cheque'];
            if (!allowedLabels.includes(item.label)) return null;
          }

          const isActive = pathname === item.href;

          return (
            <Link key={item.href} href={item.href} className={`nav-card ${isActive ? 'active' : ''}`}>
              {/* Checkbox Icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#83004c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              
              <span className="nav-label">{item.label}</span>
              
              {/* Caret Triangle Icon */}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#83004c" style={{ flexShrink: 0, opacity: 0.9 }}>
                <path d="M8 5v14l11-7z" />
              </svg>
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}
