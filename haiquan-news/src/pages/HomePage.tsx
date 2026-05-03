import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import SEOHead from '@/components/SEOHead';
import SectionTitle from '@/components/SectionTitle';
import PostCard from '@/components/PostCard';
import WebsiteLinks from '@/components/WebsiteLinks';
import { getAllSettings, getPublishedPosts, getSiteSetting, parseJsonSetting, type Post } from '@/lib/supabase';
import { DEFAULT_COMMAND_DATA, type CommandData, type Commander } from '@/pages/CommandPage';

const PLACEHOLDER = 'https://via.placeholder.com/800x500/00305f/ffffff?text=Báo+Hải+Quân';
const DEFAULT_MAIN_AD = 'https://baohaiquanvietnam.vn/storage/users/user_12/2025/TH%C3%81NG%2011/14/z7226029114068_f556938a4a781dddde927265a1a30a65.jpg';
const DEFAULT_BOTTOM_AD = 'https://baohaiquanvietnam.vn/storage/users/user_12/2026/Banner/126.png';

const getAdImages = (settings: Record<string, string>, multiKey: string, singleKey: string, fallback: string) => {
  const raw = settings[multiKey] || settings[singleKey] || fallback;
  const images = raw.trim().startsWith('[')
    ? (() => {
        try {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })()
    : raw.split(/[\n,]+/);
  return images.map((item: string) => item.trim()).filter(Boolean);
};

type YTVideo = {
  videoId: string;
  title: string;
  published: string;
  thumbnail: string;
  url: string;
  embedUrl: string;
  channel: string;
};

// Channel IDs + handles: @TGM_Kuroma, @srov24h, @srov4
const YT_MEDIA_CHANNELS = [
  { channelId: 'UCyV_AKZjCqd1bkUbEHGcTyA', handle: 'TGM_Kuroma' },
  { channelId: 'UC4MXnZXKnKu9Cg6mNts1aPQ', handle: 'srov24h' },
];
const YT_TV_CHANNELS = [
  { channelId: 'UC7W8ubM1PB8DzLMP7JSrHyg', handle: 'srov4' },
];

async function fetchYoutubeChannel(ch: { channelId: string; handle: string }): Promise<YTVideo[]> {
  // Method 1: rss2json.com — browser-direct, bypasses server IP blocks from YouTube
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${ch.channelId}`;
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=15`;
    const r = await fetch(apiUrl);
    const j = await r.json();
    if (j.status === 'ok' && Array.isArray(j.items) && j.items.length > 0) {
      return j.items.map((item: any) => {
        const videoId = item.link?.split('v=')?.[1]?.split('&')?.[0] || '';
        return {
          videoId,
          title: item.title || '',
          published: item.pubDate || '',
          thumbnail: item.thumbnail || item.enclosure?.link || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          url: item.link || '',
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          channel: ch.handle,
        } as YTVideo;
      }).filter((v: YTVideo) => v.videoId);
    }
  } catch { /* fall through */ }

  // Method 2: server-side proxy (works on Replit dev, may fail on production)
  try {
    const r = await fetch(`/api/youtube/feed?channelId=${ch.channelId}&handle=${ch.handle}`);
    if (r.ok) {
      const j = await r.json();
      if ((j.videos || []).length > 0) return j.videos as YTVideo[];
    }
  } catch { /* fall through */ }

  return [];
}

