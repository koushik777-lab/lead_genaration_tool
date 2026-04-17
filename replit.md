# LeadForge Elite

## Overview

LeadForge Elite is a B2B lead generation and CRM SaaS platform. It provides lead discovery, enrichment, scoring, CRM pipeline management, and outreach automation for digital agencies, SaaS founders, and B2B sales teams.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS + Recharts + Wouter (routing)
- **Backend**: Express 5 (Node.js)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

- `artifacts/leadforge` — React + Vite frontend (preview at `/`)
- `artifacts/api-server` — Express backend (at `/api`)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Features

- **Dashboard**: Stats cards, lead score distribution (pie chart), pipeline stage counts (bar chart), recent activity feed, top industries breakdown
- **Lead Table**: Filterable/searchable table with score badges, website flags, CRM stages, create/delete
- **Lead Detail**: Full enrichment profile, opportunity signals, AI insight, notes timeline, CRM stage selector
- **CRM Kanban Board**: Leads grouped by stage (New Lead → Closed Won/Lost), quick stage reassignment
- **Outreach**: Campaign management with stats (sent/open/reply counts), message template library

## DB Schema

Tables: `leads`, `notes`, `campaigns`, `templates`, `activity`

## Lead Scoring

- No Website: +30pts
- Poor SEO: +25pts
- Mobile Unfriendly: +20pts
- No Social Presence: +15pts
- Active Business base: +10pts

Score categories: Hot (≥60), Warm (≥35), Cold (<35)

## Notes

- After each OpenAPI spec change, re-run codegen before using the updated types
- `lib/api-zod/src/index.ts` should only export from `./generated/api` (not `./generated/types`) — the codegen regenerates this file, fix manually after running codegen if needed
