# Báo Hải Quân Việt Nam - SROV

## Overview
A full-featured Vietnamese Navy news portal (Báo Hải Quân Việt Nam – SROV) built with React 19 + Vite + Supabase + Express. Serves as the official news organ of the Vietnam People's Navy.

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite 7, Tailwind CSS 4
- **Routing**: Wouter
- **Data Fetching**: TanStack Query v5
- **Backend/DB**: Supabase (PostgreSQL) via JavaScript client
- **SSR OG**: Express `server.js` handles `/api/og` for open graph tags
- **Fonts**: Roboto (local woff2, Vietnamese range) + Oswald + Playfair Display + Cinzel (Google Fonts)
- **PWA**: Service worker (`public/sw.js`) + manifest (`public/manifest.json`)

## Architecture
- All app code under `haiquan-news/`
- Workflow: `cd haiquan-news && npm run dev` (port 5000)
- No virtual environments — deps installed in `haiquan-news/node_modules/`
- Supabase credentials via `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars (with fallbacks in `src/lib/supabase.ts`)

## Key Files
- `index.html` — Google Fonts (Cinzel + Playfair Display + Roboto Vietnamese subset) + PWA meta + SW registration
- `src/lib/supabase.ts` — All Supabase queries, types, utility functions
- `src/App.tsx` — Wouter routing (admin + public routes)
- `src/pages/` — Page components
- `src/components/` — Shared components (SiteHeader, SiteFooter, SectionTitle, etc.)
- `public/manifest.json` — PWA manifest
- `public/sw.js` — Service worker (cache-first for assets)
- `public/fonts/` — Local Roboto woff2 files

## Pages & Routes
| Route | Page | Notes |
|-------|------|-------|
| `/` | HomePage | Hero + section grid |
| `/bai-viet/:slug` | ArticlePage | Article with accessibility toolbar |
| `/bao-in` | BaoInPage | Print edition viewer |
| `/tim-kiem` | SearchPage | Advanced search + category filter |
| `/cau-truc` | StructurePage | Navy structure |
| `/chi-huy` | CommandPage | Command leadership |
| `/lien-he` | ContactPage | Contact form |
| `/:slug` | CategoryPage | Dynamic category pages |
| `/admin/*` | Admin pages | Protected, role-based |

## Features Implemented
- **Vietnamese font rendering**: Playfair Display + Roboto with `subset=vietnamese` from Google Fonts
- **Section titles**: Cinzel font (`SectionTitle.tsx`)
- **BaoIn sidebar**: CategoryPage shows latest print edition in right sidebar
- **Accessibility toolbar**: ArticlePage — font size A-/A+ with localStorage persistence + dark/light reading mode toggle
- **Longform/E-Magazine**: parallax fixed-background hero for `post_type: 'longform' | 'photo_story'`
- **Smart Related Posts**: `getRelatedPostsSmart()` uses keyword extraction + category fallback
- **Advanced Search**: `/tim-kiem` with full-text search, category filter, pagination, and popular keyword chips
- **Search Auto-suggest**: SiteHeader search panel shows live dropdown suggestions (debounced 320ms)
- **PWA**: manifest + service worker with cache-first strategy for offline support

## Post Types
- `article` — standard article
- `video` — video post
- `podcast` — audio post
- `longform` — full-bleed parallax long-form article
- `photo_story` — photo essay (also uses longform template)
- `baoin` — print newspaper edition

## Admin Roles
- `superadmin` — all permissions
- `editor` — can write, approve, manage categories
- `journalist` — can write posts (pending approval)
- `viewer` — read-only admin access

## Supabase Schema
See `SQL_SCHEMA` export in `src/lib/supabase.ts` for full DDL.
Tables: `categories`, `posts`, `settings`, `users`, `audit_logs`, `nav_items`
Storage bucket: `haiquan-media` (audio, video, PDF)

## Environment Variables
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key
