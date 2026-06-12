# Inbiso Ops

A centralized operations management platform built for Inbiso Fire Safety Systems to streamline project execution, manpower allocation, cashflow visibility, referral tracking, and operational decision-making.

---

## Overview

Inbiso Ops was developed to replace fragmented workflows spread across Excel sheets, WhatsApp conversations, phone calls, and manual tracking systems.

The platform provides a unified dashboard for managing:

- Projects
- Cashflow
- Manpower
- Referrals
- AI-assisted operational insights

Designed specifically for non-technical operators, the system enables real-time visibility into operational performance and bottlenecks.

---

## Problem Statement

Prior to Inbiso Ops, operations relied on multiple disconnected tools which created:

- Procurement delays
- Site coordination bottlenecks
- Manpower allocation challenges
- Delayed payment follow-ups
- Lack of cashflow visibility
- Manual supplier comparisons
- Missing referral tracking

---

## Features

### Projects Module

Track project lifecycle from initiation to completion.

Features:

- Project creation
- Status tracking
- Milestone monitoring
- Active project dashboard

Route:

```
/projects
```

---

### Cashflow Module

Real-time financial visibility.

Features:

- Inflow tracking
- Outflow tracking
- Cash buffer monitoring
- Financial overview dashboard

Route:

```
/cashflow
```

---

### Manpower Module

Coordinate field teams across active sites.

Features:

- Staff allocation
- Resource planning
- Site assignments
- Bottleneck identification

Route:

```
/manpower
```

---

### Referrals Module

Manage incoming leads and business opportunities.

Features:

- Referral tracking
- Lead pipeline management
- Conversion monitoring

Route:

```
/referrals
```

---

### AI Operations Assistant

Natural language operational intelligence layer.

Examples:

- Which projects are delayed?
- Show manpower shortages.
- Summarize today's risks.
- Which sites need immediate attention?

Route:

```
/api/ai-summary
```

---

## Tech Stack

### Frontend

- Next.js 14+
- TypeScript
- Tailwind CSS

### Backend

- Supabase
- PostgreSQL

### AI

- Groq API

### Deployment

- Vercel

### Development

- VS Code
- Git
- GitHub

---

## Project Structure

```text
INBISO-OPS
│
├── app
│   ├── api
│   │   └── ai-summary
│   │
│   ├── cashflow
│   ├── manpower
│   ├── projects
│   ├── referrals
│   │
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── components
│   └── ui
│
├── lib
│   └── supabase.ts
│
├── public
│
├── .env.local
├── package.json
├── tsconfig.json
└── README.md
```

---

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

GROQ_API_KEY=

```

---

## Local Development

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Deployment

### Vercel

1. Push repository to GitHub
2. Import repository into Vercel
3. Configure environment variables
4. Deploy

---

## Future Roadmap

### Phase 1

- Real Supabase integration
- Authentication
- Live dashboards

### Phase 2

- AI-generated operational summaries
- Risk prediction
- Cashflow forecasting

### Phase 3

- WhatsApp integration
- Supplier portal
- Vendor comparison engine
- Automated reminders
- Mobile application

---

## Author

Sai Chaithanya G

Indian Institute of Technology Roorkee

June 2026