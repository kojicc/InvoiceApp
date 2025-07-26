// frontend/components/ClientList.tsx
import React, { useEffect, useState } from 'react';
import { IconEdit, IconSearch, IconTrash } from '@tabler/icons-react';
import {
  ActionIcon,
  Button,
  Card,
  Group,
  Modal,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import api from '../lib/axios';
import { useInvoiceStore } from '../state/useInvoiceStore';
import ClientForm from './ClientForm';

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
  const { clients, setClients } = useInvoiceStore();
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch clients when the component mounts
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data } = await api.get('/api/clients');
        setClients(data);
      } catch (error) {
        console.error('Error fetching clients:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to fetch clients',
          color: 'red',
        });
      }
    };
    fetchClients();
  }, [setClients]);

  // Filter clients based on search term
  useEffect(() => {
    let filtered = [...clients];

    if (searchTerm) {
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredClients(filtered);
  }, [clients, searchTerm]);

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = async () => {
    setIsEditModalOpen(false);
    setEditingClient(null);
    // Refresh the client list
    try {
      const { data } = await api.get('/api/clients');
      setClients(data);
    } catch (error) {
      console.error('Error refreshing clients:', error);
    }

    if (onRefresh) {
      onRefresh();
    }
  };

  const handleDelete = async (clientId: number, clientName: string) => {
    if (!window.confirm(`Are you sure you want to delete client "${clientName}"?`)) {
      return;
    }

    try {
      await api.delete(`/clients/${clientId}`);
      setClients(clients.filter((client) => client.id !== clientId));
      notifications.show({
        title: 'Success',
        message: 'Client deleted successfully',
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
  };

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
              {filteredClients.map((client: Client) => (
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
