import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { AuthForm } from '../components/AuthForm';
import { useAuthStore } from '../state/useAuthStore';

export default function LoginPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null; // or a loading spinner
  }

  return <AuthForm />;
}
