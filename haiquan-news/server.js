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
