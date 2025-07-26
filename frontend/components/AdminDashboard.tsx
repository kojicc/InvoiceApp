import React, { useEffect, useState } from 'react';
import {
  IconChartBar,
  IconCurrencyDollar,
  IconFileInvoice,
  IconPlus,
  IconRefresh,
  IconUsers,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Container,
  Grid,
  Group,
  LoadingOverlay,
  Modal,
  Stack,
  Tabs,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import api from '../lib/axios';
import { useCurrencyStore } from '../state/useCurrencyStore';
import ClientList from './ClientList';
import InvoiceForm from './InvoiceForm';
import InvoiceList from './InvoiceList';

interface DashboardStats {
  totalClients: number;
  totalInvoices: number;
  totalRevenue: number;
  paidInvoices: number;
  unpaidInvoices: number;
  overdueInvoices: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
    overdueInvoices: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const { currentCurrency, formatCurrency } = useCurrencyStore();

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch dashboard statistics
      const [clientsRes, invoicesRes] = await Promise.all([
        api.get('/api/clients'),
        api.get('/api/invoices'),
      ]);

      const clients = clientsRes.data;
      const invoices = invoicesRes.data;

      const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + inv.total, 0);
      const paidInvoices = invoices.filter((inv: any) => inv.status === 'paid').length;
      const unpaidInvoices = invoices.filter((inv: any) => inv.status === 'unpaid').length;
      const overdueInvoices = invoices.filter((inv: any) => {
        const isOverdue = new Date(inv.dueDate) < new Date() && inv.status !== 'paid';
        return isOverdue;
      }).length;

      setStats({
        totalClients: clients.length,
        totalInvoices: invoices.length,
        totalRevenue,
        paidInvoices,
        unpaidInvoices,
        overdueInvoices,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load dashboard statistics',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    fetchStats();
    notifications.show({
      title: 'Refreshed',
      message: 'Dashboard data has been updated',
      color: 'green',
    });
  };

  const handleInvoiceCreated = () => {
    setIsInvoiceModalOpen(false);
    fetchStats(); // Refresh stats after creating invoice
  };

  const StatCard = ({ icon, title, value, color }: any) => (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between">
        <div>
          <Text c="dimmed" size="sm" tt="uppercase" fw={700}>
            {title}
          </Text>
          <Text fw={700} size="xl">
            {value}
          </Text>
        </div>
        <ActionIcon variant="light" color={color} size="xl" radius="md">
          {icon}
        </ActionIcon>
      </Group>
    </Card>
  );

  return (
    <Container size="xl" py="xl">
      <LoadingOverlay visible={loading} overlayProps={{ radius: 'sm', blur: 2 }} />

      <Group justify="space-between" mb="xl">
        <Title order={1}>Admin Dashboard</Title>
        <Group gap="sm">
          <Button leftSection={<IconPlus size={16} />} onClick={() => setIsInvoiceModalOpen(true)}>
            New Invoice
          </Button>
          <ActionIcon variant="light" color="blue" size="lg" onClick={handleRefresh}>
            <IconRefresh size={18} />
          </ActionIcon>
        </Group>
      </Group>

      {/* Statistics Cards */}
      <Grid mb="xl">
        <Grid.Col span={{ base: 12, sm: 6, lg: 2 }}>
          <StatCard
            icon={<IconUsers size={24} />}
            title="Total Clients"
            value={stats.totalClients}
            color="blue"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, lg: 2 }}>
          <StatCard
            icon={<IconFileInvoice size={24} />}
            title="Total Invoices"
            value={stats.totalInvoices}
            color="violet"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, lg: 2 }}>
          <StatCard
            icon={<IconCurrencyDollar size={24} />}
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            color="green"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, lg: 2 }}>
          <StatCard
            icon={<IconChartBar size={24} />}
            title="Paid Invoices"
            value={stats.paidInvoices}
            color="teal"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, lg: 2 }}>
          <StatCard
            icon={<IconChartBar size={24} />}
            title="Unpaid Invoices"
            value={stats.unpaidInvoices}
            color="orange"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, lg: 2 }}>
          <StatCard
            icon={<IconChartBar size={24} />}
            title="Overdue Invoices"
            value={stats.overdueInvoices}
            color="red"
          />
        </Grid.Col>
      </Grid>

      {/* Status Overview */}
      <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
        <Group justify="space-between" mb="md">
          <Title order={3}>Quick Status Overview</Title>
        </Group>
        <Group gap="md">
          <Badge color="green" size="lg">
            {stats.paidInvoices} Paid
          </Badge>
          <Badge color="orange" size="lg">
            {stats.unpaidInvoices} Unpaid
          </Badge>
          <Badge color="red" size="lg">
            {stats.overdueInvoices} Overdue
          </Badge>
        </Group>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="invoices">
        <Tabs.List>
          <Tabs.Tab value="invoices" leftSection={<IconFileInvoice size={16} />}>
            All Invoices
          </Tabs.Tab>
          <Tabs.Tab value="clients" leftSection={<IconUsers size={16} />}>
            Clients
          </Tabs.Tab>
          <Tabs.Tab value="overdue" leftSection={<IconChartBar size={16} />}>
            Overdue
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="invoices" pt="md">
          <InvoiceList />
        </Tabs.Panel>

        <Tabs.Panel value="clients" pt="md">
          <ClientList />
        </Tabs.Panel>

        <Tabs.Panel value="overdue" pt="md">
          <InvoiceList />
        </Tabs.Panel>
      </Tabs>

      {/* New Invoice Modal */}
      <Modal
        opened={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Create New Invoice"
        size="lg"
      >
        <InvoiceForm onSuccess={handleInvoiceCreated} />
      </Modal>
    </Container>
  );
};

export default AdminDashboard;
