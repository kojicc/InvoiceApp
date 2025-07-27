import React, { useEffect, useState } from 'react';
import { mutate } from 'swr';
import { Button, Card, Group, Stack, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import api from '../lib/axios';

interface ClientFormProps {
  onSuccess?: () => void;
  editingClient?: {
    id: number;
    name: string;
    contact: string;
    address: string;
    email?: string;
  } | null;
}

const ClientForm: React.FC<ClientFormProps> = ({ onSuccess, editingClient }) => {
  const [clientData, setClientData] = useState({
    name: '',
    contact: '',
    address: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingClient) {
      setClientData({
        name: editingClient.name,
        contact: editingClient.contact,
        address: editingClient.address,
        email: editingClient.email || '',
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

    if (!clientData.email.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Email address is required',
        color: 'red',
      });
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientData.email)) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please enter a valid email address',
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
        const response = await api.post('/api/clients', clientData);
        const responseData = response.data;

        if (responseData.emailSent) {
          notifications.show({
            title: 'Client Created',
            message: `${clientData.name} has been created successfully! Verification email sent to ${clientData.email}.`,
            color: 'green',
          });
        } else {
          notifications.show({
            title: 'Client Created',
            message: `${clientData.name} has been created, but verification email failed to send. Please manually provide login instructions.`,
            color: 'yellow',
          });
        }
      }

      // Revalidate clients data using SWR mutate
      mutate('/api/clients');

      // Reset form
      setClientData({
        name: '',
        contact: '',
        address: '',
        email: '',
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
          label="Email Address"
          placeholder="client@example.com"
          value={clientData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          required
          description="An account will be created with this email. The client will receive verification instructions."
        />

        <TextInput
          label="Contact Information"
          placeholder="Phone number or additional contact info"
          value={clientData.contact}
          onChange={(e) => handleInputChange('contact', e.target.value)}
        />

        <TextInput
          label="Address"
          placeholder="Client address"
          value={clientData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
        />

        <Group justify="flex-end">
          <Button onClick={handleSubmit} size="md" loading={loading} disabled={loading}>
            {editingClient ? 'Update Client' : 'Create Client'}
          </Button>
        </Group>
      </Stack>
    </Card>
  );
};

export default ClientForm;
