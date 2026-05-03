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
