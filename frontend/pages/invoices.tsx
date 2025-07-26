import React from 'react';
import { IconClock, IconFileInvoice, IconPlus } from '@tabler/icons-react';
import { Button, Card, Group, Stack, Tabs, Text, Title } from '@mantine/core';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';

const InvoicesPageContent = () => {
  return (
    <Layout>
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <div>
            <Title order={1}>Invoice Management</Title>
            <Text c="dimmed" size="lg">
              Create, manage, and track your invoices
            </Text>
          </div>
          <Button leftSection={<IconPlus size={18} />} size="md">
            Create New Invoice
          </Button>
        </Group>

        <Tabs defaultValue="all" variant="pills">
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
          </Tabs.List>

          <Tabs.Panel value="all" pt="lg">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Text c="dimmed" ta="center" py="xl">
                All invoices will be displayed here. This will include invoice list, filters, and
                actions.
              </Text>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="pending" pt="lg">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Text c="dimmed" ta="center" py="xl">
                Pending invoices will be displayed here.
              </Text>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="paid" pt="lg">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Text c="dimmed" ta="center" py="xl">
                Paid invoices will be displayed here.
              </Text>
            </Card>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Layout>
  );
};

export default function InvoicesPage() {
  return (
    <ProtectedRoute>
      <InvoicesPageContent />
    </ProtectedRoute>
  );
}
