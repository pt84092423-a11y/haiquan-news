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
const DEFAULT_IMG = `${PUBLIC_SITE_URL}/opengraph.jpg`; // navy banner (image 3)

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

// ── CORS — allow InfinityFree frontend (or any configured origin) to call this API ──
app.use((req, res, next) => {
  const allowedOrigin = process.env.CORS_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Discord: ping to check bot token ──
app.get('/api/discord/ping', (req, res) => {
  const configured = !!process.env.DISCORD_BOT_TOKEN;
  res.json({ configured });
});

// ── YouTube: fetch videos via RSS feed ──
// In-memory YouTube cache: channelId → { videos, ts }
const ytCache = {};
const YT_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

app.get('/api/youtube/feed', async (req, res) => {
  const channelId = req.query.channelId;
  const handle = req.query.handle;
  const HANDLE_MAP = {
    'UC4MXnZXKnKu9Cg6mNts1aPQ': 'srov24h',
    'UC7W8ubM1PB8DzLMP7JSrHyg': 'srov4',
    'UCyV_AKZjCqd1bkUbEHGcTyA': 'TGM_Kuroma',
  };
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  const cacheKey = channelId || handle || 'unknown';

  // Serve from cache if fresh
  if (ytCache[cacheKey] && (Date.now() - ytCache[cacheKey].ts) < YT_CACHE_TTL) {
    res.setHeader('X-Cache', 'HIT');
    return res.json({ videos: ytCache[cacheKey].videos });
  }

  function clean(t) {
    return t.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim();
  }

  function fetchWithTimeout(url, opts, ms = 8000) {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(tid));
  }

  // Method 1: Direct YouTube RSS
  async function fetchRSS(chId) {
    try {
      const rssRes = await fetchWithTimeout(
        `https://www.youtube.com/feeds/videos.xml?channel_id=${chId}`,
        { headers: { 'User-Agent': UA } }, 8000
      );
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

  // Method 2: rss2json.com (works even when direct YouTube RSS is blocked)
  async function fetchRss2Json(chId) {
    try {
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${chId}`;
      const r = await fetchWithTimeout(
        `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=15`,
        {}, 10000
      );
      if (!r.ok) return [];
      const j = await r.json();
      if (j.status !== 'ok' || !Array.isArray(j.items) || j.items.length === 0) return [];
      return j.items.map(item => {
        const videoId = item.link?.split('v=')?.[1]?.split('&')?.[0] || '';
        return {
          videoId,
          title: item.title || '',
          published: item.pubDate || '',
          channel: '',
          thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          url: item.link || '',
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
        };
      }).filter(v => v.videoId);
    } catch { return []; }
  }

  // Method 3: HTML scrape by handle
  async function scrapeByHandle(hdl) {
    try {
      const pageRes = await fetchWithTimeout(
        `https://www.youtube.com/@${hdl.replace('@','')}/videos`,
        { headers: { 'User-Agent': UA } }, 10000
      );
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
    // Try Method 1: direct RSS
    if (channelId) videos = await fetchRSS(channelId);
    // Try Method 2: rss2json.com (server-to-server, bypasses blocking)
    if (videos.length === 0 && channelId) videos = await fetchRss2Json(channelId);
    // Try Method 3: HTML scrape
    const resolvedHandle = handle || (channelId ? HANDLE_MAP[channelId] : null);
    if (videos.length === 0 && resolvedHandle) videos = await scrapeByHandle(resolvedHandle);
    // Cache the result if we got videos
    if (videos.length > 0) ytCache[cacheKey] = { videos, ts: Date.now() };
    res.setHeader('X-Cache', 'MISS');
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

// ── Discord: delete a message ──
app.delete('/api/discord/messages/:messageId', async (req, res) => {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return res.status(500).json({ error: 'DISCORD_BOT_TOKEN chưa được cấu hình.' });
  const { messageId } = req.params;
  const channelId = req.query.channelId;
  if (!channelId || !messageId) return res.status(400).json({ error: 'Thiếu channelId hoặc messageId.' });
  try {
    const r = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bot ${token}` },
    });
    if (r.ok || r.status === 204) return res.json({ ok: true });
    const err = await r.text();
    return res.status(r.status).json({ error: err });
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

app.patch('/api/admin/categories/:id', async (req, res) => {
  const { id } = req.params;
  const { name, slug, description } = req.body || {};
  if (!name || !slug) return res.status(400).json({ error: 'Thiếu name hoặc slug' });
  const payload = { name, slug };
  if (description !== undefined) payload.description = description || null;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/categories?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data?.message || JSON.stringify(data) });
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

// ── SEO Settings cache (read from Supabase, refreshed every 5 min) ──
let seoCache = null;
let seoCacheTime = 0;
let robotsCache = null;
let robotsCacheTime = 0;
let redirectsCache = null;
let redirectsCacheTime = 0;
const SEO_CACHE_TTL = 5 * 60 * 1000;

async function getSeoSettings() {
  if (seoCache && Date.now() - seoCacheTime < SEO_CACHE_TTL) return seoCache;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/settings?key=eq.seo_global&select=value&limit=1`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } });
    const data = r.ok ? await r.json() : [];
    seoCache = data?.[0]?.value ? JSON.parse(data[0].value) : null;
    seoCacheTime = Date.now();
    return seoCache;
  } catch { return null; }
}

async function getRobotsContent() {
  if (robotsCache && Date.now() - robotsCacheTime < SEO_CACHE_TTL) return robotsCache;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/settings?key=eq.robots_txt&select=value&limit=1`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } });
    const data = r.ok ? await r.json() : [];
    robotsCache = data?.[0]?.value || null;
    robotsCacheTime = Date.now();
    return robotsCache;
  } catch { return null; }
}

async function getRedirects() {
  if (redirectsCache && Date.now() - redirectsCacheTime < SEO_CACHE_TTL) return redirectsCache;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/settings?key=eq.seo_redirects&select=value&limit=1`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } });
    const data = r.ok ? await r.json() : [];
    redirectsCache = data?.[0]?.value ? JSON.parse(data[0].value) : [];
    redirectsCacheTime = Date.now();
    return redirectsCache;
  } catch { return []; }
}

