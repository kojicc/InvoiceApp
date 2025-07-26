import React, { useEffect, useState } from 'react';
import {
  IconChartBar,
  IconClock,
  IconCurrencyDollar,
  IconDownload,
  IconFileInvoice,
  IconRefresh,
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
  Progress,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import api from '../lib/axios';
import { useAuthStore } from '../state/useAuthStore';
import { useCurrencyStore } from '../state/useCurrencyStore';
import InvoiceList from './InvoiceList';
import PaymentHistory from './PaymentHistory';

interface ClientStats {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  overdueInvoices: number;
  recentInvoices: any[];
}

const ClientDashboard: React.FC = () => {
  const [stats, setStats] = useState<ClientStats>({
    totalInvoices: 0,
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    overdueInvoices: 0,
    recentInvoices: [],
  });
  const [loading, setLoading] = useState(true);
  const { currentCurrency, formatCurrency } = useCurrencyStore();
  const { user } = useAuthStore();

  const fetchClientStats = async () => {
    try {
      setLoading(true);

      // Fetch client-specific invoices
      const response = await api.get('/api/invoices');
      const invoices = response.data;

      const totalAmount = invoices.reduce((sum: number, inv: any) => sum + inv.total, 0);
      const paidAmount = invoices.reduce((sum: number, inv: any) => sum + (inv.paidAmount || 0), 0);
      const unpaidAmount = totalAmount - paidAmount;

      const overdueInvoices = invoices.filter((inv: any) => {
        const isOverdue = new Date(inv.dueDate) < new Date() && inv.status !== 'paid';
        return isOverdue;
      }).length;

      // Get recent invoices (last 5)
      const recentInvoices = invoices
        .sort((a: any, b: any) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
        .slice(0, 5);

      setStats({
        totalInvoices: invoices.length,
        totalAmount,
        paidAmount,
        unpaidAmount,
        overdueInvoices,
        recentInvoices,
      });
    } catch (error) {
      console.error('Error fetching client stats:', error);
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
    fetchClientStats();
  }, []);

  const handleRefresh = () => {
    fetchClientStats();
    notifications.show({
      title: 'Refreshed',
      message: 'Dashboard data has been updated',
      color: 'green',
    });
  };

  const handleDownloadInvoice = async (invoiceId: number) => {
    try {
      const response = await api.get(`/invoices/${invoiceId}/pdf`, {
        responseType: 'blob',
      });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(response.data);
      link.download = `invoice-${invoiceId}.pdf`;
      link.click();

      notifications.show({
        title: 'Download Started',
        message: 'Invoice PDF is being downloaded',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Download Failed',
        message: 'Failed to download invoice PDF',
        color: 'red',
      });
    }
  };

  const getPaymentProgress = () => {
    if (stats.totalAmount === 0) return 0;
    return (stats.paidAmount / stats.totalAmount) * 100;
  };

  const StatCard = ({ icon, title, value, color, description }: any) => (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between">
        <div>
          <Text c="dimmed" size="sm" tt="uppercase" fw={700}>
            {title}
          </Text>
          <Text fw={700} size="xl" mb={description ? 'xs' : 0}>
            {value}
          </Text>
          {description && (
            <Text size="sm" c="dimmed">
              {description}
            </Text>
          )}
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
        <div>
          <Title order={1}>Client Dashboard</Title>
          <Text c="dimmed">Welcome back, {user?.username}!</Text>
        </div>
        <ActionIcon variant="light" color="blue" size="lg" onClick={handleRefresh}>
          <IconRefresh size={18} />
        </ActionIcon>
      </Group>

      {/* Statistics Cards */}
      <Grid mb="xl">
        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <StatCard
            icon={<IconFileInvoice size={24} />}
            title="Total Invoices"
            value={stats.totalInvoices}
            color="blue"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <StatCard
            icon={<IconCurrencyDollar size={24} />}
            title="Total Amount"
            value={formatCurrency(stats.totalAmount)}
            color="violet"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <StatCard
            icon={<IconChartBar size={24} />}
            title="Amount Paid"
            value={formatCurrency(stats.paidAmount)}
            color="green"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
          <StatCard
            icon={<IconClock size={24} />}
            title="Overdue"
            value={stats.overdueInvoices}
            color="red"
            description={stats.overdueInvoices > 0 ? 'Requires attention' : 'All up to date'}
          />
        </Grid.Col>
      </Grid>

      {/* Payment Progress */}
      <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
        <Group justify="space-between" mb="md">
          <Title order={3}>Payment Progress</Title>
          <Badge color={getPaymentProgress() === 100 ? 'green' : 'orange'} size="lg">
            {getPaymentProgress().toFixed(1)}% Paid
          </Badge>
        </Group>
        <Progress
          value={getPaymentProgress()}
          color={getPaymentProgress() === 100 ? 'green' : 'blue'}
          size="lg"
          radius="md"
          mb="md"
        />
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Paid: {formatCurrency(stats.paidAmount)}
          </Text>
          <Text size="sm" c="dimmed">
            Outstanding: {formatCurrency(stats.unpaidAmount)}
          </Text>
        </Group>
      </Card>

      {/* Recent Invoices */}
      <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
        <Group justify="space-between" mb="md">
          <Title order={3}>Recent Invoices</Title>
        </Group>
        <Stack gap="sm">
          {stats.recentInvoices.length === 0 ? (
            <Text c="dimmed" ta="center" py="md">
              No invoices found
            </Text>
          ) : (
            stats.recentInvoices.map((invoice: any) => (
              <Group
                key={invoice.id}
                justify="space-between"
                p="md"
                style={{ border: '1px solid #e9ecef', borderRadius: '8px' }}
              >
                <div>
                  <Text fw={600}>{invoice.invoiceNo}</Text>
                  <Text size="sm" c="dimmed">
                    Due: {new Date(invoice.dueDate).toLocaleDateString()}
                  </Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Text fw={600}>{formatCurrency(invoice.total)}</Text>
                  <Badge
                    color={
                      invoice.status === 'paid'
                        ? 'green'
                        : invoice.status === 'partially_paid'
                          ? 'yellow'
                          : new Date(invoice.dueDate) < new Date()
                            ? 'red'
                            : 'blue'
                    }
                    size="sm"
                  >
                    {invoice.status === 'paid'
                      ? 'Paid'
                      : invoice.status === 'partially_paid'
                        ? 'Partial'
                        : new Date(invoice.dueDate) < new Date()
                          ? 'Overdue'
                          : 'Pending'}
                  </Badge>
                </div>
                <Button
                  size="xs"
                  variant="light"
                  leftSection={<IconDownload size={14} />}
                  onClick={() => handleDownloadInvoice(invoice.id)}
                >
                  Download
                </Button>
              </Group>
            ))
          )}
        </Stack>
      </Card>

      {/* All Invoices */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Title order={3}>All My Invoices</Title>
        </Group>
        <InvoiceList />
      </Card>
    </Container>
  );
};

export default ClientDashboard;
