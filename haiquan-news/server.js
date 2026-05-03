import express from 'express';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://gqxrptccptfbzfdmaoyl.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxeHJwdGNjcHRmYnpmZG1hb3lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MjIyNzAsImV4cCI6MjA5MDA5ODI3MH0.7lyAtlXFyRBHd3oFAhhxxdqs1rn2GhHdGOuMgEuk-SE';
const SITE_NAME = 'Báo Hải Quân Việt Nam - SROV';
const OG_SITE_NAME = 'Cổng Thông Tin SROV';
const PUBLIC_SITE_URL = (process.env.PUBLIC_SITE_URL || process.env.SITE_URL || 'https://baohaiquansrov.xo.je').replace(/\/$/, '');
const DEFAULT_DESC = 'Cơ quan ngôn luận của Quân chủng Hải quân Nhân dân Việt Nam';
const DEFAULT_IMG = `${PUBLIC_SITE_URL}/opengraph.jpg`;

const DIST_DIR = join(__dirname, 'dist');

async function fetchPost(slug) {
  const url = `${SUPABASE_URL}/rest/v1/posts?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=title,content,excerpt,thumbnail,og_image,meta_title,meta_description,author,published_at,updated_at,created_at,slug&limit=1`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.[0] || null;
}

function parseOgPayload(value) {
  if (!value) return {};
  if (value.startsWith('[OG:')) {
    try {
      const payload = JSON.parse(value.replace('[OG:', '').replace(/\]$/, ''));
      return { ...payload, image: payload.image || payload.gallery?.[0] };
    } catch {
      return {};
    }
  }
  if (value.startsWith('[GALLERY:')) {
    try {
      const gallery = JSON.parse(value.replace('[GALLERY:', '').replace(/\]$/, ''));
      return { image: gallery?.[0], gallery };
    } catch {
      return {};
    }
  }
  return { image: value };
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function stripHtml(str) {
  if (!str) return '';
  return String(str).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(str, max = 180) {
  const clean = stripHtml(str);
  return clean.length > max ? `${clean.slice(0, max - 1).trim()}…` : clean;
}

function normalizeUrl(value, fallback = DEFAULT_IMG) {
  if (!value) return fallback;
  const trimmed = String(value).trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return `${PUBLIC_SITE_URL}${trimmed}`;
  return fallback;
}

function buildOgHtml(post, slug) {
  const ogPayload = parseOgPayload(post.og_image);
  const title = escapeHtml(stripHtml(ogPayload.title || post.meta_title || post.title || SITE_NAME));
  const pageTitle = `${title} | ${SITE_NAME}`;
  const description = escapeHtml(truncate(post.meta_description || post.excerpt || post.content || DEFAULT_DESC));
  const image = escapeHtml(normalizeUrl(ogPayload.image || post.thumbnail || DEFAULT_IMG));
  const url = `${PUBLIC_SITE_URL}/bai-viet/${encodeURIComponent(slug)}`;
  const published = post.published_at || post.created_at || '';
  const modified = post.updated_at || published;
  const author = escapeHtml(post.author || SITE_NAME);

  return `
    <title>${pageTitle}</title>
    <meta name="description" content="${description}" />
    <meta name="author" content="${author}" />
    <meta property="og:site_name" content="${OG_SITE_NAME}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:secure_url" content="${image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${title}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${url}" />
    <meta property="og:locale" content="vi_VN" />
    <meta property="article:author" content="${author}" />
    ${published ? `<meta property="article:published_time" content="${published}" />` : ''}
    ${modified ? `<meta property="article:modified_time" content="${modified}" />` : ''}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@SROVNavy36" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
    <link rel="canonical" href="${url}" />`;
}

function getIndexHtml() {
  const indexPath = join(DIST_DIR, 'index.html');
  if (existsSync(indexPath)) {
    return readFileSync(indexPath, 'utf-8');
  }
  return null;
}

function injectOgIntoHtml(html, ogHtml) {
  const cleaned = html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\s+(?:name|property)=["'](?:description|author|theme-color|og:[^"']+|article:[^"']+|twitter:[^"']+)["'][^>]*>\s*/gi, '')
    .replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, '');
  return cleaned.replace('</head>', `${ogHtml}\n  </head>`);
}

app.use(express.json());

// ── Discord: ping to check bot token ──
app.get('/api/discord/ping', (req, res) => {
  const configured = !!process.env.DISCORD_BOT_TOKEN;
  res.json({ configured });
});

// ── YouTube: fetch videos via RSS feed ──
app.get('/api/youtube/feed', async (req, res) => {
  const channelId = req.query.channelId;
  const handle = req.query.handle;
  const HANDLE_MAP = {
    'UC4MXnZXKnKu9Cg6mNts1aPQ': 'srov24h',
    'UC7W8ubM1PB8DzLMP7JSrHyg': 'srov4',
    'UCyV_AKZjCqd1bkUbEHGcTyA': 'TGM_Kuroma',
  };
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  function clean(t) {
    return t.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim();
  }

  async function fetchRSS(chId) {
    try {
      const rssRes = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${chId}`, {
        headers: { 'User-Agent': UA },
      });
      if (!rssRes.ok) return [];
      const xml = await rssRes.text();
      const entries = [];
      const seen = new Set();
      const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
      let em;
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

  async function scrapeByHandle(hdl) {
    try {
      const pageRes = await fetch(`https://www.youtube.com/@${hdl.replace('@','')}/videos`, { headers: { 'User-Agent': UA } });
      if (!pageRes.ok) return [];
      const html = await pageRes.text();
      const entries = [];
      const seen = new Set();
      const re = /"videoId":"([a-zA-Z0-9_-]{11})"[^}]*?"text":"([^"]{2,200})"/g;
      let mm;
      while ((mm = re.exec(html)) !== null) {
        const videoId = mm[1];
        const title = mm[2];
        if (!seen.has(videoId) && title.length > 3) {
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
    } catch { return []; }
  }

  if (!channelId && !handle) return res.status(400).json({ error: 'Thiếu channelId hoặc handle' });
  try {
    let videos = [];
    if (channelId) videos = await fetchRSS(channelId);
    const resolvedHandle = handle || (channelId ? HANDLE_MAP[channelId] : null);
    if (videos.length === 0 && resolvedHandle) videos = await scrapeByHandle(resolvedHandle);
    return res.json({ videos });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ── Discord: list guilds and channels ──
app.get('/api/discord/guilds', async (req, res) => {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return res.status(500).json({ error: 'DISCORD_BOT_TOKEN chưa được cấu hình.' });
  try {
    const guildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: { Authorization: `Bot ${token}` },
    });
    if (!guildsRes.ok) return res.status(guildsRes.status).json({ error: await guildsRes.text() });
    const guilds = await guildsRes.json();
    const result = [];
    for (const guild of guilds) {
      const chRes = await fetch(`https://discord.com/api/v10/guilds/${guild.id}/channels`, {
        headers: { Authorization: `Bot ${token}` },
      });
      if (!chRes.ok) continue;
      const channels = await chRes.json();
      const textChannels = channels
        .filter(c => c.type === 0 || c.type === 5)
        .sort((a, b) => (a.position || 0) - (b.position || 0))
        .map(c => ({ id: c.id, name: c.name, type: c.type }));
      result.push({ id: guild.id, name: guild.name, channels: textChannels });
    }
    return res.json({ guilds: result });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Discord Bot proxy — keeps the token server-side
app.post('/api/discord/send', async (req, res) => {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'DISCORD_BOT_TOKEN chưa được cấu hình trên máy chủ.' });
  }
  const { channelId, content, embedImage } = req.body;
  if (!channelId || !content) {
    return res.status(400).json({ error: 'Thiếu channelId hoặc content.' });
  }
  const payload = { content };
  if (embedImage) {
    payload.embeds = [{ image: { url: embedImage }, color: 0x0059b2 }];
  }
  try {
    const discordRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (discordRes.ok || discordRes.status === 204) {
      return res.json({ ok: true });
    }
    const err = await discordRes.text();
    return res.status(discordRes.status).json({ error: err });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ── Discord: read channel messages (TP67 only) ──
app.get('/api/discord/messages', async (req, res) => {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return res.status(500).json({ error: 'DISCORD_BOT_TOKEN chưa được cấu hình.' });
  const channelId = req.query.channelId;
  if (!channelId) return res.status(400).json({ error: 'Thiếu channelId.' });
  const limit = Math.min(parseInt(req.query.limit || '50'), 100);
  const before = req.query.before;
  try {
    let url = `https://discord.com/api/v10/channels/${channelId}/messages?limit=${limit}`;
    if (before) url += `&before=${before}`;
    const r = await fetch(url, { headers: { Authorization: `Bot ${token}` } });
    if (!r.ok) { const err = await r.text(); return res.status(r.status).json({ error: err }); }
    const messages = await r.json();
    return res.json({ messages });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ── Admin: Categories CRUD (server-side to bypass RLS issues) ──
app.get('/api/admin/categories', async (req, res) => {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=*&order=name`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data });
    return res.json(data);
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/categories', async (req, res) => {
  const { name, slug, description, parent_id } = req.body || {};
  if (!name || !slug) return res.status(400).json({ error: 'Thiếu name hoặc slug' });
  const payload = { name, slug };
  if (description) payload.description = description;
  if (parent_id) payload.parent_id = parent_id;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/categories`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data?.message || data?.error || JSON.stringify(data) });
    return res.json(Array.isArray(data) ? data[0] : data);
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/categories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/categories?id=eq.${id}`, {
      method: 'DELETE',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      return res.status(r.status).json({ error: data?.message || 'Xóa thất bại' });
    }
    return res.json({ ok: true });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.use(express.static(DIST_DIR, { index: false }));

app.get('/bai-viet/:slug', async (req, res) => {
  const { slug } = req.params;
  const indexHtml = getIndexHtml();
  if (!indexHtml) {
    return res.status(503).send('App not built yet');
  }

  try {
    const post = await fetchPost(slug);
    if (post) {
      const injected = injectOgIntoHtml(indexHtml, buildOgHtml(post, slug));
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
      return res.send(injected);
    }
  } catch (err) {
    console.error('OG fetch error:', err);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  res.send(injectOgIntoHtml(indexHtml, buildOgHtml({ title: SITE_NAME, excerpt: DEFAULT_DESC, thumbnail: DEFAULT_IMG }, slug)));
});

app.get(/.*/, (req, res) => {
  const indexHtml = getIndexHtml();
  if (!indexHtml) {
    return res.status(503).send('App not built yet');
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(indexHtml);
});

createServer(app).listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
