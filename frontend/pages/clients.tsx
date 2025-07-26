import React from 'react';
import { IconPlus } from '@tabler/icons-react';
import { Button, Card, Container, Group, Stack, Text, Title } from '@mantine/core';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';

const ClientsPageContent = () => {
  return (
    <Layout>
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <div>
            <Title order={1}>Client Management</Title>
            <Text c="dimmed" size="lg">
              Manage your clients and their information
            </Text>
          </div>
          <Button leftSection={<IconPlus size={18} />} size="md">
            Add New Client
          </Button>
        </Group>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Text c="dimmed" ta="center" py="xl">
            Client list component will be implemented here. This will show all clients with their
            details and actions.
          </Text>
        </Card>
      </Stack>
    </Layout>
  );
};

export default function ClientsPage() {
  return (
    <ProtectedRoute>
      <ClientsPageContent />
    </ProtectedRoute>
  );
}
