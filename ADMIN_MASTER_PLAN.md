# 🎛️ ADMIN_MASTER_PLAN.md: Lovart-Flow Mission Control

> **Enterprise-Grade Admin Panel Architecture (2025 Standard)**  
> 这是一个企业级后台管理系统的完整架构方案，采用 **Server-Driven UI**、**RBAC**、**审计日志** 等现代最佳实践。

---

## 📋 Table of Contents

1. [Architecture & Tech Stack](#1-architecture--tech-stack-the-2025-standard)
2. [System Architecture Diagram](#2-system-architecture-diagram)
3. [Core Modules (4 Pillars)](#3-core-modules-the-must-haves)
4. [Database Schema](#4-database-schema)
5. [Security Architecture](#5-security-architecture)
6. [Development Phases](#6-development-phases--cursor-prompts)
7. [Performance Optimization](#7-performance-optimization)
8. [Monitoring & Observability](#8-monitoring--observability)
9. [Testing Strategy](#9-testing-strategy)
10. [CI/CD Pipeline](#10-cicd-pipeline)
11. [Growth Engine Module](#11-growth-engine-module)

---

## 1. Architecture & Tech Stack (The 2025 Standard)

### Frontend Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | Next.js 14+ (App Router) | Server Components, Route Groups, Middleware |
| **Admin UI** | Refine 4.x | Enterprise-grade admin framework |
| **UI Components** | Radix UI + Shadcn/ui | Accessible, customizable components |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **State Management** | TanStack Query (React Query) | Server state management with caching |
| **Form Handling** | React Hook Form + Zod | Type-safe form validation |
| **Code Editor** | Monaco Editor | JSON Schema editing |
| **Charts** | Recharts / Chart.js | Analytics visualization |

### Backend Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **API Framework** | FastAPI (Python) | High-performance async API |
| **Database** | Supabase (PostgreSQL) | Primary data store with RLS |
| **Storage** | Cloudflare R2 | Media storage (zero egress fees) |
| **Auth** | Supabase Auth | JWT-based authentication |
| **Queue** | Celery + Redis | Background task processing |
| **Email** | Resend | Transactional emails |
| **Monitoring** | Sentry + OpenTelemetry | Error tracking & observability |

### Integration Pattern

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Next.js + Refine)                                 │
│  ├─ Route: /admin/*                                          │
│  ├─ Middleware: RBAC Check                                   │
│  └─ Data Provider: Supabase (with Service Role for admin)   │
└─────────────────────────────────────────────────────────────┘
                          ↓ HTTP API
┌─────────────────────────────────────────────────────────────┐
│  Backend (FastAPI)                                          │
│  ├─ /api/admin/credits/gift                                 │
│  ├─ /api/admin/users/ban                                     │
│  └─ /api/admin/audit/logs                                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Supabase (PostgreSQL)                                      │
│  ├─ RLS Policies (Row Level Security)                       │
│  ├─ Service Role Key (Admin bypass)                         │
│  └─ Realtime Subscriptions                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. System Architecture Diagram

### Data Flow: Admin Action → Audit Log

```
┌──────────────┐
│ Admin User   │
│ (Browser)    │
└──────┬───────┘
       │ 1. Click "Gift Credits"
       ↓
┌─────────────────────────────────────┐
│ Next.js Middleware                  │
│ ├─ Check JWT Token                  │
│ ├─ Verify role === 'admin'          │
│ └─ Allow /admin/* routes            │
└──────┬──────────────────────────────┘
       │ 2. POST /api/admin/credits/gift
       ↓
┌─────────────────────────────────────┐
│ FastAPI Backend                     │
│ ├─ Validate request                 │
│ ├─ Atomic transaction (BEGIN)       │
│ ├─ Update credits in DB            │
│ ├─ Insert audit_log                │
│ └─ Commit transaction               │
└──────┬──────────────────────────────┘
       │ 3. Update Supabase
       ↓
┌─────────────────────────────────────┐
│ Supabase PostgreSQL                 │
│ ├─ profiles.credits += amount      │
│ ├─ credit_transactions (INSERT)     │
│ └─ admin_audit_logs (INSERT)       │
└─────────────────────────────────────┘
       │ 4. Realtime Update
       ↓
┌─────────────────────────────────────┐
│ Frontend (Refine)                   │
│ ├─ TanStack Query refetch          │
│ └─ UI updates automatically        │
└─────────────────────────────────────┘
```

---

## 3. Core Modules (The "Must-Haves")

### 🏛️ Pillar 1: AI Model Orchestration (Configuration Engine)

**Goal**: Update frontend AI capabilities without deploying code.

#### Features

1. **List View** (`/admin/ai-models`)
   - Table with columns: Name, Type, Provider, API Path, Cost, Status, Parameters Count
   - Filters: Type (IMAGE/VIDEO), Provider, Status (Active/Inactive)
   - Search: By name or API path
   - Bulk actions: Activate/Deactivate multiple models

2. **Edit View** (Modal or Full Page)
   - **Basic Info Tab**:
     - Name (required)
     - Type (IMAGE/VIDEO) - Select
     - Provider (REPLICATE/FAL/CUSTOM) - Select
     - API Path (required) - e.g., `"kling-ai/kling-video-v2"`
     - Cost per Generation (integer, credits)
     - Description (optional)
     - Icon URL (optional)
     - Is Active (toggle)
   
   - **Schema Editor Tab** (Monaco Editor):
     ```json
     [
       {
         "key": "duration",
         "label": "Duration",
         "type": "select",
         "options": [
           {"label": "5s", "value": "5s"},
           {"label": "10s", "value": "10s"}
         ],
         "default": "5s"
       },
       {
         "key": "aspect_ratio",
         "label": "Aspect Ratio",
         "type": "grid_select",
         "options": ["16:9", "1:1", "9:16"],
         "default": "16:9"
       },
       {
         "key": "guidance_scale",
         "label": "Guidance Scale",
         "type": "slider",
         "min": 1,
         "max": 20,
         "step": 0.5,
         "default": 7.5
       }
     ]
     ```
   
   - **Live Preview** (Right Panel):
     - Renders the actual form inputs based on the JSON schema
     - Updates in real-time as admin edits the JSON
     - Validates schema structure (must have `key`, `type`, `label`)

3. **Actions**
   - **Sync from Provider**: Fetch latest model specs from Replicate/Fal API (optional)
   - **Clone Model**: Duplicate an existing model configuration
   - **Export/Import**: JSON export for backup, import for migration

#### Implementation Details

- **Component**: `frontend/src/app/admin/ai-models/page.tsx`
- **Form Component**: `frontend/src/components/admin/AiModelForm.tsx`
- **Schema Validator**: Zod schema for `parameters_schema` validation
- **Monaco Editor**: `@monaco-editor/react` with JSON language support

---

### 👥 Pillar 2: User CRM & Finance

**Goal**: 360° view of customer activity with safe credit management.

#### Features

1. **List View** (`/admin/profiles`)
   - Table columns:
     - Email
     - Credits (with color coding: < 10 = red, < 50 = yellow, >= 50 = green)
     - Plan (Pro/Free) - Badge
     - Total Spend (calculated from `credit_transactions`)
     - Joined Date
     - Last Active
     - Status (Active/Banned/Suspended)
   - Filters:
     - Plan: Pro / Free
     - Credits: < 10 / < 50 / >= 50
     - Status: Active / Banned / Suspended
     - Date Range: Joined date
   - Search: By email or user ID
   - Bulk actions: Export CSV, Bulk email

2. **Detail View** (`/admin/profiles/[id]`)
   - **Profile Card**:
     - Avatar (with upload)
     - Email
     - Stripe Customer ID (link to Stripe dashboard)
     - Referral Code
     - Created At / Last Active
   
   - **Credit Ledger** (Timeline Component):
     - Chronological list of all credit transactions
     - Columns: Date, Type (Top-up/Generation/Refund/Gift), Amount, Balance After, Reason
     - Filters: Type, Date Range
     - Export: CSV download
   
   - **Actions Panel**:
     - **Gift Credits**:
       - Modal: Input amount (integer), reason (textarea)
       - Calls: `POST /api/admin/credits/gift`
       - Payload: `{ userId, amount, reason, adminId }`
       - Backend handles atomic transaction + audit log
     
     - **Refund Transaction**:
       - Select a generation from the ledger
       - Click "Refund" → Confirmation modal
       - Calls: `POST /api/admin/credits/refund`
       - Payload: `{ transactionId, reason }`
     
     - **Ban User**:
       - Toggle: Ban/Unban
       - Calls: `POST /api/admin/users/ban`
       - Payload: `{ userId, banned: boolean, reason }`
     
     - **Reset Password**:
       - Sends password reset email via Supabase Auth

3. **Analytics Widgets** (Dashboard Cards):
   - Total Users (with growth %)
   - Pro Users Count
   - Average Credits per User
   - Total Revenue (from Stripe)

#### Implementation Details

- **Component**: `frontend/src/app/admin/profiles/page.tsx`
- **Detail Component**: `frontend/src/app/admin/profiles/[id]/page.tsx`
- **Credit Ledger**: `frontend/src/components/admin/CreditLedger.tsx`
- **Backend Endpoints**:
  - `POST /api/admin/credits/gift`
  - `POST /api/admin/credits/refund`
  - `POST /api/admin/users/ban`

---

### 🛡️ Pillar 3: Content Moderation (Safety)

**Goal**: Efficient visual review of user-generated content.

#### Features

1. **Gallery View** (`/admin/moderation`)
   - **Layout**: Masonry grid (like Pinterest)
   - **Card Component**:
     - Image/Video thumbnail (lazy-loaded)
     - Metadata overlay:
       - User email (link to profile)
       - Prompt text (truncated)
       - Model used
       - Generated date
       - NSFW Score (if auto-detected)
     - Actions:
       - **Blur/Unblur**: Toggle `is_nsfw` flag
       - **Delete**: Soft delete (replace with placeholder)
       - **Ban User**: Quick action to ban the creator
       - **View Full**: Opens modal with full-size image/video
   
   - **Filters**:
     - Status: All / Reported / NSFW (score > 0.8) / Deleted
     - Date Range
     - Model
     - User
   
   - **Bulk Actions**:
     - Select multiple items → Bulk blur/delete/ban

2. **Report Queue** (Separate Tab):
   - List of user-reported content
   - Priority: High (multiple reports) / Medium / Low
   - Quick actions: Approve (dismiss) / Blur / Delete

3. **Auto-Moderation** (Backend Integration):
   - Optional: Integrate with NSFW detection API (e.g., AWS Rekognition)
   - Auto-flag content with score > 0.8
   - Admin review queue for flagged items

#### Implementation Details

- **Component**: `frontend/src/app/admin/moderation/page.tsx`
- **Masonry Grid**: `react-masonry-css` or CSS Grid
- **Image Card**: `frontend/src/components/admin/ModerationCard.tsx`
- **Backend Endpoints**:
  - `POST /api/admin/moderation/blur`
  - `POST /api/admin/moderation/delete`
  - `GET /api/admin/moderation/reports`

---

### 📊 Pillar 4: Analytics Dashboard

**Goal**: Real-time insights into platform health and growth.

#### Features

1. **Key Metrics** (Top Cards):
   - **MRR** (Monthly Recurring Revenue)
     - Current month + Growth %
     - Source: Stripe API (subscriptions)
   - **Token Burn Rate**
     - Credits consumed per hour (last 24h)
     - Chart: Line graph (hourly)
   - **Model Popularity**
     - Pie chart: Usage distribution (Flux vs Kling vs others)
     - Data: Count of generations per model
   - **Active Users**
     - DAU (Daily Active Users)
     - MAU (Monthly Active Users)
     - Growth trend

2. **Charts** (Recharts):
   - **Revenue Trend**: Line chart (MRR over time)
   - **Credit Consumption**: Area chart (daily credits burned)
   - **Model Usage**: Stacked bar chart (models over time)
   - **User Growth**: Line chart (new signups per day)

3. **Data Export**:
   - Export metrics as CSV/JSON
   - Scheduled reports (email weekly summary)

#### Implementation Details

- **Component**: `frontend/src/app/admin/dashboard/page.tsx`
- **Charts**: Recharts or Chart.js
- **Data Source**: 
  - Supabase (aggregated queries)
  - Stripe API (revenue data)
  - Custom analytics table (pre-aggregated for performance)

---

## 4. Database Schema

### Core Tables

#### `ai_models` (Already exists)
```sql
CREATE TABLE public.ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('IMAGE', 'VIDEO')),
  provider TEXT NOT NULL CHECK (provider IN ('REPLICATE', 'FAL', 'CUSTOM')),
  api_path TEXT NOT NULL,
  cost_per_gen INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  parameters_schema JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  icon_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `admin_audit_logs` (New - Critical for Security)
```sql
CREATE TABLE public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action_type TEXT NOT NULL, -- 'gift_credits', 'ban_user', 'update_model', etc.
  resource_type TEXT NOT NULL, -- 'user', 'model', 'generation', etc.
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX idx_admin_audit_logs_action_type ON public.admin_audit_logs(action_type);
```

#### `credit_transactions` (New - For Credit Ledger)
```sql
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  type TEXT NOT NULL CHECK (type IN ('TOPUP', 'GENERATION', 'REFUND', 'GIFT', 'REFERRAL')),
  amount INTEGER NOT NULL, -- Positive for credits added, negative for spent
  balance_after INTEGER NOT NULL,
  reason TEXT,
  related_generation_id UUID REFERENCES public.generations(id),
  admin_id UUID REFERENCES auth.users(id), -- If action was by admin
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);
```

#### `content_reports` (New - For Moderation)
```sql
CREATE TABLE public.content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID NOT NULL REFERENCES public.generations(id),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id),
  reason TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RESOLVED', 'DISMISSED')),
  admin_id UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_reports_status ON public.content_reports(status);
CREATE INDEX idx_content_reports_generation_id ON public.content_reports(generation_id);
```

### RLS Policies

```sql
-- Admin audit logs: Only service role can read/write
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.admin_audit_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Credit transactions: Users can view their own
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);
```

---

## 5. Security Architecture

### Authentication & Authorization

1. **Middleware** (`frontend/src/middleware.ts`):
   ```typescript
   export async function middleware(request: NextRequest) {
     const supabase = createClient();
     const { data: { user } } = await supabase.auth.getUser();
     
     if (request.nextUrl.pathname.startsWith('/admin')) {
       if (!user) {
         return NextResponse.redirect(new URL('/login', request.url));
       }
       
       // Check admin role
       const role = user.app_metadata?.role;
       if (role !== 'admin') {
         return NextResponse.redirect(new URL('/', request.url));
       }
     }
     
     return NextResponse.next();
   }
   ```

2. **Service Role Key**:
   - Admin pages use Supabase Service Role Key (server-side only)
   - Bypasses RLS for admin operations
   - **Never expose to client-side code**

3. **Audit Logging**:
   - Every admin action is logged to `admin_audit_logs`
   - Includes: admin_id, action_type, resource_id, old/new values, IP, user_agent
   - Python decorator: `@log_admin_action`

### Security Best Practices

- ✅ **API Keys**: Never stored in database, only in backend environment variables
- ✅ **RLS**: Row Level Security enabled on all tables
- ✅ **Rate Limiting**: Backend API endpoints have rate limits
- ✅ **CSRF Protection**: Next.js built-in CSRF protection
- ✅ **Input Validation**: Zod schemas for all form inputs
- ✅ **SQL Injection**: Parameterized queries only (Supabase handles this)
- ✅ **XSS Protection**: React automatically escapes, but sanitize user inputs

---

## 6. Development Phases & Cursor Prompts

### 🟥 Phase 1: Refine Integration & Auth

**Goal**: Securely mount Refine inside Next.js with RBAC.

> **Cursor Command**:
> ```
> Start Admin Phase 1: Refine Integration & Auth.
> 
> 1. Install dependencies:
>    - @refinedev/core
>    - @refinedev/nextjs-router
>    - @refinedev/supabase
>    - @refinedev/react-hook-form
>    - @refinedev/react-table
> 
> 2. Create route group: app/(admin)/admin
> 
> 3. Create AdminLayout component:
>    - Sidebar navigation (Shadcn Sidebar)
>    - Top bar with user menu
>    - Responsive (mobile drawer)
> 
> 4. Update middleware.ts:
>    - Check Supabase auth
>    - Verify user.app_metadata.role === 'admin'
>    - Redirect unauthorized to /
> 
> 5. Create admin service role client:
>    - frontend/src/utils/supabase/admin.ts
>    - Uses SERVICE_ROLE_KEY (server-side only)
> 
> 6. Test: Access /admin without login → redirect to /login
> ```

### 🟧 Phase 2: AI Model Configurator

**Goal**: Build the Server-Driven UI backend interface.

> **Cursor Command**:
> ```
> Start Admin Phase 2: AI Models Resource.
> 
> 1. Create resource: app/admin/ai-models/page.tsx
>    - List view with Refine useList
>    - Table with columns: Name, Type, Provider, Cost, Status
>    - Filters: Type, Provider, Status
>    - Search: By name
> 
> 2. Create form component: components/admin/AiModelForm.tsx
>    - React Hook Form + Zod validation
>    - Tabs: Basic Info / Schema Editor
>    - Monaco Editor for parameters_schema (JSON)
>    - Live preview panel (renders form inputs from schema)
> 
> 3. Schema validation:
>    - Zod schema for parameters_schema array
>    - Each item must have: key, label, type
>    - Type must be: select, grid_select, slider, switch, text
> 
> 4. Actions:
>    - Create / Edit / Delete
>    - Bulk activate/deactivate
> 
> 5. Test: Create a model, edit schema, verify preview updates
> ```

### 🟨 Phase 3: User CRM & Atomic Actions

**Goal**: Safe credit management with audit logging.

> **Cursor Command**:
> ```
> Start Admin Phase 3: User CRM.
> 
> 1. Create profiles list: app/admin/profiles/page.tsx
>    - Table: Email, Credits, Plan, Total Spend, Joined Date
>    - Filters: Plan, Credits range, Status
>    - Search: By email
> 
> 2. Create detail page: app/admin/profiles/[id]/page.tsx
>    - Profile card (avatar, email, Stripe ID)
>    - Credit ledger component (timeline of transactions)
>    - Actions panel: Gift Credits, Refund, Ban
> 
> 3. Create credit ledger: components/admin/CreditLedger.tsx
>    - Fetch from credit_transactions table
>    - Timeline UI (vertical)
>    - Filters: Type, Date range
> 
> 4. Backend endpoints (Python):
>    - POST /api/admin/credits/gift
>      - Validate admin role
>      - Atomic transaction: update credits + insert transaction + audit log
>    - POST /api/admin/credits/refund
>    - POST /api/admin/users/ban
> 
> 5. Create audit log decorator: @log_admin_action
>    - Auto-log all admin actions
>    - Include: admin_id, action_type, resource_id, old/new values
> 
> 6. Test: Gift credits, verify ledger updates, check audit log
> ```

### 🟩 Phase 4: Content Moderation

**Goal**: Efficient visual review of user-generated content.

> **Cursor Command**:
> ```
> Start Admin Phase 4: Content Moderation.
> 
> 1. Create moderation page: app/admin/moderation/page.tsx
>    - Masonry grid layout (react-masonry-css)
>    - Lazy-loaded images
>    - Filters: Status, Date, Model, User
> 
> 2. Create moderation card: components/admin/ModerationCard.tsx
>    - Image thumbnail
>    - Metadata overlay (user, prompt, model, date)
>    - Actions: Blur, Delete, Ban User, View Full
> 
> 3. Backend endpoints:
>    - POST /api/admin/moderation/blur (toggle is_nsfw)
>    - POST /api/admin/moderation/delete (soft delete)
>    - GET /api/admin/moderation/reports
> 
> 4. Update generations table:
>    - Add is_nsfw BOOLEAN DEFAULT false
>    - Add is_deleted BOOLEAN DEFAULT false
>    - Add nsfw_score FLOAT (for auto-moderation)
> 
> 5. Test: Blur an image, verify frontend respects flag
> ```

### 🟦 Phase 5: Analytics Dashboard

**Goal**: Real-time insights into platform health.

> **Cursor Command**:
> ```
> Start Admin Phase 5: Analytics Dashboard.
> 
> 1. Create dashboard: app/admin/dashboard/page.tsx
>    - Top metrics cards: MRR, Burn Rate, Model Popularity, Active Users
>    - Charts: Revenue trend, Credit consumption, Model usage, User growth
> 
> 2. Create API routes:
>    - GET /api/admin/analytics/mrr (from Stripe)
>    - GET /api/admin/analytics/burn-rate (from credit_transactions)
>    - GET /api/admin/analytics/model-popularity (from generations)
> 
> 3. Use Recharts for visualization
> 
> 4. Add data export: CSV/JSON download
> 
> 5. Test: Verify metrics update in real-time
> ```

---

## 7. Performance Optimization

### Frontend

1. **Caching Strategy**:
   - TanStack Query: `staleTime: 5 minutes` for model list
   - React Query DevTools for debugging
   - Optimistic updates for admin actions

2. **Code Splitting**:
   - Dynamic imports for Monaco Editor (heavy)
   - Route-based code splitting (Next.js automatic)

3. **Image Optimization**:
   - Next.js Image component for moderation gallery
   - Lazy loading with Intersection Observer

### Backend

1. **Database Indexing**:
   - Indexes on all foreign keys
   - Composite indexes for common queries (e.g., `(user_id, created_at)`)

2. **Query Optimization**:
   - Use `select()` to limit columns
   - Pagination for large lists (Refine built-in)
   - Aggregated queries for analytics (pre-compute if needed)

3. **Caching**:
   - Redis cache for frequently accessed data (model list)
   - Cache invalidation on model updates

---

## 8. Monitoring & Observability

### Error Tracking

- **Sentry**: Frontend + Backend error tracking
- **Error Boundaries**: React error boundaries for admin pages
- **Logging**: Structured logging (JSON) in backend

### Performance Monitoring

- **Vercel Analytics**: Frontend performance (if deployed on Vercel)
- **OpenTelemetry**: Backend tracing
- **Database Monitoring**: Supabase dashboard for query performance

### Alerts

- **Critical Actions**: Email/Slack alerts for:
  - Large credit gifts (> 1000 credits)
  - User bans
  - Model cost changes
  - System errors

---

## 9. Testing Strategy

### Unit Tests

- **Components**: React Testing Library
- **Forms**: Test form validation (Zod schemas)
- **Utils**: Test utility functions

### Integration Tests

- **API Endpoints**: Test admin endpoints with auth
- **Database**: Test RLS policies
- **E2E**: Playwright for critical flows (gift credits, ban user)

### Test Coverage Goals

- Components: 80%+
- API Endpoints: 90%+
- Critical paths: 100%

---

## 10. CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: Admin Panel CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Run linter
        run: npm run lint
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 11. Growth Engine Module

### SEO Strategy: Programmatic SEO

**Goal**: Auto-generate landing pages from user-generated content.

#### Implementation

1. **Public Gallery Route** (`/explore/[slug]`):
   ```typescript
   // app/explore/[slug]/page.tsx
   export async function generateMetadata({ params }) {
     const image = await fetchImageBySlug(params.slug);
     return {
       title: `Generate ${image.prompt} with AI | Lovart-Flow`,
       description: `Create stunning AI art like "${image.prompt}" using ${image.model}. Try it free.`,
       openGraph: {
         images: [image.result_url],
       },
     };
   }
   ```

2. **Sitemap Automation**:
   - Daily cron job (Python backend)
   - Fetch top 1000 public images (likes > 10)
   - Generate sitemap.xml
   - Submit to Google Search Console

3. **Schema.org Markup**:
   - JSON-LD for ImageObject
   - Improves Google Image Search ranking

### Referral System

**Database Schema**:
```sql
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id),
  referred_id UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED')),
  reward_amount INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN referral_code TEXT UNIQUE;
```

**Business Logic** (Python Backend):
- User registers with `?ref=LOVART` → Create referral record
- New user gets +10 credits immediately
- When referred user makes first payment (Stripe webhook):
  - Referrer gets +50 credits
  - Referred gets +20 credits
  - Update referral status to 'COMPLETED'
  - Send email notifications (Resend)

### Marketing Tools

#### Coupon System

**Database Schema**:
```sql
CREATE TABLE public.redemption_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  credits_amount INTEGER NOT NULL,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Admin Feature**:
- Generate bulk codes (100 at a time)
- Export to CSV
- Track usage

#### Email Drip Campaigns

**Tool**: Resend + React Email

**Automation Flow**:
- Day 1: Welcome email + tutorial
- Day 3 (if no generation): "Try it now! +5 credits"
- Day 7 (if no payment): "Upgrade to Pro"

**Implementation**:
- Python backend cron job
- Query users by criteria (no generation, no payment)
- Send email via Resend API
- Track email opens/clicks

---

## 🚀 Execution Guide

### Step-by-Step Implementation

1. **Prerequisites**:
   - Complete `CURSOR_MASTER_PLAN.md` Phases 1-3 (database, backend API)
   - Set up Supabase project with RLS
   - Configure environment variables

2. **Start with Phase 1**:
   ```
   Role: Senior Full-Stack Engineer
   Let's build the Admin Panel following ADMIN_MASTER_PLAN.md.
   Start with Phase 1: Refine Integration & Auth.
   ```

3. **Iterate**:
   - Complete each phase before moving to the next
   - Test thoroughly at each stage
   - Document any deviations

4. **Deploy**:
   - Test in staging environment first
   - Monitor for errors (Sentry)
   - Gradual rollout to production

---

## 📚 Additional Resources

- [Refine Documentation](https://refine.dev/docs/)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [TanStack Query](https://tanstack.com/query/latest)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)

---

**Last Updated**: 2025-01-XX  
**Version**: 2.0 (2025 Enterprise Standard)
