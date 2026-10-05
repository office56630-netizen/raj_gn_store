# CredEx Kirana Store - Credit & Debit Khata Book

CredEx Kirana Store is a mobile-first, enterprise-grade **Credit & Debit Khata Book (उधार व जमा खाता बही)** designed specifically for **General Kirana Stores, Grocery Shops, Provision Merchants, and Daily Essentials Retailers**.

Powered by **Node.js, Express, MongoDB (Mongoose), React 19, and Tailwind CSS**, it allows shopkeepers to effortlessly track customer credit (उधार), payments received (जमा), and live balance (बाकी राशि) from any smartphone or desktop.

---

## 1. Kirana Store & Mobile Features

### High-Speed Counter Operations on Mobile
- **Fixed Mobile Bottom Tab Bar**: One-handed thumb navigation with 5 primary destinations:
  1. **डैशबोर्ड (Dashboard)**: Quick snapshot of total khata customers, total credit given, total payments collected, and net receivable balance.
  2. **खाता (Customers)**: Customer list with live balance badges and instant tap actions.
  3. **त्वरित प्रविष्टि (+ Entry)**: Center action button to immediately record credit or payment in seconds.
  4. **लेनदेन (Transactions)**: Chronological ledger stream.
  5. **मेन्यू (Menu)**: Access to Product catalog, SMS/Notices, Reports, and Security Logs.
- **Quick Amount Buttons**: Instant `+₹50`, `+₹100`, `+₹200`, `+₹500`, `+₹1000`, `+₹2000` buttons to speed up counter billing.
- **Kirana Item Shortcuts**: Pre-configured quick items: Atta (आटा), Sugar (चीनी), Milk (दूध), Cooking Oil (तेल), Dal (दाल), Rice (चावल), Tea (चाय पत्ती), Spices (मसाले), and Soaps (साबुन).
- **Payment Modes for Payments Received (Jama)**: Cash (नकद), UPI / QR (PhonePe, Google Pay, Paytm), and Bank / Cheque.
- **1-Click WhatsApp Payment Reminders**: Send formatted, polite payment reminders to customers via WhatsApp directly from their account card.
- **Touch-First Ergonomics**: All interactive buttons, cards, and list rows maintain minimum $44 \times 44$px hitboxes to eliminate mis-taps.
- **Numeric Keypad Autofocus**: Amount inputs use `inputMode="decimal"` to automatically pop open the numeric keypad on iOS and Android.

---

## 2. Key Features

### Admin Console
- **Executive Financial Dashboard**: Real-time cards for Total Customers, Total Credit, Total Debit, Total Outstanding Balance, Total Transactions, Total Products, and Today's Credit/Debit activity.
- **Credit vs. Debit Allocation Bar**: Visual breakdown of credit extended vs payments collected.
- **Monthly Volume Trends**: Month-over-month ledger comparison.
- **Customer Management**: Full CRUD operations for customer records, with automatic creation of matching portal accounts. Searchable by name, customer code, phone, email, and city.
- **Customer Account & Ledger View**: Detailed customer financial profile with running balances, distinct product associations, and notification history.
- **Credit & Debit Entry Engine**: Instant recording of credit entries (purchases on credit) and debit entries (cash/UPI/NEFT/Cheque payments) with automatic customer notification generation.
- **Product Catalog Management**: Manage catalog products, baseline prices, categories, and inventory descriptions. Product selection auto-populates pricing in transactions while allowing manual price override when necessary.
- **Notification System**: Automated triggers upon credit/debit postings + manual notifications to individual customers, multiple customers, or broadcast to all customers.
- **Financial Reports & Auditing**:
  - Customer Balances Report (filtered by outstanding receivables, settled, or credit advance)
  - Transaction Audit Registry (date range, type, customer)
  - Product Volume & Performance Report
  - 1-Click CSV Download and Print/PDF preview
- **Secure Admin Impersonation ("Login as Customer")**: Admins can securely view any customer's account view to verify discrepancies, with a visible banner and mandatory audit logging.
- **Audit Logs Trail**: Immutable log of logins, customer creations/edits/deletions, transactions created/edited/deleted, product updates, and customer account access with timestamps and IP addresses.

