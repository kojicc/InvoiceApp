import React, { useEffect, useState } from 'react';
import { IconEye, IconMail, IconSend } from '@tabler/icons-react';
import {
  Button,
  Card,
  Code,
  Group,
  Modal,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import api from '../lib/axios';

interface EmailInvoiceProps {
  invoiceId: number;
  defaultRecipient?: string;
  onSuccess?: () => void;
}

interface EmailPreview {
  to: string;
  subject: string;
  body: string;
}

const EmailInvoice: React.FC<EmailInvoiceProps> = ({ invoiceId, defaultRecipient, onSuccess }) => {
  const [emailData, setEmailData] = useState({
    recipientEmail: defaultRecipient || '',
    subject: '',
    message: '',
    includeAttachment: true,
  });
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [preview, setPreview] = useState<EmailPreview | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (defaultRecipient) {
      setEmailData((prev) => ({ ...prev, recipientEmail: defaultRecipient }));
    }
  }, [defaultRecipient]);

  const handleInputChange = (field: string, value: any) => {
    setEmailData((prev) => ({ ...prev, [field]: value }));
  };

  const loadPreview = async () => {
    try {
      const { data } = await api.get(`/api/email/preview-invoice/${invoiceId}`);
      setPreview(data);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('Error loading preview:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load email preview',
        color: 'red',
      });
    }
  };

  const validateForm = () => {
    if (!emailData.recipientEmail.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Recipient email is required',
        color: 'red',
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailData.recipientEmail)) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please enter a valid email address',
        color: 'red',
      });
      return false;
    }

    return true;
  };

  const handleSendEmail = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const { data } = await api.post(`/api/email/send-invoice/${invoiceId}`, emailData);

      notifications.show({
        title: 'Email Sent!',
        message: `Invoice email sent successfully to ${data.sentTo}`,
        color: 'green',
      });

      // Reset form
      setEmailData({
        recipientEmail: defaultRecipient || '',
        subject: '',
        message: '',
        includeAttachment: true,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error sending email', error);
      const message = error.response?.data?.message || 'Failed to send email. Please try again.';
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!emailData.recipientEmail.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please enter a recipient email to test',
        color: 'red',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailData.recipientEmail)) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please enter a valid email address',
        color: 'red',
      });
      return;
    }

    try {
      setTestLoading(true);
      const { data } = await api.post('/api/email/test', {
        to: emailData.recipientEmail,
      });

      notifications.show({
        title: 'Test Email Sent!',
        message: `Test email sent successfully to ${data.sentTo}`,
        color: 'green',
      });
    } catch (error: any) {
      console.error('Error sending test email:', error);
      const message =
        error.response?.data?.message ||
        'Failed to send test email. Please check email configuration.';
      notifications.show({
        title: 'Test Failed',
        message,
        color: 'red',
      });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <>
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={500} size="lg">
              Send Invoice via Email
            </Text>
            <Button variant="light" leftSection={<IconEye size={16} />} onClick={loadPreview}>
              Preview Email
            </Button>
          </Group>

          <TextInput
            label="Recipient Email"
            placeholder="client@example.com"
            value={emailData.recipientEmail}
            onChange={(e) => handleInputChange('recipientEmail', e.target.value)}
            required
          />

          <TextInput
            label="Subject (Optional)"
            placeholder="Leave blank to use default subject"
            value={emailData.subject}
            onChange={(e) => handleInputChange('subject', e.target.value)}
          />

          <Textarea
            label="Custom Message (Optional)"
            placeholder="Leave blank to use default message"
            value={emailData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            rows={4}
          />

          <Switch
            label="Include PDF attachment"
            checked={emailData.includeAttachment}
            onChange={(e) => handleInputChange('includeAttachment', e.currentTarget.checked)}
          />

          <Group justify="space-between">
            <Button
              variant="light"
              leftSection={<IconSend size={16} />}
              onClick={handleTestEmail}
              loading={testLoading}
              size="sm"
            >
              Test Email Config
            </Button>
            <Button
              leftSection={<IconMail size={16} />}
              onClick={handleSendEmail}
              size="md"
              loading={loading}
            >
              Send Invoice Email
            </Button>
          </Group>
        </Stack>
      </Card>

      <Modal
        opened={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Email Preview"
        size="lg"
      >
        {preview && (
          <Stack gap="md">
            <div>
              <Text size="sm" fw={500} c="dimmed">
                To:
              </Text>
              <Text>{preview.to}</Text>
            </div>
            <div>
              <Text size="sm" fw={500} c="dimmed">
                Subject:
              </Text>
              <Text>{preview.subject}</Text>
            </div>
            <div>
              <Text size="sm" fw={500} c="dimmed">
                Message:
              </Text>
              <Code block style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                {preview.body}
              </Code>
            </div>
          </Stack>
        )}
      </Modal>
    </>
  );
};

export default EmailInvoice;
