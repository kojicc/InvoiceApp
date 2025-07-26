import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { IconEdit, IconSearch, IconTrash } from '@tabler/icons-react';
import {
  ActionIcon,
  Button,
  Card,
  Group,
  Modal,
  Pagination,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import useSWR, { mutate } from 'swr';
import api from '../lib/axios';
import { useInvoiceStore } from '../state/useInvoiceStore';
import ClientForm from './ClientForm';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

interface Client {
  id: number;
  name: string;
  contact: string;
  address: string;
}

interface ClientListProps {
  onRefresh?: () => void;
}

const ClientList: React.FC<ClientListProps> = ({ onRefresh }) => {
  const { data: clients = [], error, isLoading } = useSWR('/api/clients', fetcher);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Filter clients based on search term
  useEffect(() => {
    let filtered = [...clients];

    if (searchTerm) {
      filtered = filtered.filter(
        (client: Client) =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredClients(filtered);
  }, [clients, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedClients = filteredClients.slice(startIndex, endIndex);

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = async () => {
    setIsEditModalOpen(false);
    setEditingClient(null);
    // Revalidate clients data using SWR mutate
    mutate('/api/clients');

    if (onRefresh) {
      onRefresh();
    }
  };

  const handleDelete = async (clientId: number, clientName: string) => {
    modals.openConfirmModal({
      title: 'Delete Client',
      children: (
        <Text size="sm">
          Are you sure you want to delete client <strong>{clientName}</strong>?
          <br />
          <Text size="xs" c="dimmed" mt="xs">
            This action cannot be undone. All associated invoices and data will be affected.
          </Text>
        </Text>
      ),
      labels: { confirm: 'Delete Client', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await api.delete(`/api/clients/${clientId}`);
          // Revalidate clients data using SWR mutate
          mutate('/api/clients');
          notifications.show({
            title: 'Success',
            message: `Client "${clientName}" deleted successfully`,
            color: 'green',
          });
        } catch (error: any) {
          console.error('Error deleting client:', error);
          const message = error.response?.data?.message || 'Failed to delete client';
          notifications.show({
            title: 'Error',
            message,
            color: 'red',
          });
        }
      },
    });
  };

  if (isLoading) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text ta="center" py="xl">Loading clients...</Text>
      </Card>
    );
  }

  if (error) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text ta="center" py="xl" c="red">Error loading clients</Text>
      </Card>
    );
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <TextInput
          placeholder="Search clients..."
          leftSection={<IconSearch size={16} />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: 300 }}
        />

        {filteredClients.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            No clients found.
          </Text>
        ) : (
          <>
            <Table.ScrollContainer minWidth={600}>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Contact</Table.Th>
                    <Table.Th>Address</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedClients.map((client: Client) => (
                    <Table.Tr key={client.id}>
                      <Table.Td>{client.name}</Table.Td>
                      <Table.Td>{client.contact}</Table.Td>
                      <Table.Td>{client.address || 'N/A'}</Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            onClick={() => handleEdit(client)}
                            title="Edit Client"
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() => handleDelete(client.id, client.name)}
                            title="Delete Client"
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>

            {/* Pagination */}
            <Group justify="center" mt="md">
              <Pagination
                value={currentPage}
                onChange={setCurrentPage}
                total={totalPages}
                color="blue"
                size="sm"
              />
            </Group>
          </>
        )}

        <Modal
          opened={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Client"
          size="md"
        >
          <ClientForm editingClient={editingClient} onSuccess={handleEditSuccess} />
        </Modal>
      </Stack>
    </Card>
  );
};

export default ClientList;
