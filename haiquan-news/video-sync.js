import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://gqxrptccptfbzfdmaoyl.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxeHJwdGNjcHRmYnpmZG1hb3lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MjIyNzAsImV4cCI6MjA5MDA5ODI3MH0.7lyAtlXFyRBHd3oFAhhxxdqs1rn2GhHdGOuMgEuk-SE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function getSetting(key) {
  const { data } = await supabase.from('settings').select('value').eq('key', key).single();
  return data?.value || null;
}

async function upsertSetting(key, value) {
  await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' });
}

async function getCategoryId(slug) {
  if (!slug) return null;
  const { data } = await supabase.from('categories').select('id').eq('slug', slug).single();
  return data?.id || null;
}

async function scrapeChannelVideos(channelId, handle) {
  async function scrape(url) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!res.ok) return [];
      const html = await res.text();
      const m = html.match(/ytInitialData\s*=\s*(\{.+?\});\s*<\/script>/s);
      if (!m) return [];
      const s = JSON.stringify(JSON.parse(m[1]));
      const seen = new Set();
      const entries = [];
      function clean(t) {
        return t.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
      }
      function addEntry(videoId, title) {
        if (!seen.has(videoId) && entries.length < 15) {
          seen.add(videoId);
          entries.push({
            videoId, title: clean(title),
            thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            embedUrl: `https://www.youtube.com/embed/${videoId}`,
            published: new Date().toISOString(),
          });
        }
      }
      let mm;
      // Pattern 1: new YouTube UI
      const re1 = /"videoId":"([a-zA-Z0-9_-]{11})"[\s\S]{0,3000}?"title":\{"content":"([^"]+)"/g;
      while ((mm = re1.exec(s)) !== null) { addEntry(mm[1], mm[2]); if (entries.length >= 15) break; }
      // Pattern 2: old YouTube UI (videoRenderer with thumbnail then runs)
      if (entries.length < 3) {
        const re2 = /"videoId":"([a-zA-Z0-9_-]{11})","thumbnail"[\s\S]{0,300}?"runs":\[\{"text":"([^"]+)"/g;
        while ((mm = re2.exec(s)) !== null) { addEntry(mm[1], mm[2]); if (entries.length >= 15) break; }
      }
      // Pattern 3: broadest fallback
      if (entries.length < 3) {
        const re3 = /"videoId":"([a-zA-Z0-9_-]{11})"[\s\S]{0,400}?"text":"([^"]{5,120})"/g;
        while ((mm = re3.exec(s)) !== null) { addEntry(mm[1], mm[2]); if (entries.length >= 15) break; }
      }
      return entries;
    } catch (e) {
      return [];
    }
  }

  let videos = await scrape(`https://www.youtube.com/channel/${channelId}/videos`);
  if (videos.length === 0 && handle) {
    videos = await scrape(`https://www.youtube.com/@${handle.replace('@', '')}/videos`);
  }
  return videos;
}

async function syncChannels() {
  console.log(`[VideoSync] ${new Date().toLocaleString('vi-VN')} — Bắt đầu đồng bộ...`);
  const channelsJson = await getSetting('youtube_sync_channels');
  if (!channelsJson) {
    console.log('[VideoSync] Chưa có kênh nào được cấu hình trong youtube_sync_channels.');
    return;
  }
  let channels;
  try { channels = JSON.parse(channelsJson); } catch {
    console.error('[VideoSync] JSON cấu hình kênh không hợp lệ.'); return;
  }

  const seenJson = await getSetting('youtube_sync_seen_ids');
  const seenIds = new Set(seenJson ? JSON.parse(seenJson) : []);
  const newSeenIds = new Set(seenIds);
  let newCount = 0;

  for (const ch of channels) {
    const { channelId, handle, categorySlug, label } = ch;
    if (!channelId) continue;
    const categoryId = await getCategoryId(categorySlug);
    const videos = await scrapeChannelVideos(channelId, handle);

    for (const v of videos) {
      if (seenIds.has(v.videoId)) continue;
      const slug = `yt-${v.videoId}`;
      const { error } = await supabase.from('posts').upsert({
        title: v.title,
        slug,
        content: `<p>Video tự động nhập từ kênh <strong>${label || 'YouTube'}</strong>.</p>`,
        excerpt: v.title,
        thumbnail: v.thumbnail,
        category_id: categoryId || null,
        status: 'draft',
        post_type: 'video',
        video_url: v.embedUrl,
        author: label || 'YouTube Auto-Sync',
        published_at: v.published,
      }, { onConflict: 'slug', ignoreDuplicates: true });

      newSeenIds.add(v.videoId);
      if (!error) {
        newCount++;
        console.log(`[VideoSync] ✅ Draft: "${v.title}"`);
      }
    }
  }

  const seenArr = [...newSeenIds].slice(-1000);
  await upsertSetting('youtube_sync_seen_ids', JSON.stringify(seenArr));
  console.log(`[VideoSync] Hoàn tất. Tạo mới: ${newCount} bài.`);
}

syncChannels().catch(console.error);
setInterval(() => syncChannels().catch(console.error), SYNC_INTERVAL_MS);
