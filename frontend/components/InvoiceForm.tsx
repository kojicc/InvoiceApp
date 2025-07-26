import React, { useEffect, useState } from 'react';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import {
  Box,
  Button,
  Card,
  Grid,
  Group,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  TextInput,
} from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import api from '../lib/axios';
import { useInvoiceStore } from '../state/useInvoiceStore';

interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  [key: string]: string | number;
}

interface Client {
  id: number;
  name: string;
  contact: string;
  address: string;
}

interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number;
}

interface InvoiceFormProps {
  onSuccess?: () => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onSuccess }) => {
  const { clients, setInvoices } = useInvoiceStore();
  const [availableClients, setAvailableClients] = useState<Client[]>([]);
  const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>([]);
  const [invoiceData, setInvoiceData] = useState({
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    clientId: '',
    currency: 'USD',
    items: [{ name: '', quantity: 1, unitPrice: 0 }] as InvoiceItem[],
    total: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsResponse, currenciesResponse] = await Promise.all([
          api.get('/api/clients'),
          api.get('/api/currency/currencies'),
        ]);
        setAvailableClients(clientsResponse.data);
        setAvailableCurrencies(currenciesResponse.data);
      } catch (error) {
        console.error('Error fetching data, using fallback data:', error);

        // Fallback client data
        const fallbackClients = [
          { id: 1, name: 'Acme Corporation', contact: 'john@acme.com', address: '123 Business St' },
          {
            id: 2,
            name: 'Tech Solutions Inc',
            contact: 'info@techsolutions.com',
            address: '456 Tech Ave',
          },
          {
            id: 3,
            name: 'Global Systems Ltd',
            contact: 'contact@globalsystems.com',
            address: '789 Enterprise Blvd',
          },
          {
            id: 4,
            name: 'Creative Agency',
            contact: 'hello@creativeagency.com',
            address: '321 Design Lane',
          },
          {
            id: 5,
            name: 'StartupCo',
            contact: 'founders@startupco.com',
            address: '654 Innovation Dr',
          },
        ];

        // Fallback currency data
        const fallbackCurrencies = [
          { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1.0 },
          { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.85 },
          { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.73 },
          { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 110.0 },
          { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 1.25 },
          { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.35 },
        ];

        setAvailableClients(fallbackClients);
        setAvailableCurrencies(fallbackCurrencies);

        notifications.show({
          title: 'Using Offline Data',
          message: 'API not available, using sample data',
          color: 'yellow',
        });
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setInvoiceData((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...invoiceData.items];
    updatedItems[index][field] = value;
    setInvoiceData((prev) => ({ ...prev, items: updatedItems }));
    calculateTotal(updatedItems);
  };

  const addItem = () => {
    setInvoiceData((prev) => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: 1, unitPrice: 0 }],
    }));
  };

  const removeItem = (index: number) => {
    const updatedItems = invoiceData.items.filter((_, i) => i !== index);
    setInvoiceData((prev) => ({ ...prev, items: updatedItems }));
    calculateTotal(updatedItems);
  };

  const calculateTotal = (items: any[]) => {
    const total = items.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
      0
    );
    setInvoiceData((prev) => ({ ...prev, total }));
  };

  const validateForm = () => {
    if (!invoiceData.clientId) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please select a client',
        color: 'red',
      });
      return false;
    }

    if (invoiceData.items.some((item) => !item.name || item.quantity <= 0 || item.unitPrice <= 0)) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please fill in all item details correctly',
        color: 'red',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const { data } = await api.post('/api/invoices', {
        ...invoiceData,
        clientId: parseInt(invoiceData.clientId),
      });

      notifications.show({
        title: 'Success',
        message: 'Invoice created successfully!',
        color: 'green',
      });

      // Reset form
      setInvoiceData({
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        clientId: '',
        currency: 'USD',
        items: [{ name: '', quantity: 1, unitPrice: 0 }],
        total: 0,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating invoice', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to create invoice. Please try again.',
        color: 'red',
      });
    }
  };

  const clientOptions = availableClients.map((client) => ({
    value: client.id.toString(),
    label: `${client.name} - ${client.contact}`,
  }));

  const currencyOptions = availableCurrencies.map((currency) => ({
    value: currency.code,
    label: `${currency.code} (${currency.symbol}) - ${currency.name}`,
  }));

  const selectedCurrency = availableCurrencies.find((c) => c.code === invoiceData.currency);
  const currencySymbol = selectedCurrency?.symbol || '$';

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <Select
            label="Client"
            placeholder="Select a client"
            value={invoiceData.clientId}
            onChange={(value) => handleInputChange('clientId', value || '')}
            data={clientOptions}
            required
            searchable
          />
          <Select
            label="Currency"
            value={invoiceData.currency}
            onChange={(value) => handleInputChange('currency', value || 'USD')}
            data={currencyOptions}
            required
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <div>
            <label>Issue Date</label>
            <DatePicker
              value={invoiceData.issueDate}
              onChange={(date) => handleInputChange('issueDate', date)}
            />
          </div>
          <div>
            <label>Due Date</label>
            <DatePicker
              value={invoiceData.dueDate}
              onChange={(date) => handleInputChange('dueDate', date)}
            />
          </div>
        </SimpleGrid>

        <Stack gap="xs">
          <Group justify="space-between">
            <h4>Invoice Items</h4>
            <Button
              leftSection={<IconPlus size={16} />}
              variant="light"
              size="sm"
              onClick={addItem}
            >
              Add Item
            </Button>
          </Group>

          {invoiceData.items.map((item, index) => (
            <Card key={index} withBorder padding="sm">
              <Box hiddenFrom="sm">
                {/* Mobile Layout - Stack */}
                <Stack gap="xs">
                  <TextInput
                    label="Item Name"
                    placeholder="Enter item name"
                    value={item.name}
                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    required
                  />
                  <Group grow>
                    <NumberInput
                      label="Quantity"
                      placeholder="1"
                      min={1}
                      value={item.quantity}
                      onChange={(value) => handleItemChange(index, 'quantity', value || 1)}
                      required
                    />
                    <NumberInput
                      label="Unit Price"
                      placeholder="0.00"
                      min={0}
                      decimalScale={2}
                      prefix={currencySymbol}
                      value={item.unitPrice}
                      onChange={(value) => handleItemChange(index, 'unitPrice', value || 0)}
                      required
                    />
                  </Group>
                  <Group justify="space-between" align="flex-end">
                    <TextInput
                      label="Total"
                      value={`${currencySymbol}${((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}`}
                      readOnly
                      style={{ flex: 1 }}
                    />
                    {invoiceData.items.length > 1 && (
                      <Button
                        variant="light"
                        color="red"
                        size="sm"
                        onClick={() => removeItem(index)}
                        style={{ minWidth: 'auto', padding: '6px 8px' }}
                      >
                        <IconTrash size={16} />
                      </Button>
                    )}
                  </Group>
                </Stack>
              </Box>

              <Box visibleFrom="sm">
                {/* Desktop Layout - Grid */}
                <SimpleGrid cols={{ sm: 2, md: 4 }} spacing="xs" verticalSpacing="xs">
                  <TextInput
                    label="Item Name"
                    placeholder="Enter item name"
                    value={item.name}
                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    required
                  />
                  <NumberInput
                    label="Quantity"
                    placeholder="1"
                    min={1}
                    value={item.quantity}
                    onChange={(value) => handleItemChange(index, 'quantity', value || 1)}
                    required
                  />
                  <NumberInput
                    label="Unit Price"
                    placeholder="0.00"
                    min={0}
                    decimalScale={2}
                    prefix={currencySymbol}
                    value={item.unitPrice}
                    onChange={(value) => handleItemChange(index, 'unitPrice', value || 0)}
                    required
                  />
                  <Group align="flex-end" gap="xs">
                    <div style={{ flex: 1 }}>
                      <TextInput
                        label="Total"
                        value={`${currencySymbol}${((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}`}
                        readOnly
                      />
                    </div>
                    {invoiceData.items.length > 1 && (
                      <Button
                        variant="light"
                        color="red"
                        size="sm"
                        onClick={() => removeItem(index)}
                        style={{ minWidth: 'auto', padding: '6px 8px' }}
                      >
                        <IconTrash size={16} />
                      </Button>
                    )}
                  </Group>
                </SimpleGrid>
              </Box>
            </Card>
          ))}
        </Stack>

        <Group justify="space-between" align="center" mt="md">
          <Box>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              Total: {currencySymbol}
              {invoiceData.total.toFixed(2)}
            </div>
          </Box>
          <Button onClick={handleSubmit} size="md" style={{ minWidth: '120px' }}>
            Create Invoice
          </Button>
        </Group>
      </Stack>
    </Card>
  );
};

export default InvoiceForm;
