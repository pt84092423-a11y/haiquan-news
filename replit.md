# Hải Quân News Portal (haiquan-news)

A news portal website for the Vietnam People's Navy (Báo Hải Quân Việt Nam - SROV). Features a modern web interface for reading articles, watching videos, listening to podcasts, and accessing digital newspaper editions. Includes a comprehensive admin dashboard for content management.

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI / shadcn-ui, Lucide React icons, Framer Motion animations
- **Routing**: Wouter
- **Data Fetching**: TanStack React Query
- **Backend/Database**: Supabase (PostgreSQL, Auth, Storage)
- **Forms**: React Hook Form + Zod
- **Image Hosting**: ImgBB

## Project Structure

```
haiquan-news/          # Main project directory
  src/
    components/        # Reusable components (ui/, layout, SEO, cards)
    pages/             # Route-level public pages
      admin/           # Admin dashboard pages
    lib/               # Supabase client, auth, utilities
    hooks/             # Custom React hooks
    assets/            # Static assets (logos, images)
  public/              # Publicly served static files
  vite.config.ts       # Vite configuration (requires PORT env var)
  package.json         # NPM package manifest
```

## Development

The app runs on port 5000. Start with:

```bash
cd haiquan-news && PORT=5000 npm run dev
```

The workflow "Start application" handles this automatically.

## Deployment

Configured as an **autoscale Node server** deployment so article pages can return server-rendered OpenGraph tags:
- **Build**: `cd haiquan-news && PORT=5000 npm run build`
- **Run**: `node haiquan-news/server.js`

## Key Features

- News articles, videos, podcasts, photo stories, long-form content
- Digital newspaper edition viewer (Báo In)
- Admin dashboard: Post editor, Category manager, User manager, Audit log, Approval queue
- Post editor supports separate OpenGraph title/image stored independently from meta title/description
- Article OpenGraph tags are injected by `server.js` for `/bai-viet/:slug` so social/chat crawlers can read the correct title, description, image, and canonical URL
- Post editor includes quick-insert rich content blocks: image frame, polaroid, cinema/video, podcast, text frame, quote, page background, table, mini org chart, decorative text block
- Public pages for `Cấu trúc`, `Chỉ huy`, and `Liên hệ`
- `Cấu trúc` supports two display modes: editable organization chart or one uploaded poster/image; each chart unit can include logo, slogan, history, and up to 10 activity images shown in a detail modal
- Admin pages are split into `Cấu trúc`, `Chỉ huy`, and `Quảng cáo`; structure and HICOM personnel are stored as JSON settings
- `Chỉ huy` personnel records support an activity timeline with time, position, and rank milestones
- Article/category ad images are managed from the dedicated admin `Quảng cáo` page
- Home page poster slots support one or multiple image URLs with automatic rotation, configurable through admin settings
- HICOM commander records include unit, display order, bio, HTML detail, detail images, work chart bars, and service unit logos
- Supabase-powered auth with role-based access control (RBAC)
- Automated WebP image conversion before upload

## Environment

Requires Supabase environment variables (configured via Replit Secrets):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
