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

      // ── YouTube: fetch RSS feed by channel ID ──
      server.middlewares.use('/api/youtube/feed', async (req: any, res: any, next: any) => {
        if (req.method !== 'GET') return next();
        const qs = new URL(req.url, 'http://localhost').searchParams;
        const channelId = qs.get('channelId');
        res.setHeader('Content-Type', 'application/json');
        try {
          if (!channelId) { res.statusCode = 400; return res.end(JSON.stringify({ error: 'Thiếu channelId' })); }
          const rssRes = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          if (!rssRes.ok) { res.statusCode = rssRes.status; return res.end(JSON.stringify({ error: 'Không thể tải RSS' })); }
          const xml = await rssRes.text();
          const entries: any[] = [];
          const re = /<entry>([\s\S]*?)<\/entry>/g;
          let m;
          while ((m = re.exec(xml)) !== null) {
            const e = m[1];
            const videoId   = (e.match(/<yt:videoId>(.*?)<\/yt:videoId>/)      || [])[1];
            const title     = (e.match(/<title>(.*?)<\/title>/)                || [])[1];
            const published = (e.match(/<published>(.*?)<\/published>/)         || [])[1];
            const thumbnail = (e.match(/<media:thumbnail url="(.*?)"/)         || [])[1];
            const channel   = (e.match(/<name>(.*?)<\/name>/)                  || [])[1];
            if (videoId && title) entries.push({
              videoId, published, thumbnail, channel: channel || '',
              title: title.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'"),
              url: `https://www.youtube.com/watch?v=${videoId}`,
              embedUrl: `https://www.youtube.com/embed/${videoId}`,
            });
          }
          return res.end(JSON.stringify({ videos: entries }));
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
              .filter((c: any) => c.type === 0)
              .map((c: any) => ({ id: c.id, name: c.name }));
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
