import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import SEOHead from '@/components/SEOHead';
import SectionTitle from '@/components/SectionTitle';
import { getPublishedPosts, type Post } from '@/lib/supabase';
import { timeAgo } from '@/lib/utils';

const PLACEHOLDER = 'https://via.placeholder.com/800x500/00305f/ffffff?text=Báo+Hải+Quân';
const PAGE_SIZE = 12;

type LayoutKind = 'media' | 'article';

const SLUG_CONFIG: Record<string, { title: string; layout: LayoutKind; postType?: string; categorySlug?: string; desc?: string }> = {
  'longform': { title: 'Longform', layout: 'article', categorySlug: 'longform', desc: 'Bài viết chuyên sâu dạng dài' },
  'phong-su-anh': { title: 'Phóng sự ảnh', layout: 'article', categorySlug: 'phong-su-anh', desc: 'Phóng sự bằng hình ảnh' },
  'infographics': { title: 'Infographics', layout: 'article', categorySlug: 'infographics', desc: 'Tin tức trình bày dạng đồ họa' },
  'podcast': { title: 'Podcast', layout: 'media', postType: 'podcast', desc: 'Chương trình phát thanh Hải quân' },
  'video-ngan': { title: 'Short Video', layout: 'media', categorySlug: 'video-ngan', desc: 'Video ngắn Hải quân Nhân dân Việt Nam' },
  'truyen-hinh-hq': { title: 'Hải quân Media', layout: 'media', postType: 'video', desc: 'Truyền hình Hải quân Nhân dân Việt Nam' },
};

export const MEDIA_LISTING_SLUGS = Object.keys(SLUG_CONFIG);

function formatViews(n?: number) {
  if (!n) return '0 lượt phát';
  return `${n.toLocaleString()} lượt phát`;
}

export default function MediaListingPage() {
  const [location] = useLocation();
  const slug = location.replace(/^\//, '').split('/')[0] || '';
  const cfg = SLUG_CONFIG[slug] || { title: slug.replace(/-/g, ' '), layout: 'article' as LayoutKind };

  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    getPublishedPosts({
      categorySlug: cfg.categorySlug,
      postType: cfg.postType,
      limit: 60,
    }).then(data => {
      setPosts(data || []);
      setLoading(false);
    });
  }, [slug]);

  const visible = posts.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < posts.length;

  return (
    <>
      <SEOHead title={cfg.title} description={cfg.desc} />

      {/* Breadcrumb */}
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
        ) : posts.length === 0 ? (
          <div className="text-center py-24 text-[#555]">
            <p className="text-lg font-medium font-['Roboto',sans-serif]">Chưa có bài viết trong chuyên mục này.</p>
            <Link href="/" className="inline-block mt-4 text-[#0059b2] font-bold hover:underline">← Về trang chủ</Link>
          </div>
        ) : cfg.layout === 'media' ? (
          /* Layout có nút play overlay (Podcast / Short Video / Truyền hình) */
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {visible.map(p => (
                <Link key={p.id} href={`/bai-viet/${p.slug}`} className="group block cursor-pointer">
                  <div className="relative aspect-video overflow-hidden rounded-md bg-[#e8f0fa] shadow-sm border border-blue-50 group-hover:shadow-md transition">
                    <img
                      src={p.thumbnail || PLACEHOLDER}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center group-hover:bg-[#0059b2] group-hover:scale-110 transition">
                        <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                    </div>
                  </div>
                  <h3 className="mt-2.5 font-['Roboto',sans-serif] text-[14px] font-bold text-[#222] leading-snug line-clamp-2 group-hover:text-[#0059b2] transition-colors">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-[11px] text-[#888] font-['Roboto',sans-serif]">
                    {p.view_count ? formatViews(p.view_count) : '—'}
                    {p.published_at && <> · {timeAgo(p.published_at)}</>}
                  </p>
                </Link>
              ))}
            </div>
          </>
        ) : (
          /* Layout dạng bài viết (Longform / Phóng sự ảnh / Infographics) */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-8">
            {visible.map(p => (
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

        {/* Pagination indicator nhỏ kiểu trang gốc */}
        {!loading && posts.length > PAGE_SIZE && (
          <div className="flex justify-center gap-1.5 mt-6">
            {Array.from({ length: Math.ceil(posts.length / PAGE_SIZE) }).map((_, i) => (
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
