import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import SEOHead from '@/components/SEOHead';
import SectionTitle from '@/components/SectionTitle';
import { getPublishedPosts, type Post } from '@/lib/supabase';
import { timeAgo } from '@/lib/utils';

const PLACEHOLDER = 'https://via.placeholder.com/800x500/00305f/ffffff?text=Báo+Hải+Quân';
const PAGE_SIZE = 12;

type LayoutKind = 'media' | 'article';

type YTVideo = {
  videoId: string;
  title: string;
  thumbnail: string;
  url: string;
  pinned?: boolean;
};

type Section = {
  title: string;
  ytChannel: { channelId: string; handle: string };
};

const SLUG_CONFIG: Record<string, {
  title: string;
  layout: LayoutKind;
  postType?: string;
  categorySlug?: string;
  desc?: string;
  ytChannels?: { channelId: string; handle: string }[];
  pinnedVideoIds?: string[];
  sections?: Section[];
}> = {
  'longform':      { title: 'Longform', layout: 'article', categorySlug: 'longform', desc: 'Bài viết chuyên sâu dạng dài' },
  'phong-su-anh': { title: 'Phóng sự ảnh', layout: 'article', categorySlug: 'phong-su-anh', desc: 'Phóng sự bằng hình ảnh' },
  'infographics':  { title: 'Infographics', layout: 'article', categorySlug: 'infographics', desc: 'Tin tức trình bày dạng đồ họa' },
  'podcast':       { title: 'Podcast', layout: 'media', postType: 'podcast', desc: 'Chương trình phát thanh Hải quân' },
  'video-ngan':    { title: 'Short Video', layout: 'media', categorySlug: 'video-ngan', desc: 'Video ngắn Hải quân Nhân dân Việt Nam' },
  'hai-quan-media': {
    title: 'Hải Quân Media',
    layout: 'media',
    desc: 'Video Hải quân Nhân dân Việt Nam',
    sections: [
      { title: 'HẢI QUÂN MEDIA', ytChannel: { channelId: 'UCyV_AKZjCqd1bkUbEHGcTyA', handle: 'TGM_Kuroma' } },
      { title: 'VIDEO SHORT',    ytChannel: { channelId: 'UC4MXnZXKnKu9Cg6mNts1aPQ', handle: 'srov24h' } },
    ],
  },
  'truyen-hinh-hq': {
    title: 'Truyền Hình Hải Quân',
    layout: 'media',
    postType: 'video',
    desc: 'Truyền hình Hải quân Nhân dân Việt Nam — kênh @srov4',
    pinnedVideoIds: ['bPs-m5zPsgc'],
    pinnedVideoTitles: { 'bPs-m5zPsgc': 'Dòng Biển Của Em | SROV' },
    ytChannels: [{ channelId: 'UC7W8ubM1PB8DzLMP7JSrHyg', handle: 'srov4' }],
  },
};

export const MEDIA_LISTING_SLUGS = Object.keys(SLUG_CONFIG);

async function fetchYTChannel(ch: { channelId: string; handle: string }): Promise<YTVideo[]> {
  try {
    const r = await fetch(`/api/youtube/feed?channelId=${ch.channelId}&handle=${ch.handle}`);
    const j = await r.json();
    return (j.videos || []).map((v: any) => ({
      videoId: v.videoId,
      title: v.title,
      thumbnail: v.thumbnail,
      url: v.url,
    }));
  } catch { return []; }
}