### Customer & Admin Unified Portal
- **Single Unified Login**: No split tabs or confusing selectors. Users simply enter their email and password.
- **Intelligent Role Routing**: Authenticated admins are routed directly to the **Admin Console**; authenticated customers are routed directly to their **Customer Portal**.
- **Personal Financial Summary**: Live Total Credit, Total Debit, and Current Balance Due cards.
- **Chronological Ledger Sheet**: Full running balance ledger calculated dynamically.
- **Filterable Transactions History**: Search transactions by item, date, and credit/debit type.
- **Receipt & Invoice Breakdown**: Inspect detailed transaction receipts with reference numbers and notes.
- **Purchased Products Registry**: View all distinct catalog products credited to account.
- **Notifications & Announcements**: Mark as read, mark all read, and view priority notices.
- **Account Profile & Security**: Update account password securely.
- **Zero Cross-Customer Data Leakage**: Enforced at the MongoDB query level via customer authentication middleware.

---

## 3. Technology Stack

### Backend
- **Node.js** & **Express.js** (REST API)
- **MongoDB** with **Mongoose** ODM
- **JWT (JSON Web Tokens)** for stateless session security
- **bcryptjs** for salted password hashing
- **mongodb-memory-server** for zero-dependency local embedded execution + support for standard external MongoDB URIs

### Frontend
- **React 19** & **TypeScript**
- **Vite** bundler
- **Tailwind CSS v4** for clean, responsive enterprise SaaS styling
- **Lucide Icons**
- **Print stylesheet** for customer statements and auditor reports

---

## 4. Project Structure

```text
├── config/
│   └── database.ts             # MongoDB connection (embedded & remote URI) & initial seed
├── models/
│   ├── User.ts                 # User credentials, roles, and status
│   ├── Customer.ts             # Customer profile, contact, and code
│   ├── Product.ts              # Product catalog and baseline pricing
│   ├── Transaction.ts          # Permanent Credit & Debit ledger entries
│   ├── Notification.ts         # Broadcast and direct customer notices
│   └── AuditLog.ts             # Administrative audit trail records
├── middleware/
│   ├── auth.ts                 # JWT verification, RBAC, and audit logger
│   └── errorHandler.ts         # Centralized error handler
├── utils/
│   ├── jwt.ts                  # Token generation and verification
│   └── calculations.ts         # Dynamic balance & running ledger calculations
├── routes/
│   ├── authRoutes.ts           # Login, profile, impersonation, password
│   ├── customerRoutes.ts       # Customer CRUD, ledger, and balances
│   ├── productRoutes.ts        # Product catalog CRUD
│   ├── transactionRoutes.ts    # Credit & Debit transactions CRUD
│   ├── notificationRoutes.ts   # Notification dispatch & read status
│   ├── reportRoutes.ts         # Executive stats & CSV data
│   └── auditLogRoutes.ts       # Audit trail query endpoints
├── src/
│   ├── components/
│   │   ├── Navbar.tsx                   # Top header & impersonation banner
│   │   ├── LoginView.tsx                # Role-based login with demo accounts
│   │   ├── AdminDashboard.tsx           # Financial overview & charts
│   │   ├── CustomerManagement.tsx       # Customer records & toolbar
│   │   ├── CustomerAccountViewModal.tsx # Customer profile sheet & ledger
│   │   ├── TransactionManagement.tsx    # Credit/Debit transactions list
│   │   ├── AddTransactionModal.tsx      # Credit/Debit creation form
│   │   ├── AddEditCustomerModal.tsx     # Customer creation/editing
│   │   ├── ProductManagement.tsx        # Catalog & price manager
│   │   ├── NotificationManagement.tsx   # Notice composition & history
│   │   ├── ReportsView.tsx              # Balance reports & CSV export
│   │   ├── AuditLogsView.tsx            # Security audit trail
│   │   ├── CustomerPortal.tsx           # Customer-side portal view
│   │   ├── TransactionDetailModal.tsx   # Receipt modal
│   │   └── ChangePasswordModal.tsx      # Password update modal
│   ├── services/
│   │   └── api.ts              # Type-safe client-side API layer
│   ├── App.tsx                 # Root application controller
│   ├── main.tsx                # React DOM entry
│   └── index.css               # Global Tailwind CSS and print rules
├── server.ts                   # Express server mounting APIs and Vite middleware
├── package.json
└── README.md
```

---

## 5. MongoDB Configuration & Database Setup

CredEx supports two database modes out-of-the-box:

1. **Embedded / Zero-Config Mode (Default)**:
   If `MONGODB_URI` is not provided in your environment, CredEx automatically spins up an in-memory MongoDB engine (`mongodb-memory-server`) and seeds it with default accounts, products, and ledger transactions.
