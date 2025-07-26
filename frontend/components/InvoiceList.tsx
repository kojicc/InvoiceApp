import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import {
  IconCurrencyDollar,
  IconDownload,
  IconEdit,
  IconEye,
  IconMail,
  IconSearch,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Modal,
  Progress,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import api from '../lib/axios';
import { useAuthStore } from '../state/useAuthStore';
import { useCurrencyStore } from '../state/useCurrencyStore';
import { useInvoiceStore } from '../state/useInvoiceStore';
import EmailInvoice from './EmailInvoice';
import PaymentForm from './PaymentForm';
import PaymentHistory from './PaymentHistory';

interface Client {
  id: number;
  name: string;
  contact: string;
  address: string;
}

interface Payment {
  id: number;
  amount: number;
  method: string;
  paidDate: string;
}

interface Invoice {
  id: number;
  invoiceNo: string;
  client: Client;
  total: number;
  paidAmount?: number;
  status: string;
  issueDate: string;
  dueDate: string;
  payments?: Payment[];
}

export function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const { currentCurrency, formatCurrency } = useCurrencyStore();
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('issueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const { data } = await api.get('/api/invoices');
        setInvoices(data);
      } catch (error) {
        console.error('Error fetching invoices:', error);
      }
    };
    fetchInvoices();
  }, [setInvoices]);

  useEffect(() => {
    let filtered = [...invoices];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.client.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Invoice];
      let bValue: any = b[sortBy as keyof Invoice];

      if (sortBy === 'client') {
        aValue = a.client.name;
        bValue = b.client.name;
      }

      if (sortBy === 'issueDate' || sortBy === 'dueDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, sortBy, sortOrder]);

  const handleStatusChange = async (invoiceId: number, newStatus: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return;

    modals.openConfirmModal({
      title: 'Confirm Status Change',
      children: (
        <Text size="sm">
          Are you sure you want to mark invoice #{invoice.invoiceNo} as {newStatus}?
          {newStatus === 'paid' && ' This action will update the payment status.'}
        </Text>
      ),
      labels: { confirm: 'Yes, update status', cancel: 'Cancel' },
      confirmProps: { color: newStatus === 'paid' ? 'green' : 'orange' },
      onConfirm: async () => {
        try {
          await api.patch(`/invoices/${invoiceId}/status`, { status: newStatus });
          const updatedInvoices = invoices.map((invoice) =>
            invoice.id === invoiceId ? { ...invoice, status: newStatus } : invoice
          );
          setInvoices(updatedInvoices);
          notifications.show({
            title: 'Success',
            message: `Invoice status updated to ${newStatus}`,
            color: 'green',
          });
        } catch (error) {
          console.error('Error updating invoice status:', error);
          notifications.show({
            title: 'Error',
            message: 'Failed to update invoice status',
            color: 'red',
          });
        }
      },
    });
  };

  const handleExport = async (invoiceId: number) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return;

    modals.openConfirmModal({
      title: 'Download Invoice PDF',
      children: (
        <Text size="sm">
          Download PDF for invoice #{invoice.invoiceNo}?
          <br />
          <Text size="xs" c="dimmed" mt="xs">
            The PDF will be generated and downloaded to your device.
          </Text>
        </Text>
      ),
      labels: { confirm: 'Download PDF', cancel: 'Cancel' },
      confirmProps: { color: 'blue' },
      onConfirm: async () => {
        try {
          notifications.show({
            id: `pdf-${invoiceId}`,
            title: 'Generating PDF...',
            message: 'Please wait while we generate your invoice PDF',
            color: 'blue',
            loading: true,
            autoClose: false,
          });

          const res = await api.get(`/invoices/${invoiceId}/pdf`, {
            responseType: 'blob',
            timeout: 30000, // 30 second timeout for PDF generation
          });

          const link = document.createElement('a');
          link.href = URL.createObjectURL(res.data);
          link.download = `invoice-${invoiceId}.pdf`;
          link.click();

          notifications.update({
            id: `pdf-${invoiceId}`,
            title: 'PDF Generated',
            message: 'Invoice PDF downloaded successfully',
            color: 'green',
            loading: false,
            autoClose: 3000,
          });
        } catch (error: any) {
          console.error('Error downloading PDF:', error);

          notifications.update({
            id: `pdf-${invoiceId}`,
            title: 'PDF Generation Failed',
            message:
              error.code === 'ECONNABORTED'
                ? 'PDF generation timed out. Generating mock PDF instead...'
                : 'Failed to generate PDF. Creating mock PDF...',
            color: 'orange',
            loading: false,
            autoClose: 3000,
          });

          // Generate mock PDF as fallback
          generateMockPDF(invoiceId);
        }
      },
    });
  };

  const generateMockPDF = (invoiceId: number) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 16 Tf
72 720 Td
(INVOICE #${invoice?.invoiceNo || invoiceId}) Tj
0 -30 Td
/F1 12 Tf
(Amount: ${formatCurrency(invoice?.total || 0)}) Tj
0 -20 Td
(Status: ${invoice?.status || 'unpaid'}) Tj
0 -20 Td
(Due Date: ${invoice?.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}) Tj
0 -30 Td
(Generated on: ${new Date().toLocaleDateString()}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
450
%%EOF`;

    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `invoice-${invoiceId}-mock.pdf`;
    link.click();

    notifications.show({
      title: 'Mock PDF Generated',
      message: 'A mock PDF has been generated as fallback',
      color: 'green',
    });
  };

  const getStatusColor = (status: string, dueDate: string) => {
    if (status === 'paid') return 'green';
    if (status === 'partially_paid') return 'yellow';
    if ((status === 'unpaid' || status === 'partially_paid') && dayjs(dueDate).isBefore(dayjs()))
      return 'red';
    return 'blue';
  };

  const getStatusText = (status: string, dueDate: string) => {
    if (status === 'paid') return 'Paid';
    if (status === 'partially_paid') return 'Partially Paid';
    if ((status === 'unpaid' || status === 'partially_paid') && dayjs(dueDate).isBefore(dayjs()))
      return 'Overdue';
    return 'Pending';
  };

  const getPaymentProgress = (invoice: Invoice) => {
    const paidAmount = invoice.paidAmount || 0;
    return (paidAmount / invoice.total) * 100;
  };

  const getRemainingBalance = (invoice: Invoice) => {
    const paidAmount = invoice.paidAmount || 0;
    return invoice.total - paidAmount;
  };

  const handleAddPayment = (invoice: Invoice) => {
    const remainingAmount = invoice.total - (invoice.paidAmount || 0);

    modals.openConfirmModal({
      title: 'Add Payment',
      children: (
        <Text size="sm">
          Add a payment for invoice #{invoice.invoiceNo}?
          <br />
          <Text size="xs" c="dimmed" mt="xs">
            Total: ${invoice.total.toFixed(2)} | Paid: ${(invoice.paidAmount || 0).toFixed(2)} |
            Remaining: ${remainingAmount.toFixed(2)}
          </Text>
        </Text>
      ),
      labels: { confirm: 'Add Payment', cancel: 'Cancel' },
      confirmProps: { color: 'green' },
      onConfirm: () => {
        setSelectedInvoice(invoice);
        setIsPaymentModalOpen(true);
      },
    });
  };

  const handleViewPayments = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsHistoryModalOpen(true);
  };

  const handleSendEmail = (invoice: Invoice) => {
    modals.openConfirmModal({
      title: 'Send Invoice Email',
      children: (
        <Text size="sm">
          Send invoice #{invoice.invoiceNo} to {invoice.client.name}?
          <br />
          <Text size="xs" c="dimmed" mt="xs">
            The invoice will be sent to the client's registered email address.
          </Text>
        </Text>
      ),
      labels: { confirm: 'Send Email', cancel: 'Cancel' },
      confirmProps: { color: 'blue' },
      onConfirm: () => {
        setSelectedInvoice(invoice);
        setIsEmailModalOpen(true);
      },
    });
  };

  const handlePaymentSuccess = async () => {
    setIsPaymentModalOpen(false);
    // Refresh invoices to get updated payment info
    try {
      const { data } = await api.get('/api/invoices');
      setInvoices(data);
    } catch (error) {
      console.error('Error refreshing invoices:', error);
    }
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <TextInput
            placeholder="Search invoices..."
            leftSection={<IconSearch size={16} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 300 }}
          />
          <Group gap="sm">
            <Select
              placeholder="Sort by"
              value={sortBy}
              onChange={(value) => setSortBy(value || 'issueDate')}
              data={[
                { value: 'issueDate', label: 'Issue Date' },
                { value: 'dueDate', label: 'Due Date' },
                { value: 'invoiceNo', label: 'Invoice Number' },
                { value: 'client', label: 'Client Name' },
                { value: 'total', label: 'Amount' },
              ]}
              style={{ width: 150 }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </Group>
        </Group>

        {filteredInvoices.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            No invoices found for the selected filter.
          </Text>
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Invoice No</Table.Th>
                <Table.Th>Client</Table.Th>
                <Table.Th>Issue Date</Table.Th>
                <Table.Th>Due Date</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Payment Status</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredInvoices.map((invoice: Invoice) => (
                <Table.Tr key={invoice.id}>
                  <Table.Td>{invoice.invoiceNo}</Table.Td>
                  <Table.Td>{invoice.client.name}</Table.Td>
                  <Table.Td>{dayjs(invoice.issueDate).format('MMM DD, YYYY')}</Table.Td>
                  <Table.Td>{dayjs(invoice.dueDate).format('MMM DD, YYYY')}</Table.Td>
                  <Table.Td>{formatCurrency(invoice.total)}</Table.Td>
                  <Table.Td>
                    <Stack gap="xs">
                      <Progress
                        value={getPaymentProgress(invoice)}
                        color={invoice.status === 'paid' ? 'green' : 'blue'}
                        size="sm"
                      />
                      <Text size="xs" c="dimmed">
                        {formatCurrency(invoice.paidAmount || 0)} / {formatCurrency(invoice.total)}
                      </Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getStatusColor(invoice.status, invoice.dueDate)}>
                      {getStatusText(invoice.status, invoice.dueDate)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {/* Download PDF - available to all users */}
                      <ActionIcon
                        variant="light"
                        color="blue"
                        onClick={() => handleExport(invoice.id)}
                        title="Download PDF"
                      >
                        <IconDownload size={16} />
                      </ActionIcon>

                      {/* Send Email - admin only */}
                      {isAdmin && (
                        <ActionIcon
                          variant="light"
                          color="violet"
                          onClick={() => handleSendEmail(invoice)}
                          title="Send Email"
                        >
                          <IconMail size={16} />
                        </ActionIcon>
                      )}

                      {/* Add Payment - admin only */}
                      {isAdmin && getRemainingBalance(invoice) > 0 && (
                        <ActionIcon
                          variant="light"
                          color="green"
                          onClick={() => handleAddPayment(invoice)}
                          title="Add Payment"
                        >
                          <IconCurrencyDollar size={16} />
                        </ActionIcon>
                      )}

                      {/* View Payments - available to all users */}
                      {(invoice.paidAmount || 0) > 0 && (
                        <Button
                          size="xs"
                          variant="light"
                          color="blue"
                          onClick={() => handleViewPayments(invoice)}
                        >
                          View Payments
                        </Button>
                      )}

                      {/* Status Change - admin only */}
                      {isAdmin && invoice.status === 'unpaid' && (
                        <Button
                          size="xs"
                          variant="light"
                          color="green"
                          onClick={() => handleStatusChange(invoice.id, 'paid')}
                        >
                          Mark Paid
                        </Button>
                      )}

                      {isAdmin && invoice.status === 'paid' && (
                        <Button
                          size="xs"
                          variant="light"
                          color="orange"
                          onClick={() => handleStatusChange(invoice.id, 'unpaid')}
                        >
                          Mark Unpaid
                        </Button>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}

        {/* Payment Modals */}
        <Modal
          opened={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          title="Add Payment"
          size="md"
        >
          {selectedInvoice && (
            <PaymentForm
              invoiceId={selectedInvoice.id}
              remainingBalance={getRemainingBalance(selectedInvoice)}
              onSuccess={handlePaymentSuccess}
            />
          )}
        </Modal>

        <Modal
          opened={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          title="Payment History"
          size="lg"
        >
          {selectedInvoice && (
            <PaymentHistory invoiceId={selectedInvoice.id} onPaymentChange={handlePaymentSuccess} />
          )}
        </Modal>

        <Modal
          opened={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          title="Send Invoice Email"
          size="lg"
        >
          {selectedInvoice && (
            <EmailInvoice
              invoiceId={selectedInvoice.id}
              defaultRecipient={selectedInvoice.client.contact}
              onSuccess={() => setIsEmailModalOpen(false)}
            />
          )}
        </Modal>
      </Stack>
    </Card>
  );
}

export default InvoiceList;
