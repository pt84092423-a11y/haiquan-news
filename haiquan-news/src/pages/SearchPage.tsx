import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import SEOHead from '@/components/SEOHead';
import SectionTitle from '@/components/SectionTitle';
import { getAllCategories, searchPostsFull, type Category, type Post } from '@/lib/supabase';

const PLACEHOLDER = 'https://via.placeholder.com/800x500/00305f/ffffff?text=Báo+Hải+Quân';
const PAGE_SIZE = 10;

function formatDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

export default function SearchPage() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split('?')[1] || '');
  const initialQuery = params.get('q') || '';
  const initialCat = params.get('category') || '';

  const [query, setQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [categories, setCategories] = useState<Category[]>([]);
  const [results, setResults] = useState<Post[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    getAllCategories().then(cats => setCategories(cats.filter(c => c.slug !== 'bao-in')));
  }, []);

  const doSearch = useCallback(async (q: string, cat: string, p: number) => {
    if (!q.trim()) return;
    setLoading(true);
    const { posts, count } = await searchPostsFull(q, {
      categorySlug: cat || undefined,
      limit: PAGE_SIZE,
      offset: p * PAGE_SIZE,
    });
    setResults(posts);
    setTotalCount(count);
    setLoading(false);
    setSearched(true);
  }, []);

  useEffect(() => {
    if (initialQuery) {
      doSearch(initialQuery, initialCat, 0);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = inputValue.trim();
    if (!q) return;
    setQuery(q);
    setPage(0);
    doSearch(q, selectedCategory, 0);
    window.history.pushState({}, '', `/tim-kiem?q=${encodeURIComponent(q)}${selectedCategory ? `&category=${selectedCategory}` : ''}`);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    doSearch(query, selectedCategory, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <>
      <SEOHead title={`Tìm kiếm: ${query || '...'}`} description="Tìm kiếm bài viết trên Báo Hải Quân Việt Nam" />

      <div className="bg-[#f2f7fb] border-b border-[#e1e1e1] py-3">
        <div className="container mx-auto max-w-[1200px] px-4">
          <div className="flex items-center gap-2 text-[12px] text-[#555] font-['Roboto',sans-serif]">
            <Link href="/" className="hover:text-[#0059b2] transition-colors">Trang chủ</Link>
            <span className="text-gray-400">/</span>
            <span className="font-bold text-[#0059b2]">Tìm kiếm</span>
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-[1200px] px-4 pt-8 pb-16">
        <div className="mb-8">
          <h1 className="font-['Cinzel',serif] text-[28px] font-bold text-[#0059b2] mb-6 uppercase tracking-wide flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Tìm kiếm nâng cao
          </h1>

          <form onSubmit={handleSubmit} className="bg-white border border-[#e1e1e1] rounded-lg p-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder="Nhập từ khóa tìm kiếm..."
                  className="w-full border border-[#d1d5db] rounded-lg px-4 py-3 text-[15px] font-['Roboto',sans-serif] focus:outline-none focus:border-[#0059b2] focus:ring-2 focus:ring-[#0059b2]/20"
                  autoFocus
                />
              </div>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="md:w-[220px] border border-[#d1d5db] rounded-lg px-4 py-3 text-[14px] font-['Roboto',sans-serif] focus:outline-none focus:border-[#0059b2] bg-white"
              >
                <option value="">Tất cả chuyên mục</option>
                {categories.map(c => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
              <button
                type="submit"
                className="bg-[#0059b2] text-white font-bold px-8 py-3 rounded-lg hover:bg-[#00305f] transition font-['Roboto',sans-serif] text-[14px] uppercase tracking-wide flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Tìm kiếm
              </button>
            </div>
            {query && searched && (
              <p className="text-[13px] text-[#888] font-['Roboto',sans-serif]">
                {loading ? 'Đang tìm...' : `Tìm thấy ${totalCount.toLocaleString()} kết quả cho từ khóa `}
                {!loading && <strong className="text-[#0059b2]">"{query}"</strong>}
              </p>
            )}
          </form>
        </div>

        {loading && (
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-5">
                <div className="w-[200px] h-[130px] bg-gray-100 rounded flex-shrink-0" />
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-5 bg-gray-100 rounded w-3/4" />
                  <div className="h-4 bg-gray-100 rounded" />
                  <div className="h-4 bg-gray-100 rounded w-5/6" />
                  <div className="h-3 bg-gray-100 rounded w-1/4 mt-4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[18px] font-bold text-[#555] mb-2">Không tìm thấy kết quả</p>
            <p className="text-[14px] text-[#888]">Hãy thử tìm với từ khóa khác hoặc bỏ bộ lọc chuyên mục.</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <div className="space-y-6 mb-10">
              {results.map(post => (
                <Link
                  key={post.id}
                  href={`/bai-viet/${post.slug}`}
                  className="flex gap-5 group cursor-pointer border-b border-[#e1e1e1] pb-6 last:border-0"
                >
                  <div className="w-[180px] md:w-[220px] h-[120px] md:h-[140px] flex-shrink-0 overflow-hidden rounded-[2px]">
                    <img
                      src={post.thumbnail || PLACEHOLDER}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  </div>
                  <div className="flex-1">
                    {post.category && (
                      <span className="inline-block text-[11px] font-bold uppercase text-[#0059b2] bg-[#0059b2]/10 px-2 py-0.5 rounded mb-2">
                        {post.category.name}
                      </span>
                    )}
                    <h3 className="font-['Roboto',sans-serif] text-[17px] font-bold leading-snug text-[#222] group-hover:text-[#0059b2] transition-colors mb-2">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-[13px] text-[#666] font-['Roboto',sans-serif] line-clamp-2 leading-relaxed mb-3">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="text-[11px] text-[#aaa] font-medium">
                      {formatDate(post.published_at || post.created_at)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 0}
                  className="px-4 py-2 border border-[#e1e1e1] rounded text-[13px] font-bold hover:border-[#0059b2] hover:text-[#0059b2] disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  ← Trước
                </button>
                {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                  const p = i;
                  return (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={`w-9 h-9 rounded text-[13px] font-bold transition ${p === page ? 'bg-[#0059b2] text-white' : 'border border-[#e1e1e1] hover:border-[#0059b2] hover:text-[#0059b2]'}`}
                    >
                      {p + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 border border-[#e1e1e1] rounded text-[13px] font-bold hover:border-[#0059b2] hover:text-[#0059b2] disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}

        {!searched && (
          <div className="mt-8">
            <SectionTitle title="GỢI Ý TÌM KIẾM" />
            <div className="flex flex-wrap gap-3 mt-4">
              {['Hải quân', 'Biển đảo', 'Lịch sử', 'Tàu chiến', 'Trường Sa', 'Hoàng Sa', 'Tuần tra', 'Diễn tập'].map(kw => (
                <button
                  key={kw}
                  onClick={() => { setInputValue(kw); setQuery(kw); setPage(0); doSearch(kw, '', 0); window.history.pushState({}, '', `/tim-kiem?q=${encodeURIComponent(kw)}`); }}
                  className="px-4 py-2 bg-[#f2f7fb] border border-[#d1e8f5] text-[#0059b2] text-[13px] font-bold rounded-full hover:bg-[#0059b2] hover:text-white transition font-['Roboto',sans-serif]"
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
