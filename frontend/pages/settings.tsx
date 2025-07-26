import React from 'react';
import { IconDatabase, IconHistory, IconSettings, IconUser } from '@tabler/icons-react';
import { Card, Stack, Tabs, Text, Title } from '@mantine/core';
import AuditLog from '../components/AuditLog';
import { ColorSchemeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import DataManagement from '../components/DataManagement';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import Settings from '../components/Settings';
import { useAuthStore } from '../state/useAuthStore';

const SettingsPageContent = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  return (
    <Layout>
      <Stack gap="lg">
        <div>
          <Title order={1}>Settings</Title>
          <Text c="dimmed" size="lg">
            Manage your application settings and data
          </Text>
        </div>

        <Tabs defaultValue="profile" variant="pills">
          <Tabs.List>
            <Tabs.Tab value="profile" leftSection={<IconUser size={16} />}>
              Profile
            </Tabs.Tab>
            {isAdmin && (
              <>
                <Tabs.Tab value="data" leftSection={<IconDatabase size={16} />}>
                  Data Management
                </Tabs.Tab>
                <Tabs.Tab value="audit" leftSection={<IconHistory size={16} />}>
                  Audit Log
                </Tabs.Tab>
              </>
            )}
            <Tabs.Tab value="appearance" leftSection={<IconSettings size={16} />}>
              Appearance
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="profile" pt="lg">
            <Settings />
          </Tabs.Panel>

          {isAdmin && (
            <>
              <Tabs.Panel value="data" pt="lg">
                <DataManagement />
              </Tabs.Panel>

              <Tabs.Panel value="audit" pt="lg">
                <AuditLog />
              </Tabs.Panel>
            </>
          )}

          <Tabs.Panel value="appearance" pt="lg">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <Text fw={500} size="lg">
                  Theme Settings
                </Text>
                <Text size="sm" c="dimmed">
                  Choose your preferred color scheme
                </Text>
                <ColorSchemeToggle />
              </Stack>
            </Card>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Layout>
  );
};

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsPageContent />
    </ProtectedRoute>
  );
}
