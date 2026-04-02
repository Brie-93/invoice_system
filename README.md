# Invoice.Flow

A full-stack invoicing and payment tracking web application built for businesses that deal with sales — furniture shops, freelancers, studios, and any business that needs to send and manage invoices professionally.

🌐 **Live App:** [https://invoice-system-uyig.vercel.app](https://invoice-system-uyig.vercel.app)

---

## Features

### Invoicing
- Create new invoices with line items, quantities, and unit prices
- Auto-calculates subtotal, 10% tax, and total amount in Kenyan Shillings (Ksh)
- Save invoices as **drafts** to finish later, or send them immediately as **pending** invoices
- Edit and update draft invoices before sending
- Download invoices as PDFs
- Export invoice data as **CSV**
- Unique invoice ID generated for every invoice

### Payment Tracking
- Track partial payments against any invoice
- Mark invoices as **fully paid** in one click
- Record **overpayments** with excess amount tracking
- Invoice statuses: `Draft`, `Pending`, `Partial`, `Paid`, `Overpaid`
- See outstanding balance per invoice at a glance

### Client Management
- Add and manage clients with name, email, and address
- View all invoices belonging to a specific client
- Create an invoice directly from a client's profile
- Soft-delete clients — historical invoice data is preserved even after deletion

### Dashboard & Analytics
- Studio overview with key metrics: **Total Revenue**, **Outstanding Balance**, **Active Clients**
- Revenue vs Invoiced chart across the **last 12 months**
- Month-by-month breakdown of collected vs billed amounts
- Records & history view — full snapshot of all clients and invoices including deleted ones

### User Account
- Secure **JWT-based authentication** (register, login, logout)
- Change password from the Settings page
- User avatar with dropdown showing name and email
- Session persisted via localStorage token

### UI & Experience
- **Dark mode / Light mode** toggle with OS preference detection and localStorage persistence
- Smooth animations and transitions using Framer Motion
- Slide-over invoice form panel
- Toast notifications for all actions (success, error, loading states)
- Responsive, clean design with Tailwind CSS
- Search and filter invoices by client, ID, or amount

---

## Tech Stack

### Frontend
- [Next.js 16](https://nextjs.org/) (App Router, TypeScript)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/) — animations
- [Lucide React](https://lucide.dev/) — icons
- [Sonner](https://sonner.emilkowal.ski/) — toast notifications
- [Recharts](https://recharts.org/) — dashboard charts
- Deployed on **Vercel**

### Backend
- [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) (TypeScript)
- [Prisma ORM v6](https://www.prisma.io/) — database access
- [MySQL](https://www.mysql.com/) — hosted on [Aiven](https://aiven.io/)
- [bcryptjs](https://www.npmjs.com/package/bcryptjs) — password hashing
- [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) — auth tokens
- Deployed on **Render**

---

## Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- MySQL database (local or cloud)

### 1. Clone the repositories

```bash
# Frontend
git clone https://github.com/Brie-93/invoice_system.git
cd invoice_system
npm install

# Backend (separate repo)
git clone <your-backend-repo-url>
cd invoice_system_server
npm install
```

### 2. Set up environment variables

**Backend — create `src/.env`:**
```env
DATABASE_URL="mysql://user:password@host:port/dbname?ssl=true"
JWT_SECRET="your_secret_key"
PORT=3001
```

**Frontend — create `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Set up the database

```bash
cd invoice_system_server
npx prisma generate
npx prisma migrate dev
```

### 4. Run both servers

```bash
# Backend
npm run dev

# Frontend (separate terminal)
npm run dev
```

Frontend runs on `http://localhost:3000`, backend on `http://localhost:3001`.

---

## Project Structure

```
invoice_system/               # Next.js frontend
├── app/
│   ├── components/           # UI components
│   │   ├── Dashboard.tsx
│   │   ├── InvoiceForm.tsx
│   │   ├── InvoiceList.tsx
│   │   ├── ClientList.tsx
│   │   ├── Settings.tsx
│   │   └── Sidebar.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── login/
│   └── globals.css

invoice_system_server/        # Express backend
├── src/
│   ├── controllers/
│   │   ├── apiController.ts
│   │   └── authController.ts
│   ├── middleware/
│   │   └── auth.ts
│   ├── routes/
│   │   ├── apiRoutes.ts
│   │   └── authRoutes.ts
│   ├── utils/
│   │   └── prisma.ts
│   └── index.ts
├── prisma/
│   └── schema.prisma
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and receive JWT |
| PUT | `/api/auth/change-password` | Update password (auth required) |

### Clients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/app/clients` | Get all active clients |
| POST | `/api/app/clients` | Create a new client |
| DELETE | `/api/app/clients/:id` | Soft delete a client |

### Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/app/invoices` | Get all active invoices |
| GET | `/api/app/invoices/:id` | Get a single invoice |
| POST | `/api/app/invoices` | Create a new invoice |
| PATCH | `/api/app/invoices/:id` | Update invoice (payment, draft edit, status) |
| DELETE | `/api/app/invoices/:id` | Soft delete an invoice |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/app/dashboard` | Get stats and chart data |
| GET | `/api/app/records` | Get full records history |

---

## Deployment

### Frontend (Vercel)
- Connect your GitHub repo to Vercel
- Add environment variable: `NEXT_PUBLIC_API_URL=https://your-render-url.onrender.com`
- Vercel auto-deploys on every push to `main`

### Backend (Render)
- Connect your backend GitHub repo to Render
- Add environment variables: `DATABASE_URL`, `JWT_SECRET`, `PORT`
- Set build command: `npx prisma generate && tsc`
- Set start command: `node dist/index.js`
- Render auto-deploys on every push to `main`

---

## License

MIT