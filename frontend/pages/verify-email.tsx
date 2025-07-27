import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { IconCheck, IconMail, IconX } from '@tabler/icons-react';
import {
  Alert,
  Button,
  Card,
  Center,
  Loader,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import api from '../lib/axios';
import { useAuthStore } from '../state/useAuthStore';

export default function VerifyEmail() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [canSetPassword, setCanSetPassword] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const { token } = router.query;

        if (!token) {
          setVerificationStatus('error');
          return;
        }

        const response = await api.get(`/api/verification/verify-email?token=${token}`);
        const data = response.data;

        setVerificationStatus('success');
        setCanSetPassword(data.canSetPassword);
        setUserId(data.userId);

        if (!data.canSetPassword) {
          // User already has password set, redirect to login
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        }
      } catch (error: any) {
        console.error('Email verification error:', error);
        setVerificationStatus('error');
      }
    };

    if (router.isReady && router.query.token) {
      verifyToken();
    }
  }, [router.isReady, router.query]);

  const handlePasswordSubmit = async () => {
    if (!password || password.length < 6) {
      notifications.show({
        title: 'Invalid Password',
        message: 'Password must be at least 6 characters long',
        color: 'red',
      });
      return;
    }

    if (password !== confirmPassword) {
      notifications.show({
        title: 'Password Mismatch',
        message: 'Passwords do not match',
        color: 'red',
      });
      return;
    }

    setIsSettingPassword(true);
    try {
      const response = await api.post('/api/verification/set-password', {
        userId,
        password,
      });

      const { token: authToken, user } = response.data;

      // Set authentication state
      setToken(authToken);
      setUser(user);

      notifications.show({
        title: 'Account Setup Complete',
        message: 'Your password has been set and you are now logged in!',
        color: 'green',
      });

      // Redirect to dashboard
      router.push('/');
    } catch (error: any) {
      console.error('Set password error:', error);
      const message = error.response?.data?.message || 'Failed to set password';
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    } finally {
      setIsSettingPassword(false);
    }
  };

  const renderContent = () => {
    switch (verificationStatus) {
      case 'loading':
        return (
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text size="lg">Verifying your email...</Text>
            <Text size="sm" c="dimmed">
              Please wait while we verify your email address
            </Text>
          </Stack>
        );

      case 'success':
        if (canSetPassword) {
          return (
            <Stack gap="md" maw={400}>
              <Alert icon={<IconCheck />} color="green" title="Email Verified Successfully!">
                Your email has been verified. Please set your password to complete account setup.
              </Alert>

              <Card withBorder p="lg">
                <Stack gap="md">
                  <Title order={3} ta="center">
                    Set Your Password
                  </Title>

                  <PasswordInput
                    label="Password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.currentTarget.value)}
                    description="Password must be at least 6 characters long"
                  />

                  <PasswordInput
                    label="Confirm Password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.currentTarget.value)}
                  />

                  <Button
                    fullWidth
                    onClick={handlePasswordSubmit}
                    loading={isSettingPassword}
                    disabled={isSettingPassword || !password || !confirmPassword}
                  >
                    Set Password & Login
                  </Button>
                </Stack>
              </Card>
            </Stack>
          );
        } else {
          return (
            <Stack align="center" gap="md">
              <Alert icon={<IconCheck />} color="green" title="Email Already Verified">
                Your email has been verified and your account is ready to use.
              </Alert>
              <Text ta="center">Redirecting to login page...</Text>
              <Button onClick={() => router.push('/login')}>Go to Login</Button>
            </Stack>
          );
        }

      case 'error':
        return (
          <Stack align="center" gap="md">
            <Alert icon={<IconX />} color="red" title="Verification Failed">
              The verification link is invalid or has expired.
            </Alert>
            <Text ta="center" c="dimmed">
              Please contact support or request a new verification email.
            </Text>
            <Button onClick={() => router.push('/login')}>Go to Login</Button>
          </Stack>
        );

      default:
        return null;
    }
  };

  return (
    <Center h="100vh" p="md">
      <Stack align="center" gap="lg" maw={500}>
        <Stack align="center" gap="sm">
          <IconMail size={48} />
          <Title order={2} ta="center">
            Email Verification
          </Title>
        </Stack>
        {renderContent()}
      </Stack>
    </Center>
  );
}
