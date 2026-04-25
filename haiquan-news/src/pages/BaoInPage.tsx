import { useState, useEffect, useCallback } from 'react';
import SEOHead from '@/components/SEOHead';
import SectionTitle from '@/components/SectionTitle';
import { supabase } from '@/lib/supabase';

interface NewspaperIssue {
  id: number;
  edition: number;
  date: string;
  cover: string;
  pages: string[];
}

function NewspaperReader({ issue, onClose }: { issue: NewspaperIssue; onClose: () => void }) {
  const [page, setPage] = useState(0);
  const [flip, setFlip] = useState<{ from: number; to: number; dir: 'next' | 'prev' } | null>(null);
  const contentPages = issue.pages.filter(Boolean);
  const pages = issue.cover && !contentPages.includes(issue.cover)
    ? [issue.cover, ...contentPages]
    : contentPages.length > 0 ? contentPages : (issue.cover ? [issue.cover] : []);
  const total = pages.length;
  const FLIP_MS = 650;

  const turnTo = useCallback((nextPage: number, dir: 'next' | 'prev') => {
    setPage(curr => {
      if (nextPage === curr || nextPage < 0 || nextPage >= total) return curr;
      setFlip({ from: curr, to: nextPage, dir });
      window.setTimeout(() => {
        setPage(nextPage);
        setFlip(null);
      }, FLIP_MS);
      return curr;
    });
  }, [total]);

  const goNext = useCallback(() => {
    if (flip) return;
    turnTo(Math.min(page + 1, total - 1), 'next');
  }, [flip, page, total, turnTo]);

  const goPrev = useCallback(() => {
    if (flip) return;
    turnTo(Math.max(page - 1, 0), 'prev');
  }, [flip, page, turnTo]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, onClose]);

  if (total === 0) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-lg mb-4">Chưa có trang báo nào</p>
          <button onClick={onClose} className="text-white/60 hover:text-white underline">Đóng</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 text-white/80 text-[13px] flex-shrink-0">
        <span className="font-mono">{page + 1} / {total}</span>
        <div className="flex items-center gap-3">
          <button className="hover:text-white transition p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <button onClick={onClose} className="hover:text-white transition p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden" style={{ perspective: '2200px' }}>
        <button
          onClick={goPrev}
          disabled={page === 0 || !!flip}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/10 hover:bg-white/20 disabled:opacity-20 rounded-full flex items-center justify-center text-white transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>

        <div className="relative h-full max-h-full flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
          {/* Page underneath (destination) */}
          {flip && (
            <img
              src={pages[flip.to]}
              alt={`Trang ${flip.to + 1}`}
              className="max-h-[92vh] max-w-[95vw] object-contain select-none shadow-2xl"
              draggable={false}
            />
          )}

          {/* Current page (the one flipping) */}
          <img
            key={`current-${page}-${flip ? flip.dir : 'idle'}`}
            src={pages[page]}
            alt={`Trang ${page + 1}`}
            onClick={e => {
              if (flip) return;
              const rect = (e.currentTarget as HTMLImageElement).getBoundingClientRect();
              const isLeftHalf = (e.clientX - rect.left) < rect.width / 2;
              if (isLeftHalf) goPrev(); else goNext();
            }}
            className={`max-h-[92vh] max-w-[95vw] object-contain select-none shadow-2xl cursor-pointer ${flip ? (flip.dir === 'next' ? 'page-flip-next' : 'page-flip-prev') : ''} ${flip ? 'absolute inset-0 m-auto' : ''}`}
            style={{
              backfaceVisibility: 'hidden',
              transformOrigin: flip?.dir === 'next' ? 'left center' : 'right center',
              boxShadow: flip ? '0 40px 80px rgba(0,0,0,0.8), inset 0 0 60px rgba(0,0,0,0.2)' : undefined,
            }}
            draggable={false}
          />
        </div>

        <button
          onClick={goNext}
          disabled={page === total - 1 || !!flip}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/10 hover:bg-white/20 disabled:opacity-20 rounded-full flex items-center justify-center text-white transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div className="flex-shrink-0 border-t border-white/10 px-6 py-3 flex items-center justify-center gap-6 text-white/60">
        <button className="hover:text-white transition" title="Phóng to"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></button>
        <button className="hover:text-white transition" title="Thu nhỏ"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg></button>
        <button className="hover:text-white transition" title="Slideshow"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></button>
        <button className="hover:text-white transition" title="Đánh dấu"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg></button>
        <button className="hover:text-white transition" title="Danh mục"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg></button>
        <button className="hover:text-white transition" title="Xem lưới">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" strokeWidth={2} /><rect x="14" y="3" width="7" height="7" strokeWidth={2} /><rect x="3" y="14" width="7" height="7" strokeWidth={2} /><rect x="14" y="14" width="7" height="7" strokeWidth={2} /></svg>
        </button>
        <button className="hover:text-white transition" title="In"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg></button>
        <button
          onClick={() => { const a = document.createElement('a'); a.href = pages[page]; a.download = `baoin-so${issue.edition}-trang${page + 1}.jpg`; a.click(); }}
          className="hover:text-white transition" title="Tải xuống"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
        </button>
        <button
          onClick={() => document.documentElement.requestFullscreen?.()}
          className="hover:text-white transition" title="Toàn màn hình"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
        </button>
      </div>
    </div>
  );
}

