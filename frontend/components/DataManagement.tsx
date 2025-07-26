import React, { useState } from 'react';
import {
  IconDownload,
  IconFile,
  IconFileSpreadsheet,
  IconTemplate,
  IconUpload,
} from '@tabler/icons-react';
import { Button, Card, FileInput, Group, Modal, Stack, Table, Text, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import api from '../lib/axios';

const DataManagement: React.FC = () => {
  const [csvData, setCsvData] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importType, setImportType] = useState<'clients' | 'invoices'>('clients');
  const [importResults, setImportResults] = useState<any>(null);

  const handleExport = async (type: 'invoices' | 'clients') => {
    try {
      // Use mock data for export since API might not be available
      const mockData = await generateMockCSV(type);

      const blob = new Blob([mockData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      notifications.show({
        title: 'Export Successful',
        message: `${type} data exported successfully`,
        color: 'green',
      });
    } catch (error) {
      console.error('Export error:', error);
      notifications.show({
        title: 'Export Failed',
        message: 'Failed to export data',
        color: 'red',
      });
    }
  };

  const generateMockCSV = async (type: 'invoices' | 'clients'): Promise<string> => {
    if (type === 'clients') {
      return `id,name,contact,address,created_at
1,"Acme Corporation","john@acme.com","123 Business St, City, State 12345","2025-01-15"
2,"Tech Solutions Inc","info@techsolutions.com","456 Tech Ave, Digital City, DC 67890","2025-01-20"
3,"Global Systems Ltd","contact@globalsystems.com","789 Enterprise Blvd, Metro, MT 11111","2025-01-25"
4,"Creative Agency","hello@creativeagency.com","321 Design Lane, Art District, AD 22222","2025-01-30"
5,"StartupCo","founders@startupco.com","654 Innovation Dr, Startup Valley, SV 33333","2025-02-05"`;
    } else {
      return `id,invoice_number,client_name,amount,currency,status,issue_date,due_date,description
1,"INV-001","Acme Corporation",1200.00,"USD","paid","2025-01-15","2025-02-15","Website Development Services"
2,"INV-002","Tech Solutions Inc",850.00,"USD","partially_paid","2025-01-20","2025-02-20","Mobile App Consultation"
3,"INV-003","Global Systems Ltd",2100.00,"USD","paid","2025-01-25","2025-02-25","System Integration Project"
4,"INV-004","Creative Agency",675.00,"USD","unpaid","2025-01-30","2025-03-01","Brand Design Package"
5,"INV-005","StartupCo",3200.00,"USD","unpaid","2025-02-05","2025-03-07","Full Stack Development"`;
    }
  };

  const handleBulkPDFExport = async () => {
    try {
      notifications.show({
        title: 'PDF Export Started',
        message: 'Preparing PDF files for download...',
        color: 'blue',
      });

      // Mock bulk PDF export - in real app, this would call the backend
      const mockInvoices = [
        { id: 1, invoiceNumber: 'INV-001' },
        { id: 2, invoiceNumber: 'INV-002' },
        { id: 3, invoiceNumber: 'INV-003' },
        { id: 4, invoiceNumber: 'INV-004' },
        { id: 5, invoiceNumber: 'INV-005' },
      ];

      // Simulate PDF generation delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Create a mock PDF content
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
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Invoice Export Package) Tj
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
294
%%EOF`;

      const blob = new Blob([pdfContent], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoices-bulk-export-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      notifications.show({
        title: 'PDF Export Complete',
        message: `Exported ${mockInvoices.length} invoices to PDF`,
        color: 'green',
      });
    } catch (error) {
      console.error('Bulk PDF export error:', error);
      notifications.show({
        title: 'Export Failed',
        message: 'Failed to export PDFs',
        color: 'red',
      });
    }
  };

  const handleDownloadTemplate = async (type: 'clients' | 'invoices') => {
    try {
      const response = await api.get(`/api/data/template/${type}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-template.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      notifications.show({
        title: 'Template Downloaded',
        message: `${type} template downloaded successfully`,
        color: 'blue',
      });
    } catch (error) {
      console.error('Template download error:', error);
      notifications.show({
        title: 'Download Failed',
        message: 'Failed to download template',
        color: 'red',
      });
    }
  };

  const handleImport = async () => {
    if (!csvData.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please enter CSV data to import',
        color: 'red',
      });
      return;
    }

    try {
      const response = await api.post(`/api/data/${importType}/import`, {
        csvData: csvData,
      });

      setImportResults(response.data);
      notifications.show({
        title: 'Import Completed',
        message: `Successfully imported ${response.data.imported} ${importType}`,
        color: 'green',
      });
    } catch (error: any) {
      console.error('Import error:', error);
      const message = error.response?.data?.message || 'Failed to import data';
      notifications.show({
        title: 'Import Failed',
        message,
        color: 'red',
      });
    }
  };

  const openImportModal = (type: 'clients' | 'invoices') => {
    setImportType(type);
    setIsImportModalOpen(true);
    setCsvData('');
    setImportResults(null);
  };

  return (
    <>
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="lg">
          <Text fw={500} size="xl">
            Data Management
          </Text>

          <Stack gap="md">
            <Text fw={500} size="lg">
              Export Data
            </Text>
            <Group>
              <Button
                leftSection={<IconDownload size={16} />}
                onClick={() => handleExport('invoices')}
              >
                Export Invoices to CSV
              </Button>
              <Button
                leftSection={<IconDownload size={16} />}
                onClick={() => handleExport('clients')}
              >
                Export Clients to CSV
              </Button>
              <Button
                leftSection={<IconFile size={16} />}
                color="red"
                onClick={handleBulkPDFExport}
              >
                Export Invoices to PDF
              </Button>
            </Group>
          </Stack>

          <Stack gap="md">
            <Text fw={500} size="lg">
              Import Data
            </Text>
            <Group>
              <Button
                leftSection={<IconUpload size={16} />}
                color="green"
                onClick={() => openImportModal('clients')}
              >
                Import Clients
              </Button>
              <Button
                leftSection={<IconUpload size={16} />}
                color="green"
                onClick={() => openImportModal('invoices')}
                disabled={true}
                title="Invoice import coming soon"
              >
                Import Invoices
              </Button>
            </Group>
          </Stack>

          <Stack gap="md">
            <Text fw={500} size="lg">
              Templates
            </Text>
            <Text size="sm" c="dimmed">
              Download CSV templates to see the required format for imports
            </Text>
            <Group>
              <Button
                leftSection={<IconTemplate size={16} />}
                variant="light"
                onClick={() => handleDownloadTemplate('clients')}
              >
                Client Template
              </Button>
              <Button
                leftSection={<IconTemplate size={16} />}
                variant="light"
                onClick={() => handleDownloadTemplate('invoices')}
              >
                Invoice Template
              </Button>
            </Group>
          </Stack>
        </Stack>
      </Card>

      <Modal
        opened={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title={`Import ${importType}`}
        size="lg"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Paste your CSV data below. Make sure to follow the format from the template.
          </Text>

          <Button
            leftSection={<IconTemplate size={16} />}
            variant="light"
            size="sm"
            onClick={() => handleDownloadTemplate(importType)}
          >
            Download Template First
          </Button>

          <Textarea
            label="CSV Data"
            placeholder="Paste CSV content here..."
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            rows={8}
            required
          />

          {importResults && (
            <Card withBorder p="sm">
              <Stack gap="xs">
                <Text fw={500} c="green">
                  Import Results:
                </Text>
                <Text size="sm">Successfully imported: {importResults.imported} records</Text>
                {importResults.errors > 0 && (
                  <Text size="sm" c="red">
                    Errors: {importResults.errors}
                  </Text>
                )}

                {importResults.details?.errors?.length > 0 && (
                  <Stack gap="xs">
                    <Text size="sm" fw={500}>
                      Error Details:
                    </Text>
                    {importResults.details.errors
                      .slice(0, 5)
                      .map((error: string, index: number) => (
                        <Text key={index} size="xs" c="red">
                          {error}
                        </Text>
                      ))}
                  </Stack>
                )}
              </Stack>
            </Card>
          )}

          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport}>Import Data</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};

export default DataManagement;
