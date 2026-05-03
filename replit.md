# Báo Hải Quân Việt Nam - SROV

## Overview
A full-featured Vietnamese Navy news portal built with React 19 + Vite + Supabase + Express. Serves as the official news organ of the Vietnam People's Navy.

## Project Structure
All application code lives in the `haiquan-news/` subdirectory.

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite 7, Tailwind CSS 4
- **Routing**: Wouter
- **Data Fetching**: TanStack Query v5
- **Backend/DB**: Supabase (PostgreSQL) via JavaScript client
- **SSR OG**: Express `server.js` handles open graph tag injection for social sharing
- **Fonts**: Roboto (local woff2, Vietnamese range) + Oswald + Playfair Display + Cinzel (Google Fonts)
- **PWA**: Service worker (`public/sw.js`) + manifest (`public/manifest.json`)

## Running the App
- **Dev workflow**: `cd haiquan-news && npm run dev` (port 5000)
- **Production build**: `cd haiquan-news && npm run build`
- **Production start**: `cd haiquan-news && node server.js`

## Environment Variables
- `VITE_SUPABASE_URL` — Supabase project URL (set as shared env var)
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key (set as shared env var)

## Key Files
- `haiquan-news/src/lib/supabase.ts` — All Supabase queries, types, utility functions
- `haiquan-news/src/lib/auth.ts` — Custom RBAC auth (admin roles: HADMIN, ADMIN, EDITOR)
- `haiquan-news/src/App.tsx` — Wouter routing (admin + public routes)
- `haiquan-news/server.js` — Express server for production + OG tag injection
- `haiquan-news/vite.config.ts` — Vite config

## Admin Access
- URL: `/admin/login`
- Default HADMIN account: username `TP67`, password `HaiQuan@2025!`
- Change password after first login

## Supabase Schema
See `SQL_SCHEMA` export in `haiquan-news/src/lib/supabase.ts` for full DDL.
Tables: `categories`, `posts`, `settings`, `admin_users`, `audit_logs`, `approval_requests`
Storage bucket: `haiquan-media` (audio, video, PDF)
