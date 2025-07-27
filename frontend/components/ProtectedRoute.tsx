import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button, Container, LoadingOverlay, Paper, Text, Title } from '@mantine/core';
import { useAuthStore } from '../state/useAuthStore';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, isHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    console.log('🔒 ProtectedRoute check:', {
      isAuthenticated,
      user,
      isHydrated,
      pathname: router.pathname,
    });

    // Only redirect if store is hydrated and user is not authenticated
    if (isHydrated && !isAuthenticated && router.pathname !== '/login') {
      console.log('🔒 Redirecting to login - not authenticated');
      // Store the current path so we can redirect back after login
      sessionStorage.setItem('returnTo', router.asPath);
      router.push('/login');
    }
  }, [isAuthenticated, isHydrated, router]);

  // Show loading while store is rehydrating or checking authentication
  if (!isHydrated || (!isAuthenticated && router.pathname !== '/login')) {
    return <LoadingOverlay visible overlayProps={{ radius: 'sm', blur: 2 }} />;
  }

  // Check role-based access
  if (isAuthenticated && allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <Container size="sm" mt="xl">
        <Paper shadow="md" p="xl" radius="md">
          <Title order={2} ta="center" mb="md">
            Access Denied
          </Title>
          <Text ta="center" mb="xl">
            You don't have permission to access this page. Your role: {user.role}
          </Text>
          <Button fullWidth onClick={() => router.push('/')}>
            Go to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  return <>{children}</>;
}
