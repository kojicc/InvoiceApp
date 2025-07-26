import React, { useState } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { Button, Group, Modal, Stack, Text, Title } from '@mantine/core';
import ClientForm from '@/components/ClientForm';
import ClientList from '../components/ClientList';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';

const ClientsPageContent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRefresh = () => {
    // This will trigger a refresh in the ClientList component
  };

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
          <Button
            leftSection={<IconPlus size={18} />}
            size="md"
            onClick={() => setIsModalOpen(true)}
          >
            Add New Client
          </Button>
        </Group>

        <ClientList onRefresh={handleRefresh} />

        <Modal
          opened={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add New Client"
          size="md"
        >
          <ClientForm onSuccess={() => setIsModalOpen(false)} />
        </Modal>
      </Stack>
    </Layout>
  );
};

export default function ClientsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <ClientsPageContent />
    </ProtectedRoute>
  );
}
