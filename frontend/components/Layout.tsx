import { useState } from 'react';
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
import { useAuthStore } from '../state/useAuthStore';
import classes from './Layout.module.css';

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
  const [opened, setOpened] = useState(false);
  const { user, logout } = useAuthStore();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const router = useRouter();

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
      navbar={{ width: 280, breakpoint: 'md', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={() => setOpened(!opened)} hiddenFrom="md" size="sm" />
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
                      src={user?.avatarUrl ? `http://localhost:4000${user.avatarUrl}` : undefined}
                    >
                      {user?.username?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <div className={classes.userInfo}>
                      <Text size="sm" fw={500}>
                        {user?.username}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {user?.role}
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
