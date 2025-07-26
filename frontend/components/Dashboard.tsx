import { useEffect, useState } from 'react';
import {
  IconAlertCircle,
  IconCurrencyDollar,
  IconFileInvoice,
  IconTrendingUp,
  IconUsers,
} from '@tabler/icons-react';
import {
  Alert,
  Badge,
  Card,
  Grid,
  Group,
  Loader,
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

      // Fetch dashboard statistics
      const [statsResponse, activityResponse] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/recent-activity'),
      ]);

      setStats(statsResponse.data);
      setRecentActivity(activityResponse.data);
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');

      // Fallback to mock data if API fails
      setStats({
        totalClients: 0,
        activeInvoices: 0,
        monthlyRevenue: 0,
        growthRate: 0,
        pendingInvoices: 0,
        newClientsThisMonth: 0,
      });
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Stack align="center" justify="center" h="400">
        <Loader size="lg" />
        <Text c="dimmed">Loading dashboard...</Text>
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
      title: 'Growth Rate',
      value: `${stats?.growthRate || 0}%`,
      icon: IconTrendingUp,
      color: 'teal',
      change: 'Year over year',
    },
  ];

  return (
    <Stack gap="xl">
      <div>
        <Title order={1} mb="xs">
          Welcome back, {user?.username}!
        </Title>
        <Text c="dimmed" size="lg">
          Here's what's happening with your business today.
        </Text>
      </div>

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
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder h="300">
            <Title order={3} mb="md">
              Recent Activity
            </Title>
            {recentActivity.length > 0 ? (
              <Stack gap="sm">
                {recentActivity.slice(0, 5).map((activity) => (
                  <Group key={activity.id} justify="space-between">
                    <div>
                      <Text size="sm" fw={500}>
                        {activity.description}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {new Date(activity.date).toLocaleDateString()}
                      </Text>
                    </div>
                    {activity.amount && (
                      <Text size="sm" c="green" fw={500}>
                        ${activity.amount.toLocaleString()}
                      </Text>
                    )}
                  </Group>
                ))}
              </Stack>
            ) : (
              <Text c="dimmed" ta="center" py="xl">
                No recent activity to display.
              </Text>
            )}
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder h="300">
            <Title order={3} mb="md">
              Quick Actions
            </Title>
            <Stack gap="md">
              <Card
                withBorder
                p="sm"
                style={{ cursor: 'pointer' }}
                onClick={() => (window.location.href = '/invoices')}
              >
                <Group>
                  <ThemeIcon variant="light" color="blue">
                    <IconFileInvoice size={16} />
                  </ThemeIcon>
                  <div>
                    <Text size="sm" fw={500}>
                      Create New Invoice
                    </Text>
                    <Text size="xs" c="dimmed">
                      Generate a new invoice for your clients
                    </Text>
                  </div>
                </Group>
              </Card>
              <Card
                withBorder
                p="sm"
                style={{ cursor: 'pointer' }}
                onClick={() => (window.location.href = '/clients')}
              >
                <Group>
                  <ThemeIcon variant="light" color="green">
                    <IconUsers size={16} />
                  </ThemeIcon>
                  <div>
                    <Text size="sm" fw={500}>
                      Add New Client
                    </Text>
                    <Text size="xs" c="dimmed">
                      Add a new client to your database
                    </Text>
                  </div>
                </Group>
              </Card>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
