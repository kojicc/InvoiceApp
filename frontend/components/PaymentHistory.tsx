import dayjs from 'dayjs';
import React from 'react';
import { IconTrash } from '@tabler/icons-react';
import useSWR, { mutate } from 'swr';
import { ActionIcon, Badge, Card, Group, Stack, Table, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import api from '../lib/axios';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

interface Payment {
  id: number;
  amount: number;
  method: string;
  notes?: string;
  paidDate: string;
}

interface PaymentHistoryProps {
  invoiceId: number;
  onPaymentChange?: () => void;
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ invoiceId, onPaymentChange }) => {
  const {
    data: payments = [],
    error,
    isLoading,
  } = useSWR(`/api/payments/invoice/${invoiceId}`, fetcher);

  const handleDeletePayment = async (paymentId: number, paymentAmount: number) => {
    modals.openConfirmModal({
      title: 'Delete Payment',
      children: (
        <Text size="sm">
          Are you sure you want to delete this payment of{' '}
          <strong>${paymentAmount.toFixed(2)}</strong>?
          <br />
          <Text size="xs" c="dimmed" mt="xs">
            This action cannot be undone and will affect the invoice status.
          </Text>
        </Text>
      ),
      labels: { confirm: 'Delete Payment', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await api.delete(`/api/payments/${paymentId}`);

          // Revalidate related data using SWR mutate
          await mutate(`/api/payments/invoice/${invoiceId}`);
          await mutate('/api/invoices');

          notifications.show({
            title: 'Success',
            message: 'Payment deleted successfully',
            color: 'green',
          });

          if (onPaymentChange) {
            onPaymentChange();
          }
        } catch (error: any) {
          console.error('Error deleting payment:', error);
          const message = error.response?.data?.message || 'Failed to delete payment';
          notifications.show({
            title: 'Error',
            message,
            color: 'red',
          });
        }
      },
    });
  };

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case 'cash':
        return 'green';
      case 'card':
        return 'blue';
      case 'bank_transfer':
        return 'purple';
      case 'check':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const formatMethod = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Cash';
      case 'card':
        return 'Card';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'check':
        return 'Check';
      default:
        return method;
    }
  };

  if (isLoading) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text c="dimmed" ta="center" py="xl">
          Loading payment history...
        </Text>
      </Card>
    );
  }

  if (error) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text c="red" ta="center" py="xl">
          Failed to load payment history
        </Text>
      </Card>
    );
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Text fw={500} size="lg">
            Payment History
          </Text>
          <Text size="sm" c="dimmed">
            {payments.length} payment{payments.length !== 1 ? 's' : ''}
          </Text>
        </Group>

        {payments.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            No payments recorded for this invoice.
          </Text>
        ) : (
          <Table.ScrollContainer minWidth={500}>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Amount</Table.Th>
                  <Table.Th>Method</Table.Th>
                  <Table.Th>Notes</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {payments.map((payment: Payment) => (
                  <Table.Tr key={payment.id}>
                    <Table.Td>{dayjs(payment.paidDate).format('MMM DD, YYYY')}</Table.Td>
                    <Table.Td>${payment.amount.toFixed(2)}</Table.Td>
                    <Table.Td>
                      <Badge color={getMethodBadgeColor(payment.method)} variant="light">
                        {formatMethod(payment.method)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{payment.notes || 'N/A'}</Table.Td>
                    <Table.Td>
                      <ActionIcon
                        variant="light"
                        color="red"
                        onClick={() => handleDeletePayment(payment.id, payment.amount)}
                        title="Delete Payment"
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}

        <Group justify="space-between">
          <Text fw={500}>
            Total Paid: ${payments.reduce((sum: number, p: Payment) => sum + p.amount, 0).toFixed(2)}
          </Text>
        </Group>
      </Stack>
    </Card>
  );
};

export default PaymentHistory;
