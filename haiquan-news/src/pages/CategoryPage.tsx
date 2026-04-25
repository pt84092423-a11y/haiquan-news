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

/* ── Section title (Tin đọc nhiều) ─────────────────────────────────── */
function SidebarHeading({ label }: { label: string }) {
  return (
    <h2 className="font-['Playfair_Display',serif] text-[#0059b2] text-[20px] font-black uppercase mb-4 flex items-center">
      <div className="flex mr-2">
        <div className="w-[5px] h-[18px] bg-[#0059b2] -skew-x-[20deg] mr-[2px]"></div>
        <div className="w-[5px] h-[18px] bg-sky-300 -skew-x-[20deg]"></div>
      </div>
      {label}
    </h2>
  );
}

/* ── Hero featured post (Top Left) ─────────────────────────────────────────── */
function HeroFeatured({ post }: { post: Post }) {
  return (
    <Link href={`/bai-viet/${post.slug}`} className="group block cursor-pointer">
      <div className="overflow-hidden rounded-[2px] mb-4 relative aspect-[16/9] shadow-sm">
        <img
          src={post.thumbnail || PLACEHOLDER}
          alt={post.title}
          className="w-full h-full object-cover transform transition duration-500 group-hover:scale-105"
        />
      </div>
      <h2 className="font-['Roboto',sans-serif] text-[26px] md:text-[30px] font-bold leading-tight text-[#222] mb-3 group-hover:text-[#0059b2] transition-colors">
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

/* ── Mini Row for Sidebar Top (Aside Right) ────────────────────────────────── */
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

/* ── List item (Main vertical list) ────────────────────────────────────────── */
function ListItem({ post }: { post: Post }) {
  return (
    <Link href={`/bai-viet/${post.slug}`} className="flex gap-4 group cursor-pointer border-b border-[#e1e1e1] pb-5 last:border-0">
      <div className="w-[180px] md:w-[220px] flex-shrink-0 overflow-hidden rounded-[2px] relative aspect-[3/2]">
        <img
          src={post.thumbnail || PLACEHOLDER}
          alt={post.title}
          className="w-full h-full object-cover transform transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex-1">
        <h3 className="font-['Roboto',sans-serif] text-[16px] md:text-[17px] font-bold leading-snug text-[#222] group-hover:text-[#0059b2] transition-colors mb-2">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-[13px] text-[#555] font-['Roboto',sans-serif] line-clamp-3">
            {post.excerpt}
          </p>
        )}
        <div className="mt-2 text-[11px] text-gray-400">{formatDate(post.published_at || post.created_at)}</div>
      </div>
    </Link>
  );
}

/* ── Other category column (Bottom section) ─────────────────────────────────── */
function OtherCategoryColumn({ cat, posts }: { cat: Category; posts: Post[] }) {
  const [featured, ...rest] = posts;
  return (
    <div className="flex flex-col gap-3">
      <Link href={`/${cat.slug}`}>
        <h3 className="font-['Playfair_Display',serif] text-[16px] font-black uppercase text-[#0059b2] pb-2 border-b-2 border-[#0059b2] hover:text-[#002060] transition">
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
            <h4 className="font-['Roboto',sans-serif] font-bold text-[13px] leading-snug text-[#222] group-hover:text-[#0059b2] line-clamp-2">
              {featured.title}
            </h4>
          </Link>
          <ul className="flex flex-col gap-2">
            {rest.map(p => (
              <li key={p.id}>
                <Link
                  href={`/bai-viet/${p.slug}`}
                  className="font-['Roboto',sans-serif] text-[12.5px] text-[#333] leading-snug hover:text-[#0059b2] line-clamp-2 block"
                >
                  • {p.title}
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

      const sortedPopular = [...(popular || [])]
        .filter((p: Post) => p.post_type !== 'baoin')
        .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
        .slice(0, 8);
      setMostRead(sortedPopular);
      setAds(settings || {});

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
  const sideFeatured = posts.slice(1, 5);
  const listPool = posts.slice(5);
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

      <div className="container mx-auto max-w-[1200px] px-4 py-6">
        <h1 className="text-center font-['Playfair_Display',serif] text-[28px] md:text-[32px] font-black uppercase text-[#0059b2] mb-8 tracking-wide">
          {title}
        </h1>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-pulse">
            <div className="md:col-span-8 bg-gray-50 h-96 rounded" />
            <div className="md:col-span-4 space-y-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-50 rounded" />)}
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-[#555]">
            <p className="text-lg">Chưa có bài viết trong chuyên mục này.</p>
            <Link href="/" className="inline-block mt-4 text-[#0059b2] font-bold hover:underline">← Về trang chủ</Link>
          </div>
        ) : (
          <>
            {/* Top Section: Hero + Sidebar Mini Posts */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-10 pb-8 border-b border-[#e1e1e1]">
              <div className="md:col-span-8">
                {featured && <HeroFeatured post={featured} />}
              </div>
              <aside className="md:col-span-4 flex flex-col gap-5">
                {sideFeatured.map(p => <MiniRow key={p.id} post={p} />)}
              </aside>
            </div>

            {/* Middle Section: Most Read + Main List + Ads/Links */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-10">
              {/* Aside Left: Most Read */}
              <aside className="md:col-span-3">
                <SidebarHeading label="Tin đọc nhiều" />
                <ul className="flex flex-col">
                  {mostRead.map((p, i) => (
                    <li key={p.id} className="flex gap-4 py-3 border-b border-dashed border-[#e1e1e1] group cursor-pointer items-start">
                      <div className="font-['Playfair_Display',serif] text-[32px] text-[#aed1ef] font-black leading-none mt-1">
                        {i + 1}
                      </div>
                      <Link
                        href={`/bai-viet/${p.slug}`}
                        className="font-['Roboto',sans-serif] text-[14px] font-bold text-[#222] leading-snug group-hover:text-[#0059b2]"
                      >
                        {p.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </aside>

              {/* Main Center Column: Article List */}
              <div className="md:col-span-6 px-0 md:px-2 flex flex-col gap-6">
                {visibleList.map(p => <ListItem key={p.id} post={p} />)}
                
                {hasMore && (
                  <div className="text-center mt-4">
                    <button
                      onClick={() => setVisibleListCount(c => c + PAGE_SIZE)}
                      className="px-8 py-2.5 border-2 border-[#0059b2] text-[#0059b2] font-['Roboto',sans-serif] font-bold text-[13px] rounded-sm hover:bg-[#0059b2] hover:text-white transition"
                    >
                      XEM THÊM
                    </button>
                  </div>
                )}
              </div>

              {/* Aside Right: Ads & Links */}
              <aside className="md:col-span-3 flex flex-col gap-6">
                <WebsiteLinks />
                <div className="flex flex-col gap-3">
                  {adBlocks.map((ad, i) => (
                    <a key={i} href={ad.href} target="_blank" rel="noopener noreferrer" className="block hover:opacity-95 transition shadow-sm rounded-sm overflow-hidden border border-gray-100">
                      <img src={ad.src} className="w-full h-auto object-cover" alt={`Quảng cáo ${i + 1}`} />
                    </a>
                  ))}
                </div>
              </aside>
            </div>

            {/* Bottom Section: Other Categories */}
            {otherCats.length > 0 && (
              <section className="mt-4 pt-10 border-t border-[#e1e1e1]">
                <div className="flex items-center gap-2 mb-8">
                    <div className="flex shrink-0">
                      <div className="w-[6px] h-[20px] bg-[#0059b2] -skew-x-[18deg] mr-[3px]" />
                      <div className="w-[6px] h-[20px] bg-sky-300 -skew-x-[18deg]" />
                    </div>
                    <h2 className="font-['Playfair_Display',serif] font-black uppercase text-[20px] text-[#0059b2] tracking-wide">
                      Chuyên mục khác
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {otherCats.map(({ cat, posts: catPosts }) => (
                    <OtherCategoryColumn key={cat.id} cat={cat} posts={catPosts} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
