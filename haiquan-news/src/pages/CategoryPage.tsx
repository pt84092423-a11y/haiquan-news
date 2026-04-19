import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import SEOHead from '@/components/SEOHead';
import SectionTitle from '@/components/SectionTitle';
import PostCard from '@/components/PostCard';
import WebsiteLinks from '@/components/WebsiteLinks';
import { getAllSettings, getPublishedPosts, getCategoryBySlug, type Post, type Category } from '@/lib/supabase';

const CATEGORY_CONFIG: Record<string, { title: string; desc: string }> = {
  'tin-tuc': { title: 'Tin tức', desc: 'Tin tức thời sự Hải quân Nhân dân Việt Nam' },
  'vi-chu-quyen': { title: 'Vì chủ quyền biển đảo', desc: 'Bảo vệ chủ quyền biển đảo Tổ quốc' },
  'tam-tinh': { title: 'Tâm tình lính biển', desc: 'Câu chuyện của người lính biển' },
  'lich-su': { title: 'Lịch sử', desc: 'Lịch sử Hải quân Nhân dân Việt Nam' },
  'longform': { title: 'Longform', desc: 'Bài viết chuyên sâu dạng dài' },
  'podcast': { title: 'Podcast', desc: 'Chương trình phát thanh Hải quân' },
  'truyen-hinh-hq': { title: 'Truyền hình Hải quân', desc: 'Video truyền hình chính thức' },
  'phong-su-anh': { title: 'Phóng sự ảnh', desc: 'Phóng sự bằng hình ảnh' },
  'bao-in': { title: 'Báo In', desc: 'Phiên bản báo in số hóa' },
  'da-phuong-tien': { title: 'Đa phương tiện', desc: 'Nội dung đa phương tiện' },
};

const LIMIT = 12;

export default function CategoryPage() {
  const [location] = useLocation();
  const slug = location.replace(/^\//, '').split('/')[0] || '';
  const [posts, setPosts] = useState<Post[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState<Record<string, string>>({});

  const config = CATEGORY_CONFIG[slug] || { title: slug, desc: '' };

  useEffect(() => {
    setPage(0);
    setPosts([]);
    getCategoryBySlug(slug).then(setCategory);
  }, [slug]);

  useEffect(() => {
    setLoading(true);
    getPublishedPosts({ categorySlug: slug, limit: LIMIT, offset: page * LIMIT }).then(data => {
      if (page === 0) setPosts(data || []);
      else setPosts(prev => [...prev, ...(data || [])]);
      setLoading(false);
    });
  }, [slug, page]);

  useEffect(() => {
    getAllSettings().then(setAds);
  }, []);

  const hasMore = posts.length < total || (page === 0 && posts.length === LIMIT);

  return (
    <>
      <SEOHead title={config.title} description={config.desc} />
      
      <div className="bg-[#f2f7fb] border-b border-[#e1e1e1] py-4">
        <div className="container mx-auto max-w-[1200px] px-4">
          <div className="flex items-center gap-2 text-[13px] text-[#555555]">
            <a href="/" className="hover:text-[#0059b2]">Trang chủ</a>
            <span>/</span>
            <span className="font-bold text-[#0059b2]">{config.title}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-[1200px] px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <main className="md:col-span-9">
            <div className="border-b-2 border-[#0059b2] pb-3 mb-6">
              <SectionTitle title={config.title} className="text-[28px] mb-0" />
              {config.desc && <p className="text-[13px] text-[#555555] mt-1">{config.desc}</p>}
            </div>

            {loading && page === 0 ? (
              <div className="space-y-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="w-[220px] h-[146px] bg-gray-100 rounded flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-1/4" />
                      <div className="h-5 bg-gray-100 rounded w-3/4" />
                      <div className="h-4 bg-gray-100 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16 text-[#555555]">
                <p className="text-lg">Chưa có bài viết trong chuyên mục này.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {posts.map(p => <PostCard key={p.id} post={p} variant="horizontal" />)}
              </div>
            )}

            {hasMore && !loading && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="px-8 py-3 border-2 border-[#0059b2] text-[#0059b2] font-bold text-[14px] rounded hover:bg-[#0059b2] hover:text-white transition"
                >
                  Xem thêm bài viết
                </button>
              </div>
            )}
          </main>

          <aside className="md:col-span-3">
            <div className="mb-6">
              <SectionTitle title="Bài viết mới nhất" className="text-[18px]" />
              <div className="flex flex-col gap-3">
                {posts.slice(0, 5).map(p => (
                  <a key={p.id} href={`/bai-viet/${p.slug}`} className="group flex gap-3 cursor-pointer border-b border-[#e1e1e1] pb-3 last:border-b-0">
                    <img src={p.thumbnail || 'https://via.placeholder.com/80x55/00305f/fff'} alt={p.title} className="w-[80px] h-[55px] object-cover rounded-[2px] flex-shrink-0" />
                    <h4 className="text-[13px] font-bold text-[#222222] group-hover:text-[#0059b2] leading-snug">{p.title}</h4>
                  </a>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <SectionTitle title="Liên kết website" className="text-[18px]" />
              <WebsiteLinks />
            </div>

            <div className="space-y-4">
              <a href={ads.article_ad_1_link || "#"} className="block hover:opacity-95 transition">
                <img src={ads.article_ad_1_image || "/quangcao-101.png"} className="w-full rounded-sm shadow-md" alt="Quảng cáo chuyên mục 1" />
              </a>
              <a href={ads.article_ad_2_link || "#"} className="block hover:opacity-95 transition">
                <img src={ads.article_ad_2_image || "/quangcao-954.png"} className="w-full rounded-sm shadow-md" alt="Quảng cáo chuyên mục 2" />
              </a>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
