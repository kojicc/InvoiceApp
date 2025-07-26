import React, { useEffect } from 'react';
import { Button, Table } from '@mantine/core';
import api from '../lib/axios';
import { useInvoiceStore } from '../state/useInvoiceStore';

interface Client {
  name: string;
}

interface Invoice {
  id: number;
  invoiceNo: string;
  client: Client;
  total: number;
  status: string;
}

const InvoiceList = () => {
  const { invoices, setInvoices } = useInvoiceStore();

  useEffect(() => {
    const fetchInvoices = async () => {
      const { data } = await api.get('/invoices');
      setInvoices(data);
    };
    fetchInvoices();
  }, [setInvoices]);

  const handleExport = async (invoiceId: number) => {
    const res = await api.get(`/invoices/${invoiceId}/export-pdf`, { responseType: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(res.data);
    link.download = `invoice-${invoiceId}.pdf`;
    link.click();
  };

  return (
    <div>
      <Table>
        <thead>
          <tr>
            <th>Invoice No</th>
            <th>Client</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice: Invoice) => (
            <tr key={invoice.id}>
              <td>{invoice.invoiceNo}</td>
              <td>{invoice.client.name}</td>
              <td>{invoice.total}</td>
              <td>{invoice.status}</td>
              <td>
                <Button onClick={() => handleExport(invoice.id)}>Download PDF</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default InvoiceList;
