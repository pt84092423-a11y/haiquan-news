import express from 'express';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

const SUPABASE_URL = 'https://gqxrptccptfbzfdmaoyl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxeHJwdGNjcHRmYnpmZG1hb3lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MjIyNzAsImV4cCI6MjA5MDA5ODI3MH0.7lyAtlXFyRBHd3oFAhhxxdqs1rn2GhHdGOuMgEuk-SE';
const SITE_NAME = 'Báo Hải Quân Việt Nam - SROV';
const SITE_DOMAIN = 'baohaiquansrov.xo.je';
const DEFAULT_DESC = 'Cơ quan ngôn luận của Quân chủng Hải quân Nhân dân Việt Nam';
const DEFAULT_IMG = `https://${SITE_DOMAIN}/opengraph.jpg`;

const DIST_DIR = join(__dirname, 'dist');

async function fetchPost(slug) {
  const url = `${SUPABASE_URL}/rest/v1/posts?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=title,excerpt,thumbnail,og_image,meta_title,meta_description,author,published_at,updated_at,slug&limit=1`;
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

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildOgHtml(post, slug) {
  const title = escapeHtml(post.meta_title || post.title);
  const fullTitle = `${title} | ${SITE_NAME}`;
  const description = escapeHtml(post.meta_description || post.excerpt || DEFAULT_DESC);
  const image = escapeHtml(post.og_image || post.thumbnail || DEFAULT_IMG);
  const url = `https://${SITE_DOMAIN}/bai-viet/${slug}`;
  const published = post.published_at || post.created_at || '';
  const modified = post.updated_at || published;
  const author = escapeHtml(post.author || SITE_NAME);

  return `
    <title>${fullTitle}</title>
    <meta name="description" content="${description}" />
    <meta name="author" content="${author}" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:title" content="${fullTitle}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
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
    <meta name="twitter:title" content="${fullTitle}" />
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
  return html.replace('<head>', `<head>${ogHtml}`);
}

app.use(express.static(DIST_DIR));

app.get('/bai-viet/:slug', async (req, res) => {
  const { slug } = req.params;
  const indexHtml = getIndexHtml();
  if (!indexHtml) {
    return res.status(503).send('App not built yet');
  }

  try {
    const post = await fetchPost(slug);
    if (post) {
      const ogHtml = buildOgHtml(post, slug);
      const injected = injectOgIntoHtml(indexHtml, ogHtml);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
      return res.send(injected);
    }
  } catch (err) {
    console.error('OG fetch error:', err);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(indexHtml);
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
