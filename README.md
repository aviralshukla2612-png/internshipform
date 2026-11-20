# Enterprise Recruitment & HR Management System

An end-to-end, production-ready recruitment and applicant tracking platform built with a high-performance decoupled monorepo architecture:
- **Frontend:** Next.js 15 App Router, TypeScript, Tailwind CSS, Lucide, React Hook Form, TanStack Query, Recharts, FullCalendar.
- **Backend:** NestJS 10, TypeScript, Prisma ORM, Argon2id, Swagger/OpenAPI, Helmet, Throttler rate limiting, BullMQ.
- **Database:** PostgreSQL with 26 normalized relational models.
- **Messaging & Notifications:** Official Meta WhatsApp Business Cloud API (v18.0) with HMAC-SHA256 signature verification, transactional Email notification engine (Resend / SMTP).
- **Security:** Strict RBAC (`SUPER_ADMIN`, `HR_ADMIN`, `INTERVIEWER`), magic byte file signature validation (checking actual file binary headers for PDF/JPEG/PNG), HTTP-only cookies, time-bounded private downloads, login attempt throttling (5 attempts -> 15 min lock).

---

## Workspace Structure

```
d:/essform/
├── apps/
│   ├── backend/                       # NestJS 10+ Enterprise API
│   │   ├── prisma/
│   │   │   ├── schema.prisma          # Complete 26-entity normalized schema
│   │   │   └── seed.ts                # SuperAdmin, default roles, permissions & settings
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/              # Argon2id, JWT/Session, lockout, MFA
│   │   │   │   ├── audit/             # Tamper-resistant immutable audit logs
│   │   │   │   ├── candidates/        # Candidates profile management & deduplication
│   │   │   │   ├── applications/      # Multi-step submission & lifecycle transitions
│   │   │   │   ├── jobs/              # Job position CRUD & public links
│   │   │   │   ├── interviews/        # Scheduling, conflict detection, calendar
│   │   │   │   ├── feedback/          # Interviewer rating & evaluation matrices
│   │   │   │   ├── documents/         # Magic byte verification & secure presigned URLs
│   │   │   │   ├── whatsapp/          # Meta Cloud API, webhooks & BullMQ queues
│   │   │   │   ├── email/             # Transactional email engine
│   │   │   │   ├── reports/           # Real DB aggregations & CSV exports
│   │   │   │   └── settings/          # System-level configuration
│   │   └── test/                      # Comprehensive unit and security test suites
│   │
│   └── frontend/                      # Next.js 15 App Router
│       ├── src/
│       │   ├── app/
│       │   │   ├── (public)/          # Candidate portal (landing, apply, track)
│       │   │   │   ├── jobs/          # Public listings & position detail
│       │   │   │   ├── apply/[jobId]/ # 6-Step responsive application form
│       │   │   │   └── track/         # Secure candidate status portal
│       │   │   ├── (auth)/login/      # Protected admin login & recovery
│       │   │   └── (dashboard)/       # Role-protected HR/Admin dashboard (15 views)
│       │   ├── components/            # Reusable UI primitives & providers
│       │   └── lib/                   # API client, React Query, utilities
│       └── package.json
│
├── packages/
│   └── shared/                        # Shared DTOs, Enums, Zod Schemas & Types
├── docker-compose.yml                 # Local PostgreSQL and Redis infrastructure
└── .env.example                       # Documented environment templates
```

---

## 1. Quick Start & Local Development

### Prerequisites
- Node.js >= 20 (Node v24.19.0 recommended)
- pnpm >= 9 (pnpm v12 recommended)
- PostgreSQL (Local or via Docker Compose)

### Step 1: Clone & Configure Environment
```bash
cp .env.example .env
```
Ensure your `DATABASE_URL` is set in `.env`. Example:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/recruitment_db?schema=public"
JWT_SECRET="replace-with-a-very-secure-random-secret-key-at-least-32-chars"
```

### Step 2: Start Infrastructure (Optional if running Docker)
```bash
docker-compose up -d
```

### Step 3: Run Database Migrations & Seed
```bash
pnpm --filter backend db:generate
pnpm --filter backend db:migrate
pnpm --filter backend db:seed
```

Default seeded credentials:
- **Super Administrator:** `admin@enterprise.com` / `AdminSecurePassword123!@#`
- **Lead Interviewer:** `interviewer@enterprise.com` / `Interviewer123!@#`

### Step 4: Run Development Servers
```bash
# Terminal 1: Backend API (runs on port 4000)
pnpm --filter backend start:dev

# Terminal 2: Frontend App (runs on port 3000)
pnpm --filter frontend dev
```

---

## 2. Testing & Quality Assurance

Run all unit, security, and integration test suites:
```bash
pnpm --filter backend test
```
Passing test suites:
- `test/percentage.spec.ts`: Percentage calculation accuracy, edge cases, obtained > total error.
- `test/gender-validation.spec.ts`: Mandatory gender enforcement.
- `test/magic-bytes.spec.ts`: Binary header signature verification and disguised script attack prevention.
- `test/interview-conflict.spec.ts`: Interview scheduling conflict engine and double-booking detection.
- `test/webhook-signature.spec.ts`: Meta WhatsApp Cloud API HMAC-SHA256 signature verification.

---

## 3. Production Deployment

### Backend (VPS / Container Cloud):
```bash
pnpm --filter @recruitment/shared build
pnpm --filter backend build
pnpm --filter backend start:prod
```

### Frontend (Vercel / Cloud):
Deploy `apps/frontend` to Vercel with:
- Root directory: `apps/frontend`
- Build command: `pnpm run build`
- Environment variable: `NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1`