export default function BaoInPage() {
  const [issues, setIssues] = useState<NewspaperIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<NewspaperIssue | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('post_type', 'baoin')
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      if (data) {
        setIssues(data.map((p: any) => {
          let pages: string[] = [];
          try { pages = JSON.parse(p.content || '[]'); } catch {}
          return {
            id: p.id,
            edition: p.id,
            date: p.published_at?.slice(0, 10) || p.created_at?.slice(0, 10) || '',
            cover: p.thumbnail || '',
            pages,
            title: p.title,
          } as any;
        }));
      }
      setLoading(false);
    }
    load();
  }, []);

  const SLOTS = 30;
  const slots = Array.from({ length: SLOTS }, (_, i) => issues[i] || null);

  const formatDate = (d: string) => {
    if (!d) return '';
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
  };

  return (
    <>
      <SEOHead title="Báo In" description="Đọc báo in Hải Quân Việt Nam phiên bản số" />
      {selected && <NewspaperReader issue={selected} onClose={() => setSelected(null)} />}

      <div className="container mx-auto max-w-[1200px] px-4 py-8">
        <SectionTitle title="BÁO IN" />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 mt-6">
          {loading
            ? [...Array(10)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-md aspect-[3/4] mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-1" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))
            : slots.map((issue, i) => (
                <div
                  key={i}
                  onClick={() => issue && setSelected(issue)}
                  className={`group ${issue ? 'cursor-pointer' : ''}`}
                >
                  <div className={`relative aspect-[3/4] rounded-md overflow-hidden border-2 mb-2 shadow-sm ${issue ? 'border-gray-200 group-hover:border-[#0059b2] group-hover:shadow-lg transition' : 'border-dashed border-gray-200 bg-gray-50'}`}>
                    {issue?.cover ? (
                      <img src={issue.cover} alt={`Số ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                        <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <span className="text-[11px]">Chưa có</span>
                      </div>
                    )}
                    {issue && (
                      <div className="absolute inset-0 bg-[#0059b2]/0 group-hover:bg-[#0059b2]/10 transition flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition bg-white/90 rounded-full px-4 py-1.5 text-[#0059b2] font-bold text-[12px] shadow">
                          Đọc ngay
                        </div>
                      </div>
                    )}
                  </div>
                  {issue ? (
                    <>
                      <p className="text-[13px] font-bold text-[#002060] group-hover:text-[#0059b2] transition leading-snug line-clamp-2">{(issue as any).title || `Báo in Hải quân số ${i + 1}`}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(issue.date)}</p>
                    </>
                  ) : (
                    <p className="text-[12px] text-gray-300">Ô {i + 1}</p>
                  )}
                </div>
              ))
          }
        </div>
      </div>
    </>
  );
}
