import React, { useState } from 'react';
import { Button, Group, NumberInput, Textarea, TextInput } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import api from '../lib/axios';
import { useInvoiceStore } from '../state/useInvoiceStore';

interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  [key: string]: string | number;
}

const InvoiceForm = () => {
  const { clients, setInvoices } = useInvoiceStore();
  const [invoiceData, setInvoiceData] = useState({
    issueDate: new Date(),
    dueDate: new Date(),
    clientId: '',
    items: [{ name: '', quantity: 1, unitPrice: 0 }] as InvoiceItem[],
    total: 0,
  });

  const handleInputChange = (field: string, value: any) => {
    setInvoiceData((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...invoiceData.items];
    updatedItems[index][field] = value;
    setInvoiceData((prev) => ({ ...prev, items: updatedItems }));
    calculateTotal(updatedItems);
  };

  const calculateTotal = (items: any[]) => {
    const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    setInvoiceData((prev) => ({ ...prev, total }));
  };

  const handleSubmit = async () => {
    try {
      const { data } = await api.post('/invoices', invoiceData);
      setInvoices(data);
      alert('Invoice created successfully!');
    } catch (error) {
      console.error('Error creating invoice', error);
    }
  };

  return (
    <div>
      <TextInput
        label="Client"
        value={invoiceData.clientId}
        onChange={(e) => handleInputChange('clientId', e.target.value)}
        required
      />
      <DatePicker
        value={invoiceData.issueDate}
        onChange={(date: any) => handleInputChange('issueDate', date)}
      />
      <DatePicker
        value={invoiceData.dueDate}
        onChange={(date: any) => handleInputChange('dueDate', date)}
      />
      {invoiceData.items.map((item, index) => (
        <Group key={index} gap="xs">
          <TextInput
            label="Item Name"
            value={item.name}
            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
          />
          <NumberInput
            label="Quantity"
            value={item.quantity}
            onChange={(value) => handleItemChange(index, 'quantity', value)}
          />
          <NumberInput
            label="Unit Price"
            value={item.unitPrice}
            onChange={(value) => handleItemChange(index, 'unitPrice', value)}
          />
        </Group>
      ))}
      <Group justify="right" gap="xs">
        <Button onClick={handleSubmit}>Save Invoice</Button>
      </Group>
    </div>
  );
};

export default InvoiceForm;
