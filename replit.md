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
- Home page `CHỈ HUY` section renders HICOM cards (photo, rank, name, position, unit) sourced from the admin `command_page_data` setting; cards link to `/chi-huy`
- Home page renders dedicated sections for `Tâm tình lính biển` (slug `tam-tinh`) and `Lịch sử` (slug `lich-su`) with a 1 large + 3 small post layout
- Liên hệ hero uses `/contact-hero-bg.png` (Vietnam People's Navy banner) with a navy-gradient overlay
- Liên hệ page shows Discord contact (default `donkey3959`) and Khánh Hòa address; values come from `contact_email`, `contact_discord`, and `contact_address` settings
- Báo In reader features a page-flip book animation (CSS `pageFlipNext`/`pageFlipPrev` keyframes in `index.css`); click left/right halves or use arrow keys to navigate
- Top navigation taskbar is admin-managed via `/admin/thanh-dieu-huong` (NavManager): reorder, edit label/href, mark home icon, add/remove items, reset to defaults; persisted as `site_nav_items` JSON setting and read by `SiteHeader` (falls back to `DEFAULT_NAV_ITEMS`)
- Standard category pages (`/:slug`) use a magazine-style layout matching `baohaiquanvietnam.vn`: centered uppercase title with underline, hero grid (1 large featured + 4 medium 2×2 + 4 small stacked), then a 3-column row with `Tin đọc nhiều` (top viewed, ranked 1–8), main horizontal article list with "Xem thêm" pagination (6/page), and `Đọc Báo In` aside (latest baoin cover + 2 ad blocks + Liên kết website). Below: `Chuyên mục khác` 5-column grid (one card per other category) and the Navy gallery banner strip. Special pages (`/`, `/bao-in`, `/cau-truc`, `/chi-huy`, `/lien-he`, `/bai-viet/:slug`) keep their dedicated layouts.
- HADMIN-only analytics panel at `/admin/hadmin` (permission `view_hadmin_panel`): per-article SEO checklist (meta_title / meta_description / OG image), total + average views, posts created in 7/30 days, average reading time (200 wpm), 14-day posting frequency bar chart, top 10 most-viewed posts, and a 30-day "active staff" leaderboard from `audit_logs` (writes, logins, last activity); shown in its own `HADMIN` sidebar group
- `Cấu trúc` supports two display modes: editable organization chart or one uploaded poster/image; each chart unit can include logo, slogan, history, and up to 10 activity images shown in a detail modal
- Admin pages are split into `Cấu trúc`, `Chỉ huy`, and `Quảng cáo`; structure and HICOM personnel are stored as JSON settings
- `Chỉ huy` personnel records support a table-style activity timeline with time, rank/order, position, and note milestones, plus slot-based uploads for detail images and service unit logos
- Article/category/home ad fields are managed from the dedicated admin `Quảng cáo` page, with upload controls available on every configured field
- Home page poster slots support one or multiple image URLs with automatic rotation, configurable through admin settings
- HICOM commander records include unit, display order, bio, HTML detail, detail images, work chart bars, and service unit logos
- Supabase-powered auth with role-based access control (RBAC)
- Automated WebP image conversion before upload

## Environment

Requires Supabase environment variables (configured via Replit Secrets):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
