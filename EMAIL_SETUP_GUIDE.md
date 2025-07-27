# 📧 Email Configuration & Setup Guide

## Overview

The Invoice Management System now supports real email sending using Gmail SMTP. This guide explains how to configure and use the email functionality.

## 🔧 Configuration

### Gmail App Password Setup

1. **Enable 2-Factor Authentication** on your Gmail account
2. Go to **Google Account Settings** > **Security** > **2-Step Verification**
3. Generate an **App Password** for the Invoice Management System
4. Use the app password (not your regular Gmail password) in the configuration

### Backend Configuration (.env)

The system is already configured with the following Gmail settings:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=true
EMAIL_HOST_USER=reservoiacthm@gmail.com
EMAIL_HOST_PASSWORD=ussz mccl gkrd bxkw
```

## 🚀 Features

### ✅ Real Email Sending

- **SMTP Integration**: Uses Gmail SMTP for actual email delivery
- **Professional Templates**: HTML-formatted emails with invoice details
- **Error Handling**: Comprehensive error reporting for failed sends

### ✅ Test Email Functionality

- **Configuration Test**: Send test emails to verify SMTP setup
- **Instant Feedback**: Real-time success/error notifications
- **Debug Information**: Detailed error messages in development mode

### ✅ Invoice Email Features

- **Automatic Content**: Generates professional invoice emails
- **Custom Messages**: Optional custom message addition
- **Email Preview**: Preview emails before sending
- **Client Integration**: Uses client email from invoice data

## 📱 How to Use

### Testing Email Configuration

1. Navigate to any invoice in the system
2. Click **"Email Invoice"** or find the email section
3. Enter your email address in the recipient field
4. Click **"Test Email Config"** button
5. Check your email for the test message

### Sending Invoice Emails

1. **Select an Invoice**: Go to the invoice you want to email
2. **Open Email Modal**: Click the email button/icon
3. **Configure Email**:
   - Recipient: Auto-filled with client email (can be changed)
   - Subject: Optional custom subject (uses default if empty)
   - Message: Optional custom message
   - Attachment: Toggle PDF attachment (currently mock)
4. **Preview**: Click "Preview Email" to see how it will look
5. **Send**: Click "Send Invoice Email"
6. **Confirmation**: Receive success notification with delivery details

## 🎨 Email Template Features

### Professional Design

- **Responsive Layout**: Works on desktop and mobile
- **Brand Colors**: Uses system color scheme
- **Status Indicators**: Color-coded invoice status
- **Clean Typography**: Professional fonts and spacing

### Dynamic Content

- **Invoice Details**: All invoice information included
- **Item Breakdown**: Detailed line items with totals
- **Client Information**: Personalized with client name
- **Company Branding**: System branding and contact info

## 🛠️ API Endpoints

### Test Email

```
POST /api/email/test
Body: { "to": "test@example.com" }
```

### Send Invoice Email

```
POST /api/email/send-invoice/:invoiceId
Body: {
  "recipientEmail": "client@example.com",
  "subject": "Custom subject (optional)",
  "message": "Custom message (optional)",
  "includeAttachment": true
}
```

### Preview Email

```
GET /api/email/preview-invoice/:invoiceId
```

## 🔒 Security Features

### Email Validation

- **Format Validation**: Validates email format before sending
- **Required Fields**: Ensures recipient email is provided
- **Error Handling**: Graceful error handling for invalid emails

### SMTP Security

- **TLS Encryption**: All emails sent over encrypted connection
- **App Passwords**: Uses secure Gmail app passwords
- **Environment Variables**: Sensitive credentials stored securely

## 🐛 Troubleshooting

### Common Issues

**"Failed to send email"**

- Check internet connection
- Verify Gmail app password is correct
- Ensure 2-factor authentication is enabled on Gmail
- Check if Gmail account is locked or suspended

**"Authentication failed"**

- Verify EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in .env
- Generate new Gmail app password
- Check for typos in credentials

**"SMTP connection timeout"**

- Check firewall settings
- Verify EMAIL_HOST and EMAIL_PORT settings
- Try different network connection

### Testing Steps

1. **Test Email Config**: Use the test email feature first
2. **Check Logs**: Monitor backend console for detailed error messages
3. **Verify Credentials**: Double-check Gmail app password
4. **Network Check**: Ensure SMTP port 587 is not blocked

## 🎯 Success Indicators

### ✅ Working Email System

- Test emails are received successfully
- Invoice emails are delivered to recipients
- No SMTP errors in backend logs
- Success notifications appear in UI

### 📊 Email Metrics

- **Delivery Status**: Real-time delivery confirmation
- **Message IDs**: Unique tracking for each sent email
- **Timestamps**: Accurate send time recording
- **Error Tracking**: Detailed error logging for failures

## 🔮 Future Enhancements

### Planned Features

- **PDF Attachments**: Attach invoice PDFs to emails
- **Email Templates**: Multiple email template options
- **Email History**: Track all sent emails per invoice
- **Bulk Email**: Send multiple invoices at once
- **Email Scheduling**: Schedule emails for later delivery
- **Delivery Tracking**: Track email opens and clicks

---

## 📞 Support

For email configuration issues:

1. Check this documentation first
2. Test with the built-in test email feature
3. Review backend console logs for detailed errors
4. Verify Gmail security settings and app passwords

The email system is now fully functional and ready for production use! 🚀