function VideoCard({ yt, pinned }: { yt: YTVideo; pinned?: boolean }) {
  return (
    <a href={yt.url} target="_blank" rel="noopener noreferrer" className="group block cursor-pointer">
      <div className="relative aspect-video overflow-hidden bg-gray-100 shadow-sm group-hover:shadow-md transition">
        <img src={yt.thumbnail} alt={yt.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-red-600/80 flex items-center justify-center group-hover:scale-110 transition">
            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </div>
        </div>
        <div className="absolute top-2 left-2 flex gap-1.5">
          {pinned && (
            <span className="bg-[#0059b2] text-white text-[9px] font-bold px-1.5 py-0.5 flex items-center gap-1">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
              GHiM
            </span>
          )}
          <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 flex items-center gap-1">
            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            YouTube
          </span>
        </div>
      </div>
      <h3 className="mt-2.5 font-['Roboto',sans-serif] text-[14px] font-bold text-[#222] leading-snug line-clamp-2 group-hover:text-[#0059b2] transition-colors">{yt.title}</h3>
      <p className="mt-1 text-[11px] text-[#888] font-['Roboto',sans-serif]">YouTube</p>
    </a>
  );
}

function DBCard({ p }: { p: Post }) {
  return (
    <Link href={`/bai-viet/${p.slug}`} className="group block cursor-pointer">
      <div className="relative aspect-video overflow-hidden bg-gray-100 shadow-sm group-hover:shadow-md transition">
        <img src={p.thumbnail || PLACEHOLDER} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center group-hover:bg-[#0059b2] group-hover:scale-110 transition">
            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </div>
        </div>
      </div>
      <h3 className="mt-2.5 font-['Roboto',sans-serif] text-[14px] font-bold text-[#222] leading-snug line-clamp-2 group-hover:text-[#0059b2] transition-colors">{p.title}</h3>
      <p className="mt-1 text-[11px] text-[#888] font-['Roboto',sans-serif]">
        {p.view_count ? `${p.view_count.toLocaleString()} lượt xem` : '—'}
        {p.published_at && <> · {timeAgo(p.published_at)}</>}
      </p>
    </Link>
  );
}

function VideoGrid({ videos, pinnedIds }: { videos: YTVideo[]; pinnedIds?: string[] }) {
  const pinnedSet = new Set(pinnedIds || []);
  const pinned = videos.filter(v => pinnedSet.has(v.videoId));
  const rest = videos.filter(v => !pinnedSet.has(v.videoId));
  const ordered = [...pinned.map(v => ({ ...v, pinned: true })), ...rest];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
      {ordered.map(yt => <VideoCard key={yt.videoId} yt={yt} pinned={yt.pinned} />)}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-video bg-gray-100 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-3/4 mb-1.5" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

/* ── Single-section page (truyen-hinh-hq, podcast, etc.) ──────────────── */
function SingleSectionPage({ cfg, slug }: { cfg: any; slug: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [ytVideos, setYtVideos] = useState<YTVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    const dbFetch = getPublishedPosts({ categorySlug: cfg.categorySlug, postType: cfg.postType, limit: 60 }).then(d => d || []);
    const ytFetch = cfg.ytChannels?.length
      ? Promise.all(cfg.ytChannels.map(fetchYTChannel)).then((r: YTVideo[][]) => r.flat().slice(0, 60))
      : Promise.resolve([] as YTVideo[]);
    Promise.all([dbFetch, ytFetch]).then(([db, yt]) => {
      setPosts(db);
      const pinnedIds = new Set(cfg.pinnedVideoIds || []);
      const titles: Record<string, string> = cfg.pinnedVideoTitles || {};
      const pinnedVideos: YTVideo[] = (cfg.pinnedVideoIds || []).map((id: string) => ({
        videoId: id,
        title: titles[id] || yt.find((v: YTVideo) => v.videoId === id)?.title || '',
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${id}`,
        pinned: true,
      }));
      const rest = yt.filter((v: YTVideo) => !pinnedIds.has(v.videoId));
      setYtVideos([...pinnedVideos, ...rest]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  const dbSlugs = new Set(posts.map(p => p.slug));
  const ytFill = ytVideos.filter(yt => !dbSlugs.has(`yt-${yt.videoId}`));
  const totalCount = posts.length + ytFill.length;
  const visiblePosts = posts.slice(0, page * PAGE_SIZE);
  const visibleYT = ytFill.slice(0, Math.max(0, page * PAGE_SIZE - posts.length));
  const hasMore = page * PAGE_SIZE < totalCount;

  if (loading) return <SkeletonGrid />;
  if (totalCount === 0) return (
    <div className="text-center py-24 text-[#555]">
      <p className="text-lg font-medium font-['Roboto',sans-serif]">Chưa có bài viết trong chuyên mục này.</p>
      <Link href="/" className="inline-block mt-4 text-[#0059b2] font-bold hover:underline">← Về trang chủ</Link>
    </div>
  );

  if (cfg.layout === 'media') {
    return (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {visiblePosts.map(p => <DBCard key={p.id} p={p} />)}
          {visibleYT.map(yt => <VideoCard key={yt.videoId} yt={yt} pinned={yt.pinned} />)}
        </div>
        {hasMore && (
          <div className="text-center mt-10">
            <button onClick={() => setPage(p => p + 1)}
              className="px-10 py-3 border-2 border-[#0059b2] text-[#0059b2] font-['Roboto',sans-serif] font-bold text-[13px] tracking-widest uppercase hover:bg-[#0059b2] hover:text-white transition-all duration-300">
              XEM THÊM
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-8">
      {visiblePosts.map(p => (
        <Link key={p.id} href={`/bai-viet/${p.slug}`} className="group block cursor-pointer">
          <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 shadow-sm">
            <img src={p.thumbnail || PLACEHOLDER} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
          </div>
          <h3 className="mt-3 font-['Roboto',sans-serif] text-[15px] font-bold leading-snug text-[#222] group-hover:text-[#0059b2] transition-colors line-clamp-2">{p.title}</h3>
          {p.excerpt && <p className="mt-1.5 text-[13px] text-[#555] font-['Roboto',sans-serif] leading-relaxed line-clamp-3">{p.excerpt}</p>}
        </Link>
      ))}
    </div>
  );
}

/* ── Multi-section page (hai-quan-media) ─────────────────────────────── */
function SectionedPage({ cfg, slug }: { cfg: any; slug: string }) {
  const [sectionsData, setSectionsData] = useState<YTVideo[][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setSectionsData([]);
    const fetches = (cfg.sections as Section[]).map((sec: Section) => fetchYTChannel(sec.ytChannel));
    Promise.all(fetches).then(results => {
      setSectionsData(results);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  if (loading) return <SkeletonGrid />;

  return (
    <div className="space-y-12">
      {(cfg.sections as Section[]).map((sec: Section, i: number) => {
        const videos = sectionsData[i] || [];
        return (
          <div key={i}>
            <div className="mb-5 pb-2 border-b-2 border-[#0059b2] flex items-center gap-2">
              <span className="text-[#0059b2] font-bold text-[11px]">■</span>
              <h2 className="font-['Roboto',sans-serif] font-bold text-[18px] text-[#111] uppercase tracking-wide">{sec.title}</h2>
              <a href={`https://www.youtube.com/@${sec.ytChannel.handle}`} target="_blank" rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1 text-[11px] text-red-600 font-bold hover:underline">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                @{sec.ytChannel.handle}
              </a>
            </div>
            {videos.length === 0 ? (
              <p className="text-[13px] text-[#888] font-['Roboto',sans-serif] py-6 text-center">Đang tải...</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                {videos.map(yt => <VideoCard key={yt.videoId} yt={yt} />)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Main export ─────────────────────────────────────────────────────── */
export default function MediaListingPage({ slug: slugProp }: { slug?: string }) {
  const slug = slugProp || window.location.pathname.replace(/^\//, '').split('/')[0] || '';
  const cfg = SLUG_CONFIG[slug] || { title: slug.replace(/-/g, ' '), layout: 'article' as LayoutKind };

  return (
    <>
      <SEOHead title={cfg.title} description={cfg.desc} />

      <div className="bg-[#f2f7fb] border-b border-[#e1e1e1] py-3">
        <div className="container mx-auto max-w-[1200px] px-4">
          <div className="flex items-center gap-2 text-[12px] text-[#555] font-['Roboto',sans-serif]">
            <Link href="/" className="hover:text-[#0059b2] transition-colors">Trang chủ</Link>
            <span className="text-gray-400">/</span>
            <span className="font-bold text-[#0059b2] uppercase">{cfg.title}</span>
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-[1200px] px-4 pt-8 pb-16">
        <div className="mb-8">
          <SectionTitle title={cfg.title.toUpperCase()} className="text-[22px] sm:text-[26px] md:text-[28px] mb-0" />
        </div>

        {cfg.sections
          ? <SectionedPage cfg={cfg} slug={slug} />
          : <SingleSectionPage cfg={cfg} slug={slug} />
        }
      </main>
    </>
  );
}
