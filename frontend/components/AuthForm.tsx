import { useState } from 'react';
import {
  Anchor,
  Button,
  Checkbox,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
  Stack,
  Group,
  LoadingOverlay,
  Divider,
} from '@mantine/core';
import { IconBrandGoogle } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useAuthStore } from '../state/useAuthStore';
import classes from './AuthForm.module.css';

interface AuthFormData {
  email: string;
  password: string;
  username?: string;
  rememberMe: boolean;
}

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register, isLoading } = useAuthStore();
  
  const form = useForm<AuthFormData>({
    initialValues: {
      email: '',
      password: '',
      username: '',
      rememberMe: false,
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length >= 6 ? null : 'Password must be at least 6 characters'),
      username: (value) => (!isLogin && (!value || value.length < 3) ? 'Username must be at least 3 characters' : null),
    },
  });

  const handleGoogleSignIn = () => {
    // Redirect to backend Google OAuth route
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/oauth/google`;
  };

  const handleSubmit = async (values: AuthFormData) => {
    try {
      if (isLogin) {
        await login(values.email, values.password);
      } else {
        await register(values.username!, values.email, values.password);
      }
      form.reset();
    } catch (error) {
      // Error handled in store
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    form.reset();
  };

  return (
    <div className={classes.wrapper}>
      <Paper className={classes.form} pos="relative">
        <LoadingOverlay visible={isLoading} overlayProps={{ radius: "sm", blur: 2 }} />
        
        <Title order={2} className={classes.title}>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </Title>
        
        <Text c="dimmed" size="sm" ta="center" mb="lg">
          {isLogin 
            ? 'Sign in to your invoice management account' 
            : 'Join our invoice management platform'
          }
        </Text>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            {!isLogin && (
              <TextInput
                label="Username"
                placeholder="Enter your username"
                size="md"
                {...form.getInputProps('username')}
              />
            )}
            
            <TextInput
              label="Email address"
              placeholder="Enter your email"
              size="md"
              {...form.getInputProps('email')}
            />
            
            <PasswordInput
              label="Password"
              placeholder="Enter your password"
              size="md"
              {...form.getInputProps('password')}
            />
            
            {isLogin && (
              <Group justify="space-between">
                <Checkbox
                  label="Remember me"
                  size="sm"
                  {...form.getInputProps('rememberMe', { type: 'checkbox' })}
                />
                <Anchor size="sm" c="dimmed">
                  Forgot password?
                </Anchor>
              </Group>
            )}
            
            <Button 
              type="submit" 
              fullWidth 
              size="md" 
              mt="lg"
              disabled={isLoading}
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>

            {isLogin && (
              <>
                <Divider label="or" labelPosition="center" my="lg" />
                
                <Button 
                  fullWidth 
                  size="md" 
                  variant="outline"
                  leftSection={<IconBrandGoogle size={20} />}
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  Sign in with Google
                </Button>
              </>
            )}
          </Stack>
        </form>

        <Text ta="center" mt="lg" size="sm">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <Anchor fw={500} onClick={toggleMode} style={{ cursor: 'pointer' }}>
            {isLogin ? 'Create one' : 'Sign in'}
          </Anchor>
        </Text>
      </Paper>
    </div>
  );
}
