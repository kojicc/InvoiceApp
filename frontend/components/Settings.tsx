import React, { useEffect, useState } from 'react';
import {
  IconBell,
  IconCheck,
  IconPalette,
  IconSettings,
  IconUpload,
  IconUser,
} from '@tabler/icons-react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Container,
  Divider,
  FileInput,
  Group,
  LoadingOverlay,
  PasswordInput,
  Select,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import api from '../lib/axios';
import { useAuthStore } from '../state/useAuthStore';
import { useCurrencyStore } from '../state/useCurrencyStore';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string;
}

const Settings: React.FC = () => {
  const { user: authUser, login } = useAuthStore();
  const { currentCurrency, setCurrency } = useCurrencyStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Settings form state
  const [settings, setSettings] = useState({
    currency: currentCurrency,
    theme: 'light',
    notifications: true,
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/profile');
      const userData = response.data;
      setProfile(userData);
      setProfileForm({
        username: userData.username,
        email: userData.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load profile',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileUpdate = async () => {
    try {
      // Validation
      if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
        notifications.show({
          title: 'Error',
          message: 'New passwords do not match',
          color: 'red',
        });
        return;
      }

      if (profileForm.newPassword && !profileForm.currentPassword) {
        notifications.show({
          title: 'Error',
          message: 'Current password is required to set a new password',
          color: 'red',
        });
        return;
      }

      setSaving(true);

      const updateData: any = {
        username: profileForm.username,
        email: profileForm.email,
      };

      if (profileForm.newPassword && profileForm.currentPassword) {
        updateData.currentPassword = profileForm.currentPassword;
        updateData.newPassword = profileForm.newPassword;
      }

      const response = await api.put('/api/profile', updateData);

      // Update auth store with new user data
      if (response.data.user) {
        await login(profileForm.email, profileForm.currentPassword || 'dummy');
      }

      notifications.show({
        title: 'Success',
        message: 'Profile updated successfully',
        color: 'green',
      });

      // Clear password fields
      setProfileForm((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));

      // Refresh profile data
      fetchProfile();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update profile',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSettingsUpdate = async () => {
    try {
      setSaving(true);

      // Update currency
      setCurrency(settings.currency);

      // TODO: Save other settings to backend if needed

      notifications.show({
        title: 'Success',
        message: 'Settings updated successfully',
        color: 'green',
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update settings',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File | null) => {
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      setSaving(true);
      const response = await api.post('/api/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      notifications.show({
        title: 'Success',
        message: 'Avatar uploaded successfully',
        color: 'green',
      });

      // Refresh profile to get new avatar URL
      fetchProfile();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to upload avatar',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingOverlay visible overlayProps={{ radius: 'sm', blur: 2 }} />;
  }

  return (
    <Container size="md" py="xl">
      <LoadingOverlay visible={saving} overlayProps={{ radius: 'sm', blur: 2 }} />

      <Stack gap="xl">
        <Group justify="space-between">
          <Title order={1}>Settings</Title>
          <Badge color="blue" size="lg">
            {authUser?.role?.toUpperCase()}
          </Badge>
        </Group>

        <Tabs defaultValue="profile">
          <Tabs.List>
            <Tabs.Tab value="profile" leftSection={<IconUser size={16} />}>
              Profile
            </Tabs.Tab>
            <Tabs.Tab value="preferences" leftSection={<IconSettings size={16} />}>
              Preferences
            </Tabs.Tab>
            <Tabs.Tab value="notifications" leftSection={<IconBell size={16} />}>
              Notifications
            </Tabs.Tab>
          </Tabs.List>

          {/* Profile Tab */}
          <Tabs.Panel value="profile" pt="md">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <Group justify="space-between">
                  <Title order={3}>Profile Information</Title>
                  <Text c="dimmed" size="sm">
                    Member since {new Date(profile?.createdAt || '').toLocaleDateString()}
                  </Text>
                </Group>

                <Group gap="xl">
                  <div>
                    <Avatar src={profile?.avatarUrl} size={80} radius="md" />
                    <FileInput
                      placeholder="Upload avatar"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      size="xs"
                      mt="xs"
                      style={{ width: '120px' }}
                    />
                  </div>

                  <Stack gap="md" style={{ flex: 1 }}>
                    <TextInput
                      label="Username"
                      value={profileForm.username}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, username: e.target.value }))
                      }
                      required
                    />

                    <TextInput
                      label="Email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                      required
                    />
                  </Stack>
                </Group>

                <Divider label="Change Password" labelPosition="center" />

                <Group grow>
                  <PasswordInput
                    label="Current Password"
                    placeholder="Enter current password"
                    value={profileForm.currentPassword}
                    onChange={(e) =>
                      setProfileForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                    }
                  />
                  <PasswordInput
                    label="New Password"
                    placeholder="Enter new password"
                    value={profileForm.newPassword}
                    onChange={(e) =>
                      setProfileForm((prev) => ({ ...prev, newPassword: e.target.value }))
                    }
                  />
                  <PasswordInput
                    label="Confirm Password"
                    placeholder="Confirm new password"
                    value={profileForm.confirmPassword}
                    onChange={(e) =>
                      setProfileForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                    }
                  />
                </Group>

                <Group justify="flex-end">
                  <Button
                    leftSection={<IconCheck size={16} />}
                    onClick={handleProfileUpdate}
                    loading={saving}
                  >
                    Update Profile
                  </Button>
                </Group>
              </Stack>
            </Card>
          </Tabs.Panel>

          {/* Preferences Tab */}
          <Tabs.Panel value="preferences" pt="md">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <Title order={3}>Application Preferences</Title>

                <Select
                  label="Default Currency"
                  data={[
                    { value: 'USD', label: 'US Dollar (USD)' },
                    { value: 'EUR', label: 'Euro (EUR)' },
                    { value: 'GBP', label: 'British Pound (GBP)' },
                    { value: 'JPY', label: 'Japanese Yen (JPY)' },
                    { value: 'PHP', label: 'Philippine Peso (PHP)' },
                  ]}
                  value={settings.currency}
                  onChange={(value) =>
                    setSettings((prev) => ({ ...prev, currency: value || 'USD' }))
                  }
                />

                <Select
                  label="Theme"
                  data={[
                    { value: 'light', label: 'Light' },
                    { value: 'dark', label: 'Dark' },
                    { value: 'auto', label: 'Auto (System)' },
                  ]}
                  value={settings.theme}
                  onChange={(value) =>
                    setSettings((prev) => ({ ...prev, theme: value || 'light' }))
                  }
                />

                <Group justify="flex-end">
                  <Button
                    leftSection={<IconCheck size={16} />}
                    onClick={handleSettingsUpdate}
                    loading={saving}
                  >
                    Save Preferences
                  </Button>
                </Group>
              </Stack>
            </Card>
          </Tabs.Panel>

          {/* Notifications Tab */}
          <Tabs.Panel value="notifications" pt="md">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <Title order={3}>Notification Settings</Title>
                <Text c="dimmed">
                  Notification preferences will be available in a future update.
                </Text>
              </Stack>
            </Card>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
};

export default Settings;