// ── Redirect middleware (reads from Supabase seo_redirects setting) ──
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/admin')) return next();
  try {
    const redirects = await getRedirects();
    const match = redirects.find(r => r.from && (r.from === req.path || r.from === req.url));
    if (match) return res.redirect(match.type || 301, match.to);
  } catch {}
  next();
});

// ── Robots.txt (dynamic from Supabase settings) ──
const DEFAULT_ROBOTS_TXT = `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: ${PUBLIC_SITE_URL}/sitemap.xml`;

app.get('/robots.txt', async (req, res) => {
  const content = (await getRobotsContent()) || DEFAULT_ROBOTS_TXT;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.send(content);
});

// ── Admin: clear server-side caches ──
app.post('/api/admin/clear-cache', (req, res) => {
  seoCache = null; seoCacheTime = 0;
  robotsCache = null; robotsCacheTime = 0;
  redirectsCache = null; redirectsCacheTime = 0;
  Object.keys(ytCache).forEach(k => delete ytCache[k]);
  return res.json({ ok: true, message: 'Đã xóa toàn bộ cache server.' });
});

// ── Visitor Tracking ──
app.post('/api/track', async (req, res) => {
  try {
    const { path, referrer, screenWidth, userAgent, language } = req.body || {};
    if (!userAgent || /bot|crawl|spider|prerender|googlebot|bingbot|yandex|baidu|slurp/i.test(userAgent)) {
      return res.json({ ok: true });
    }
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket?.remoteAddress || '').trim();
    const isTablet = /ipad|tablet|playbook|silk/i.test(userAgent);
    const isMobile = !isTablet && /mobile|android|iphone|ipod|blackberry|opera mini|windows phone/i.test(userAgent);
    const deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';
    let os = 'Khác';
    if (/windows nt/i.test(userAgent)) os = 'Windows';
    else if (/macintosh|mac os x/i.test(userAgent)) os = 'macOS';
    else if (/android/i.test(userAgent)) os = 'Android';
    else if (/iphone|ipad|ipod/i.test(userAgent)) os = 'iOS';
    else if (/chromeos|cros/i.test(userAgent)) os = 'ChromeOS';
    else if (/linux/i.test(userAgent)) os = 'Linux';
    let browser = 'Khác';
    if (/edg\//i.test(userAgent)) browser = 'Edge';
    else if (/opr\/|opera/i.test(userAgent)) browser = 'Opera';
    else if (/firefox/i.test(userAgent)) browser = 'Firefox';
    else if (/chrome/i.test(userAgent)) browser = 'Chrome';
    else if (/safari/i.test(userAgent)) browser = 'Safari';
    let geo = {};
    const isLocal = !ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('10.') || ip.startsWith('192.168.');
    if (!isLocal) {
      try {
        const geoRes = await Promise.race([
          fetch(`http://ip-api.com/json/${ip}?lang=vi&fields=status,country,countryCode,regionName,city,district`),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3000)),
        ]);
        if (geoRes.ok) {
          const g = await geoRes.json();
          if (g.status === 'success') geo = { country: g.country || null, country_code: g.countryCode || null, region: g.regionName || null, city: g.city || null, district: g.district || null };
        }
      } catch (_) {}
    }
    await fetch(`${SUPABASE_URL}/rest/v1/visitor_logs`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ path: (path || '/').substring(0, 500), referrer: referrer ? String(referrer).substring(0, 500) : null, device_type: deviceType, os, browser, screen_width: typeof screenWidth === 'number' ? screenWidth : null, ip: ip || null, language: language ? String(language).substring(0, 20) : null, ...geo }),
    });
    res.json({ ok: true });
  } catch (_) { res.json({ ok: true }); }
});

