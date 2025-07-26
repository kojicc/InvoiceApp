import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button, Container, LoadingOverlay, Paper, Text, Title } from '@mantine/core';
import { useAuthStore } from '../state/useAuthStore';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    console.log('🔒 ProtectedRoute check:', { isAuthenticated, user, pathname: router.pathname });

    // Check if user is not authenticated and not on login page
    if (!isAuthenticated && router.pathname !== '/login') {
      console.log('🔒 Redirecting to login - not authenticated');
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Show loading while checking authentication
  if (!isAuthenticated && router.pathname !== '/login') {
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
