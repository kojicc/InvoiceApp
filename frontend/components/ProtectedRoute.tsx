import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import { LoadingOverlay } from '@mantine/core';
import { useAuthStore } from '../state/useAuthStore';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Check if user is not authenticated and not on login page
    if (!isAuthenticated && router.pathname !== '/login') {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Show loading while checking authentication
  if (!isAuthenticated && router.pathname !== '/login') {
    return <LoadingOverlay visible overlayProps={{ radius: 'sm', blur: 2 }} />;
  }

  return <>{children}</>;
}
