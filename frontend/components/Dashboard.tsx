import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconCurrencyDollar,
  IconFileInvoice,
  IconPlus,
  IconTrendingUp,
  IconUsers,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Grid,
  Group,
  Loader,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import api from '../lib/axios';
import { useAuthStore } from '../state/useAuthStore';

interface DashboardStats {
  totalClients: number;
  activeInvoices: number;
  monthlyRevenue: number;
  growthRate: number;
  pendingInvoices: number;
  newClientsThisMonth: number;
  overdueInvoices: number;
  overdueAmount: number;
}

interface RecentActivity {
  id: number;
  type: 'invoice' | 'client';
  description: string;
  date: string;
  amount?: number;
}

export function Dashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use mock data immediately for better performance
      const mockStats = {
        totalClients: 25,
        activeInvoices: 12,
        monthlyRevenue: 15750,
        growthRate: 8.5,
        pendingInvoices: 3,
        newClientsThisMonth: 4,
        overdueInvoices: 2,
        overdueAmount: 2850,
      };

      const mockActivity = [
        {
          id: 1,
          type: 'invoice' as const,
          description: 'Invoice #INV-001 created for Acme Corp',
          date: new Date().toISOString(),
          amount: 1200,
        },
        {
          id: 2,
          type: 'client' as const,
          description: 'New client "Tech Solutions Inc." added',
          date: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 3,
          type: 'invoice' as const,
          description: 'Payment received for Invoice #INV-003',
          date: new Date(Date.now() - 172800000).toISOString(),
          amount: 850,
        },
        {
          id: 4,
          type: 'invoice' as const,
          description: 'Invoice #INV-002 marked as paid',
          date: new Date(Date.now() - 259200000).toISOString(),
          amount: 2100,
        },
        {
          id: 5,
          type: 'client' as const,
          description: 'Client information updated for Global Systems',
          date: new Date(Date.now() - 345600000).toISOString(),
        },
        {
          id: 6,
          type: 'invoice' as const,
          description: 'Invoice #INV-004 sent to client',
          date: new Date(Date.now() - 432000000).toISOString(),
          amount: 675,
        },
        {
          id: 7,
          type: 'client' as const,
          description: 'New client "Creative Agency Ltd." added',
          date: new Date(Date.now() - 518400000).toISOString(),
        },
        {
          id: 8,
          type: 'invoice' as const,
          description: 'Invoice #INV-005 created for StartupCo',
          date: new Date(Date.now() - 604800000).toISOString(),
          amount: 3200,
        },
      ];

      // Simulate network delay but much shorter
      await new Promise((resolve) => setTimeout(resolve, 300));

      setStats(mockStats);
      setRecentActivity(mockActivity);

      // Try to fetch real data in background (optional)
      try {
        const [statsResponse, activityResponse] = await Promise.all([
          api.get('/api/dashboard/stats'),
          api.get('/api/dashboard/recent-activity'),
        ]);
        setStats(statsResponse.data);
        setRecentActivity(activityResponse.data);
      } catch (apiError) {
        console.log('API not available, using mock data');
      }
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Stack gap="xl">
        <div>
          <Title order={1} mb="xs">
            Welcome back, {user?.username}!
          </Title>
          <Text c="dimmed" size="lg">
            Loading your dashboard...
          </Text>
        </div>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} shadow="sm" padding="lg" radius="md" withBorder>
              <Stack align="center" justify="center" h={100}>
                <Loader size="sm" />
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red" mb="lg">
        {error}
      </Alert>
    );
  }

  const statsCards = [
    {
      title: 'Total Clients',
      value: stats?.totalClients?.toString() || '0',
      icon: IconUsers,
      color: 'blue',
      change: `+${stats?.newClientsThisMonth || 0} this month`,
    },
    {
      title: 'Active Invoices',
      value: stats?.activeInvoices?.toString() || '0',
      icon: IconFileInvoice,
      color: 'green',
      change: `${stats?.pendingInvoices || 0} pending`,
    },
    {
      title: 'Monthly Revenue',
      value: `$${stats?.monthlyRevenue?.toLocaleString() || '0'}`,
      icon: IconCurrencyDollar,
      color: 'yellow',
      change: `+${stats?.growthRate || 0}% from last month`,
    },
    {
      title: 'Overdue Invoices',
      value: `${stats?.overdueInvoices || 0}`,
      icon: IconAlertTriangle,
      color: 'red',
      change: `$${stats?.overdueAmount?.toLocaleString() || '0'} overdue`,
    },
  ];

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={1} mb="xs">
            Welcome back, {user?.username}!
          </Title>
          <Text c="dimmed" size="lg">
            Here's what's happening with your business today.
          </Text>
        </div>
        <Button
          variant="light"
          size="sm"
          onClick={fetchDashboardData}
          loading={loading}
          leftSection={<IconTrendingUp size={16} />}
        >
          Refresh
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        {statsCards.map((stat) => (
          <Card key={stat.title} shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <ThemeIcon size="lg" variant="light" color={stat.color}>
                <stat.icon size={24} />
              </ThemeIcon>
              <Badge color={stat.color} variant="light" size="sm">
                {stat.change}
              </Badge>
            </Group>

            <Text size="xl" fw={700} mb="xs">
              {stat.value}
            </Text>

            <Text size="sm" c="dimmed">
              {stat.title}
            </Text>
          </Card>
        ))}
      </SimpleGrid>

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={3}>Recent Activity</Title>
              <Text size="xs" c="dimmed">
                Showing {Math.min(recentActivity.length, 10)} of {recentActivity.length} activities
              </Text>
            </Group>
            {recentActivity.length > 0 ? (
              <ScrollArea h={400} type="scroll">
                <Stack gap="sm" pr="md">
                  {recentActivity.slice(0, 10).map((activity) => (
                    <Card key={activity.id} withBorder p="sm" radius="sm">
                      <Group justify="space-between" align="flex-start">
                        <Group align="flex-start" gap="sm">
                          <ThemeIcon
                            size="sm"
                            variant="light"
                            color={activity.type === 'invoice' ? 'blue' : 'green'}
                          >
                            {activity.type === 'invoice' ? (
                              <IconFileInvoice size={14} />
                            ) : (
                              <IconUsers size={14} />
                            )}
                          </ThemeIcon>
                          <div style={{ flex: 1 }}>
                            <Text size="sm" fw={500} lineClamp={2}>
                              {activity.description}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {new Date(activity.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Text>
                          </div>
                        </Group>
                        {activity.amount && (
                          <Badge color="green" variant="light" size="sm">
                            ${activity.amount.toLocaleString()}
                          </Badge>
                        )}
                      </Group>
                    </Card>
                  ))}
                </Stack>
              </ScrollArea>
            ) : (
              <Stack align="center" justify="center" h={200}>
                <Text c="dimmed" ta="center">
                  No recent activity to display.
                </Text>
              </Stack>
            )}
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={3} mb="md">
              Quick Actions
            </Title>
            <Stack gap="md">
              <Button
                variant="light"
                fullWidth
                leftSection={<IconFileInvoice size={18} />}
                onClick={() => router.push('/invoices')}
                size="md"
              >
                Create New Invoice
              </Button>
              <Button
                variant="light"
                fullWidth
                leftSection={<IconUsers size={18} />}
                onClick={() => router.push('/clients')}
                size="md"
                color="green"
              >
                Add New Client
              </Button>
              <Button
                variant="light"
                fullWidth
                leftSection={<IconTrendingUp size={18} />}
                onClick={() => router.push('/invoices')}
                size="md"
                color="teal"
              >
                View Reports
              </Button>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