export default function HomePage() {
  const [spotlight, setSpotlight] = useState<Post[]>([]);
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [newPosts, setNewPosts] = useState<Post[]>([]);
  const [mostRead, setMostRead] = useState<Post[]>([]);
  const [generalPosts, setGeneralPosts] = useState<Post[]>([]);
  
  const [chuQuyenPosts, setChuQuyenPosts] = useState<Post[]>([]);
  const [tamTinhPosts, setTamTinhPosts] = useState<Post[]>([]);
  const [lichSuPosts, setLichSuPosts] = useState<Post[]>([]);
  const [commanders, setCommanders] = useState<Commander[]>([]);
  
  const [mediaPosts, setMediaPosts] = useState<Post[]>([]);
  const [podcastPosts, setPodcastPosts] = useState<Post[]>([]);
  const [videoPosts, setVideoPosts] = useState<Post[]>([]);
  const [shortVideos, setShortVideos] = useState<Post[]>([]);
  const [latestBaoIn, setLatestBaoIn] = useState<Post | null>(null);
  const [ads, setAds] = useState<Record<string, string>>({});
  const [mainAdIdx, setMainAdIdx] = useState(0);
  const [bottomAdIdx, setBottomAdIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // YouTube live RSS state
  const [ytMediaVideos, setYtMediaVideos] = useState<YTVideo[]>([]);
  const [ytTVVideos, setYtTVVideos] = useState<YTVideo[]>([]);
  const [ytLoading, setYtLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        console.log('[HomePage] load() start');
        // Mỗi call có timeout 8s để không bị treo nếu một query nào đó chậm/hang.
        const withTimeout = <T,>(p: Promise<T>, label: string, ms = 8000): Promise<T> =>
          Promise.race<T>([
            p,
            new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timeout ${ms}ms`)), ms)),
          ]);
        const results = await Promise.allSettled([
          withTimeout(getPublishedPosts({ limit: 40 }), 'all'),
          withTimeout(getPublishedPosts({ postType: 'video', limit: 6 }), 'video6'),
          withTimeout(getPublishedPosts({ postType: 'video', limit: 5 }), 'video5'),
          withTimeout(getPublishedPosts({ postType: 'podcast', limit: 4 }), 'podcast'),
          withTimeout(getPublishedPosts({ postType: 'baoin', limit: 1 }), 'baoin'),
          withTimeout(getPublishedPosts({ categorySlug: 'tam-tinh', limit: 4 }), 'tam-tinh'),
          withTimeout(getPublishedPosts({ categorySlug: 'lich-su', limit: 4 }), 'lich-su'),
          withTimeout(getAllSettings(), 'settings'),
          withTimeout(getSiteSetting('command_page_data'), 'command'),
        ]);
        console.log('[HomePage] allSettled done', results.map(r => r.status));
        function pickAt<T>(i: number, fallback: T): T {
          const r = results[i];
          return r.status === 'fulfilled' && r.value != null ? (r.value as T) : fallback;
        }
        results.forEach((r, i) => {
          if (r.status === 'rejected') console.warn(`HomePage load[${i}] failed:`, r.reason);
        });
        const all = pickAt<Post[]>(0, []);
        const media = pickAt<Post[]>(1, []);
        const shorts = pickAt<Post[]>(2, []);
        const podcasts = pickAt<Post[]>(3, []);
        const baoIn = pickAt<Post[]>(4, []);
        const tamTinh = pickAt<Post[]>(5, []);
        const lichSu = pickAt<Post[]>(6, []);
        const settings = pickAt<Record<string, string>>(7, {});
        const commandRaw = pickAt<string | null>(8, null);
        const posts = all || [];
        const articles = posts.filter(p => p.post_type !== 'baoin');

        setSpotlight(articles.slice(0, 3));
        setNewPosts(articles.slice(0, 4));

        const sorted = [...articles].sort((a, b) => b.view_count - a.view_count);
        setMostRead(sorted.slice(0, 6));

        setGeneralPosts(articles.slice(3, 7));
        setChuQuyenPosts(articles.slice(11, 16));

        setTamTinhPosts(tamTinh || []);
        setLichSuPosts(lichSu || []);

        try {
          const command = parseJsonSetting<CommandData>(commandRaw, DEFAULT_COMMAND_DATA);
          const peopleArr = Array.isArray(command?.people) ? command.people : DEFAULT_COMMAND_DATA.people;
          const sortedCommanders = [...peopleArr]
            .filter(p => p.group === 'navy')
            .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
          setCommanders(sortedCommanders);
        } catch (e) {
          console.warn('[HomePage] command parse failed', e);
          setCommanders([]);
        }

        setMediaPosts((media || []).slice(0, 4));
        setPodcastPosts((podcasts || []).slice(0, 4));
        setVideoPosts((media || []).slice(0, 3));
        setShortVideos((shorts || []).slice(0, 5));
        setLatestBaoIn((baoIn || [])[0] || null);
        setAds(settings || {});
        console.log('[HomePage] state set, articles=', articles.length);
      } catch (e) {
        console.error('[HomePage] load() crashed', e);
      } finally {
        setLoading(false);
        console.log('[HomePage] loading=false');
      }
    }
    load();
  }, []);

  // Fetch YouTube RSS feeds live for homepage video sections
  useEffect(() => {
    async function loadYT() {
      setYtLoading(true);
      try {
        const [mediaResults, tvResults] = await Promise.allSettled([
          Promise.all(YT_MEDIA_CHANNELS.map(fetchYoutubeChannel)),
          Promise.all(YT_TV_CHANNELS.map(fetchYoutubeChannel)),
        ]);
        if (mediaResults.status === 'fulfilled') {
          const all = mediaResults.value.flat();
          // Sort by published date descending
          all.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
          setYtMediaVideos(all.slice(0, 10));
        }
        if (tvResults.status === 'fulfilled') {
          const all = tvResults.value.flat();
          all.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
          setYtTVVideos(all.slice(0, 6));
        }
      } catch (e) {
        console.warn('[HomePage] YouTube RSS fetch failed', e);
      } finally {
        setYtLoading(false);
      }
    }
    loadYT();
  }, []);

  useEffect(() => {
    if (spotlight.length > 1) {
      intervalRef.current = setInterval(() => {
        setFeaturedIdx(i => (i + 1) % spotlight.length);
      }, 5000);
    }
    return () => clearInterval(intervalRef.current);
  }, [spotlight]);

  const featured = spotlight[featuredIdx];
  const mainAdImages = getAdImages(ads, 'home_ad_main_images', 'home_ad_main_image', DEFAULT_MAIN_AD);
  const bottomAdImages = getAdImages(ads, 'home_ad_bottom_images', 'home_ad_bottom_image', DEFAULT_BOTTOM_AD);
  const activeMainAd = mainAdImages[mainAdIdx % mainAdImages.length] || DEFAULT_MAIN_AD;
  const activeBottomAd = bottomAdImages[bottomAdIdx % bottomAdImages.length] || DEFAULT_BOTTOM_AD;

  useEffect(() => {
    const timer = setInterval(() => {
      setMainAdIdx(i => i + 1);
      setBottomAdIdx(i => i + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Helper class để đồng bộ style tiêu đề in đậm, có chân, in hoa
  const headingStyle = "font-['Playfair_Display',serif] font-black uppercase text-[#0059b2] tracking-tight";

  // Helper cho pill buttons (Nút phân loại mỏng)
  const PillButton = ({ label }: { label: string }) => (
    <button className="px-4 py-1.5 rounded-full border border-[#e1e1e1] text-[13px] text-[#555555] hover:text-[#0059b2] hover:border-[#0059b2] transition-colors bg-white">
      {label}
    </button>
  );

  return (
    <>
      <SEOHead
  title="Tin tức Hải quân mới nhất"
  description="Báo Hải quân - Cơ quan ngôn luận của Quân chủng Hải quân Nhân dân Việt Nam"
  ogType="website"
  canonicalUrl="https://baohaiquansrov.xo.je/"
/>
      <div className="container mx-auto max-w-[1200px] px-4 py-6">

        {/* Row 1: TIÊU ĐIỂM + Featured + TIN MỚI */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-6 border-b border-[#e1e1e1]">
          
          {/* Tiêu điểm */}
          <aside className="md:col-span-3">
            <SectionTitle title="TIÊU ĐIỂM" className={headingStyle} />
            {loading ? (
              <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />)}</div>
            ) : spotlight.length > 0 ? (
              <>
                <PostCard post={spotlight[0]} variant="featured" className="mb-5 border-b border-[#e1e1e1] pb-4" />
                {spotlight.slice(1).map(p => <PostCard key={p.id} post={p} variant="small" />)}
              </>
            ) : <p className="text-sm text-gray-400">Chưa có bài viết</p>}
          </aside>

          {/* Featured Carousel */}
          <div className="md:col-span-6 px-0 md:px-2">
            {loading ? (
              <div className="aspect-video bg-gray-100 rounded animate-pulse mb-4" />
            ) : featured ? (
              <Link href={`/bai-viet/${featured.slug}`} className="group cursor-pointer block">
                <div className="overflow-hidden rounded-[2px] mb-4 relative">
                  <button
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center z-10 shadow text-[#0059b2] font-bold"
                    onClick={e => { e.preventDefault(); setFeaturedIdx(i => (i - 1 + spotlight.length) % spotlight.length); }}
                  >&lt;</button>
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center z-10 shadow text-[#0059b2] font-bold"
                    onClick={e => { e.preventDefault(); setFeaturedIdx(i => (i + 1) % spotlight.length); }}
                  >&gt;</button>
                  <img src={featured.thumbnail || PLACEHOLDER} alt={featured.title} className="w-full h-auto object-cover transform transition duration-500 group-hover:scale-105" />
                </div>
                <h2 className="font-['Roboto',sans-serif] text-[28px] font-bold leading-tight text-[#222222] mb-3 group-hover:text-[#0059b2] transition-colors">
                  {featured.title}
                </h2>
                <p className="font-['Roboto',sans-serif] text-[15px] text-[#555555] leading-relaxed">
                  {featured.excerpt}
                </p>
              </Link>
            ) : (
              <div className="flex items-center justify-center h-[300px] bg-gray-50 text-gray-400 rounded">Chưa có bài viết nổi bật</div>
            )}
          </div>

          {/* Tin mới */}
          <aside className="md:col-span-3">
            <SectionTitle title="TIN MỚI" className={headingStyle} />
            <ul className="flex flex-col">
              {loading
                ? [...Array(4)].map((_, i) => <li key={i} className="h-16 bg-gray-100 rounded animate-pulse mb-2" />)
                : newPosts.map((p, i) => (
                  <li key={p.id}>
                    <Link href={`/bai-viet/${p.slug}`} className="flex gap-4 py-3.5 border-b border-dashed border-[#e1e1e1] group cursor-pointer items-start">
                      <div className="font-['Playfair_Display',serif] text-[40px] text-[#aed1ef] font-black leading-none mt-1">{i + 1}</div>
                      <h4 className="font-['Roboto',sans-serif] text-[15px] font-bold text-[#222222] leading-snug group-hover:text-[#0059b2]">{p.title}</h4>
                    </Link>
                  </li>
                ))
              }
            </ul>
          </aside>
        </div>

        {/* Banner */}
        <div className="my-8">
          <a href={ads.home_ad_main_link || "#"} className="block w-full rounded-sm overflow-hidden shadow-md cursor-pointer hover:opacity-95 transition">
            <img src={activeMainAd} alt="Banner Cổ Động" className="w-full h-auto object-cover" />
          </a>
        </div>

        {/* Row 2: TIN ĐỌC NHIỀU + General + Sidebar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6 pb-6 border-b border-[#e1e1e1]">
          
          {/* CỘT TRÁI: Tin đọc nhiều */}
          <aside className="md:col-span-3">
            <SectionTitle title="TIN ĐỌC NHIỀU" className={headingStyle} />
            <ul className="flex flex-col">
              {loading
                ? [...Array(6)].map((_, i) => <li key={i} className="h-12 bg-gray-100 rounded animate-pulse mb-2" />)
                : mostRead.map((p, i) => <PostCard key={p.id} post={p} variant="numbered" index={i + 1} />)
              }
              {/* Lấp đầy cột trái */}
              {!loading && mostRead.length < 5 && (
                [...Array(5 - mostRead.length)].map((_, i) => (
                  <li key={`filler-${i}`} className="opacity-30 pointer-events-none select-none">
                     <div className="flex gap-3 py-3 border-b border-dashed border-[#e1e1e1] items-center">
                        <div className="font-['Playfair_Display',serif] text-[24px] text-[#aed1ef] font-black leading-none mt-1">
                          {mostRead.length + i + 1}
                        </div>
                        <div className="flex flex-col gap-2 w-full">
                          <div className="h-3.5 bg-gray-200 rounded w-full"></div>
                          <div className="h-3.5 bg-gray-200 rounded w-2/3"></div>
                        </div>
                     </div>
                  </li>
                ))
              )}
            </ul>
          </aside>

          {/* CỘT GIỮA: Khu vực tin tức tổng hợp */}
          <div className="md:col-span-6 px-0 md:px-2 flex flex-col gap-6">
            {loading ? (
              [...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded animate-pulse" />)
            ) : generalPosts.length > 0 ? (
              generalPosts.map(p => <PostCard key={p.id} post={p} variant="horizontal" />)
            ) : (
              <div className="bg-[#f8fbff] border border-blue-100 p-8 rounded-md h-full flex flex-col justify-center items-center text-center shadow-sm">
                <div className="w-16 h-16 bg-[#e8f0fa] rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-[#0059b2]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5L18.5 7H20M9 15h3m-3 4h6m-9-8h.01M15 15h.01M15 19h.01M9 11h.01M15 11h.01" /></svg>
                </div>
                <h3 className="font-serif font-bold text-[#0059b2] text-[20px] mb-2 uppercase">Tin Tức Tổng Hợp</h3>
                <p className="text-[#555555] text-[14px] max-w-[80%] mb-8">
                  Các diễn biến và tin tức hoạt động mới nhất sẽ được tổng hợp và hiển thị tại khu vực này.
                </p>
                <div className="w-full space-y-6 opacity-40">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4">
                       <div className="w-1/3 aspect-[4/3] bg-blue-100/50 rounded-sm"></div>
                       <div className="w-2/3 flex flex-col gap-2.5 justify-center">
                         <div className="h-4 bg-gray-200 w-full rounded-sm"></div>
                         <div className="h-4 bg-gray-200 w-4/5 rounded-sm"></div>
                         <div className="h-3 bg-blue-50 w-1/3 rounded-sm mt-1"></div>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CỘT PHẢI: Sidebar báo in & Website links */}
          <aside className="md:col-span-3">
            <div className="mb-8">
              <SectionTitle title="ĐỌC BÁO IN" className={headingStyle} />
              <Link href="/bao-in" className="bg-[#f2f7fb] p-4 rounded-md border border-blue-100 flex flex-col cursor-pointer group block">
                <h4 className="font-['Roboto',sans-serif] font-bold text-[#0059b2] text-[15px] mb-1">Báo in Hải quân</h4>
                <p className="text-[11px] text-[#555555] mb-3">Số mới nhất</p>
                <div className="shadow-md group-hover:scale-105 transition duration-300 border border-[#e1e1e1]">
                  {loading ? (
                    <div className="w-full aspect-[3/4] bg-gray-200 animate-pulse" />
                  ) : latestBaoIn?.thumbnail ? (
                    <img src={latestBaoIn.thumbnail} alt={latestBaoIn.title || 'Báo In'} className="w-full h-auto" />
                  ) : (
                    <div className="w-full aspect-[3/4] flex flex-col items-center justify-center bg-[#e8f0fa] text-[#0059b2]">
                      <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <span className="text-[12px] opacity-50">Chưa có báo in</span>
                    </div>
                  )}
                </div>
                {latestBaoIn && (
                  <p className="text-[12px] text-[#55] mt-2 line-clamp-2">{latestBaoIn.title}</p>
                )}
              </Link>
            </div>
            <div className="mb-8">
              <SectionTitle title="LIÊN KẾT WEBSITE" className={headingStyle} />
              <WebsiteLinks />
            </div>
            <div>
              <a href={ads.home_ad_sidebar_link || "#"} className="block hover:opacity-95 transition">
                <img src={ads.home_ad_sidebar_image || "/quangcao-101.png"} className="w-full h-auto shadow-md rounded-sm" alt="Quảng cáo trang chủ" />
              </a>
            </div>
          </aside>
        </div>

        {/* --- CHỈ HUY --- */}
        <section className="mt-8 mb-8 border-b border-[#e1e1e1] pb-8">
          <div className="flex flex-col md:flex-row md:items-center mb-6">
            <SectionTitle title="CHỈ HUY" className={`text-[24px] mb-0 md:mr-8 ${headingStyle}`} />
            <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
              <PillButton label="Tin tức - Sự kiện" />
              <PillButton label="HICOM Bộ Tư lệnh" />
              <PillButton label="HICOM các đơn vị" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm">
                  <div className="aspect-[4/3] bg-gray-100 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-1/3 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                    <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
                  </div>
                </div>
              ))
            ) : commanders.length > 0 ? (
              commanders.slice(0, 4).map(person => (
                <Link
                  key={person.id}
                  href="/chi-huy"
                  className="text-left bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition group block"
                >
                  <div className="aspect-[4/3] bg-[#e8f0fa] overflow-hidden">
                    {person.photo ? (
                      <img src={person.photo} alt={person.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#0059b2]/40 font-bold">ẢNH THẺ</div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-[11px] font-bold text-[#0059b2] uppercase">{person.rank}</p>
                    <h3 className="font-bold text-[#222] text-lg leading-tight mt-1 group-hover:text-[#0059b2] transition-colors">{person.name}</h3>
                    <p className="text-sm text-[#555] mt-1">{person.position}</p>
                    {person.unit && <p className="text-[12px] text-[#0059b2] font-bold mt-2 uppercase">{person.unit}</p>}
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full bg-[#f8fbff] border border-blue-100 p-8 rounded-md min-h-[200px] flex flex-col justify-center items-center text-center text-[#0059b2]">
                <strong>Chưa có nội dung Chỉ huy</strong>
                <span className="text-sm text-gray-500 mt-2">Thêm nhân sự HICOM trong trang quản trị để hiển thị tại đây.</span>
              </div>
            )}
          </div>
        </section>

        {/* --- TÂM TÌNH LÍNH BIỂN --- */}
        <section className="mt-8 mb-8 border-b border-[#e1e1e1] pb-8">
          <div className="flex flex-col md:flex-row md:items-center mb-6">
            <SectionTitle title="TÂM TÌNH LÍNH BIỂN" className={`text-[24px] mb-0 md:mr-8 ${headingStyle}`} />
            <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
              <PillButton label="Câu chuyện người lính" />
              <PillButton label="Hậu phương" />
              <PillButton label="Thư từ đảo xa" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8">
              {loading ? (
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="md:w-2/5 flex flex-col gap-2"><div className="h-6 bg-gray-200 rounded w-full"/><div className="h-20 bg-gray-100 rounded w-full"/></div>
                  <div className="md:w-3/5 aspect-[4/3] bg-gray-200 rounded animate-pulse" />
                </div>
              ) : tamTinhPosts[0] ? (
                <Link href={`/bai-viet/${tamTinhPosts[0].slug}`} className="flex flex-col md:flex-row gap-6 group cursor-pointer">
                  <div className="md:w-[40%] flex flex-col justify-center">
                    <h3 className="font-['Roboto',sans-serif] text-[22px] md:text-[26px] font-bold leading-tight text-[#222222] mb-3 group-hover:text-[#0059b2] transition-colors">
                      {tamTinhPosts[0].title}
                    </h3>
                    <p className="font-['Roboto',sans-serif] text-[14px] text-[#555555] leading-relaxed line-clamp-4">
                      {tamTinhPosts[0].excerpt}
                    </p>
                  </div>
                  <div className="md:w-[60%] overflow-hidden rounded-md relative shadow-sm">
                    <img src={tamTinhPosts[0].thumbnail || PLACEHOLDER} alt={tamTinhPosts[0].title} className="w-full h-full object-cover aspect-[4/3] transform transition duration-500 group-hover:scale-105" />
                  </div>
                </Link>
              ) : (
                 <div className="bg-[#f8fbff] border border-blue-100 p-8 rounded-md min-h-[240px] flex flex-col justify-center items-center text-center text-[#0059b2]">
                   <strong>Chưa có nội dung Tâm tình lính biển</strong>
                   <span className="text-sm text-gray-500 mt-2">Khi có bài viết mới, nội dung sẽ tự hiển thị tại đây.</span>
                 </div>
              )}
            </div>

            <div className="md:col-span-4 flex flex-col gap-4 justify-between">
              {loading ? (
                [...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />)
              ) : (
                tamTinhPosts.slice(1, 4).map(p => (
                  <Link key={p.id} href={`/bai-viet/${p.slug}`} className="flex gap-3 group cursor-pointer">
                    <div className="w-[130px] flex-shrink-0 relative aspect-[4/3] rounded-sm overflow-hidden">
                      <img src={p.thumbnail || PLACEHOLDER} alt={p.title} className="w-full h-full object-cover transform transition duration-500 group-hover:scale-110" />
                    </div>
                    <h4 className="font-['Roboto',sans-serif] text-[14px] font-bold text-[#222222] leading-snug group-hover:text-[#0059b2]">
                      {p.title}
                    </h4>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>

        {/* --- LỊCH SỬ --- */}
        <section className="mt-8 mb-8 border-b border-[#e1e1e1] pb-8">
          <div className="flex flex-col md:flex-row md:items-center mb-6">
            <SectionTitle title="LỊCH SỬ" className={`text-[24px] mb-0 md:mr-8 ${headingStyle}`} />
            <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
              <PillButton label="Truyền thống Hải quân" />
              <PillButton label="Trận đánh tiêu biểu" />
              <PillButton label="Anh hùng liệt sĩ" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8">
              {loading ? (
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="md:w-2/5 flex flex-col gap-2"><div className="h-6 bg-gray-200 rounded w-full"/><div className="h-20 bg-gray-100 rounded w-full"/></div>
                  <div className="md:w-3/5 aspect-[4/3] bg-gray-200 rounded animate-pulse" />
                </div>
              ) : lichSuPosts[0] ? (
                <Link href={`/bai-viet/${lichSuPosts[0].slug}`} className="flex flex-col md:flex-row gap-6 group cursor-pointer">
                  <div className="md:w-[40%] flex flex-col justify-center">
                    <h3 className="font-['Roboto',sans-serif] text-[22px] md:text-[26px] font-bold leading-tight text-[#222222] mb-3 group-hover:text-[#0059b2] transition-colors">
                      {lichSuPosts[0].title}
                    </h3>
                    <p className="font-['Roboto',sans-serif] text-[14px] text-[#555555] leading-relaxed line-clamp-4">
                      {lichSuPosts[0].excerpt}
                    </p>
                  </div>
                  <div className="md:w-[60%] overflow-hidden rounded-md relative shadow-sm">
                    <img src={lichSuPosts[0].thumbnail || PLACEHOLDER} alt={lichSuPosts[0].title} className="w-full h-full object-cover aspect-[4/3] transform transition duration-500 group-hover:scale-105" />
                  </div>
                </Link>
              ) : (
                 <div className="bg-[#f8fbff] border border-blue-100 p-8 rounded-md min-h-[240px] flex flex-col justify-center items-center text-center text-[#0059b2]">
                   <strong>Chưa có nội dung Lịch sử</strong>
                   <span className="text-sm text-gray-500 mt-2">Khi có bài viết mới, nội dung sẽ tự hiển thị tại đây.</span>
                 </div>
              )}
            </div>

            <div className="md:col-span-4 flex flex-col gap-4 justify-between">
              {loading ? (
                [...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />)
              ) : (
                lichSuPosts.slice(1, 4).map(p => (
                  <Link key={p.id} href={`/bai-viet/${p.slug}`} className="flex gap-3 group cursor-pointer">
                    <div className="w-[130px] flex-shrink-0 relative aspect-[4/3] rounded-sm overflow-hidden">
                      <img src={p.thumbnail || PLACEHOLDER} alt={p.title} className="w-full h-full object-cover transform transition duration-500 group-hover:scale-110" />
                    </div>
                    <h4 className="font-['Roboto',sans-serif] text-[14px] font-bold text-[#222222] leading-snug group-hover:text-[#0059b2]">
                      {p.title}
                    </h4>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>

        {/* --- VÌ CHỦ QUYỀN BIỂN ĐẢO --- */}
        <section className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center mb-6">
            <SectionTitle title="VÌ CHỦ QUYỀN BIỂN ĐẢO" className={`text-[24px] mb-0 md:mr-8 ${headingStyle}`} />
            <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
              <PillButton label="Tin tức - Sự kiện" />
              <PillButton label="Bộ đội Cụ Hồ" />
              <PillButton label="Bảo vệ nền tảng tư tưởng của Đảng" />
            </div>
          </div>

          <div className="relative mb-6">
             {/* Nút điều hướng mô phỏng */}
             <button className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center z-10 shadow text-[#0059b2] font-bold hover:bg-[#0059b2] hover:text-white transition hidden md:flex">&lt;</button>
             <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center z-10 shadow text-[#0059b2] font-bold hover:bg-[#0059b2] hover:text-white transition hidden md:flex">&gt;</button>
             
             <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {loading ? (
                   [...Array(5)].map((_, i) => <div key={i} className="aspect-[3/5] bg-gray-200 rounded-xl animate-pulse" />)
                ) : chuQuyenPosts.length > 0 ? (
                   chuQuyenPosts.map(p => (
                     <Link key={p.id} href={`/bai-viet/${p.slug}`} className="relative aspect-[3/5] rounded-xl overflow-hidden group cursor-pointer shadow-md block">
                        <img src={p.thumbnail || PLACEHOLDER} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-90 group-hover:opacity-100 transition duration-300" />
                        <h4 className="absolute bottom-4 left-3 right-3 text-white font-['Roboto',sans-serif] font-bold text-[14px] leading-snug text-center group-hover:text-[#FFD700] transition">
                           {p.title}
                        </h4>
                     </Link>
                   ))
                ) : (
                   [...Array(5)].map((_, i) => (
                      <div key={i} className="aspect-[3/5] bg-[#e8f0fa] rounded-xl flex items-center justify-center">
                         <span className="text-[#a0c1e8] text-xs font-bold uppercase">Chưa có bài</span>
                      </div>
                   ))
                )}
             </div>
          </div>

          {/* Banner Đặc công Hải quân */}
          <div className="w-full">
            <a href={ads.home_ad_bottom_link || "#"} className="block hover:opacity-95 transition rounded-md overflow-hidden shadow-md">
               <img src={activeBottomAd} alt="Banner Đặc công Hải quân" className="w-full h-auto object-cover" />
            </a>
          </div>
        </section>

        {/* ĐA PHƯƠNG TIỆN */}
        <section className="bg-[#f2f7fb] rounded-xl p-4 md:p-6 mb-8 shadow-sm border border-blue-100">
          <div className="flex flex-col md:flex-row md:items-center mb-6 pb-3 border-b-2 border-white">
            <SectionTitle title="ĐA PHƯƠNG TIỆN" className={`text-[24px] mr-8 mb-0 ${headingStyle}`} />
            <div className="flex gap-4 md:gap-6 mt-3 md:mt-0 font-['Roboto',sans-serif] font-bold text-[14px] text-[#0059b2]">
              <Link href="/longform" className="hover:text-[#00305f] transition uppercase">Longform</Link>
              <span className="text-blue-200">|</span>
              <Link href="/podcast" className="hover:text-[#00305f] transition uppercase">Podcast</Link>
              <span className="text-blue-200">|</span>
              <Link href="/phong-su-anh" className="hover:text-[#00305f] transition uppercase">Phóng sự ảnh</Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mediaPosts[0] && (
              <Link href={`/bai-viet/${mediaPosts[0].slug}`} className="group cursor-pointer block">
                <div className="overflow-hidden rounded-md aspect-[16/10] relative shadow-md">
                  <span className="absolute bottom-4 left-4 bg-[#00305f] text-white text-xs font-bold px-2 py-1 rounded-sm z-10 uppercase">
                    {mediaPosts[0].post_type === 'podcast' ? 'Podcast' : 'Video'}
                  </span>
                  <img src={mediaPosts[0].thumbnail || PLACEHOLDER} alt={mediaPosts[0].title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                </div>
                <h3 className="font-['Roboto',sans-serif] text-[18px] font-bold text-[#222222] mt-3 group-hover:text-[#0059b2]">{mediaPosts[0].title}</h3>
              </Link>
            )}
            {!mediaPosts[0] && !loading && (
              <div className="flex items-center justify-center aspect-[16/10] bg-gray-100 rounded-md text-gray-400 uppercase">Chưa có nội dung</div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {mediaPosts.slice(1, 5).map(p => <PostCard key={p.id} post={p} variant="video" />)}
              {!loading && mediaPosts.length <= 1 && [...Array(4 - Math.max(0, mediaPosts.length - 1))].map((_, i) => (
                <div key={`media-empty-${i}`} className="aspect-[4/3] rounded-md bg-white/70 border border-blue-100 flex items-center justify-center text-[12px] text-[#0059b2]/50 font-bold uppercase">Chưa có nội dung</div>
              ))}
            </div>
          </div>
        </section>

        {/* PODCAST */}
        <section className="mb-8 border-b border-[#e1e1e1] pb-8">
          <div className="flex items-center justify-between mb-5">
            <SectionTitle title="PODCAST" className={`text-[24px] ${headingStyle}`} />
            <div className="flex items-center gap-2">
              <button aria-label="Trước" className="w-8 h-8 rounded-full border border-[#cfdef0] text-[#0059b2] flex items-center justify-center hover:bg-[#f2f7fb] transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button aria-label="Sau" className="w-8 h-8 rounded-full border border-[#cfdef0] text-[#0059b2] flex items-center justify-center hover:bg-[#f2f7fb] transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {loading
              ? [...Array(4)].map((_, i) => <div key={i} className="h-[340px] bg-gray-100 rounded-2xl animate-pulse" />)
              : Array.from({ length: 4 }).map((_, idx) => {
                  const post = podcastPosts[idx];
                  const subtitle = post?.title || 'Đang cập nhật nội dung podcast mới';
                  const category = post?.category?.name || 'Tin tức, sự kiện';
                  const href = post ? `/bai-viet/${post.slug}` : '/podcast';
                  return (
                    <Link
                      key={post?.id ?? `pod-${idx}`}
                      href={href}
                      className={`group relative cursor-pointer block rounded-2xl overflow-hidden bg-[#0059b2] shadow-md ${post ? 'hover:shadow-2xl hover:-translate-y-1' : 'opacity-90'} transition-all duration-300`}
                    >
                      {/* Sound wave decorations on sides */}
                      <svg className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-32 text-white/15 pointer-events-none" viewBox="0 0 12 100" fill="currentColor" preserveAspectRatio="none">
                        <rect x="0" y="35" width="2" height="30" rx="1" /><rect x="4" y="20" width="2" height="60" rx="1" /><rect x="8" y="10" width="2" height="80" rx="1" />
                      </svg>
                      <svg className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-32 text-white/15 pointer-events-none" viewBox="0 0 12 100" fill="currentColor" preserveAspectRatio="none">
                        <rect x="0" y="10" width="2" height="80" rx="1" /><rect x="4" y="20" width="2" height="60" rx="1" /><rect x="8" y="35" width="2" height="30" rx="1" />
                      </svg>

                      {/* Top: small globe/icon circle */}
                      <div className="px-5 pt-5">
                        <div className="w-9 h-9 rounded-full border border-white/40 flex items-center justify-center mb-3">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                            <circle cx="12" cy="12" r="9" />
                            <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
                          </svg>
                        </div>
                        <h4 className="font-['Roboto',sans-serif] text-[15px] font-bold text-white leading-tight mb-1">
                          {category}
                        </h4>
                        <p className="font-['Roboto',sans-serif] text-[12px] text-white/85 leading-snug line-clamp-2 min-h-[32px]">
                          {subtitle}
                        </p>
                      </div>

                      {/* Bottom: circular thumbnail with play button */}
                      <div className="px-5 pb-6 pt-4 flex justify-center">
                        <div className="relative w-[140px] h-[140px] rounded-full overflow-hidden ring-2 ring-white/20 shadow-lg">
                          {post?.thumbnail ? (
                            <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                          ) : (
                            <div className="w-full h-full bg-[#003a7a] flex items-center justify-center">
                              <svg className="w-12 h-12 text-white/30" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/15 group-hover:bg-black/5 transition" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-white/95 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-[#FFD700] transition">
                              <svg className="w-5 h-5 text-[#0059b2] ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })
            }
          </div>
        </section>

        {/* HẢI QUÂN MEDIA */}
        <section className="mb-8 border-b border-[#e1e1e1] pb-8">
          <div className="flex items-center justify-between mb-1">
            <Link href="/hai-quan-media"><SectionTitle title="HẢI QUÂN MEDIA" className={`text-[24px] ${headingStyle} hover:opacity-80 cursor-pointer`} /></Link>
            <div className="flex items-center gap-3">
              <Link href="/hai-quan-media" className="text-[12px] text-[#0059b2] font-bold hover:underline">Xem tất cả →</Link>
              <a href="https://www.youtube.com/@TGM_Kuroma" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[12px] text-red-600 font-bold hover:underline">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                YouTube
              </a>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(ytLoading && videoPosts.length === 0)
                ? [...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg overflow-hidden border border-blue-50 shadow-sm animate-pulse">
                      <div className="aspect-video bg-[#e8f0fa]" />
                      <div className="p-3 space-y-2"><div className="h-3 bg-gray-100 rounded w-full" /><div className="h-3 bg-gray-100 rounded w-3/4" /></div>
                    </div>
                  ))
                : [0, 1, 2, 3].map(index => {
                  const post = videoPosts[index];
                  const yt = ytMediaVideos[index];
                  if (post) return (
                    <Link key={post.id} href={`/bai-viet/${post.slug}`} className="group block bg-white rounded-lg overflow-hidden border border-blue-50 shadow-sm hover:shadow-md transition">
                      <div className="relative aspect-video bg-[#e8f0fa] overflow-hidden">
                        <img src={post.thumbnail || PLACEHOLDER} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-white/35 backdrop-blur-sm flex items-center justify-center">
                            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                          </div>
                        </div>
                      </div>
                      <div className="p-3"><h4 className="font-['Roboto',sans-serif] text-[14px] font-bold text-[#222222] group-hover:text-[#0059b2] line-clamp-2">{post.title}</h4></div>
                    </Link>
                  );
                  if (yt) return (
                    <a key={yt.videoId} href={yt.url} target="_blank" rel="noopener noreferrer" className="group block bg-white rounded-lg overflow-hidden border border-blue-50 shadow-sm hover:shadow-md transition">
                      <div className="relative aspect-video bg-[#e8f0fa] overflow-hidden">
                        <img src={yt.thumbnail} alt={yt.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-red-600/80 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                          </div>
                        </div>
                        <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">YouTube</span>
                      </div>
                      <div className="p-3"><h4 className="font-['Roboto',sans-serif] text-[14px] font-bold text-[#222222] group-hover:text-[#0059b2] line-clamp-2">{yt.title}</h4></div>
                    </a>
                  );
                  return null;
                })
              }
            </div>
            <div className="md:col-span-4">
              <a href={ads.home_ad_media_link || "#"} className="h-full min-h-[280px] rounded-xl bg-gradient-to-br from-[#001a55] to-[#0059b2] flex flex-col items-center justify-center text-center text-white p-6 shadow-md hover:opacity-95 transition">
                {ads.home_ad_media_image ? (
                  <img src={ads.home_ad_media_image} className="w-full h-full object-cover rounded-lg" alt="Poster Hải Quân Media" />
                ) : (
                  <>
                    <svg className="w-10 h-10 text-white/35 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" /></svg>
                    <strong className="uppercase tracking-wide">Hải quân Nhân dân Việt Nam</strong>
                    <span className="text-xs text-white/60 mt-2">Cài ảnh poster trong Admin → Cài đặt</span>
                  </>
                )}
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* SHORT VIDEO section */}
      <div className="w-full bg-[#0059b2] pt-10 pb-12 shadow-inner">
        <div className="container mx-auto max-w-[1200px] px-4">
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <SectionTitle title="SHORT VIDEO" light className="text-[24px] font-serif font-bold uppercase mb-0" />
              <a href="https://www.youtube.com/@srov24h" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[12px] text-white/70 font-bold hover:text-white transition">
                <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                @srov24h
              </a>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {(loading && ytLoading)
                ? [...Array(5)].map((_, i) => <div key={i} className="aspect-[9/16] bg-[#004b87] rounded-lg animate-pulse" />)
                : shortVideos.length > 0
                  ? shortVideos.map(p => (
                    <Link key={p.id} href={`/bai-viet/${p.slug}`} className="relative aspect-[9/16] rounded-lg overflow-hidden group cursor-pointer shadow-lg border border-white/10">
                      <img src={p.thumbnail || PLACEHOLDER} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        </div>
                      </div>
                      <h4 className="absolute bottom-3 left-3 right-3 text-white font-['Roboto',sans-serif] font-bold text-[14px] leading-tight">{p.title}</h4>
                    </Link>
                  ))
                  : ytMediaVideos.slice(0, 5).map(yt => (
                    <a key={yt.videoId} href={yt.url} target="_blank" rel="noopener noreferrer" className="relative aspect-[9/16] rounded-lg overflow-hidden group cursor-pointer shadow-lg border border-white/10">
                      <img src={yt.thumbnail} alt={yt.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-red-600/80 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        </div>
                      </div>
                      <span className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">YouTube</span>
                      <h4 className="absolute bottom-3 left-3 right-3 text-white font-['Roboto',sans-serif] font-bold text-[13px] leading-tight line-clamp-3">{yt.title}</h4>
                    </a>
                  ))
              }
            </div>
          </div>

          {/* TRUYỀN HÌNH HẢI QUÂN */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <Link href="/truyen-hinh-hq"><SectionTitle title="TRUYỀN HÌNH HẢI QUÂN" light className="text-[24px] font-serif font-bold uppercase mb-0 hover:opacity-80 cursor-pointer" /></Link>
              <div className="flex items-center gap-3">
                <Link href="/truyen-hinh-hq" className="text-[12px] text-white/70 font-bold hover:text-white transition">Xem tất cả →</Link>
                <a href="https://www.youtube.com/@srov4" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[12px] text-white/70 font-bold hover:text-white transition">
                  <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  @srov4
                </a>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-8">
                {videoPosts[0] ? (
                  <Link href={`/bai-viet/${videoPosts[0].slug}`} className="relative aspect-video rounded-md overflow-hidden group cursor-pointer border border-white/20 shadow-lg block">
                    <img src={videoPosts[0].thumbnail || PLACEHOLDER} alt={videoPosts[0].title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-4">
                      <h3 className="text-white font-bold text-[18px]">{videoPosts[0].title}</h3>
                    </div>
                  </Link>
                ) : ytTVVideos[0] ? (
                  <a href={ytTVVideos[0].url} target="_blank" rel="noopener noreferrer" className="relative aspect-video rounded-md overflow-hidden group cursor-pointer border border-white/20 shadow-lg block">
                    <img src={ytTVVideos[0].thumbnail} alt={ytTVVideos[0].title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-red-600/80 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                    </div>
                    <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                      YouTube
                    </span>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-4">
                      <h3 className="text-white font-bold text-[18px]">{ytTVVideos[0].title}</h3>
                    </div>
                  </a>
                ) : ytLoading ? (
                  <div className="aspect-video bg-[#001540] rounded-md animate-pulse" />
                ) : (
                  <div className="aspect-video bg-[#001540] rounded-md flex items-center justify-center text-white/40 uppercase">Chưa có nội dung</div>
                )}
              </div>
              <div className="md:col-span-4 flex flex-col gap-4">
                {(() => {
                  const items = videoPosts.length > 1 ? videoPosts.slice(1, 4) : ytTVVideos.slice(1, 4);
                  const useYT = videoPosts.length <= 1;
                  return items.map((item: any) => useYT ? (
                    <a key={item.videoId} href={item.url} target="_blank" rel="noopener noreferrer" className="flex gap-3 group cursor-pointer">
                      <div className="w-[120px] flex-shrink-0 relative aspect-video rounded-sm overflow-hidden">
                        <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        </div>
                      </div>
                      <h4 className="font-['Roboto',sans-serif] text-[13px] font-bold text-white/80 group-hover:text-[#FFD700] leading-snug line-clamp-3">{item.title}</h4>
                    </a>
                  ) : (
                    <Link key={item.id} href={`/bai-viet/${item.slug}`} className="flex gap-3 group cursor-pointer">
                      <div className="w-[120px] flex-shrink-0 relative aspect-video rounded-sm overflow-hidden">
                        <img src={item.thumbnail || PLACEHOLDER} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <h4 className="font-['Roboto',sans-serif] text-[13px] font-bold text-white/80 group-hover:text-[#FFD700] leading-snug">{item.title}</h4>
                    </Link>
                  ));
                })()}
                {!loading && !ytLoading && videoPosts.length === 0 && ytTVVideos.length === 0 && [...Array(3)].map((_, i) => (
                  <div key={`tv-empty-${i}`} className="flex gap-3 opacity-60">
                    <div className="w-[120px] flex-shrink-0 aspect-video rounded-sm bg-[#001540]" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3 bg-white/15 rounded" />
                      <div className="h-3 bg-white/10 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
