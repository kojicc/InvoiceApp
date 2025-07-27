import { Button, Group, useMantineColorScheme } from '@mantine/core';

export function ColorSchemeToggle() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  return (
    <Group justify="center" mt="xl">
      <Button
        variant={colorScheme === 'light' ? 'filled' : 'outline'}
        onClick={() => setColorScheme('light')}
      >
        Light
      </Button>
      <Button
        variant={colorScheme === 'dark' ? 'filled' : 'outline'}
        onClick={() => setColorScheme('dark')}
      >
        Dark
      </Button>
      <Button
        variant={colorScheme === 'auto' ? 'filled' : 'outline'}
        onClick={() => setColorScheme('auto')}
      >
        Auto
      </Button>
    </Group>
  );
}
