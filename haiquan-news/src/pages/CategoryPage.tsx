import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import SEOHead from '@/components/SEOHead';
import WebsiteLinks from '@/components/WebsiteLinks';
import NavyGalleryStrip from '@/components/NavyGalleryStrip';
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

function HeroFeatured({ post }: { post: Post }) {
  return (
    <Link href={`/bai-viet/${post.slug}`} className="group block">
      <div className="overflow-hidden rounded-sm shadow-sm">
        <img
          src={post.thumbnail || PLACEHOLDER}
          alt={post.title}
          className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition duration-500"
        />
      </div>
      <h2 className="mt-3 font-['Roboto',sans-serif] font-bold text-[20px] md:text-[22px] leading-snug text-[#222] group-hover:text-[#0059b2]">
        {post.title}
      </h2>
      {post.excerpt && (
        <p className="mt-2 text-[13px] text-[#555] leading-relaxed line-clamp-3">{post.excerpt}</p>
      )}
    </Link>
  );
}

function MediumCard({ post }: { post: Post }) {
  return (
    <Link href={`/bai-viet/${post.slug}`} className="group block">
      <div className="overflow-hidden rounded-sm">
        <img
          src={post.thumbnail || PLACEHOLDER}
          alt={post.title}
          className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition duration-500"
        />
      </div>
      <h3 className="mt-2 font-bold text-[13.5px] leading-snug text-[#222] group-hover:text-[#0059b2] line-clamp-3">
        {post.title}
      </h3>
    </Link>
  );
}

function MiniRow({ post }: { post: Post }) {
  return (
    <Link href={`/bai-viet/${post.slug}`} className="group flex gap-3">
      <div className="w-[110px] flex-shrink-0 overflow-hidden rounded-sm">
        <img
          src={post.thumbnail || PLACEHOLDER}
          alt={post.title}
          className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition duration-500"
        />
      </div>
      <h4 className="text-[13px] font-bold leading-snug text-[#222] group-hover:text-[#0059b2] line-clamp-3">
        {post.title}
      </h4>
    </Link>
  );
}

function ListItem({ post }: { post: Post }) {
  return (
    <Link
      href={`/bai-viet/${post.slug}`}
      className="group grid grid-cols-12 gap-4 pb-5 mb-5 border-b border-gray-100 last:border-b-0"
    >
      <div className="col-span-12 sm:col-span-5">
        <div className="overflow-hidden rounded-sm">
          <img
            src={post.thumbnail || PLACEHOLDER}
            alt={post.title}
            className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition duration-500"
          />
        </div>
      </div>
      <div className="col-span-12 sm:col-span-7 flex flex-col">
        <h3 className="font-bold text-[16px] md:text-[17px] leading-snug text-[#222] group-hover:text-[#0059b2]">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mt-2 text-[13px] text-[#555] leading-relaxed line-clamp-3">{post.excerpt}</p>
        )}
        <span className="mt-auto pt-2 text-[11px] text-gray-400">{formatDate(post.published_at || post.created_at)}</span>
      </div>
    </Link>
  );
}