// ── Analytics Stats ──
app.get('/api/analytics-stats', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 365);
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const r = await fetch(`${SUPABASE_URL}/rest/v1/visitor_logs?created_at=gte.${since}&select=path,country,country_code,region,city,district,device_type,os,browser,screen_width,created_at,language&limit=50000&order=created_at.desc`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } });
    const logs = r.ok ? await r.json() : [];
    if (!Array.isArray(logs)) return res.json({ total: 0, countries: [], regions: [], cities: [], districts: [], devices: [], os: [], browsers: [], topPages: [], daily: [], error: 'Table not found' });
    const tally = (key) => { const c = {}; for (const l of logs) { const v = l[key]; if (v) c[v] = (c[v] || 0) + 1; } return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })); };
    const daily = {}; for (const l of logs) { const d = l.created_at?.split('T')[0]; if (d) daily[d] = (daily[d] || 0) + 1; }
    res.json({ total: logs.length, countries: tally('country').slice(0,15), regions: tally('region').slice(0,20), cities: tally('city').slice(0,20), districts: tally('district').slice(0,20), devices: tally('device_type'), os: tally('os').slice(0,10), browsers: tally('browser').slice(0,10), topPages: tally('path').slice(0,15), languages: tally('language').slice(0,10), daily: Object.entries(daily).sort((a,b) => a[0].localeCompare(b[0])).map(([date,count]) => ({ date, count })) });
  } catch (err) { console.error('Analytics error:', err); res.json({ total: 0, countries: [], regions: [], cities: [], districts: [], devices: [], os: [], browsers: [], topPages: [], daily: [] }); }
});

