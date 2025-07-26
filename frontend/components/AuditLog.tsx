import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { IconHistory, IconRefresh } from '@tabler/icons-react';
import { Badge, Button, Card, Group, Pagination, Select, Stack, Table, Text } from '@mantine/core';

interface AuditLog {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  userId?: number;
  changes?: any;
  timestamp: string;
  ipAddress?: string;
}

const AuditLog: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    entityType: '',
    action: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Mock data for now - replace with API call when backend is ready
  const mockLogs: AuditLog[] = [
    {
      id: 1,
      action: 'create',
      entityType: 'invoice',
      entityId: 1,
      userId: 1,
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      changes: { invoiceNo: 'INV-001', total: 1000 },
      ipAddress: '192.168.1.100',
    },
    {
      id: 2,
      action: 'update',
      entityType: 'client',
      entityId: 1,
      userId: 1,
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      changes: { name: { from: 'John Doe', to: 'John Smith' } },
      ipAddress: '192.168.1.100',
    },
    {
      id: 3,
      action: 'create',
      entityType: 'payment',
      entityId: 1,
      userId: 1,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      changes: { amount: 500, method: 'card' },
      ipAddress: '192.168.1.100',
    },
    {
      id: 4,
      action: 'update',
      entityType: 'invoice',
      entityId: 1,
      userId: 1,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      changes: { status: { from: 'unpaid', to: 'paid' } },
      ipAddress: '192.168.1.100',
    },
    {
      id: 5,
      action: 'delete',
      entityType: 'client',
      entityId: 2,
      userId: 1,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      changes: { deletedData: { name: 'Old Client', contact: 'old@example.com' } },
      ipAddress: '192.168.1.100',
    },
  ];

  useEffect(() => {
    loadLogs();
  }, [filters, currentPage]);

  const loadLogs = async () => {
    setLoading(true);
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    let filteredLogs = [...mockLogs];

    if (filters.entityType) {
      filteredLogs = filteredLogs.filter((log) => log.entityType === filters.entityType);
    }

    if (filters.action) {
      filteredLogs = filteredLogs.filter((log) => log.action === filters.action);
    }

    // Simulate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

    setLogs(paginatedLogs);
    setLoading(false);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'green';
      case 'update':
        return 'blue';
      case 'delete':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getEntityTypeColor = (entityType: string) => {
    switch (entityType) {
      case 'invoice':
        return 'blue';
      case 'client':
        return 'teal';
      case 'payment':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const formatChanges = (changes: any) => {
    if (!changes) return 'No details';

    if (typeof changes === 'object') {
      return Object.entries(changes)
        .map(([key, value]: [string, any]) => {
          if (value && typeof value === 'object' && value.from && value.to) {
            return `${key}: ${value.from} → ${value.to}`;
          }
          return `${key}: ${JSON.stringify(value)}`;
        })
        .join(', ');
    }

    return JSON.stringify(changes);
  };

  const totalPages = Math.ceil(mockLogs.length / itemsPerPage);

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Group>
            <IconHistory size={20} />
            <Text fw={500} size="lg">
              Audit Log
            </Text>
          </Group>
          <Button
            leftSection={<IconRefresh size={16} />}
            variant="light"
            onClick={loadLogs}
            loading={loading}
          >
            Refresh
          </Button>
        </Group>

        <Group>
          <Select
            placeholder="Filter by entity type"
            value={filters.entityType}
            onChange={(value) => setFilters((prev) => ({ ...prev, entityType: value || '' }))}
            data={[
              { value: '', label: 'All Types' },
              { value: 'invoice', label: 'Invoices' },
              { value: 'client', label: 'Clients' },
              { value: 'payment', label: 'Payments' },
            ]}
            style={{ width: 200 }}
          />
          <Select
            placeholder="Filter by action"
            value={filters.action}
            onChange={(value) => setFilters((prev) => ({ ...prev, action: value || '' }))}
            data={[
              { value: '', label: 'All Actions' },
              { value: 'create', label: 'Create' },
              { value: 'update', label: 'Update' },
              { value: 'delete', label: 'Delete' },
            ]}
            style={{ width: 150 }}
          />
        </Group>

        <Text size="sm" c="dimmed">
          Note: This is showing mock data. In production, this would display actual audit logs from
          the database.
        </Text>

        {loading ? (
          <Text ta="center" py="xl">
            Loading audit logs...
          </Text>
        ) : logs.length === 0 ? (
          <Text ta="center" py="xl" c="dimmed">
            No audit logs found for the selected filters.
          </Text>
        ) : (
          <>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Timestamp</Table.Th>
                  <Table.Th>Action</Table.Th>
                  <Table.Th>Entity</Table.Th>
                  <Table.Th>Entity ID</Table.Th>
                  <Table.Th>Changes</Table.Th>
                  <Table.Th>IP Address</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {logs.map((log) => (
                  <Table.Tr key={log.id}>
                    <Table.Td>{dayjs(log.timestamp).format('MMM DD, YYYY HH:mm')}</Table.Td>
                    <Table.Td>
                      <Badge color={getActionColor(log.action)} variant="light">
                        {log.action.toUpperCase()}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getEntityTypeColor(log.entityType)} variant="light">
                        {log.entityType.toUpperCase()}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{log.entityId}</Table.Td>
                    <Table.Td>
                      <Text size="sm" style={{ maxWidth: 300, wordBreak: 'break-word' }}>
                        {formatChanges(log.changes)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {log.ipAddress || 'N/A'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            {totalPages > 1 && (
              <Group justify="center">
                <Pagination value={currentPage} onChange={setCurrentPage} total={totalPages} />
              </Group>
            )}
          </>
        )}
      </Stack>
    </Card>
  );
};

export default AuditLog;