2. **External MongoDB Mode (Production / MongoDB Atlas)**:
   Specify your connection string in `.env`:
   ```bash
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/credex?retryWrites=true&w=majority
   ```

---

## 6. Installation & How to Run

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file (or copy from `.env.example`):
```bash
cp .env.example .env
```
Ensure `JWT_SECRET` is set:
```bash
JWT_SECRET=your-secure-production-jwt-key
```

### 3. Start Development Server
```bash
npm run dev
```
The server starts at `http://localhost:3000`.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 7. Default Credentials

The database automatically seeds the initial admin and sample customers upon first run:

| Role | Name | Email | Password | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | Administrator | `admin@example.com` | `Admin@123456` | Full CRUD, ledger, audit, and impersonation privileges |
| **Customer** | Rahul Sharma | `rahul.sharma@example.com` | `Customer@123456` | Active ledger with purchases and partial payments |
| **Customer** | Priya Patel | `priya.patel@example.com` | `Customer@123456` | Settled account ledger |
| **Customer** | Amit Verma | `amit.verma@example.com` | `Customer@123456` | Enterprise services account |

*Note: You can also use the 1-click demo login buttons directly on the Login page.*

---

## 8. REST API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/login` — Sign in as admin or customer.
- `GET  /api/auth/me` — Retrieve session profile and customer details.
- `POST /api/auth/impersonate/:customerId` — Admin impersonates customer (audit logged).
- `POST /api/auth/change-password` — Change password with current password verification.
- `POST /api/auth/logout` — Revoke session.

### Customers (`/api/customers`)
- `GET    /api/customers` — List all customers with dynamically computed `totalCredit`, `totalDebit`, `balance`, and `transactionCount`.
- `GET    /api/customers/:id` — Customer account sheet (restricted to owner or admin).
- `POST   /api/customers` — Create customer and generate customer portal login.
- `PUT    /api/customers/:id` — Update customer information.
- `DELETE /api/customers/:id` — Delete customer (prevents deletion if active transactions exist).
- `GET    /api/customers/:id/ledger` — Chronological ledger with computed running balance.
- `GET    /api/customers/:id/balance` — Real-time balance inquiry.

### Products (`/api/products`)
- `GET    /api/products` — List catalog products with search, category, and status filters.
- `GET    /api/products/:id` — Retrieve product details.
- `POST   /api/products` — Admin adds new product.
- `PUT    /api/products/:id` — Admin edits product price or details.
- `DELETE /api/products/:id` — Admin deletes or soft-deactivates product.

### Transactions (`/api/transactions`)
- `GET    /api/transactions` — Query ledger entries with filters (date range, customer, type, product). Customers are strictly limited to their own records.
- `GET    /api/transactions/:id` — Detailed transaction receipt.
- `POST   /api/transactions` — Record Credit or Debit transaction; automatically triggers customer notification and recalculates balances.
- `PUT    /api/transactions/:id` — Edit transaction with audit record.
- `DELETE /api/transactions/:id` — Delete transaction with audit record.

### Notifications (`/api/notifications`)
- `GET    /api/notifications` — Fetch announcements & notifications.
- `POST   /api/notifications` — Admin dispatches to individual, multiple, or all customers.
- `PUT    /api/notifications/:id/read` — Mark notification as read.
- `PUT    /api/notifications/read-all` — Mark all customer notifications as read.
- `DELETE /api/notifications/:id` — Delete notification.

### Reports (`/api/reports`)
- `GET /api/reports/dashboard-stats` — Executive summary statistics, monthly trends, and top balances.
- `GET /api/reports/customers` — Customer balances report for CSV export.
- `GET /api/reports/transactions` — Transaction audit trail report.
- `GET /api/reports/products` — Product volume and sales report.

### Audit Logs (`/api/audit-logs`)
- `GET /api/audit-logs` — Immutable audit log records for administrative compliance.

---

## 9. Security Notes

1. **Password Security**: Passwords are never stored in plaintext and are salted and hashed using `bcrypt` (10 rounds).
2. **Access Control**: Role-based middleware (`authenticateJWT`, `requireAdmin`, `requireCustomer`) protects all endpoints.
3. **Data Isolation**: Customers cannot access any other customer's ID, transactions, or notifications.
4. **Audit Trail**: Every customer impersonation, transaction alteration, and balance adjustment is recorded in `AuditLog` with client IP and initiator details.
5. **No Password Leakage**: Passwords and sensitive hash strings are stripped from all API outputs.
