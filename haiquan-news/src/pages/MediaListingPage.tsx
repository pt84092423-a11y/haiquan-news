import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
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
};

const SLUG_CONFIG: Record<string, {
  title: string;
  layout: LayoutKind;
  postType?: string;
  categorySlug?: string;
  desc?: string;
  ytChannels?: { channelId: string; handle: string }[];
}> = {
  'longform':      { title: 'Longform', layout: 'article', categorySlug: 'longform', desc: 'Bài viết chuyên sâu dạng dài' },
  'phong-su-anh': { title: 'Phóng sự ảnh', layout: 'article', categorySlug: 'phong-su-anh', desc: 'Phóng sự bằng hình ảnh' },
  'infographics':  { title: 'Infographics', layout: 'article', categorySlug: 'infographics', desc: 'Tin tức trình bày dạng đồ họa' },
  'podcast':       { title: 'Podcast', layout: 'media', postType: 'podcast', desc: 'Chương trình phát thanh Hải quân' },
  'video-ngan':    { title: 'Short Video', layout: 'media', categorySlug: 'video-ngan', desc: 'Video ngắn Hải quân Nhân dân Việt Nam' },
  'hai-quan-media': {
    title: 'Hải Quân Media',
    layout: 'media',
    postType: 'video',
    desc: 'Video Hải quân Nhân dân Việt Nam — kênh @TGM_Kuroma & @srov24h',
    ytChannels: [
      { channelId: 'UCyV_AKZjCqd1bkUbEHGcTyA', handle: 'TGM_Kuroma' },
      { channelId: 'UC4MXnZXKnKu9Cg6mNts1aPQ', handle: 'srov24h' },
    ],
  },
  'truyen-hinh-hq': {
    title: 'Truyền Hình Hải Quân',
    layout: 'media',
    postType: 'video',
    desc: 'Truyền hình Hải quân Nhân dân Việt Nam — kênh @srov4',
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

export default function MediaListingPage() {
  const [location] = useLocation();
  const slug = location.replace(/^\//, '').split('/')[0] || '';
  const cfg = SLUG_CONFIG[slug] || { title: slug.replace(/-/g, ' '), layout: 'article' as LayoutKind };

  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [ytVideos, setYtVideos] = useState<YTVideo[]>([]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    setYtVideos([]);

    const dbFetch = getPublishedPosts({
      categorySlug: cfg.categorySlug,
      postType: cfg.postType,
      limit: 60,
    }).then(data => data || []);

    const ytFetch = cfg.ytChannels?.length
      ? Promise.all(cfg.ytChannels.map(fetchYTChannel)).then(r => r.flat().slice(0, 60))
      : Promise.resolve([] as YTVideo[]);

    Promise.all([dbFetch, ytFetch]).then(([dbPosts, yt]) => {
      setPosts(dbPosts);
      setYtVideos(yt);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  // Merge: DB posts first, then YouTube to fill remaining slots (deduplicated by videoId slug)
  const dbSlugs = new Set(posts.map(p => p.slug));
  const ytFill = ytVideos.filter(yt => !dbSlugs.has(`yt-${yt.videoId}`));
  const totalCount = posts.length + ytFill.length;
  const visiblePosts = posts.slice(0, page * PAGE_SIZE);
  const visibleYT = ytFill.slice(0, Math.max(0, page * PAGE_SIZE - posts.length));
  const hasMore = page * PAGE_SIZE < totalCount;

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

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video bg-gray-100 rounded-md mb-2" />
                <div className="h-3 bg-gray-100 rounded w-3/4 mb-1.5" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : totalCount === 0 ? (
          <div className="text-center py-24 text-[#555]">
            <p className="text-lg font-medium font-['Roboto',sans-serif]">Chưa có bài viết trong chuyên mục này.</p>
            <Link href="/" className="inline-block mt-4 text-[#0059b2] font-bold hover:underline">← Về trang chủ</Link>
          </div>
        ) : cfg.layout === 'media' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {/* DB posts first */}
            {visiblePosts.map(p => (
              <Link key={p.id} href={`/bai-viet/${p.slug}`} className="group block cursor-pointer">
                <div className="relative aspect-video overflow-hidden rounded-md bg-[#e8f0fa] shadow-sm border border-blue-50 group-hover:shadow-md transition">
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
                  {p.view_count ? formatViews(p.view_count) : '—'}
                  {p.published_at && <> · {timeAgo(p.published_at)}</>}
                </p>
              </Link>
            ))}
            {/* YouTube videos fill remaining */}
            {visibleYT.map(yt => (
              <a key={yt.videoId} href={yt.url} target="_blank" rel="noopener noreferrer" className="group block cursor-pointer">
                <div className="relative aspect-video overflow-hidden rounded-md bg-[#e8f0fa] shadow-sm border border-blue-50 group-hover:shadow-md transition">
                  <img src={yt.thumbnail} alt={yt.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-red-600/80 flex items-center justify-center group-hover:scale-110 transition">
                      <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </div>
                  <span className="absolute top-2 right-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                    YouTube
                  </span>
                </div>
                <h3 className="mt-2.5 font-['Roboto',sans-serif] text-[14px] font-bold text-[#222] leading-snug line-clamp-2 group-hover:text-[#0059b2] transition-colors">{yt.title}</h3>
                <p className="mt-1 text-[11px] text-[#888] font-['Roboto',sans-serif]">YouTube</p>
              </a>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-8">
            {visiblePosts.map(p => (
              <Link key={p.id} href={`/bai-viet/${p.slug}`} className="group block cursor-pointer">
                <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-gray-100 shadow-sm">
                  <img
                    src={p.thumbnail || PLACEHOLDER}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>
                <h3 className="mt-3 font-['Roboto',sans-serif] text-[15px] font-bold leading-snug text-[#222] group-hover:text-[#0059b2] transition-colors line-clamp-2">
                  {p.title}
                </h3>
                {p.excerpt && (
                  <p className="mt-1.5 text-[13px] text-[#555] font-['Roboto',sans-serif] leading-relaxed line-clamp-3">
                    {p.excerpt}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}

        {hasMore && !loading && (
          <div className="text-center mt-10">
            <button
              onClick={() => setPage(p => p + 1)}
              className="px-10 py-3 border-2 border-[#0059b2] text-[#0059b2] font-['Roboto',sans-serif] font-bold text-[13px] tracking-widest uppercase rounded-sm hover:bg-[#0059b2] hover:text-white transition-all duration-300"
            >
              XEM THÊM
            </button>
          </div>
        )}

        {!loading && totalCount > PAGE_SIZE && (
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
