import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

function discordBotApiPlugin() {
  return {
    name: 'discord-bot-api',
    configureServer(server: any) {
      server.middlewares.use('/api/discord/send', (req: any, res: any, next: any) => {
        if (req.method !== 'POST') return next();
        let body = '';
        req.on('data', (chunk: any) => { body += chunk; });
        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json');
          try {
            const token = process.env.DISCORD_BOT_TOKEN;
            if (!token) {
              res.statusCode = 500;
              return res.end(JSON.stringify({ error: 'DISCORD_BOT_TOKEN chưa được cấu hình.' }));
            }
            const { channelId, content, embedImage } = JSON.parse(body);
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
      server.middlewares.use('/api/youtube/feed', async (req: any, res: any, next: any) => {
        if (req.method !== 'GET') return next();
        const qs = new URL(req.url || '/', 'http://localhost').searchParams;
        const channelId = qs.get('channelId');
        const handle = qs.get('handle');
        res.setHeader('Content-Type', 'application/json');
        // Known handle map for fallback
        const HANDLE_MAP: Record<string, string> = {
          'UC4MXnZXKnKu9Cg6mNts1aPQ': 'srov24h',
          'UC7W8ubM1PB8DzLMP7JSrHyg': 'srov4',
          'UCyV_AKZjCqd1bkUbEHGcTyA': 'TGM_Kuroma',
        };
        const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        async function scrapeChannelPage(url: string): Promise<any[]> {
          const pageRes = await fetch(url, { headers: { 'User-Agent': UA } });
          if (!pageRes.ok) return [];
          const html = await pageRes.text();
          const m = html.match(/ytInitialData\s*=\s*(\{.+?\});\s*<\/script>/s);
          if (!m) return [];
          let data: any;
          try { data = JSON.parse(m[1]); } catch { return []; }

          const entries: any[] = [];
          const seen = new Set<string>();
          const s = JSON.stringify(data);

          function clean(t: string) {
            return t.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
          }

          // Targeted regex: find "videoRenderer":{"videoId":"ID","thumbnail"...,"title":{"runs":[{"text":"TITLE"}
          // This is the canonical structure YouTube uses for all video listings
          const re = /"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})","thumbnail"[\s\S]{0,2000}?"title":\{"runs":\[\{"text":"([^"]{2,200})"/g;
          let mm: RegExpExecArray | null;
          while ((mm = re.exec(s)) !== null) {
            const videoId = mm[1];
            const title = mm[2];
            if (!seen.has(videoId)) {
              seen.add(videoId);
              entries.push({
                videoId,
                title: clean(title),
                published: '', channel: '',
                thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                url: `https://www.youtube.com/watch?v=${videoId}`,
                embedUrl: `https://www.youtube.com/embed/${videoId}`,
              });
            }
            if (entries.length >= 15) break;
          }
          return entries;
        }
        try {
          if (!channelId && !handle) { res.statusCode = 400; return res.end(JSON.stringify({ error: 'Thiếu channelId hoặc handle' })); }
          let videos: any[] = [];
          // Try channel/ID/videos first (works for most channels)
          if (channelId) videos = await scrapeChannelPage(`https://www.youtube.com/channel/${channelId}/videos`);
          // Try @handle/videos if channel ID scraping failed
          const resolvedHandle = handle || (channelId ? HANDLE_MAP[channelId] : null);
          if (videos.length === 0 && resolvedHandle) {
            videos = await scrapeChannelPage(`https://www.youtube.com/@${resolvedHandle.replace('@','')}/videos`);
          }
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
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    hmr: {
      clientPort: 443,
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
