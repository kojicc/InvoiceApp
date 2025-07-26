import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Dashboard } from '../components/Dashboard';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useAuthStore } from '../state/useAuthStore';

function DashboardPage() {
  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
}

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  );
}
