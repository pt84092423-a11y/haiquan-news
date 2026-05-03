import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://gqxrptccptfbzfdmaoyl.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxeHJwdGNjcHRmYnpmZG1hb3lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MjIyNzAsImV4cCI6MjA5MDA5ODI3MH0.7lyAtlXFyRBHd3oFAhhxxdqs1rn2GhHdGOuMgEuk-SE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;

async function getSetting(key) {
  const { data } = await supabase.from('site_settings').select('value').eq('key', key).single();
  return data?.value || null;
}

async function upsertSetting(key, value) {
  await supabase.from('site_settings').upsert({ key, value }, { onConflict: 'key' });
}

async function getCategoryId(slug) {
  if (!slug) return null;
  const { data } = await supabase.from('categories').select('id').eq('slug', slug).single();
  return data?.id || null;
}

async function parseYoutubeRSS(channelId) {
  try {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const entries = [];
    const re = /<entry>([\s\S]*?)<\/entry>/g;
    let m;
    while ((m = re.exec(xml)) !== null) {
      const e = m[1];
      const videoId   = (e.match(/<yt:videoId>(.*?)<\/yt:videoId>/)   || [])[1];
      const title     = (e.match(/<title>(.*?)<\/title>/)             || [])[1];
      const published = (e.match(/<published>(.*?)<\/published>/)      || [])[1];
      const thumbnail = (e.match(/<media:thumbnail url="(.*?)"/)      || [])[1];
      if (videoId && title) entries.push({
        videoId, published, thumbnail: thumbnail || '',
        title: title.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'"),
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      });
    }
    return entries;
  } catch (e) {
    console.error(`[VideoSync] Lỗi RSS ${channelId}:`, e.message);
    return [];
  }
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
    const { channelId, categorySlug, label } = ch;
    if (!channelId) continue;
    const categoryId = await getCategoryId(categorySlug);
    const videos = await parseYoutubeRSS(channelId);

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
        published_at: v.published || new Date().toISOString(),
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