// ── Sitemap XML (dynamic — fetches from Supabase) ──
app.get('/sitemap.xml', async (req, res) => {
  const STATIC_PAGES = [
    { loc: '', priority: '1.0', changefreq: 'daily' },
    { loc: '/tin-tuc', priority: '0.9', changefreq: 'daily' },
    { loc: '/cau-truc', priority: '0.7', changefreq: 'monthly' },
    { loc: '/vi-chu-quyen', priority: '0.8', changefreq: 'weekly' },
    { loc: '/tam-tinh', priority: '0.7', changefreq: 'weekly' },
    { loc: '/goc-van-nghe', priority: '0.6', changefreq: 'weekly' },
    { loc: '/video', priority: '0.7', changefreq: 'weekly' },
  ];

  try {
    // Fetch all published post slugs + dates
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/posts?status=eq.published&select=slug,updated_at,published_at&order=published_at.desc&limit=1000`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    const posts = r.ok ? await r.json() : [];

    const now = new Date().toISOString().split('T')[0];

    const staticUrls = STATIC_PAGES.map(p => `
  <url>
    <loc>${PUBLIC_SITE_URL}${p.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('');

    const postUrls = posts.map(p => {
      const lastmod = (p.updated_at || p.published_at || now).split('T')[0];
      return `
  <url>
    <loc>${PUBLIC_SITE_URL}/bai-viet/${encodeURIComponent(p.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticUrls}${postUrls}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    return res.send(xml);
  } catch (err) {
    console.error('Sitemap error:', err);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
});

// Serve hashed assets with 1-year immutable cache
app.use('/assets', express.static(join(DIST_DIR, 'assets'), {
  index: false,
  maxAge: 365 * 24 * 60 * 60 * 1000,
  immutable: true,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  },
}));
// Serve other static files with short cache
app.use(express.static(DIST_DIR, {
  index: false,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else if (/\.(jpg|jpeg|png|gif|webp|svg|ico|woff2|woff)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    } else if (/\.(js|css)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    }
  },
}));

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

// Static SEO content injected into homepage HTML before React mounts.
// Content is real and visible to everyone — fully Google-compliant (no cloaking).
const HOMEPAGE_STATIC_HTML = `
<div id="hq-static-seo" style="font-family:sans-serif;background:#f0f4f8;border-top:3px solid #003380;padding:28px 20px;color:#222;line-height:1.75;font-size:15px;">
  <div style="max-width:900px;margin:0 auto;">
    <h2 style="color:#003380;font-size:20px;font-weight:700;margin:0 0 10px;">Giới thiệu về Báo Hải Quân Việt Nam – SROV</h2>
    <p style="margin:0 0 10px;">
      <strong>Báo Hải Quân Việt Nam – SROV</strong> là cổng thông tin điện tử chuyên cập nhật tin tức sự kiện,
      cơ cấu tổ chức và hoạt động chính thức của Sư đoàn 162 thuộc Quân chủng Hải quân Nhân dân Việt Nam.
      Trang cung cấp thông tin đa dạng, bao gồm: tin tức &amp; sự kiện hải quân, chủ quyền biển đảo,
      tâm tình lính biển, lịch sử hải quân, hệ thống chỉ huy, truyền hình hải quân và ấn phẩm báo in kỹ thuật số cuối tuần.
    </p>
    <p style="margin:0 0 10px;">
      Hệ thống hoạt động như một tòa soạn báo chính quy, cập nhật liên tục các thông báo quân sự,
      tư liệu huấn luyện và tài liệu lịch sử hữu ích cho cán bộ, chiến sĩ và cộng đồng quan tâm.
      Mọi nội dung được kiểm duyệt bởi ban biên tập trước khi đăng tải.
    </p>
    <p style="margin:0;font-size:13px;color:#555;">
      📍 Trụ sở: Số 36, Phường Cam Ranh, Tỉnh Khánh Hoà &nbsp;|&nbsp;
      🌐 <a href="https://baohaiquansrov.xo.je" style="color:#003380;">baohaiquansrov.xo.je</a> &nbsp;|&nbsp;
      ✉ toasoan@haiquan-srov.vn
    </p>
  </div>
</div>
<script>
  // Hide the static section once React has mounted to avoid duplication
  document.addEventListener('DOMContentLoaded', function() {
    var el = document.getElementById('hq-static-seo');
    var root = document.getElementById('root');
    if (!el || !root) return;
    var obs = new MutationObserver(function() {
      if (root.children.length > 0) { el.style.display = 'none'; obs.disconnect(); }
    });
    obs.observe(root, { childList: true, subtree: false });
    // Fallback: hide after 4 seconds regardless
    setTimeout(function() { if (el) el.style.display = 'none'; }, 4000);
  });
</script>`;

app.get(/.*/, (req, res) => {
  const indexHtml = getIndexHtml();
  if (!indexHtml) {
    return res.status(503).send('App not built yet');
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Inject static SEO section before </body> for homepage only
  const isHomepage = req.path === '/' || req.path === '';
  const html = isHomepage
    ? indexHtml.replace('</body>', `${HOMEPAGE_STATIC_HTML}\n</body>`)
    : indexHtml;
  res.send(html);
});

createServer(app).listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
