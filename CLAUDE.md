# Project Overview

This is a production-grade Medical Uniform Production Management System.

The system manages:
- Customer orders
- Tailoring workflow
- Embroidery workflow
- Production tracking
- AI-assisted order intake

# Tech Stack

- Next.js App Router
- TypeScript
- TailwindCSS
- shadcn/ui
- Supabase
- PostgreSQL
- Vercel AI SDK
- Gemini AI
- Zod
- TanStack Query

# Architecture Rules

- Use feature-based modular architecture
- Server components by default
- Client components only when necessary
- Business logic must not live inside UI components
- API logic must be centralized
- Use Zod validation everywhere
- Use typed server actions
- Never trust client-side validation

# Security Rules

- All database access must respect RLS
- Validate uploads server-side
- Never expose service-role keys
- All mutations require permission checks
- AI output must be validated before persistence

# Development Rules

Before implementing:
1. Search for existing reusable components
2. Reuse existing patterns
3. Avoid duplicate business logic
4. Preserve naming consistency
5. Keep components focused

# Important Docs

- ./docs/architecture.md
- ./docs/database.md
- ./docs/security.md
- ./docs/business-workflows.md