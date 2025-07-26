import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { IconFilter, IconSearch } from '@tabler/icons-react';
import {
  Badge,
  Card,
  Container,
  Group,
  LoadingOverlay,
  Pagination,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import api from '../lib/axios';

interface AuditLog {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  userId?: number;
  changes?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

interface AuditLogsProps {
  onClose?: () => void;
}

const AuditLogs: React.FC<AuditLogsProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 1,
  });
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
  });

  const fetchAuditLogs = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.action) params.append('action', filters.action);
      if (filters.entityType) params.append('entityType', filters.entityType);

      const response = await api.get(`/audit?${params}`);
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load audit logs',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [filters]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
    fetchAuditLogs(page);
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

  const getEntityColor = (entityType: string) => {
    switch (entityType) {
      case 'invoice':
        return 'blue';
      case 'client':
        return 'violet';
      case 'payment':
        return 'green';
      default:
        return 'gray';
    }
  };

  const formatChanges = (changes: string | null) => {
    if (!changes) return 'N/A';

    try {
      const parsed = JSON.parse(changes);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return changes;
    }
  };

  return (
    <Container size="xl" py="md">
      <LoadingOverlay visible={loading} overlayProps={{ radius: 'sm', blur: 2 }} />

      <Stack gap="md">
        <Group justify="space-between">
          <Title order={2}>Audit Logs</Title>
          <Text c="dimmed" size="sm">
            Total: {pagination.total} entries
          </Text>
        </Group>

        {/* Filters */}
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group gap="md">
            <Select
              placeholder="Filter by Action"
              value={filters.action}
              onChange={(value) => setFilters((prev) => ({ ...prev, action: value || '' }))}
              data={[
                { value: '', label: 'All Actions' },
                { value: 'create', label: 'Create' },
                { value: 'update', label: 'Update' },
                { value: 'delete', label: 'Delete' },
              ]}
              leftSection={<IconFilter size={16} />}
              clearable
            />
            <Select
              placeholder="Filter by Entity"
              value={filters.entityType}
              onChange={(value) => setFilters((prev) => ({ ...prev, entityType: value || '' }))}
              data={[
                { value: '', label: 'All Entities' },
                { value: 'invoice', label: 'Invoice' },
                { value: 'client', label: 'Client' },
                { value: 'payment', label: 'Payment' },
              ]}
              leftSection={<IconFilter size={16} />}
              clearable
            />
          </Group>
        </Card>

        {/* Audit Logs Table */}
        <Card shadow="sm" padding="md" radius="md" withBorder>
          {logs.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              No audit logs found
            </Text>
          ) : (
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Timestamp</Table.Th>
                  <Table.Th>Action</Table.Th>
                  <Table.Th>Entity</Table.Th>
                  <Table.Th>Entity ID</Table.Th>
                  <Table.Th>User ID</Table.Th>
                  <Table.Th>IP Address</Table.Th>
                  <Table.Th>Changes</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {logs.map((log) => (
                  <Table.Tr key={log.id}>
                    <Table.Td>
                      <Text size="sm">{dayjs(log.timestamp).format('MMM DD, YYYY HH:mm:ss')}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getActionColor(log.action)} size="sm">
                        {log.action.toUpperCase()}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getEntityColor(log.entityType)} size="sm" variant="light">
                        {log.entityType}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{log.entityId}</Table.Td>
                    <Table.Td>{log.userId || 'System'}</Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {log.ipAddress || 'N/A'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text
                        size="xs"
                        c="dimmed"
                        style={{
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={formatChanges(log.changes || null)}
                      >
                        {log.changes ? 'View changes' : 'No changes'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Card>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <Group justify="center">
            <Pagination
              value={pagination.page}
              onChange={handlePageChange}
              total={pagination.pages}
              size="sm"
            />
          </Group>
        )}
      </Stack>
    </Container>
  );
};

export default AuditLogs;
