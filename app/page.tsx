import { redirect } from 'next/navigation';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getAccessTokenFromCookies } from '@/lib/auth/cookies';

export default async function Home() {
  const token = await getAccessTokenFromCookies();
  const user = token ? await verifyAccessToken(token) : null;

  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
