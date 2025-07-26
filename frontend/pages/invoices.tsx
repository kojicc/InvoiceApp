import React, { useState } from 'react';
import { IconClock, IconFileInvoice, IconPlus } from '@tabler/icons-react';
import { Button, Card, Group, Modal, Stack, Tabs, Text, Title } from '@mantine/core';
import InvoiceForm from '../components/InvoiceForm';
import InvoiceList from '../components/InvoiceList';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useAuthStore } from '../state/useAuthStore';

const InvoicesPageContent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  return (
    <Layout>
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <div>
            <Title order={1}>Invoice Management</Title>
            <Text c="dimmed" size="lg">
              {isAdmin ? 'Create, manage, and track your invoices' : 'View and track your invoices'}
            </Text>
          </div>
          {isAdmin && (
            <Button
              leftSection={<IconPlus size={18} />}
              size="md"
              onClick={() => setIsModalOpen(true)}
            >
              Create New Invoice
            </Button>
          )}
        </Group>

        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'all')} variant="pills">
          <Tabs.List>
            <Tabs.Tab value="all" leftSection={<IconFileInvoice size={16} />}>
              All Invoices
            </Tabs.Tab>
            <Tabs.Tab value="pending" leftSection={<IconClock size={16} />}>
              Pending
            </Tabs.Tab>
            <Tabs.Tab value="paid" leftSection={<IconFileInvoice size={16} />}>
              Paid
            </Tabs.Tab>
            <Tabs.Tab value="overdue" leftSection={<IconClock size={16} />}>
              Overdue
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="all" pt="lg">
            <InvoiceList />
          </Tabs.Panel>

          <Tabs.Panel value="pending" pt="lg">
            <InvoiceList />
          </Tabs.Panel>

          <Tabs.Panel value="paid" pt="lg">
            <InvoiceList />
          </Tabs.Panel>

          <Tabs.Panel value="overdue" pt="lg">
            <InvoiceList />
          </Tabs.Panel>
        </Tabs>

        <Modal
          opened={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New Invoice"
          size="lg"
        >
          <InvoiceForm onSuccess={() => setIsModalOpen(false)} />
        </Modal>
      </Stack>
    </Layout>
  );
};

export default function InvoicesPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'client']}>
      <InvoicesPageContent />
    </ProtectedRoute>
  );
}
