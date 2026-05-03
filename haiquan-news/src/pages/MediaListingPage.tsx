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
  isShort?: boolean;
};

type SectionDef = {
  title: string;
  ytChannels?: { channelId: string; handle: string }[];
};

type SlugEntry = {
  title: string;
  layout: LayoutKind;
  postType?: string;
  categorySlug?: string;
  desc?: string;
  ytChannels?: { channelId: string; handle: string }[];
  pinnedVideos?: { videoId: string; title: string; isShort?: boolean }[];
  sections?: SectionDef[];
};

const SLUG_CONFIG: Record<string, SlugEntry> = {
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
      {
        title: 'VIDEO SHORT',
        ytChannels: [{ channelId: 'UC4MXnZXKnKu9Cg6mNts1aPQ', handle: 'srov24h' }],
      },
      {
        title: 'HẢI QUÂN MEDIA',
        ytChannels: [{ channelId: 'UCyV_AKZjCqd1bkUbEHGcTyA', handle: 'TGM_Kuroma' }],
      },
    ],
  },
  'truyen-hinh-hq': {
    title: 'Truyền Hình Hải Quân',
    layout: 'media',
    postType: 'video',
    desc: 'Truyền hình Hải quân Nhân dân Việt Nam — kênh @srov4',
    pinnedVideos: [
      { videoId: 'bPs-m5zPsgc', title: 'Dòng Biển Của Em', isShort: true },
    ],
    ytChannels: [
      { channelId: 'UC7W8ubM1PB8DzLMP7JSrHyg', handle: 'srov4' },
    ],
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

function formatViews(n?: number) {
  if (!n) return '0 lượt xem';
  return `${n.toLocaleString()} lượt xem`;
}

const YT_ICON = (
  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

function VideoCard({ yt, isShort }: { yt: YTVideo; isShort?: boolean }) {
  const shortUrl = isShort
    ? `https://www.youtube.com/shorts/${yt.videoId}`
    : yt.url;
  const thumb = isShort
    ? `https://i.ytimg.com/vi/${yt.videoId}/maxresdefault.jpg`
    : yt.thumbnail;
  return (
    <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="group block cursor-pointer">
      <div className={`relative overflow-hidden bg-black shadow-sm group-hover:shadow-lg transition ${isShort ? 'aspect-[9/16]' : 'aspect-video'}`}>
        <img
          src={thumb}
          alt={yt.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-red-600/80 flex items-center justify-center group-hover:scale-110 transition">
            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </div>
        </div>
        <span className="absolute top-2 right-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
          {YT_ICON}
          {isShort ? 'Short' : 'YouTube'}
        </span>
      </div>
      <h3 className="mt-2.5 font-['Roboto',sans-serif] text-[13px] font-bold text-[#222] leading-snug line-clamp-2 group-hover:text-[#0059b2] transition-colors">{yt.title}</h3>
      <p className="mt-1 text-[11px] text-[#888] font-['Roboto',sans-serif]">YouTube</p>
    </a>
  );
}

function DbPostCard({ p }: { p: Post }) {
  return (
    <Link href={`/bai-viet/${p.slug}`} className="group block cursor-pointer">
      <div className="relative aspect-video overflow-hidden bg-black shadow-sm group-hover:shadow-lg transition">
        <img src={p.thumbnail || PLACEHOLDER} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center group-hover:bg-[#0059b2] group-hover:scale-110 transition">
            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </div>
        </div>
      </div>
      <h3 className="mt-2.5 font-['Roboto',sans-serif] text-[14px] font-bold text-[#222] leading-snug line-clamp-2 group-hover:text-[#0059b2] transition-colors">{p.title}</h3>
      <p className="mt-1 text-[11px] text-[#888] font-['Roboto',sans-serif]">
        {p.view_count ? formatViews(p.view_count) : '—'}
        {p.published_at && <> · {timeAgo(p.published_at)}</>}
      </p>
    </Link>
  );
}

function VideoGrid({ videos, posts }: { videos: YTVideo[]; posts?: Post[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
      {(posts || []).map(p => <DbPostCard key={p.id} p={p} />)}
      {videos.map(yt => <VideoCard key={yt.videoId} yt={yt} />)}
    </div>
  );
}

export default function MediaListingPage({ slug: slugProp }: { slug?: string }) {
  const slug = slugProp || window.location.pathname.replace(/^\//, '').split('/')[0] || '';
  const cfg = SLUG_CONFIG[slug] || { title: slug.replace(/-/g, ' '), layout: 'article' as LayoutKind };

  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [ytVideos, setYtVideos] = useState<YTVideo[]>([]);
  const [sectionVideos, setSectionVideos] = useState<Record<number, YTVideo[]>>({});

  useEffect(() => {
    setPage(1);
    setYtVideos([]);
    setSectionVideos({});
    setPosts([]);

    const entryCfg = cfg as SlugEntry;
    const hasSec = !!(entryCfg.sections?.length);

    if (hasSec) {
      // Section pages: show immediately, load each section in background
      setLoading(false);
      (entryCfg.sections || []).forEach((sec, idx) => {
        if (!sec.ytChannels?.length) return;
        Promise.all(sec.ytChannels.map(fetchYTChannel))
          .then(r => setSectionVideos(prev => ({ ...prev, [idx]: r.flat().slice(0, 30) })))
          .catch(() => setSectionVideos(prev => ({ ...prev, [idx]: [] })));
      });
    } else {
      // Regular pages: fetch DB + YT, show when DB resolves
      setLoading(true);
      getPublishedPosts({ categorySlug: entryCfg.categorySlug, postType: entryCfg.postType, limit: 60 })
        .then(data => setPosts(data || []))
        .catch(() => {})
        .finally(() => setLoading(false));

      if (entryCfg.ytChannels?.length) {
        Promise.all(entryCfg.ytChannels.map(fetchYTChannel))
          .then(r => setYtVideos(r.flat().slice(0, 60)))
          .catch(() => {});
      }
    }
  }, [slug]);

  const dbSlugs = new Set(posts.map(p => p.slug));
  const ytFill = ytVideos.filter(yt => !dbSlugs.has(`yt-${yt.videoId}`));
  const totalCount = posts.length + ytFill.length;
  const visiblePosts = posts.slice(0, page * PAGE_SIZE);
  const visibleYT = ytFill.slice(0, Math.max(0, page * PAGE_SIZE - posts.length));
  const hasMore = page * PAGE_SIZE < totalCount;

  const pinnedVideos = (cfg as SlugEntry).pinnedVideos || [];
  const pinnedIds = new Set(pinnedVideos.map(v => v.videoId));
  const mainYT = visibleYT.filter(v => !pinnedIds.has(v.videoId));
  const hasSections = !!((cfg as SlugEntry).sections?.length);

  const Skeleton = () => (
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

        {loading ? <Skeleton /> : hasSections ? (
          /* ── HAI-QUAN-MEDIA: two separate sections ── */
          <div className="space-y-12">
            {((cfg as SlugEntry).sections || []).map((sec, idx) => {
              const vids = sectionVideos[idx] || [];
              return (
                <div key={idx}>
                  <div className="flex items-center gap-3 mb-5">
                    <h2 className="font-['Roboto',sans-serif] text-[18px] font-black text-[#0059b2] uppercase tracking-wide">{sec.title}</h2>
                    <div className="flex-1 h-px bg-[#e1e1e1]" />
                  </div>
                  {vids.length === 0 ? (
                    <p className="text-[#aaa] text-sm font-['Roboto',sans-serif]">Đang tải...</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                      {vids.map(yt => (
                        <VideoCard
                          key={yt.videoId}
                          yt={yt}
                          isShort={sec.title.toLowerCase().includes('short')}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : cfg.layout === 'media' ? (
          /* ── TRUYEN-HINH-HQ and other media pages ── */
          <div>
            {/* Pinned videos — shown as portrait Short cards before the grid */}
            {pinnedVideos.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M16 12V4H17V2H7V4H8V12L6 14V16H11.2V22H12.8V16H18V14L16 12Z"/></svg>
                    GHIM
                  </span>
                </div>
                <div className="flex gap-4 flex-wrap">
                  {pinnedVideos.map(pv => (
                    <a
                      key={pv.videoId}
                      href={pv.isShort ? `https://www.youtube.com/shorts/${pv.videoId}` : `https://www.youtube.com/watch?v=${pv.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block cursor-pointer"
                      style={{ width: '180px' }}
                    >
                      <div className="relative overflow-hidden bg-black shadow-md group-hover:shadow-xl transition aspect-[9/16]">
                        <img
                          src={`https://i.ytimg.com/vi/${pv.videoId}/maxresdefault.jpg`}
                          alt={pv.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          onError={e => { (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${pv.videoId}/hqdefault.jpg`; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-red-600/80 flex items-center justify-center group-hover:scale-110 transition">
                            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                          </div>
                        </div>
                        {pv.isShort && (
                          <span className="absolute top-2 right-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                            {YT_ICON} Short
                          </span>
                        )}
                      </div>
                      <h3 className="mt-2.5 font-['Roboto',sans-serif] text-[13px] font-bold text-[#222] leading-snug line-clamp-2 group-hover:text-[#0059b2] transition-colors">{pv.title}</h3>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Main video grid */}
            {totalCount === 0 ? (
              <div className="text-center py-24 text-[#555]">
                <p className="text-lg font-medium font-['Roboto',sans-serif]">Chưa có bài viết trong chuyên mục này.</p>
                <Link href="/" className="inline-block mt-4 text-[#0059b2] font-bold hover:underline">← Về trang chủ</Link>
              </div>
            ) : (
              <VideoGrid videos={mainYT} posts={visiblePosts} />
            )}
          </div>
        ) : (
          /* ── Article layout ── */
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
        )}

        {hasMore && !loading && !hasSections && (
          <div className="text-center mt-10">
            <button
              onClick={() => setPage(p => p + 1)}
              className="px-10 py-3 border-2 border-[#0059b2] text-[#0059b2] font-['Roboto',sans-serif] font-bold text-[13px] tracking-widest uppercase rounded-sm hover:bg-[#0059b2] hover:text-white transition-all duration-300"
            >
              XEM THÊM
            </button>
          </div>
        )}

        {!loading && !hasSections && totalCount > PAGE_SIZE && (
          <div className="flex justify-center gap-1.5 mt-6">
            {Array.from({ length: Math.ceil(totalCount / PAGE_SIZE) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-7 h-7 text-[12px] rounded-sm font-bold transition ${page === i + 1 ? 'bg-[#0059b2] text-white' : 'text-[#0059b2] border border-[#cfdef0] hover:border-[#0059b2]'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