function OtherCategoryColumn({ cat, post }: { cat: Category; post: Post | null }) {
  return (
    <div>
      <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#0059b2] pb-2 mb-3 border-b-2 border-[#0059b2]">
        {cat.name}
      </h3>
      {post ? (
        <Link href={`/bai-viet/${post.slug}`} className="group block">
          <div className="overflow-hidden rounded-sm mb-2">
            <img
              src={post.thumbnail || PLACEHOLDER}
              alt={post.title}
              className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition duration-500"
            />
          </div>
          <h4 className="font-bold text-[13.5px] leading-snug text-[#222] group-hover:text-[#0059b2] line-clamp-3">
            {post.title}
          </h4>
          {post.excerpt && (
            <p className="mt-1 text-[12px] text-[#666] leading-relaxed line-clamp-2">{post.excerpt}</p>
          )}
        </Link>
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
  const [latestBaoIn, setLatestBaoIn] = useState<Post | null>(null);
  const [otherCats, setOtherCats] = useState<Array<{ cat: Category; post: Post | null }>>([]);
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
        .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
        .slice(0, 8);
      setMostRead(sortedPopular);
      setLatestBaoIn((baoIn || [])[0] || null);
      setAds(settings || {});

      const others = (allCats || []).filter((c: Category) => c.slug !== slug).slice(0, 5);
      const withPosts = await Promise.all(
        others.map(async (c: Category) => {
          const items = await getPublishedPosts({ categorySlug: c.slug, limit: 1 });
          return { cat: c, post: (items || [])[0] || null };
        })
      );
      setOtherCats(withPosts);
      setLoading(false);
    }
    load();
  }, [slug]);

  const featured = posts[0];
  const middleQuad = posts.slice(1, 5);
  const rightStack = posts.slice(5, 9);
  const listPool = posts.slice(9);
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

      <div className="bg-[#f2f7fb] border-b border-[#e1e1e1] py-3">
        <div className="container mx-auto max-w-[1200px] px-4">
          <div className="flex items-center gap-2 text-[12px] text-[#555]">
            <Link href="/" className="hover:text-[#0059b2]">Trang chủ</Link>
            <span>/</span>
            <span className="font-bold text-[#0059b2] uppercase">{title}</span>
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-[1200px] px-4 pt-8 pb-12">
        {/* Centered title with horizontal rule */}
        <div className="text-center mb-8">
          <h1 className="font-['Playfair_Display',serif] text-[28px] md:text-[34px] font-black uppercase text-[#002060] tracking-wide">
            {title}
          </h1>
          <div className="mt-3 mx-auto w-24 border-t-2 border-[#0059b2]" />
        </div>

        {loading ? (
          <div className="grid grid-cols-12 gap-6 animate-pulse">
            <div className="col-span-12 md:col-span-5 space-y-3">
              <div className="aspect-[4/3] bg-blue-50 rounded" />
              <div className="h-5 bg-blue-50 rounded w-3/4" />
              <div className="h-4 bg-blue-50 rounded w-full" />
            </div>
            <div className="col-span-12 md:col-span-4 grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="aspect-[16/10] bg-blue-50 rounded" />
                  <div className="h-3 bg-blue-50 rounded w-full" />
                </div>
              ))}
            </div>
            <div className="col-span-12 md:col-span-3 space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-blue-50 rounded" />)}
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-[#555]">
            <p className="text-lg">Chưa có bài viết trong chuyên mục này.</p>
            <Link href="/" className="inline-block mt-4 text-[#0059b2] font-bold hover:underline">← Về trang chủ</Link>
          </div>
        ) : (
          <>
            {/* HERO GRID: 5 + 4 + 3 */}
            <section className="grid grid-cols-12 gap-6 pb-10 border-b border-gray-100">
              <div className="col-span-12 md:col-span-5">
                {featured && <HeroFeatured post={featured} />}
              </div>
              <div className="col-span-12 md:col-span-4 grid grid-cols-2 gap-4">
                {middleQuad.length > 0
                  ? middleQuad.map(p => <MediumCard key={p.id} post={p} />)
                  : [...Array(4)].map((_, i) => (
                      <div key={i} className="aspect-[16/10] bg-blue-50/40 rounded-sm" />
                    ))}
              </div>
              <div className="col-span-12 md:col-span-3 flex flex-col gap-4">
                {rightStack.length > 0
                  ? rightStack.map(p => <MiniRow key={p.id} post={p} />)
                  : [...Array(4)].map((_, i) => (
                      <div key={i} className="h-20 bg-blue-50/40 rounded-sm" />
                    ))}
              </div>
            </section>

            {/* LIST + READ + BÁO IN */}
            <section className="grid grid-cols-12 gap-8 mt-10">
              {/* Tin đọc nhiều */}
              <aside className="col-span-12 md:col-span-3 order-2 md:order-1">
                <h3 className="text-[14px] font-black uppercase text-[#0059b2] pb-2 mb-3 border-b-2 border-[#0059b2]">
                  Tin đọc nhiều
                </h3>
                <ol className="space-y-3">
                  {mostRead.length === 0 && <li className="text-sm text-gray-400 italic">Chưa có dữ liệu</li>}
                  {mostRead.map((p, i) => (
                    <li key={p.id} className="flex gap-3">
                      <span
                        className={`flex-shrink-0 w-7 h-7 rounded-sm flex items-center justify-center font-black text-[14px] ${
                          i < 3 ? 'text-[#FFD700] bg-[#0059b2]' : 'text-[#0059b2] bg-blue-50'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <Link
                        href={`/bai-viet/${p.slug}`}
                        className="text-[13px] font-bold text-[#222] leading-snug hover:text-[#0059b2] line-clamp-3"
                      >
                        {p.title}
                      </Link>
                    </li>
                  ))}
                </ol>
              </aside>

              {/* Main article list */}
              <div className="col-span-12 md:col-span-6 order-1 md:order-2">
                {listPool.length === 0 ? (
                  <div className="text-sm text-gray-400 italic py-6">Đã hiển thị toàn bộ bài viết của chuyên mục.</div>
                ) : (
                  <>
                    {visibleList.map(p => <ListItem key={p.id} post={p} />)}
                    {hasMore && (
                      <div className="text-center mt-4">
                        <button
                          onClick={() => setVisibleListCount(c => c + PAGE_SIZE)}
                          className="px-8 py-2.5 border-2 border-[#0059b2] text-[#0059b2] font-bold text-[13px] rounded-sm hover:bg-[#0059b2] hover:text-white transition"
                        >
                          Xem thêm
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Đọc báo in + ads */}
              <aside className="col-span-12 md:col-span-3 order-3">
                <h3 className="text-[14px] font-black uppercase text-[#0059b2] pb-2 mb-3 border-b-2 border-[#0059b2]">
                  Đọc Báo In
                </h3>
                {latestBaoIn ? (
                  <Link href="/bao-in" className="block group">
                    <div className="overflow-hidden rounded-sm shadow border border-gray-100">
                      <img
                        src={latestBaoIn.thumbnail || PLACEHOLDER}
                        alt={latestBaoIn.title}
                        className="w-full h-auto object-cover group-hover:scale-[1.02] transition duration-500"
                      />
                    </div>
                    <p className="mt-2 text-[12px] text-[#0059b2] font-bold uppercase">{formatDate(latestBaoIn.published_at || latestBaoIn.created_at)}</p>
                    <p className="text-[13px] font-bold text-[#222] group-hover:text-[#0059b2] line-clamp-2 leading-snug">
                      {latestBaoIn.title}
                    </p>
                  </Link>
                ) : (
                  <div className="bg-blue-50/60 rounded-sm p-4 text-[12px] text-gray-500 italic text-center">
                    Chưa có ấn phẩm Báo In mới.
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {adBlocks.map((ad, i) => (
                    <a key={i} href={ad.href} target="_blank" rel="noopener noreferrer" className="block hover:opacity-95 transition shadow-sm rounded-sm overflow-hidden bg-white p-1">
                      <img src={ad.src} className="w-full h-[60px] object-contain" alt={`Quảng cáo ${i + 1}`} />
                    </a>
                  ))}
                </div>

                <div className="mt-4">
                  <WebsiteLinks />
                </div>
              </aside>
            </section>

            {/* CHUYÊN MỤC KHÁC */}
            {otherCats.length > 0 && (
              <section className="mt-12 pt-8 border-t border-gray-100">
                <h2 className="text-[16px] font-black uppercase text-[#0059b2] mb-6 pb-2 border-b-2 border-[#0059b2] inline-block px-1">
                  Chuyên mục khác
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
                  {otherCats.map(({ cat, post }) => (
                    <OtherCategoryColumn key={cat.id} cat={cat} post={post} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <NavyGalleryStrip />
    </>
  );
}
