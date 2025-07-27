import AdminDashboard from '../components/AdminDashboard';
import ClientDashboard from '../components/ClientDashboard';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useAuthStore } from '../state/useAuthStore';

function RoleBasedDashboard() {
  const { user } = useAuthStore();

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  } else if (user?.role === 'client') {
    return <ClientDashboard />;
  }

  return <div>Loading...</div>;
}

function DashboardPage() {
  return (
    <Layout>
      <RoleBasedDashboard />
    </Layout>
  );
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  );
}
