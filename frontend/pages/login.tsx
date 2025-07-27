import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { AuthForm } from '../components/AuthForm';
import { useAuthStore } from '../state/useAuthStore';

export default function LoginPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      // Check if there's a stored return path
      const returnTo = sessionStorage.getItem('returnTo');
      if (returnTo) {
        sessionStorage.removeItem('returnTo');
        console.log('🔄 Redirecting to stored path:', returnTo);
        router.push(returnTo);
      } else {
        console.log('🔄 Redirecting to dashboard');
        router.push('/');
      }
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null; // or a loading spinner
  }

  return <AuthForm />;
}
