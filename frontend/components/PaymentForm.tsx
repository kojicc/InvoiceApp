import React, { useEffect, useState } from 'react';
import { mutate } from 'swr';
import { Button, Card, Group, NumberInput, Select, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import api from '../lib/axios';

interface PaymentFormProps {
  invoiceId: number;
  remainingBalance: number;
  onSuccess?: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ invoiceId, remainingBalance, onSuccess }) => {
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    method: 'cash',
    notes: '',
  });

  const handleInputChange = (field: string, value: any) => {
    setPaymentData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (paymentData.amount <= 0) {
      notifications.show({
        title: 'Validation Error',
        message: 'Payment amount must be greater than 0',
        color: 'red',
      });
      return false;
    }

    if (paymentData.amount > remainingBalance) {
      notifications.show({
        title: 'Validation Error',
        message: 'Payment amount cannot exceed remaining balance',
        color: 'red',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await api.post('/api/payments', {
        ...paymentData,
        invoiceId,
      });

      // Revalidate related data using SWR mutate
      mutate('/api/invoices');
      mutate(`/api/payments/invoice/${invoiceId}`);

      notifications.show({
        title: 'Success',
        message: 'Payment added successfully!',
        color: 'green',
      });

      // Reset form
      setPaymentData({
        amount: 0,
        method: 'cash',
        notes: '',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error adding payment', error);
      const message = error.response?.data?.message || 'Failed to add payment. Please try again.';
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    }
  };

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Credit/Debit Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'check', label: 'Check' },
  ];

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Remaining Balance: ${remainingBalance.toFixed(2)}
        </Text>

        <NumberInput
          label="Payment Amount"
          placeholder="0.00"
          min={0.01}
          max={remainingBalance}
          decimalScale={2}
          prefix="$"
          value={paymentData.amount}
          onChange={(value) => handleInputChange('amount', value || 0)}
          required
        />

        <Select
          label="Payment Method"
          value={paymentData.method}
          onChange={(value) => handleInputChange('method', value || 'cash')}
          data={paymentMethods}
          required
        />

        <TextInput
          label="Notes (Optional)"
          placeholder="Additional payment details"
          value={paymentData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
        />

        <Group justify="flex-end">
          <Button onClick={handleSubmit} size="md">
            Add Payment
          </Button>
        </Group>
      </Stack>
    </Card>
  );
};

export default PaymentForm;
