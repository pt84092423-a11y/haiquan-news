import { useState, useEffect, useCallback } from 'react';
import SEOHead from '@/components/SEOHead';
import SectionTitle from '@/components/SectionTitle';
import { supabase } from '@/lib/supabase';

interface PageEntry {
  url: string;
  type: 'image' | 'canva';
}

interface NewspaperIssue {
  id: number;
  edition: number;
  date: string;
  cover: string;
  pages: PageEntry[];
  title: string;
}

function parsePages(content: string): PageEntry[] {
  try {
    const raw = JSON.parse(content || '[]');
    if (!Array.isArray(raw)) return [];
    return raw.map((p: any) => {
      if (typeof p === 'string') return { url: p, type: 'image' as const };
      return { url: p.url || '', type: p.type || 'image' } as PageEntry;
    }).filter(p => p.url);
  } catch {
    return [];
  }
}

function CanvaViewer({ url, onClose, title }: { url: string; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 text-white/80 text-[13px] flex-shrink-0 bg-black/80">
        <span className="font-bold truncate max-w-[60vw]">{title}</span>
        <div className="flex items-center gap-3">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-white/70 hover:text-white transition text-[12px] border border-white/20 px-3 py-1 rounded"
          >
            Mở Canva
          </a>
          <button onClick={onClose} className="hover:text-white transition p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <iframe
          src={url}
          className="w-full h-full border-0"
          allowFullScreen
          title={title}
        />
      </div>
    </div>
  );
}

function NewspaperReader({ issue, onClose }: { issue: NewspaperIssue; onClose: () => void }) {
  const [page, setPage] = useState(0);
  const [flip, setFlip] = useState<{ from: number; to: number; dir: 'next' | 'prev' } | null>(null);
  const [showThumb, setShowThumb] = useState(false);

  const allPages: PageEntry[] = (() => {
    const imgPages = issue.pages.filter(p => p.type === 'image');
    const coverEntry: PageEntry | null = issue.cover && !imgPages.some(p => p.url === issue.cover)
      ? { url: issue.cover, type: 'image' }
      : null;
    const combined = coverEntry ? [coverEntry, ...imgPages] : imgPages;
    return combined.length > 0 ? combined : (issue.cover ? [{ url: issue.cover, type: 'image' }] : []);
  })();

  const canvaPages = issue.pages.filter(p => p.type === 'canva');
  const total = allPages.length;
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

  if (total === 0 && canvaPages.length === 0) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-lg mb-4">Chưa có trang báo nào</p>
          <button onClick={onClose} className="text-white/60 hover:text-white underline">Đóng</button>
        </div>
      </div>
    );
  }

  if (total === 0 && canvaPages.length > 0) {
    return <CanvaViewer url={canvaPages[0].url} onClose={onClose} title={issue.title} />;
  }

  const currentPage = allPages[page];

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 text-white/80 text-[13px] flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-mono">{page + 1} / {total}</span>
          {canvaPages.length > 0 && (
            <a
              href={canvaPages[0].url}
              target="_blank"
              rel="noreferrer"
              className="text-purple-300 hover:text-purple-200 text-[11px] border border-purple-400/40 px-2 py-0.5 rounded flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Xem Canva
            </a>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            className="hover:text-white transition p-1"
            onClick={() => setShowThumb(v => !v)}
            title="Xem tất cả trang"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button onClick={onClose} className="hover:text-white transition p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {showThumb && (
        <div className="absolute inset-0 z-10 bg-black/95 overflow-y-auto p-6" onClick={() => setShowThumb(false)}>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-w-5xl mx-auto">
            {allPages.map((p, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setPage(i); setFlip(null); setShowThumb(false); }}
                className={`relative aspect-[3/4] rounded overflow-hidden border-2 transition ${i === page ? 'border-[#0059b2] ring-2 ring-[#0059b2]/50' : 'border-white/20 hover:border-white/60'}`}
              >
                <img src={p.url} alt={`Trang ${i + 1}`} className="w-full h-full object-cover" />
                <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5">{i + 1}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 relative flex items-center justify-center overflow-hidden" style={{ perspective: '2200px' }}>
        <button
          onClick={goPrev}
          disabled={page === 0 || !!flip}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/10 hover:bg-white/20 disabled:opacity-20 rounded-full flex items-center justify-center text-white transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="relative h-full max-h-full flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
          {flip && (
            <img
              src={allPages[flip.to].url}
              alt={`Trang ${flip.to + 1}`}
              className="max-h-[92vh] max-w-[95vw] object-contain select-none shadow-2xl"
              draggable={false}
            />
          )}
          <img
            key={`current-${page}-${flip ? flip.dir : 'idle'}`}
            src={currentPage.url}
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
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="flex-shrink-0 border-t border-white/10 px-6 py-3 flex items-center justify-center gap-6 text-white/60">
        <button
          onClick={() => document.documentElement.requestFullscreen?.()}
          className="hover:text-white transition" title="Toàn màn hình"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
        <button
          onClick={() => { const a = document.createElement('a'); a.href = currentPage.url; a.download = `baoin-trang${page + 1}.jpg`; a.click(); }}
          className="hover:text-white transition" title="Tải trang hiện tại"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
        <button onClick={() => setShowThumb(v => !v)} className="hover:text-white transition" title="Xem lưới trang">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" strokeWidth={2} />
            <rect x="14" y="3" width="7" height="7" strokeWidth={2} />
            <rect x="3" y="14" width="7" height="7" strokeWidth={2} />
            <rect x="14" y="14" width="7" height="7" strokeWidth={2} />
          </svg>
        </button>
        {canvaPages.length > 0 && (
          <a
            href={canvaPages[0].url}
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition text-purple-400 hover:text-purple-300"
            title="Mở Canva embed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
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
        setIssues(data.map((p: any) => ({
          id: p.id,
          edition: p.id,
          date: p.published_at?.slice(0, 10) || p.created_at?.slice(0, 10) || '',
          cover: p.thumbnail || '',
          pages: parsePages(p.content || '[]'),
          title: p.title || `Báo in Hải quân số ${p.id}`,
        })));
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
                    ) : issue ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                        <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-[11px]">Báo số {i + 1}</span>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-200">
                        <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
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
                    {issue && issue.pages.some(p => p.type === 'canva') && (
                      <div className="absolute top-1.5 right-1.5 bg-purple-500/90 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                        Canva
                      </div>
                    )}
                  </div>
                  {issue ? (
                    <>
                      <p className="text-[13px] font-bold text-[#002060] group-hover:text-[#0059b2] transition leading-snug line-clamp-2">{issue.title}</p>
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
