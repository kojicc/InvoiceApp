import React, { useEffect, useState } from 'react';
import { Button, Card, Group, Stack, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { mutate } from 'swr';
import api from '../lib/axios';

interface ClientFormProps {
  onSuccess?: () => void;
  editingClient?: {
    id: number;
    name: string;
    contact: string;
    address: string;
  } | null;
}

const ClientForm: React.FC<ClientFormProps> = ({ onSuccess, editingClient }) => {
  const [clientData, setClientData] = useState({
    name: '',
    contact: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingClient) {
      setClientData({
        name: editingClient.name,
        contact: editingClient.contact,
        address: editingClient.address,
      });
    }
  }, [editingClient]);

  const handleInputChange = (field: string, value: string) => {
    setClientData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!clientData.name.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Client name is required',
        color: 'red',
      });
      return false;
    }

    if (!clientData.contact.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Contact information is required',
        color: 'red',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (editingClient) {
        // Update existing client
        await api.put(`/api/clients/${editingClient.id}`, clientData);
        notifications.show({
          title: 'Success',
          message: 'Client updated successfully!',
          color: 'green',
        });
      } else {
        // Create new client
        await api.post('/api/clients', clientData);
        notifications.show({
          title: 'Success',
          message: 'Client created successfully!',
          color: 'green',
        });
      }

      // Revalidate clients data using SWR mutate
      mutate('/api/clients');

      // Reset form
      setClientData({
        name: '',
        contact: '',
        address: '',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error saving client', error);
      const message = error.response?.data?.message || 'Failed to save client. Please try again.';
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <TextInput
          label="Client Name"
          placeholder="Enter client name"
          value={clientData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          required
        />

        <TextInput
          label="Contact Information"
          placeholder="Email or phone number"
          value={clientData.contact}
          onChange={(e) => handleInputChange('contact', e.target.value)}
          required
        />

        <TextInput
          label="Address"
          placeholder="Client address"
          value={clientData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
        />

        <Group justify="flex-end">
          <Button 
            onClick={handleSubmit} 
            size="md"
            loading={loading}
            disabled={loading}
          >
            {editingClient ? 'Update Client' : 'Create Client'}
          </Button>
        </Group>
      </Stack>
    </Card>
  );
};

export default ClientForm;
