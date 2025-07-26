# Database Seeding and Cleanup

This directory contains comprehensive database seeding and cleanup scripts for the Invoice Management System.

## 🌱 Seeding Script (`seed.ts`)

The seeding script creates a complete test dataset with realistic scenarios:

### Created Data

**Users (6 total):**

- 2 Admin users: `admin@invoiceapp.com` / `super@invoiceapp.com` (password: `admin123`)
- 4 Client users: `acmecorp@example.com`, `contact@techsolutions.com`, `billing@globalinc.com`, `finance@startupxyz.com` (password: `client123`)

**Clients (5 total):**

- ACME Corporation
- Tech Solutions Ltd
- Global Industries Inc
- StartupXYZ
- Retail Chain Co

**Invoices (9 total) - All Scenarios:**

- ✅ **Paid invoices** (2): Fully paid with payment history
- 🔄 **Partially paid invoices** (1): Multiple partial payments
- ⏳ **Unpaid invoices** (2): Current invoices awaiting payment
- ⚠️ **Overdue invoices** (2): Past due date, unpaid
- 🔁 **Recurring invoices** (1): Monthly recurring with schedule
- 💰 **High-value invoices** (1): Enterprise-level amounts
- 🌍 **Multi-currency invoices** (1): Different currencies (USD, EUR, GBP, JPY)

**Payments (5 total):**

- Various payment methods: Credit card, bank transfer, check, cash
- Full and partial payments
- Different dates and scenarios

**Audit Logs (5 total):**

- Create/update/delete actions
- User tracking with IP addresses
- JSON change tracking

### Invoice Scenarios Covered

1. **Payment Status Variety:**

   - Fully paid invoices
   - Partially paid invoices (multiple payments)
   - Completely unpaid invoices
   - Overdue invoices

2. **Business Scenarios:**

   - Recurring monthly invoices
   - One-time project invoices
   - High-value enterprise deals
   - Multi-currency international clients

3. **Time-based Testing:**

   - Recent invoices (this week)
   - Monthly invoices (last month)
   - Historical invoices (2+ months ago)
   - Future due dates

4. **Currency Testing:**
   - USD (default)
   - EUR with exchange rate
   - GBP with exchange rate
   - JPY with exchange rate

## 🧹 Cleanup Script (`cleanup.ts`)

The cleanup script removes all seeded data and resets auto-increment sequences.

## 📝 Available Commands

```bash
# Populate database with comprehensive test data
npm run seed

# Clean all data from database
npm run cleanup

# Clean and then re-seed (full reset)
npm run db:reset
```

## 🔐 Test Credentials

### Admin Access

- **Email:** `admin@invoiceapp.com`
- **Password:** `admin123`
- **Permissions:** Full access to all features, clients, invoices, audit logs

### Client Access

- **Email:** `acmecorp@example.com`
- **Password:** `client123`
- **Permissions:** Access to own invoices only (ACME Corporation)

- **Email:** `contact@techsolutions.com`
- **Password:** `client123`
- **Permissions:** Access to own invoices only (Tech Solutions Ltd)

- **Email:** `billing@globalinc.com`
- **Password:** `client123`
- **Permissions:** Access to own invoices only (Global Industries Inc)

- **Email:** `finance@startupxyz.com`
- **Password:** `client123`
- **Permissions:** Access to own invoices only (StartupXYZ)

## 🧪 Testing Scenarios

With this seeded data, you can test:

1. **Role-based Authentication:**

   - Admin can see all invoices and clients
   - Clients can only see their own invoices

2. **Dashboard Statistics:**

   - Total clients, active invoices, revenue calculations
   - Overdue invoice tracking
   - Monthly growth metrics

3. **Invoice Management:**

   - Create, update, delete invoices
   - Payment tracking and history
   - PDF generation
   - Email notifications

4. **Payment Processing:**

   - Record payments against invoices
   - Partial payment handling
   - Multiple payment methods
   - Payment history tracking

5. **Recurring Invoices:**

   - Monthly recurring setup
   - Next due date calculation
   - Recurring invoice generation

6. **Multi-currency Support:**

   - Currency conversion
   - Exchange rate handling
   - International client management

7. **Audit Trail:**
   - User action tracking
   - Change history
   - Admin oversight capabilities

## 📊 Expected Results

After seeding, your dashboard should show:

- **5 Clients** total
- **9 Invoices** with various statuses
- **Mixed payment statuses** (paid, partial, unpaid, overdue)
- **Revenue data** from completed payments
- **Recent activity** from audit logs

## 🚨 Important Notes

- The cleanup script will **permanently delete all data**
- Auto-increment sequences are reset to start from 1
- All foreign key relationships are properly handled
- The scripts use transactions to ensure data integrity

## 🔄 Database Reset Workflow

1. **Clean:** Remove all existing data
2. **Seed:** Create comprehensive test dataset
3. **Verify:** Test application functionality
4. **Repeat:** Use `npm run db:reset` for full refresh
