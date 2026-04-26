import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import SEOHead from '@/components/SEOHead';
import WebsiteLinks from '@/components/WebsiteLinks';
import {
  getAllCategories,
  getAllSettings,
  getCategoryBySlug,
  getPublishedPosts,
  type Category,
  type Post,
} from '@/lib/supabase';

const PLACEHOLDER = 'https://via.placeholder.com/800x500/00305f/ffffff?text=Báo+Hải+Quân';

// Đã bổ sung thêm các chuyên mục có trên Navbar nhưng bị thiếu: 'cau-truc' và 'chi-huy'
const CATEGORY_FALLBACK: Record<string, { title: string; desc: string }> = {
  'tin-tuc': { title: 'Tin tức', desc: 'Tin tức thời sự Hải quân Nhân dân Việt Nam' },
  'chinh-tri': { title: 'Chính trị', desc: 'Tin tức chính trị, lãnh đạo Hải quân' },
  'quoc-phong-an-ninh': { title: 'Quốc phòng - An ninh', desc: 'Tin tức quốc phòng, an ninh Tổ quốc' },
  'quan-su-quoc-phong': { title: 'Quân sự - Quốc phòng', desc: 'Tin tức quân sự, quốc phòng' },
  'vi-chu-quyen': { title: 'Vì chủ quyền biển đảo', desc: 'Bảo vệ chủ quyền biển đảo Tổ quốc' },
  'vi-chu-quyen-bien-dao': { title: 'Vì chủ quyền biển đảo', desc: 'Bảo vệ chủ quyền biển đảo Tổ quốc' },
  'kinh-te-xa-hoi': { title: 'Kinh tế - Xã hội', desc: 'Tin tức kinh tế và xã hội' },
  'doi-ngoai': { title: 'Đối ngoại', desc: 'Hoạt động đối ngoại Hải quân' },
  'phap-luat': { title: 'Pháp luật', desc: 'Tin tức và văn bản pháp luật' },
  'tam-tinh': { title: 'Tâm tình lính biển', desc: 'Câu chuyện của người lính biển' },
  'lich-su': { title: 'Lịch sử', desc: 'Lịch sử Hải quân Nhân dân Việt Nam' },
  'cau-truc': { title: 'Cấu trúc', desc: 'Cấu trúc và tổ chức Hải quân Nhân dân Việt Nam' },
  'chi-huy': { title: 'Chỉ huy', desc: 'Lãnh đạo, chỉ huy Hải quân Nhân dân Việt Nam' },
  'nghien-cuu-trao-doi': { title: 'Nghiên cứu - Trao đổi', desc: 'Nghiên cứu, trao đổi chuyên sâu' },
  'van-hoa-the-thao': { title: 'Văn hoá - Thể thao', desc: 'Văn hoá, thể thao Hải quân' },
  'longform': { title: 'Longform', desc: 'Bài viết chuyên sâu dạng dài' },
  'podcast': { title: 'Podcast', desc: 'Chương trình phát thanh Hải quân' },
  'truyen-hinh-hq': { title: 'Truyền hình Hải quân', desc: 'Video truyền hình chính thức' },
  'phong-su-anh': { title: 'Phóng sự ảnh', desc: 'Phóng sự bằng hình ảnh' },
  'da-phuong-tien': { title: 'Đa phương tiện', desc: 'Nội dung đa phương tiện' },
};

const PAGE_SIZE = 6;

function formatDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

/* ── Section title (Playfair Display) ────────────────────────────────────────── */
function SidebarHeading({ label }: { label: string }) {
  return (
    <h2 className="font-['Playfair_Display',serif] text-[#0059b2] text-[20px] md:text-[22px] font-black uppercase mb-5 flex items-center">
      <div className="flex mr-2.5">
        <div className="w-[5px] h-[18px] bg-[#0059b2] -skew-x-[20deg] mr-[2px]" />
        <div className="w-[5px] h-[18px] bg-sky-300 -skew-x-[20deg]" />
      </div>
      {label}
    </h2>
  );
}

/* ── Hero featured post (Top Left - 8 columns) ─────────────────────────────── */
function HeroFeatured({ post }: { post: Post }) {
  return (
    <Link href={`/bai-viet/${post.slug}`} className="group block cursor-pointer">
      <div className="overflow-hidden rounded-[2px] mb-4 relative aspect-[16/9] shadow-sm">
        <img
          src={post.thumbnail || PLACEHOLDER}
          alt={post.title}
          className="w-full h-full object-cover transform transition duration-700 group-hover:scale-105"
        />
      </div>
      <h2 className="font-['Roboto',sans-serif] text-[26px] md:text-[32px] font-bold leading-tight text-[#222] mb-3 group-hover:text-[#0059b2] transition-colors">
        {post.title}
      </h2>
      {post.excerpt && (
        <p className="font-['Roboto',sans-serif] text-[15px] text-[#555] leading-relaxed line-clamp-3">
          {post.excerpt}
        </p>
      )}
    </Link>
  );
}

