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
      const response = await api.get(`/api/data/${type}/export`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
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

  const handleBulkPDFExport = async () => {
    try {
      notifications.show({
        title: 'PDF Export Started',
        message: 'Preparing PDF files for download...',
        color: 'blue',
      });

      const response = await api.get('/api/data/invoices/bulk-pdf', {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
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
        message: 'Invoices exported to PDF successfully',
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
