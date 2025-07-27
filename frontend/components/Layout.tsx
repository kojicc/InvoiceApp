import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  IconChevronDown,
  IconFileInvoice,
  IconHome,
  IconLogout,
  IconMoon,
  IconSettings,
  IconSun,
  IconUsers,
} from '@tabler/icons-react';
import useSWR from 'swr';
import {
  ActionIcon,
  AppShell,
  Avatar,
  Burger,
  Container,
  Group,
  Menu,
  rem,
  Text,
  Title,
  UnstyledButton,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import api from '../lib/axios';
import { useAuthStore } from '../state/useAuthStore';
import classes from './Layout.module.css';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { label: 'Dashboard', icon: IconHome, href: '/', roles: ['admin', 'client'] },
  { label: 'Clients', icon: IconUsers, href: '/clients', roles: ['admin'] },
  { label: 'Invoices', icon: IconFileInvoice, href: '/invoices', roles: ['admin', 'client'] },
  { label: 'Settings', icon: IconSettings, href: '/settings', roles: ['admin', 'client'] },
];

export function Layout({ children }: LayoutProps) {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const { user, logout } = useAuthStore();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const router = useRouter();

  // Fetch fresh profile data to get updated avatar
  const { data: profile } = useSWR('/api/profile', fetcher);

  // Helper function to construct full avatar URL
  const getAvatarUrl = (avatarUrl: string | null | undefined) => {
    if (!avatarUrl) return null;
    if (avatarUrl.startsWith('http')) return avatarUrl;
    return `http://localhost:4000${avatarUrl}`;
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Filter navigation items based on user role
  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user?.role || 'client')
  );

  const navItems = filteredNavigation.map((item) => (
    <Link key={item.label} href={item.href} className={classes.navLink}>
      <UnstyledButton
        className={`${classes.navButton} ${router.pathname === item.href ? classes.active : ''}`}
      >
        <Group gap="sm">
          <item.icon size={20} />
          <Text size="sm" fw={500}>
            {item.label}
          </Text>
        </Group>
      </UnstyledButton>
    </Link>
  ));

  return (
    <AppShell
      header={{ height: 70 }}
      navbar={{
        width: 280,
        breakpoint: 'md',
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="md" size="sm" />
            <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="md" size="sm" />
            <Title order={3} c="indigo">
              Invoice Manager
            </Title>
          </Group>

          <Group gap="sm">
            <ActionIcon variant="light" size="lg" onClick={() => toggleColorScheme()}>
              {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
            </ActionIcon>

            <Menu shadow="md" width={200}>
              <Menu.Target>
                <UnstyledButton className={classes.userButton}>
                  <Group gap="sm">
                    <Avatar
                      size="sm"
                      color="indigo"
                      src={getAvatarUrl(profile?.avatarUrl || user?.avatarUrl)}
                    >
                      {(profile?.username || user?.username)?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <div className={classes.userInfo}>
                      <Text size="sm" fw={500}>
                        {profile?.username || user?.username}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {profile?.role || user?.role}
                      </Text>
                    </div>
                    <IconChevronDown size={14} />
                  </Group>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconSettings style={{ width: rem(14), height: rem(14) }} />}
                  onClick={() => router.push('/settings')}
                >
                  Settings
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconLogout style={{ width: rem(14), height: rem(14) }} />}
                  color="red"
                  onClick={handleLogout}
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <div className={classes.navSection}>
          <Text size="xs" fw={500} c="dimmed" tt="uppercase" mb="md">
            Navigation
          </Text>
          {navItems}
        </div>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="xl">{children}</Container>
      </AppShell.Main>
    </AppShell>
  );
}