/* ── Mini row (Top Right side stack - 4 columns) ───────────────────────────── */
function MiniRow({ post }: { post: Post }) {
  return (
    <Link href={`/bai-viet/${post.slug}`} className="flex gap-4 group cursor-pointer pb-4 border-b border-dashed border-[#e1e1e1] last:border-0 last:pb-0">
      <div className="w-[120px] h-[80px] flex-shrink-0 overflow-hidden rounded-[2px]">
        <img
          src={post.thumbnail || PLACEHOLDER}
          alt={post.title}
          className="w-full h-full object-cover transform transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex-1">
        <h3 className="font-['Roboto',sans-serif] text-[14px] font-bold leading-snug text-[#222] group-hover:text-[#0059b2] transition-colors line-clamp-3">
          {post.title}
        </h3>
      </div>
    </Link>
  );
}

/* ── List item (Main article list - Center 6 columns) ──────────────────────── */
function ListItem({ post }: { post: Post }) {
  return (
    <Link href={`/bai-viet/${post.slug}`} className="flex gap-4 group cursor-pointer border-b border-[#e1e1e1] pb-5 last:border-0">
      <div className="w-[180px] md:w-[240px] flex-shrink-0 overflow-hidden rounded-[2px] relative aspect-[3/2]">
        <img
          src={post.thumbnail || PLACEHOLDER}
          alt={post.title}
          className="w-full h-full object-cover transform transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex-1">
        <h3 className="font-['Roboto',sans-serif] text-[17px] font-bold leading-snug text-[#222] group-hover:text-[#0059b2] transition-colors mb-2">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-[14px] text-[#555] font-['Roboto',sans-serif] line-clamp-3 leading-relaxed">
            {post.excerpt}
          </p>
        )}
        <div className="mt-2 text-[11px] text-gray-400 font-medium">
          {formatDate(post.published_at || post.created_at)}
        </div>
      </div>
    </Link>
  );
}

