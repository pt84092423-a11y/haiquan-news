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
    components/        # Reusable components (ui/, layout, etc.)
    pages/             # Route-level pages
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

Configured as a **static** deployment:
- **Build**: `cd haiquan-news && PORT=5000 npm run build`
- **Public Dir**: `haiquan-news/dist`

## Key Features

- News articles, videos, podcasts, photo stories, long-form content
- Digital newspaper edition viewer (Báo In)
- Admin dashboard: Post editor, Category manager, User manager, Audit log, Approval queue
- Supabase-powered auth with role-based access control (RBAC)
- Automated WebP image conversion before upload

## Environment

Requires Supabase environment variables (configured via Replit Secrets):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
