import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Center, Loader, Text, Stack } from '@mantine/core';
import { useAuthStore } from '../../state/useAuthStore';
import { notifications } from '@mantine/notifications';

export default function OAuthCallback() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const { token, error } = router.query;

        if (error) {
          notifications.show({
            title: 'Authentication Failed',
            message: 'There was an error during Google sign in. Please try again.',
            color: 'red',
          });
          router.push('/login');
          return;
        }

        if (token && typeof token === 'string') {
          // Decode JWT to get user info
          const payload = JSON.parse(atob(token.split('.')[1]));
          
          // Set authentication state
          setToken(token);
          setUser({
            id: payload.userId,
            username: payload.username,
            email: payload.email,
            role: payload.role,
            clientId: payload.clientId,
          });

          notifications.show({
            title: 'Welcome!',
            message: 'Successfully signed in with Google.',
            color: 'green',
          });

          // Redirect to dashboard
          router.push('/');
        } else {
          throw new Error('No token received');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        notifications.show({
          title: 'Authentication Error',
          message: 'Failed to complete sign in. Please try again.',
          color: 'red',
        });
        router.push('/login');
      }
    };

    if (router.isReady) {
      handleOAuthCallback();
    }
  }, [router.isReady, router.query, setUser, setToken, router]);

  return (
    <Center h="100vh">
      <Stack align="center" gap="md">
        <Loader size="lg" />
        <Text size="lg">Completing sign in...</Text>
        <Text size="sm" c="dimmed">Please wait while we verify your credentials</Text>
      </Stack>
    </Center>
  );
}