/* ── Other category column (Bottom grid) ────────────────────────────────────── */
function OtherCategoryColumn({ cat, posts }: { cat: Category; posts: Post[] }) {
  const [featured, ...rest] = posts;
  return (
    <div className="flex flex-col gap-4">
      <Link href={`/${cat.slug}`}>
        <h3 className="font-['Playfair_Display',serif] text-[16px] font-black uppercase text-[#0059b2] pb-2 border-b-2 border-[#0059b2] hover:text-[#00305f] transition-colors tracking-wide">
          {cat.name}
        </h3>
      </Link>
      {featured ? (
        <>
          <Link href={`/bai-viet/${featured.slug}`} className="group block">
            <div className="overflow-hidden rounded-[2px] aspect-[16/10] mb-2">
              <img
                src={featured.thumbnail || PLACEHOLDER}
                alt={featured.title}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
            </div>
            <h4 className="font-['Roboto',sans-serif] font-bold text-[13.5px] leading-snug text-[#222] group-hover:text-[#0059b2] line-clamp-2">
              {featured.title}
            </h4>
          </Link>
          <ul className="flex flex-col gap-2 mt-1">
            {rest.map(p => (
              <li key={p.id}>
                <Link
                  href={`/bai-viet/${p.slug}`}
                  className="font-['Roboto',sans-serif] text-[12.5px] text-[#444] leading-snug hover:text-[#0059b2] line-clamp-2 block"
                >
                  <span className="mr-1 text-[#0059b2]">•</span> {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="text-[12px] text-gray-400 italic">Chưa có bài</div>
      )}
    </div>
  );
}

export default function CategoryPage() {
  const [location] = useLocation();
  const slug = location.replace(/^\//, '').split('/')[0] || '';

  const [category, setCategory] = useState<Category | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [mostRead, setMostRead] = useState<Post[]>([]);
  const [otherCats, setOtherCats] = useState<Array<{ cat: Category; posts: Post[] }>>([]);
  const [ads, setAds] = useState<Record<string, string>>({});
  const [latestBaoIn, setLatestBaoIn] = useState<Post | null>(null);
  const [visibleListCount, setVisibleListCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);

  const fallback = CATEGORY_FALLBACK[slug] || { title: slug.replace(/-/g, ' '), desc: '' };
  const title = category?.name || fallback.title;
  const desc = category?.description || fallback.desc;

  useEffect(() => {
    setLoading(true);
    setVisibleListCount(PAGE_SIZE);
    setPosts([]);

    async function load() {
      const [cat, mainPosts, popular, baoIn, allCats, settings] = await Promise.all([
        getCategoryBySlug(slug),
        getPublishedPosts({ categorySlug: slug, limit: 60 }),
        getPublishedPosts({ limit: 30 }),
        getPublishedPosts({ postType: 'baoin', limit: 1 }),
        getAllCategories(),
        getAllSettings(),
      ]);
      setCategory(cat || null);
      setPosts(mainPosts || []);
      setLatestBaoIn((baoIn || [])[0] || null);

      const sortedPopular = [...(popular || [])]
        .filter((p: Post) => p.post_type !== 'baoin')
        .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
        .slice(0, 8);
      setMostRead(sortedPopular);
      setAds(settings || {});

      // Lấy 4 chuyên mục cho footer
      const others = (allCats || []).filter((c: Category) => c.slug !== slug && c.slug !== 'bao-in').slice(0, 4);
      const withPosts = await Promise.all(
        others.map(async (c: Category) => {
          const items = await getPublishedPosts({ categorySlug: c.slug, limit: 4 });
          return { cat: c, posts: items || [] };
        })
      );
      setOtherCats(withPosts);
      setLoading(false);
    }
    load();
  }, [slug]);

  const featured = posts[0];
  const sideFeatured = posts.slice(1, 5); // 4 bài cho cột bên phải của Hero
  // Cột giữa: hiển thị toàn bộ bài viết của chuyên mục (trừ bài hero) để tránh khoảng trống
  const listPool = posts.slice(1);
  const visibleList = listPool.slice(0, visibleListCount);
  const hasMore = visibleListCount < listPool.length;

  const adBlocks = useMemo(
    () =>
      [
        { src: ads.article_ad_1_image || '/quangcao-101.png', href: ads.article_ad_1_link || '#' },
        { src: ads.article_ad_2_image || '/quangcao-954.png', href: ads.article_ad_2_link || '#' },
      ],
    [ads]
  );

  return (
    <>
      <SEOHead title={title} description={desc} />

      {/* Breadcrumb Section */}
      <div className="bg-[#f2f7fb] border-b border-[#e1e1e1] py-3">
        <div className="container mx-auto max-w-[1200px] px-4">
          <div className="flex items-center gap-2 text-[12px] text-[#555] font-['Roboto',sans-serif]">
            <Link href="/" className="hover:text-[#0059b2] transition-colors">Trang chủ</Link>
            <span className="text-gray-400">/</span>
            <span className="font-bold text-[#0059b2] uppercase">{title}</span>
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-[1200px] px-4 pt-8 pb-16">
        
        {/* Category Header */}
        <div className="text-center mb-10">
          <h1 className="font-['Playfair_Display',serif] text-[32px] md:text-[38px] font-black uppercase text-[#0059b2] leading-tight tracking-wide">
            {title}
          </h1>
          <div className="mt-3 mx-auto flex items-center justify-center gap-1">
            <div className="h-[3px] w-12 bg-[#0059b2]" />
            <div className="h-[3px] w-4 bg-sky-300" />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-pulse">
            <div className="md:col-span-8 bg-gray-50 h-96 rounded" />
            <div className="md:col-span-4 space-y-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-50 rounded" />)}
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24 text-[#555]">
            <p className="text-lg font-medium font-['Roboto',sans-serif]">Chưa có bài viết trong chuyên mục này.</p>
            <Link href="/" className="inline-block mt-4 text-[#0059b2] font-bold hover:underline">← Về trang chủ</Link>
          </div>
        ) : (
          <>
            {/* Top Grid: Hero (Left 8 cols) + Side Stack (Right 4 cols) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12 pb-10 border-b border-[#e1e1e1]">
              <div className="md:col-span-8">
                {featured && <HeroFeatured post={featured} />}
              </div>
              <aside className="md:col-span-4 flex flex-col gap-5">
                {sideFeatured.map(p => <MiniRow key={p.id} post={p} />)}
              </aside>
            </div>

            {/* Middle Content Layout: Most Read (3) + Main List (6) + Ads (3) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Left Column: Most Read */}
              <aside className="md:col-span-3 order-2 md:order-1">
                <SidebarHeading label="Tin đọc nhiều" />
                <ul className="flex flex-col">
                  {mostRead.map((p, i) => (
                    <li key={p.id} className="flex gap-4 py-4 border-b border-dashed border-[#e1e1e1] group cursor-pointer items-start last:border-0">
                      <div className="font-['Playfair_Display',serif] text-[36px] text-[#aed1ef] font-black leading-none mt-1 min-w-[32px]">
                        {i + 1}
                      </div>
                      <Link
                        href={`/bai-viet/${p.slug}`}
                        className="font-['Roboto',sans-serif] text-[14px] font-bold text-[#222] leading-snug group-hover:text-[#0059b2] transition-colors"
                      >
                        {p.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </aside>

              {/* Center Column: Articles List */}
              <div className="md:col-span-6 order-1 md:order-2 flex flex-col gap-8">
                {visibleList.map(p => <ListItem key={p.id} post={p} />)}
                
                {hasMore && (
                  <div className="text-center mt-6">
                    <button
                      onClick={() => setVisibleListCount(c => c + PAGE_SIZE)}
                      className="px-10 py-3 border-2 border-[#0059b2] text-[#0059b2] font-['Roboto',sans-serif] font-bold text-[13px] tracking-widest uppercase rounded-sm hover:bg-[#0059b2] hover:text-white transition-all duration-300"
                    >
                      XEM THÊM
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: BaoIn + Links & Ads */}
              <aside className="md:col-span-3 order-3">
                {latestBaoIn && (
                  <div className="mb-6">
                    <SidebarHeading label="ĐỌC BÁO IN" />
                    <div className="bg-white border border-[#e1e1e1] rounded-[2px] overflow-hidden shadow-sm">
                      <div className="px-4 py-3 bg-[#f2f7fb] border-b border-[#e1e1e1]">
                        <p className="font-['Roboto',sans-serif] text-[12px] font-bold text-[#0059b2] uppercase">Báo in Hải quân</p>
                        <p className="font-['Roboto',sans-serif] text-[11px] text-[#888] mt-0.5">Số mới nhất</p>
                      </div>
                      <Link href="/bao-in" className="block group">
                        {latestBaoIn.thumbnail && (
                          <div className="overflow-hidden">
                            <img
                              src={latestBaoIn.thumbnail}
                              alt={latestBaoIn.title}
                              className="w-full h-auto object-cover group-hover:opacity-95 transition"
                            />
                          </div>
                        )}
                        <div className="p-3">
                          <p className="font-['Roboto',sans-serif] text-[13px] font-bold text-[#222] group-hover:text-[#0059b2] line-clamp-2 leading-snug transition-colors">
                            {latestBaoIn.title}
                          </p>
                        </div>
                      </Link>
                      <Link
                        href="/bao-in"
                        className="block px-4 py-2.5 bg-[#0059b2] text-white text-center text-[12px] font-bold uppercase tracking-wider hover:bg-[#00305f] transition font-['Roboto',sans-serif]"
                      >
                        Xem Báo In →
                      </Link>
                    </div>
                  </div>
                )}
                <WebsiteLinks />
                <div className="flex flex-col gap-4 mt-6">
                  {adBlocks.map((ad, i) => (
                    <a key={i} href={ad.href} target="_blank" rel="noopener noreferrer" className="block hover:opacity-95 transition-opacity shadow-sm rounded-[2px] overflow-hidden border border-gray-100">
                      <img src={ad.src} className="w-full h-auto object-cover" alt={`Quảng cáo ${i + 1}`} />
                    </a>
                  ))}
                </div>
              </aside>
            </div>

            {/* Bottom Section: Related Categories Grid */}
            {otherCats.length > 0 && (
              <section className="mt-16 pt-12 border-t border-[#e1e1e1]">
                <div className="flex items-center gap-2 mb-10">
                  <div className="flex shrink-0">
                    <div className="w-[6px] h-[22px] bg-[#0059b2] -skew-x-[20deg] mr-[3px]" />
                    <div className="w-[6px] h-[22px] bg-sky-300 -skew-x-[20deg]" />
                  </div>
                  <h2 className="font-['Playfair_Display',serif] font-black uppercase text-[22px] text-[#0059b2] tracking-wide">
                    Chuyên mục khác
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                  {otherCats.map(({ cat, posts: catPosts }) => (
                    <OtherCategoryColumn key={cat.id} cat={cat} posts={catPosts} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
