// frontend/components/ClientList.tsx
import React, { useEffect } from 'react';
import { Button, Group, Table } from '@mantine/core';
import api from '../lib/axios';
import { useInvoiceStore } from '../state/useInvoiceStore';

interface Client {
  id: number;
  name: string;
  contact: string;
}
const ClientList = () => {
  const { clients, setClients } = useInvoiceStore();

  // Fetch clients when the component mounts
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data } = await api.get('/clients');
        setClients(data);
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };
    fetchClients();
  }, [setClients]);

  const handleDelete = async (clientId: number) => {
    try {
      await api.delete(`/clients/${clientId}`);
      setClients(clients.filter((client) => client.id !== clientId));
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  return (
    <div>
      <Table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Contact</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client: Client) => (
            <tr key={client.id}>
              <td>{client.name}</td>
              <td>{client.contact}</td>
              <td>
                <Group gap="xs">
                  <Button variant="light" color="blue">
                    Edit
                  </Button>
                  <Button variant="light" color="red" onClick={() => handleDelete(client.id)}>
                    Delete
                  </Button>
                </Group>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default ClientList;
