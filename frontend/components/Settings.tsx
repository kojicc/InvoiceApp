import React, { useEffect, useState } from 'react';
import {
  IconBell,
  IconCheck,
  IconPalette,
  IconSettings,
  IconUpload,
  IconUser,
} from '@tabler/icons-react';
import useSWR, { mutate } from 'swr';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Container,
  Divider,
  FileInput,
  Group,
  Image,
  LoadingOverlay,
  PasswordInput,
  Select,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { Dropzone, FileWithPath, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { notifications } from '@mantine/notifications';
import api from '../lib/axios';
import { useAuthStore } from '../state/useAuthStore';
import { useCurrencyStore } from '../state/useCurrencyStore';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

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
  const {
    data: profile,
    error,
    isLoading,
    mutate: mutateProfile,
  } = useSWR('/api/profile', fetcher);
  const [saving, setSaving] = useState(false);
  const [avatarFiles, setAvatarFiles] = useState<FileWithPath[]>([]);

  // Helper function to construct full avatar URL
  const getAvatarUrl = (avatarUrl: string | null | undefined) => {
    if (!avatarUrl) return null;
    if (avatarUrl.startsWith('http')) return avatarUrl;
    return `http://localhost:4000${avatarUrl}`;
  };

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Settings form state
  const [settings, setSettings] = useState({
    currency: currentCurrency,
    theme: 'light',
    notifications: true,
  });

  // Update form when profile data is loaded
  useEffect(() => {
    if (profile) {
      console.log('Profile data:', profile);
      console.log('Avatar URL:', profile.avatarUrl);
      console.log('Full Avatar URL:', getAvatarUrl(profile.avatarUrl));
      setProfileForm({
        username: profile.username,
        email: profile.email,
        newPassword: '',
        confirmPassword: '',
      });
    }
  }, [profile]);

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

      setSaving(true);

      const updateData: any = {
        username: profileForm.username,
        email: profileForm.email,
      };

      if (profileForm.newPassword) {
        updateData.newPassword = profileForm.newPassword;
      }

      const response = await api.put('/api/profile', updateData);

      // Update local state and auth context - FIX: Don't call login() which causes refresh
      // Instead, just revalidate the profile data and update SWR cache
      await mutateProfile();

      // Also update the global user data in other SWR caches that might use it
      await mutate('/api/auth/me');

      notifications.show({
        title: 'Success',
        message: 'Profile updated successfully',
        color: 'green',
      });

      // Clear password fields
      setProfileForm((prev) => ({
        ...prev,
        newPassword: '',
        confirmPassword: '',
      }));
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

  const handleAvatarUpload = async (files: FileWithPath[]) => {
    if (!files || files.length === 0) return;

    const file = files[0]; // Take the first file

    // Check file size on frontend (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      notifications.show({
        title: 'File Too Large',
        message: `File size must be less than 5MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
        color: 'red',
      });
      setAvatarFiles([]);
      return;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      notifications.show({
        title: 'Invalid File Type',
        message: 'Please upload a valid image file (JPEG, PNG, GIF, or WebP).',
        color: 'red',
      });
      setAvatarFiles([]);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      setSaving(true);
      const response = await api.post('/api/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      notifications.show({
        title: 'Success',
        message: 'Avatar uploaded successfully',
        color: 'green',
      });

      // Force refresh profile to get new avatar URL - invalidate all profile-related caches
      await mutateProfile();
      await mutate('/api/profile');
      await mutate('/api/auth/me');

      // Add a small delay and force another refresh to ensure avatar updates
      setTimeout(async () => {
        await mutateProfile();
      }, 1000);

      // Clear the preview files after successful upload
      setAvatarFiles([]);
    } catch (error: any) {
      console.error('Error uploading avatar:', error);

      // Handle specific error types from backend
      const errorData = error.response?.data;
      if (errorData?.error === 'FILE_TOO_LARGE') {
        notifications.show({
          title: 'File Too Large',
          message:
            errorData.message || `File size must be less than ${errorData.maxSize || '5MB'}.`,
          color: 'red',
        });
      } else if (errorData?.error === 'TOO_MANY_FILES') {
        notifications.show({
          title: 'Too Many Files',
          message: errorData.message || 'Only one file is allowed.',
          color: 'red',
        });
      } else if (errorData?.error === 'UNEXPECTED_FIELD') {
        notifications.show({
          title: 'Upload Error',
          message: errorData.message || 'Invalid field name.',
          color: 'red',
        });
      } else {
        notifications.show({
          title: 'Error',
          message: errorData?.message || 'Failed to upload avatar',
          color: 'red',
        });
      }

      // Clear preview files on error
      setAvatarFiles([]);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
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
                  <Stack gap="xs">
                    <Avatar src={getAvatarUrl(profile?.avatarUrl)} size={80} radius="md" />

                    {/* Dropzone for avatar upload with preview */}
                    <Dropzone
                      accept={IMAGE_MIME_TYPE}
                      onDrop={(files) => {
                        setAvatarFiles(files);
                        if (files.length > 0) {
                          handleAvatarUpload(files);
                        }
                      }}
                      maxFiles={1}
                      style={{ width: '120px', minHeight: '80px' }}
                    >
                      <Text ta="center" size="xs" mb="xs">
                        Drop avatar here or click
                      </Text>
                      <Text ta="center" size="xs" c="dimmed">
                        Max: 5MB
                      </Text>
                      <Text ta="center" size="xs" c="dimmed">
                        JPEG, PNG, GIF, WebP
                      </Text>
                    </Dropzone>

                    {/* Preview of selected image before upload */}
                    {avatarFiles.length > 0 && (
                      <div style={{ width: '120px' }}>
                        <Text size="xs" c="dimmed" mb="xs">
                          Preview:
                        </Text>
                        {avatarFiles.map((file, index) => {
                          const imageUrl = URL.createObjectURL(file);
                          return (
                            <Image
                              key={index}
                              src={imageUrl}
                              onLoad={() => URL.revokeObjectURL(imageUrl)}
                              radius="md"
                              style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </Stack>

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
