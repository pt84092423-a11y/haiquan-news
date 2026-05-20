import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

function discordBotApiPlugin() {
  return {
    name: 'discord-bot-api',
    configureServer(server: any) {
      // Simple GET ping — just checks if token env var is set
      server.middlewares.use('/api/discord/ping', (req: any, res: any, next: any) => {
        if (req.method !== 'GET') return next();
        res.setHeader('Content-Type', 'application/json');
        const configured = !!process.env.DISCORD_BOT_TOKEN;
        return res.end(JSON.stringify({ configured }));
      });

      server.middlewares.use('/api/discord/send', (req: any, res: any, next: any) => {
        if (req.method !== 'POST') return next();
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => { chunks.push(chunk); });
        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json');
          try {
            const token = process.env.DISCORD_BOT_TOKEN;
            if (!token) {
              res.statusCode = 500;
              return res.end(JSON.stringify({ error: 'DISCORD_BOT_TOKEN chưa được cấu hình.' }));
            }
            const { channelId, content, embedImage } = JSON.parse(Buffer.concat(chunks).toString());
            if (!channelId || !content) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: 'Thiếu channelId hoặc content.' }));
            }
            const payload: any = { content };
            if (embedImage) payload.embeds = [{ image: { url: embedImage }, color: 0x0059b2 }];
            const discordRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
              method: 'POST',
              headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (discordRes.ok || discordRes.status === 204) {
              return res.end(JSON.stringify({ ok: true }));
            }
            const err = await discordRes.text();
            res.statusCode = discordRes.status;
            return res.end(JSON.stringify({ error: err }));
          } catch (e: any) {
            res.statusCode = 500;
            return res.end(JSON.stringify({ error: e.message }));
          }
        });
      });

      // ── Admin: Categories CRUD proxy (dev) ──
      const SUPABASE_URL_DEV = process.env.VITE_SUPABASE_URL || 'https://gqxrptccptfbzfdmaoyl.supabase.co';
      const SUPABASE_KEY_DEV = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxeHJwdGNjcHRmYnpmZG1hb3lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MjIyNzAsImV4cCI6MjA5MDA5ODI3MH0.7lyAtlXFyRBHd3oFAhhxxdqs1rn2GhHdGOuMgEuk-SE';

      server.middlewares.use('/api/admin/categories', async (req: any, res: any, next: any) => {
        res.setHeader('Content-Type', 'application/json');
        const headers = { apikey: SUPABASE_KEY_DEV, Authorization: `Bearer ${SUPABASE_KEY_DEV}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };

        if (req.method === 'GET') {
          try {
            const r = await fetch(`${SUPABASE_URL_DEV}/rest/v1/categories?select=*&order=name`, { headers });
            const d = await r.json();
            if (!r.ok) { res.statusCode = r.status; return res.end(JSON.stringify({ error: d })); }
            return res.end(JSON.stringify(d));
          } catch (e: any) { res.statusCode = 500; return res.end(JSON.stringify({ error: e.message })); }
        }

        if (req.method === 'POST') {
          const chunks: Buffer[] = [];
          req.on('data', (c: Buffer) => chunks.push(c));
          req.on('end', async () => {
            try {
              const body = JSON.parse(Buffer.concat(chunks).toString());
              const r = await fetch(`${SUPABASE_URL_DEV}/rest/v1/categories`, { method: 'POST', headers, body: JSON.stringify(body) });
              const d = await r.json();
              if (!r.ok) { res.statusCode = r.status; return res.end(JSON.stringify({ error: d?.message || JSON.stringify(d) })); }
              return res.end(JSON.stringify(Array.isArray(d) ? d[0] : d));
            } catch (e: any) { res.statusCode = 500; return res.end(JSON.stringify({ error: e.message })); }
          });
          return;
        }

        // PATCH /api/admin/categories/:id
        if (req.method === 'PATCH') {
          const id = req.url?.split('/').pop();
          const chunks: Buffer[] = [];
          req.on('data', (c: Buffer) => chunks.push(c));
          req.on('end', async () => {
            try {
              const body = JSON.parse(Buffer.concat(chunks).toString());
              const r = await fetch(`${SUPABASE_URL_DEV}/rest/v1/categories?id=eq.${id}`, { method: 'PATCH', headers, body: JSON.stringify(body) });
              const d = await r.json();
              if (!r.ok) { res.statusCode = r.status; return res.end(JSON.stringify({ error: d?.message || JSON.stringify(d) })); }
              return res.end(JSON.stringify(Array.isArray(d) ? d[0] : d));
            } catch (e: any) { res.statusCode = 500; return res.end(JSON.stringify({ error: e.message })); }
          });
          return;
        }

        // DELETE /api/admin/categories/:id
        if (req.method === 'DELETE') {
          const id = req.url?.split('/').pop();
          try {
            const r = await fetch(`${SUPABASE_URL_DEV}/rest/v1/categories?id=eq.${id}`, { method: 'DELETE', headers });
            if (!r.ok) { const d = await r.json().catch(() => ({})); res.statusCode = r.status; return res.end(JSON.stringify({ error: d?.message || 'Xóa thất bại' })); }
            return res.end(JSON.stringify({ ok: true }));
          } catch (e: any) { res.statusCode = 500; return res.end(JSON.stringify({ error: e.message })); }
        }

        next();
      });

      // ── YouTube: resolve channel handle → channel ID ──
      server.middlewares.use('/api/youtube/resolve', async (req: any, res: any, next: any) => {
        if (req.method !== 'GET') return next();
        const qs = new URL(req.url, 'http://localhost').searchParams;
        const handle = qs.get('handle');
        res.setHeader('Content-Type', 'application/json');
        try {
          if (!handle) { res.statusCode = 400; return res.end(JSON.stringify({ error: 'Thiếu handle' })); }
          const pageRes = await fetch(`https://www.youtube.com/@${handle.replace('@', '')}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
          });
          const html = await pageRes.text();
          const match = html.match(/"externalId":"(UC[a-zA-Z0-9_-]+)"/);
          if (match) return res.end(JSON.stringify({ channelId: match[1] }));
          res.statusCode = 404; return res.end(JSON.stringify({ error: 'Không tìm thấy channel ID' }));
        } catch (e: any) { res.statusCode = 500; return res.end(JSON.stringify({ error: e.message })); }
      });

      // ── YouTube: fetch videos by scraping channel page (RSS blocked from server IPs) ──
      // In-memory YouTube cache (shared across dev requests)
      const ytCacheDev: Record<string, { videos: any[]; ts: number }> = {};
      const YT_CACHE_TTL_DEV = 30 * 60 * 1000;

      server.middlewares.use('/api/youtube/feed', async (req: any, res: any, next: any) => {
        if (req.method !== 'GET') return next();
        const qs = new URL(req.url || '/', 'http://localhost').searchParams;
        const channelId = qs.get('channelId');
        const handle = qs.get('handle');
        res.setHeader('Content-Type', 'application/json');

        const HANDLE_MAP: Record<string, string> = {
          'UC4MXnZXKnKu9Cg6mNts1aPQ': 'srov24h',
          'UC7W8ubM1PB8DzLMP7JSrHyg': 'srov4',
          'UCyV_AKZjCqd1bkUbEHGcTyA': 'TGM_Kuroma',
        };
        const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        const cacheKey = channelId || handle || 'unknown';

        if (ytCacheDev[cacheKey] && (Date.now() - ytCacheDev[cacheKey].ts) < YT_CACHE_TTL_DEV) {
          res.setHeader('X-Cache', 'HIT');
          return res.end(JSON.stringify({ videos: ytCacheDev[cacheKey].videos }));
        }

        function clean(t: string) {
          return t.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim();
        }

        function fetchWT(url: string, opts: any = {}, ms = 8000) {
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), ms);
          return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(tid));
        }

        // Method 1: Direct YouTube RSS
        async function fetchRSS(chId: string): Promise<any[]> {
          try {
            const rssRes = await fetchWT(`https://www.youtube.com/feeds/videos.xml?channel_id=${chId}`, { headers: { 'User-Agent': UA } }, 8000);
            if (!rssRes.ok) return [];
            const xml = await rssRes.text();
            const entries: any[] = [];
            const seen = new Set<string>();
            const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
            let em: RegExpExecArray | null;
            while ((em = entryRe.exec(xml)) !== null) {
              const block = em[1];
              const vidMatch = block.match(/<yt:videoId>([a-zA-Z0-9_-]{11})<\/yt:videoId>/);
              const titleMatch = block.match(/<title>([^<]+)<\/title>/);
              const pubMatch = block.match(/<published>([^<]+)<\/published>/);
              const thumbMatch = block.match(/<media:thumbnail url="([^"]+)"/);
              if (!vidMatch || !titleMatch) continue;
              const videoId = vidMatch[1];
              if (seen.has(videoId)) continue;
              seen.add(videoId);
              entries.push({
                videoId,
                title: clean(titleMatch[1]),
                published: pubMatch ? pubMatch[1] : '',
                channel: '',
                thumbnail: thumbMatch ? thumbMatch[1] : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                url: `https://www.youtube.com/watch?v=${videoId}`,
                embedUrl: `https://www.youtube.com/embed/${videoId}`,
              });
              if (entries.length >= 15) break;
            }
            return entries;
          } catch { return []; }
        }

        // Method 2: rss2json.com (works even when direct YouTube RSS is blocked)
        async function fetchRss2Json(chId: string): Promise<any[]> {
          try {
            const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${chId}`;
            const r = await fetchWT(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=15`, {}, 10000);
            if (!r.ok) return [];
            const j = await r.json();
            if (j.status !== 'ok' || !Array.isArray(j.items) || j.items.length === 0) return [];
            return j.items.map((item: any) => {
              const videoId = item.link?.split('v=')?.[1]?.split('&')?.[0] || '';
              return { videoId, title: item.title || '', published: item.pubDate || '', channel: '', thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, url: item.link || '', embedUrl: `https://www.youtube.com/embed/${videoId}` };
            }).filter((v: any) => v.videoId);
          } catch { return []; }
        }

        // Method 3: HTML scrape by handle
        async function scrapeByHandle(hdl: string): Promise<any[]> {
          try {
            const pageRes = await fetchWT(`https://www.youtube.com/@${hdl.replace('@','')}/videos`, { headers: { 'User-Agent': UA } }, 10000);
            if (!pageRes.ok) return [];
            const html = await pageRes.text();
            const entries: any[] = [];
            const seen = new Set<string>();
            const re = /"videoId":"([a-zA-Z0-9_-]{11})"[^}]*?"text":"([^"]{2,200})"/g;
            let mm: RegExpExecArray | null;
            while ((mm = re.exec(html)) !== null) {
              const videoId = mm[1];
              const title = mm[2];
              if (!seen.has(videoId) && title.length > 3) {
                seen.add(videoId);
                entries.push({ videoId, title: clean(title), published: '', channel: '', thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, url: `https://www.youtube.com/watch?v=${videoId}`, embedUrl: `https://www.youtube.com/embed/${videoId}` });
              }
              if (entries.length >= 15) break;
            }
            return entries;
          } catch { return []; }
        }

        try {
          if (!channelId && !handle) { res.statusCode = 400; return res.end(JSON.stringify({ error: 'Thiếu channelId hoặc handle' })); }
          let videos: any[] = [];
          if (channelId) videos = await fetchRSS(channelId);
          if (videos.length === 0 && channelId) videos = await fetchRss2Json(channelId);
          const resolvedHandle = handle || (channelId ? HANDLE_MAP[channelId] : null);
          if (videos.length === 0 && resolvedHandle) videos = await scrapeByHandle(resolvedHandle);
          if (videos.length > 0) ytCacheDev[cacheKey] = { videos, ts: Date.now() };
          res.setHeader('X-Cache', 'MISS');
          return res.end(JSON.stringify({ videos }));
        } catch (e: any) { res.statusCode = 500; return res.end(JSON.stringify({ error: e.message })); }
      });

      // Auto-discover guilds and channels from bot token
      server.middlewares.use('/api/discord/guilds', async (req: any, res: any, next: any) => {
        if (req.method !== 'GET') return next();
        res.setHeader('Content-Type', 'application/json');
        try {
          const token = process.env.DISCORD_BOT_TOKEN;
          if (!token) {
            res.statusCode = 500;
            return res.end(JSON.stringify({ error: 'DISCORD_BOT_TOKEN chưa được cấu hình.' }));
          }
          const guildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
            headers: { Authorization: `Bot ${token}` },
          });
          if (!guildsRes.ok) {
            res.statusCode = guildsRes.status;
            return res.end(JSON.stringify({ error: await guildsRes.text() }));
          }
          const guilds: any[] = await guildsRes.json();
          const result = await Promise.all(guilds.map(async (g: any) => {
            const chRes = await fetch(`https://discord.com/api/v10/guilds/${g.id}/channels`, {
              headers: { Authorization: `Bot ${token}` },
            });
            const channels = chRes.ok ? await chRes.json() : [];
            const textChannels = channels
              .filter((c: any) => c.type === 0 || c.type === 5)
              .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
              .map((c: any) => ({ id: c.id, name: c.name, type: c.type }));
            return { id: g.id, name: g.name, icon: g.icon, channels: textChannels };
          }));
          return res.end(JSON.stringify({ guilds: result }));
        } catch (e: any) {
          res.statusCode = 500;
          return res.end(JSON.stringify({ error: e.message }));
        }
      });

      // ── Discord: delete a message ──
      server.middlewares.use('/api/discord/messages/', async (req: any, res: any, next: any) => {
        if (req.method !== 'DELETE') return next();
        const urlParts = (req.url || '').split('?');
        const messageId = urlParts[0].replace(/^\//, '').split('/')[0];
        const qs = new URL(req.url || '/', 'http://localhost').searchParams;
        const channelId = qs.get('channelId');
        res.setHeader('Content-Type', 'application/json');
        try {
          const token = process.env.DISCORD_BOT_TOKEN;
          if (!token) { res.statusCode = 500; return res.end(JSON.stringify({ error: 'DISCORD_BOT_TOKEN chưa được cấu hình.' })); }
          if (!channelId || !messageId) { res.statusCode = 400; return res.end(JSON.stringify({ error: 'Thiếu channelId hoặc messageId.' })); }
          const r = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bot ${token}` },
          });
          if (r.ok || r.status === 204) return res.end(JSON.stringify({ ok: true }));
          const err = await r.text();
          res.statusCode = r.status;
          return res.end(JSON.stringify({ error: err }));
        } catch (e: any) { res.statusCode = 500; return res.end(JSON.stringify({ error: e.message })); }
      });

      // ── Discord: read channel messages (TP67 only) ──
      server.middlewares.use('/api/discord/messages', async (req: any, res: any, next: any) => {
        if (req.method !== 'GET') return next();
        const qs = new URL(req.url || '/', 'http://localhost').searchParams;
        const channelId = qs.get('channelId');
        const limit = Math.min(parseInt(qs.get('limit') || '50'), 100);
        const before = qs.get('before');
        res.setHeader('Content-Type', 'application/json');
        try {
          const token = process.env.DISCORD_BOT_TOKEN;
          if (!token) { res.statusCode = 500; return res.end(JSON.stringify({ error: 'DISCORD_BOT_TOKEN chưa được cấu hình.' })); }
          if (!channelId) { res.statusCode = 400; return res.end(JSON.stringify({ error: 'Thiếu channelId.' })); }
          let url = `https://discord.com/api/v10/channels/${channelId}/messages?limit=${limit}`;
          if (before) url += `&before=${before}`;
          const r = await fetch(url, { headers: { Authorization: `Bot ${token}` } });
          if (!r.ok) { const err = await r.text(); res.statusCode = r.status; return res.end(JSON.stringify({ error: err })); }
          const messages = await r.json();
          return res.end(JSON.stringify({ messages }));
        } catch (e: any) { res.statusCode = 500; return res.end(JSON.stringify({ error: e.message })); }
      });
    }
  };
}

const isBuild = process.env.NODE_ENV === "production" || process.argv.includes("build");

const port = Number(process.env.PORT) || 5000;

const basePath = process.env.BASE_PATH || "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    discordBotApiPlugin(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "src/assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  optimizeDeps: {
    include: ["@tinymce/tinymce-react", "quill", "jspdf", "html2canvas"],
    esbuildOptions: {
      alias: {
        react: path.resolve(import.meta.dirname, "node_modules/react"),
        "react-dom": path.resolve(import.meta.dirname, "node_modules/react-dom"),
      },
    },
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    hmr: {
      clientPort: 443,
      protocol: "wss",
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
