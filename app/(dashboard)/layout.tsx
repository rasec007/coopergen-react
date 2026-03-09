import '@/lib/polyfills';
import { redirect } from 'next/navigation';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getAccessTokenFromCookies } from '@/lib/auth/cookies';
import { cookies } from 'next/headers';
import Sidebar from '@/components/dashboard/Sidebar';
import Topbar from '@/components/dashboard/Topbar';
import { ActiveCooperativaProvider } from '@/lib/context/ActiveCooperativaContext';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const token = await getAccessTokenFromCookies();
  const user = token ? await verifyAccessToken(token) : null;
  const cookieStore = await cookies();
  const activeCoopId = cookieStore.get('active_cooperativa_id')?.value;
  const activeCoopName = cookieStore.get('active_cooperativa_name')?.value;

  if (!user) {
    redirect('/login');
  }

  const decodedName = activeCoopName ? decodeURIComponent(activeCoopName) : undefined;

  return (
    <ActiveCooperativaProvider initialId={activeCoopId} initialName={decodedName}>
      <div className="dashboard-layout">
        <Topbar userName={user.name} activeCooperativaName={decodedName} />
        
        <div className="dashboard-body">
          <Sidebar userRole={user.role} />
          <main className="dashboard-content">
            {children}
          </main>
        </div>
      </div>
    </ActiveCooperativaProvider>
  );
}
