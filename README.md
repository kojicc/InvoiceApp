# 🧾 Invoice Management System

A comprehensive, full-stack invoice management application built with **Next.js**, **Node.js**, **TypeScript**, **Prisma**, and **PostgreSQL**. This system provides role-based access control, complete invoice lifecycle management, payment tracking, and comprehensive audit trails.

## ✨ Features

### 🔐 Authentication & Authorization
- **JWT-based authentication** with secure token management
- **Role-based access control** (Admin/Client roles)
- **Profile management** with avatar upload support
- **Password management** with bcrypt encryption

### 📊 Invoice Management
- **Complete invoice lifecycle** (Create, Read, Update, Delete)
- **Multi-currency support** with real-time exchange rates
- **Recurring invoice automation** with flexible scheduling
- **Invoice status tracking** (Paid, Partial, Unpaid, Overdue)
- **PDF generation** with professional formatting
- **Email notifications** for invoice delivery

### 💰 Payment Processing
- **Payment recording** with multiple methods (Card, Bank Transfer, Cash, Check)
- **Partial payment support** with automatic status updates
- **Payment history tracking** with detailed audit trails
- **Balance calculations** and remaining amount tracking
- **Payment method categorization**

### 👥 Client Management
- **Client profiles** with contact information
- **Client-specific invoice filtering** for secure access
- **Client communication history**
- **Address and contact management**

### 📈 Dashboard & Analytics
- **Revenue tracking** with period comparisons
- **Invoice status overview** with visual indicators
- **Payment analytics** and trends
- **Overdue invoice alerts**
- **Recent activity feeds**

### 🛡️ Security & Audit
- **Comprehensive audit logging** for all user actions
- **IP address tracking** for security monitoring
- **Change history** with before/after state tracking
- **Admin oversight capabilities**
- **Secure file upload** with validation

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kojicc/InvoiceApp.git
   cd InvoiceApp
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   
   # Create .env file with your database credentials
   echo "DATABASE_URL=\"postgresql://username:password@localhost:5432/invoiceapp\"
   JWT_SECRET=\"your-super-secret-jwt-key\"
   PORT=4000" > .env
   
   # Run database migrations
   npx prisma migrate dev
   
   # Seed the database with sample data
   npm run db:reset
   ```

3. **Set up the frontend**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Start the development servers**
   
   **Backend (Terminal 1):**
   ```bash
   cd backend
   npm run dev
   # Server running on http://localhost:4000
   ```
   
   **Frontend (Terminal 2):**
   ```bash
   cd frontend
   npm run dev
   # App running on http://localhost:3000
   ```
- **Client Management**: Complete CRUD operations for client information
- **User Authentication**: JWT-based authentication system with protected routes

### 💰 Payment Tracking

- **Payment Records**: Track partial and full payments for each invoice
- **Payment History**: View detailed payment history with timestamps
- **Payment Status**: Visual indicators for paid, partial, and unpaid invoices
- **Payment Methods**: Support for cash, card, bank transfer, and check payments

### 📧 Email Integration

- **Email Invoices**: Send invoices directly to clients via email
- **Email Preview**: Preview emails before sending
- **Email Templates**: Professional email templates with invoice attachments
- **Email History**: Track sent emails and delivery status

### 🌍 Multi-Currency Support

- **Currency Conversion**: Real-time currency conversion for international clients
- **Multiple Currencies**: Support for USD, EUR, GBP, and other major currencies
- **Exchange Rates**: Automatic exchange rate updates
- **Currency Display**: Show amounts in both original and converted currencies

### 📊 Data Management

- **CSV Import**: Import invoice and client data from CSV files
- **CSV Export**: Export data for backup or analysis
- **Data Validation**: Comprehensive validation during import
- **Bulk Operations**: Process multiple records efficiently

### 🔍 Audit Logging

- **Activity Tracking**: Track all user actions and system changes
- **Change History**: Detailed logs of create, update, and delete operations
- **User Attribution**: Link all activities to specific users
- **Audit Trail**: Complete audit trail for compliance and security

### 🎨 User Interface

- **Modern Design**: Clean, responsive design using Mantine UI components
- **Dark/Light Mode**: Toggle between light and dark themes
- **Mobile Responsive**: Optimized for desktop, tablet, and mobile devices
- **Interactive Elements**: Modals, notifications, and smooth transitions

## Technology Stack

### Frontend

- **React 19.1.0**: Modern React with hooks and functional components
- **Next.js 15.3.3**: Server-side rendering and routing
- **TypeScript**: Type-safe development
- **Mantine UI 8.2.1**: Component library for consistent design
- **Zustand**: State management for user authentication and invoices
- **SWR**: Data fetching and caching
- **Axios**: HTTP client for API calls

### Backend

- **Node.js**: JavaScript runtime environment
- **Express 5.1.0**: Web application framework
- **TypeScript**: Type-safe server development
- **Prisma 6.12.0**: Database ORM and query builder
- **PostgreSQL**: Relational database
- **JWT**: JSON Web Tokens for authentication
- **PDFKit**: PDF generation for invoices
- **Bcrypt**: Password hashing and security

## Installation

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database
- Git

### Backend Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd InvoiceApp/backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the backend directory:

   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/InvoiceDB"
   JWT_SECRET="your-jwt-secret-key"
   PORT=5000
   ```

4. **Database Setup**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the backend server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**

   ```bash
   cd ../frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the frontend directory:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

4. **Start the frontend development server**

   ```bash
   npm run dev
   ```

5. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

## API Endpoints

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user info

### Invoices

- `GET /invoices` - List all invoices
- `POST /invoices` - Create new invoice
- `GET /invoices/:id` - Get invoice by ID
- `PUT /invoices/:id` - Update invoice
- `DELETE /invoices/:id` - Delete invoice
- `GET /invoices/:id/pdf` - Generate PDF

### Clients

- `GET /clients` - List all clients
- `POST /clients` - Create new client
- `GET /clients/:id` - Get client by ID
- `PUT /clients/:id` - Update client
- `DELETE /clients/:id` - Delete client

### Payments

- `GET /payments/invoice/:invoiceId` - Get payments for invoice
- `POST /payments` - Add new payment
- `DELETE /payments/:id` - Delete payment

### Email

- `POST /email/send` - Send email with invoice
- `POST /email/preview` - Preview email content

### Currency

- `GET /currency/rates` - Get exchange rates
- `POST /currency/convert` - Convert currency amount

### Data Management

- `POST /data/import/invoices` - Import invoices from CSV
- `POST /data/import/clients` - Import clients from CSV
- `GET /data/export/invoices` - Export invoices to CSV
- `GET /data/export/clients` - Export clients to CSV

### Audit Logs

- `GET /audit` - Get audit logs with filtering
- `POST /audit` - Create audit log entry

## Database Schema

The application uses the following main database models:

### User

- `id`: Primary key
- `username`: Unique username
- `email`: User email
- `password`: Hashed password
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp

### Client

- `id`: Primary key
- `name`: Client name
- `email`: Client email
- `phone`: Phone number
- `address`: Client address
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### Invoice

- `id`: Primary key
- `invoiceNumber`: Unique invoice number
- `clientId`: Foreign key to Client
- `amount`: Invoice amount
- `currency`: Currency code (e.g., 'USD')
- `dueDate`: Payment due date
- `status`: Payment status
- `description`: Invoice description
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### Payment

- `id`: Primary key
- `invoiceId`: Foreign key to Invoice
- `amount`: Payment amount
- `method`: Payment method
- `notes`: Optional payment notes
- `createdAt`: Payment timestamp

### AuditLog

- `id`: Primary key
- `userId`: Foreign key to User
- `action`: Action performed
- `entity`: Entity affected
- `entityId`: ID of affected entity
- `changes`: JSON of changes made
- `createdAt`: Action timestamp

## Features in Detail

### Payment Tracking System

The payment tracking system allows users to:

- Record partial payments against invoices
- Track payment methods and notes
- View payment history with timestamps
- Calculate remaining balances automatically
- Display payment progress with visual indicators

### Email Integration

The email system provides:

- Professional email templates
- Invoice attachment capability
- Email preview functionality
- SMTP configuration for sending
- Email delivery tracking

### Multi-Currency Support

Currency features include:

- Real-time exchange rate fetching
- Automatic currency conversion
- Support for major world currencies
- Display in both original and converted amounts
- Historical exchange rate tracking

### Data Import/Export

Data management capabilities:

- CSV import with validation
- Bulk data processing
- Export functionality for backup
- Error handling and reporting
- Data integrity checks

### Audit Logging

Comprehensive audit trail:

- All user actions logged
- Change tracking with before/after values
- User attribution for all activities
- Filterable audit history
- Compliance-ready audit trail

## Development

### Code Structure

```
InvoiceApp/
├── backend/                 # Backend API server
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── middleware/     # Express middleware
│   │   └── utils/          # Utility functions
│   ├── prisma/             # Database schema and migrations
│   └── index.ts           # Server entry point
└── frontend/               # Frontend React application
    ├── components/         # React components
    ├── pages/             # Next.js pages
    ├── contexts/          # React contexts
    ├── state/             # Zustand stores
    └── lib/               # Utility libraries
```

### Testing

Run tests with:

```bash
# Frontend tests
cd frontend
npm test

# Backend tests (when implemented)
cd backend
npm test
```

### Building for Production

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support or questions, please open an issue in the repository or contact the development team.
