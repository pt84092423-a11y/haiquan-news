import { useState, useEffect, useRef, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import { supabase } from '@/lib/supabase';
import type { Post } from '@/lib/supabase';
import logoUrl from '@assets/logo_haiquan.png';

const PAPER_TITLE = 'BÁO HẢI QUÂN SROV CUỐI TUẦN';
const PAPER_SUBTITLE = 'Cơ quan ngôn luận của Hải quân nhân dân Việt Nam';
const WEBSITE = 'haiquan-srov.vn';
const SETTING_KEY = 'weekend_paper_issue';
const NAVY = '#0059b2';
const GOLD = '#d4af37';
const DARK_NAVY = '#00305f';
const PAGE_W = 1122;
const PAGE_H = 1587;
const SCALE = 0.42;

function stripHtml(html: string): string {
  try {
    const div = document.createElement('div');
    div.innerHTML = html || '';
    return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
  } catch {
    return '';
  }
}

function excpt(content: string, len: number): string {
  const text = stripHtml(content);
  if (text.length <= len) return text;
  return text.slice(0, len).replace(/\s+\S*$/, '') + '…';
}

function viDate(d: Date) {
  const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  return `${days[d.getDay()]}, ngày ${String(d.getDate()).padStart(2, '0')} tháng ${String(d.getMonth() + 1).padStart(2, '0')} năm ${d.getFullYear()}`;
}

function fmtDate(ds: string) {
  const d = new Date(ds);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

interface NpProps {
  articles: Post[];
  issueNumber: number;
  pubDate: string;
}

function PaperHeader({ issueNumber, pubDate, mini = false }: { issueNumber: number; pubDate: string; mini?: boolean }) {
  const dateObj = new Date(pubDate + 'T00:00:00');
  const hH = mini ? 64 : 100;
  const titleSize = mini ? 20 : 32;
  const logoH = mini ? 48 : 76;

  return (
    <div style={{ width: '100%', height: hH, background: NAVY, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, position: 'relative', flexShrink: 0 }}>
      {/* Gold star decorations */}
      <div style={{ position: 'absolute', left: 110, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: GOLD, letterSpacing: 4, opacity: 0.7 }}>★ ★ ★</div>
      <div style={{ position: 'absolute', right: 110, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: GOLD, letterSpacing: 4, opacity: 0.7 }}>★ ★ ★</div>

      {/* Logo */}
      <img src={logoUrl} alt="Logo" style={{ height: logoH, width: 'auto', flexShrink: 0, filter: 'brightness(0) invert(1)' }} />

      {/* Center: paper name */}
      <div style={{ flex: 1, textAlign: 'center' }}>
        <div style={{ fontFamily: 'Cinzel, Oswald, Arial', fontSize: titleSize, fontWeight: 900, color: '#fff', letterSpacing: 3, textTransform: 'uppercase', lineHeight: 1.1, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
          {PAPER_TITLE}
        </div>
        {!mini && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 4, fontStyle: 'italic', fontFamily: 'Roboto, sans-serif' }}>
            {PAPER_SUBTITLE}
          </div>
        )}
      </div>

      {/* Right: date + issue */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontFamily: 'Roboto, sans-serif', lineHeight: 1.5 }}>
          {mini ? fmtDate(pubDate) : viDate(dateObj)}
        </div>
        <div style={{ fontSize: mini ? 13 : 17, color: GOLD, fontWeight: 900, fontFamily: 'Oswald, Arial', letterSpacing: 1 }}>
          SỐ {issueNumber}
        </div>
        {!mini && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontFamily: 'Roboto, sans-serif' }}>{WEBSITE}</div>
        )}
      </div>
    </div>
  );
}

function GoldLine() {
  return <div style={{ width: '100%', height: 4, background: `linear-gradient(90deg, ${DARK_NAVY}, ${GOLD} 30%, ${GOLD} 70%, ${DARK_NAVY})`, flexShrink: 0 }} />;
}

function TaglineBar({ issueNumber, pubDate }: { issueNumber: number; pubDate: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 24px', background: '#f5f5f0', borderBottom: '1px solid #ddd', flexShrink: 0 }}>
      <span style={{ fontSize: 11, color: '#555', fontFamily: 'Roboto, sans-serif' }}>
        Số {issueNumber} — {viDate(new Date(pubDate + 'T00:00:00'))}
      </span>
      <span style={{ fontSize: 11, color: '#555', fontStyle: 'italic', fontFamily: 'Roboto, sans-serif' }}>{PAPER_SUBTITLE}</span>
      <span style={{ fontSize: 11, color: NAVY, fontWeight: 700, fontFamily: 'Roboto, sans-serif' }}>{WEBSITE}</span>
    </div>
  );
}

function SrovWatermark() {
  return (
    <div style={{
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%) rotate(-30deg)',
      fontSize: 320, fontWeight: 900, color: NAVY,
      opacity: 0.03, pointerEvents: 'none', zIndex: 0,
      fontFamily: 'Oswald, Arial', letterSpacing: 20, userSelect: 'none',
      whiteSpace: 'nowrap',
    }}>SROV</div>
  );
}

function ArticleCard({ post, headlineSize = 22, excerptLen = 180, showThumb = true, thumbH = 200, borderRight = false, borderBottom = false }: {
  post: Post; headlineSize?: number; excerptLen?: number; showThumb?: boolean; thumbH?: number; borderRight?: boolean; borderBottom?: boolean;
}) {
  return (
    <div style={{
      padding: '14px 16px',
      borderRight: borderRight ? `1px solid #ccc` : 'none',
      borderBottom: borderBottom ? `1px solid #ddd` : 'none',
      display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden',
      position: 'relative', zIndex: 1,
    }}>
      {showThumb && post.thumbnail && (
        <div style={{ width: '100%', height: thumbH, overflow: 'hidden', flexShrink: 0, borderRadius: 2 }}>
          <img
            src={post.thumbnail}
            alt=""
            crossOrigin="anonymous"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: headlineSize, fontWeight: 900, color: '#111', lineHeight: 1.25, letterSpacing: -0.3 }}>
        {post.title}
      </div>
      {post.author_name && (
        <div style={{ fontSize: 11, color: NAVY, fontWeight: 700, fontFamily: 'Roboto, sans-serif', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          ✦ {post.author_name}  •  {fmtDate(post.published_at || post.created_at || '')}
        </div>
      )}
      <div style={{ fontSize: 13.5, color: '#333', lineHeight: 1.75, fontFamily: "'Roboto', sans-serif" }}>
        {excpt(post.content || '', excerptLen)}
      </div>
    </div>
  );
}

function NewspaperPage1({ articles, issueNumber, pubDate }: NpProps) {
  const [a1, a2, a3, a4, a5] = articles;
  return (
    <div style={{ width: PAGE_W, height: PAGE_H, background: '#fafaf7', position: 'relative', display: 'flex', flexDirection: 'column', fontFamily: 'Roboto, sans-serif', overflow: 'hidden' }}>
      <SrovWatermark />
      <PaperHeader issueNumber={issueNumber} pubDate={pubDate} />
      <GoldLine />
      <TaglineBar issueNumber={issueNumber} pubDate={pubDate} />

      {/* Red label bar */}
      <div style={{ padding: '4px 24px', background: '#cc0000', flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: '#fff', fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Oswald, Arial' }}>Tin tức nổi bật tuần này</span>
      </div>

      {/* Main content: top 3 articles */}
      <div style={{ flex: '0 0 820px', display: 'flex', borderBottom: '2px solid #bbb', position: 'relative', zIndex: 1 }}>
        {/* Article 1 - large left */}
        <div style={{ flex: '0 0 62%', borderRight: '1px solid #ccc' }}>
          <ArticleCard post={a1} headlineSize={26} excerptLen={300} showThumb thumbH={260} />
        </div>
        {/* Right column: articles 2 + 3 */}
        <div style={{ flex: '0 0 38%', display: 'flex', flexDirection: 'column' }}>
          {a2 && (
            <div style={{ flex: '0 0 50%', borderBottom: '1px solid #ddd' }}>
              <ArticleCard post={a2} headlineSize={17} excerptLen={130} showThumb thumbH={130} />
            </div>
          )}
          {a3 && (
            <div style={{ flex: '0 0 50%' }}>
              <ArticleCard post={a3} headlineSize={17} excerptLen={130} showThumb={false} />
            </div>
          )}
        </div>
      </div>

      {/* Red section label */}
      <div style={{ padding: '4px 24px', background: DARK_NAVY, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: GOLD, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Oswald, Arial' }}>Tiếp tục trong số này</span>
      </div>

      {/* Bottom 2 articles */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
        {a4 && (
          <div style={{ flex: '0 0 50%', borderRight: '1px solid #ccc' }}>
            <ArticleCard post={a4} headlineSize={18} excerptLen={200} showThumb thumbH={160} />
          </div>
        )}
        {a5 && (
          <div style={{ flex: '0 0 50%' }}>
            <ArticleCard post={a5} headlineSize={18} excerptLen={200} showThumb thumbH={160} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ height: 38, background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: 'Roboto, sans-serif' }}>© {new Date().getFullYear()} Báo Hải Quân SROV — Trang 1/2</span>
        <span style={{ fontSize: 11, color: GOLD, fontWeight: 700, fontFamily: 'Oswald, Arial', letterSpacing: 1 }}>{WEBSITE}</span>
      </div>
    </div>
  );
}

function NewspaperPage2({ articles, issueNumber, pubDate }: NpProps) {
  const [, , , a4, a5] = articles;
  const art4 = articles[3];
  const art5 = articles[4];
  return (
    <div style={{ width: PAGE_W, height: PAGE_H, background: '#fafaf7', position: 'relative', display: 'flex', flexDirection: 'column', fontFamily: 'Roboto, sans-serif', overflow: 'hidden' }}>
      <SrovWatermark />
      <PaperHeader issueNumber={issueNumber} pubDate={pubDate} mini />
      <GoldLine />

      {/* Continuation label */}
      <div style={{ padding: '5px 24px', background: '#cc0000', flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: '#fff', fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Oswald, Arial' }}>Tiếp theo — Trang 2</span>
      </div>

      {/* 2 large articles */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
        {art4 && (
          <div style={{ flex: '0 0 50%', display: 'flex', borderBottom: '2px solid #bbb' }}>
            {art4.thumbnail && (
              <div style={{ flex: '0 0 340px', overflow: 'hidden' }}>
                <img src={art4.thumbnail} alt="" crossOrigin="anonymous"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
            <div style={{ flex: 1, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10, borderLeft: '1px solid #ddd', position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 11, color: '#cc0000', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Oswald, Arial' }}>Bài viết đặc biệt</div>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 900, color: '#111', lineHeight: 1.2 }}>{art4.title}</div>
              {art4.author_name && (
                <div style={{ fontSize: 12, color: NAVY, fontWeight: 700, fontFamily: 'Roboto, sans-serif' }}>✦ {art4.author_name}  •  {fmtDate(art4.published_at || art4.created_at || '')}</div>
              )}
              <div style={{ fontSize: 14, color: '#333', lineHeight: 1.8, fontFamily: 'Roboto, sans-serif' }}>{excpt(art4.content || '', 400)}</div>
            </div>
          </div>
        )}
        {art5 && (
          <div style={{ flex: '0 0 50%', display: 'flex' }}>
            {art5.thumbnail && (
              <div style={{ flex: '0 0 340px', overflow: 'hidden' }}>
                <img src={art5.thumbnail} alt="" crossOrigin="anonymous"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
            <div style={{ flex: 1, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10, borderLeft: '1px solid #ddd', position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 11, color: DARK_NAVY, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Oswald, Arial' }}>Tin trong tuần</div>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 900, color: '#111', lineHeight: 1.2 }}>{art5.title}</div>
              {art5.author_name && (
                <div style={{ fontSize: 12, color: NAVY, fontWeight: 700, fontFamily: 'Roboto, sans-serif' }}>✦ {art5.author_name}  •  {fmtDate(art5.published_at || art5.created_at || '')}</div>
              )}
              <div style={{ fontSize: 14, color: '#333', lineHeight: 1.8, fontFamily: 'Roboto, sans-serif' }}>{excpt(art5.content || '', 400)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom info band */}
      <div style={{ padding: '10px 24px', background: '#f0f0eb', borderTop: '2px solid #bbb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#666', fontFamily: 'Roboto, sans-serif' }}>Toà soạn: Hải quân nhân dân Việt Nam</span>
          <span style={{ fontSize: 11, color: '#666', fontFamily: 'Roboto, sans-serif' }}>Email: toasoan@haiquan-srov.vn</span>
        </div>
        <div style={{ width: 60, height: 3, background: GOLD }} />
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#666', fontFamily: 'Roboto, sans-serif' }}>Website: {WEBSITE}</span>
          <span style={{ fontSize: 11, color: '#666', fontFamily: 'Roboto, sans-serif' }}>Giấy phép BVHTT: số 1234/GP-BVHTT</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ height: 38, background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: 'Roboto, sans-serif' }}>© {new Date().getFullYear()} Báo Hải Quân SROV — Trang 2/2</span>
        <span style={{ fontSize: 11, color: GOLD, fontWeight: 700, fontFamily: 'Oswald, Arial', letterSpacing: 1 }}>{WEBSITE}</span>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function AdminBaoInCuoiTuan() {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [selected, setSelected] = useState<Post[]>([]);
  const [issueNumber, setIssueNumber] = useState(1);
  const [pubDate, setPubDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [tab, setTab] = useState<'p1' | 'p2'>('p1');

  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: posts }, { data: setting }] = await Promise.all([
        supabase
          .from('posts')
          .select('id, title, thumbnail, content, author_name, published_at, created_at, slug, category_id, post_type')
          .eq('status', 'published')
          .not('post_type', 'in', '("baoin","video","audio","photo_story","podcast")')
          .order('published_at', { ascending: false })
          .limit(30),
        supabase.from('settings').select('value').eq('key', SETTING_KEY).maybeSingle(),
      ]);
      const postList = (posts as Post[]) || [];
      setAllPosts(postList);
      if (postList.length > 0) setSelected(postList.slice(0, 5));
      const num = setting?.value ? parseInt(setting.value) : 1;
      setIssueNumber(isNaN(num) ? 1 : num);
      setLoading(false);
    })();
  }, []);

  const filteredPosts = allPosts.filter(p =>
    !searchQ || p.title.toLowerCase().includes(searchQ.toLowerCase())
  );

  const isSelected = (id: number) => selected.some(p => (p as any).id === id);

  const toggleSelect = (post: Post) => {
    const id = (post as any).id;
    if (isSelected(id)) {
      setSelected(prev => prev.filter(p => (p as any).id !== id));
    } else {
      if (selected.length >= 5) return;
      setSelected(prev => [...prev, post]);
    }
  };

  const moveSelected = (idx: number, dir: -1 | 1) => {
    setSelected(prev => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const generatePDF = useCallback(async () => {
    if (selected.length < 5) { alert('Vui lòng chọn đúng 5 bài viết'); return; }
    if (!page1Ref.current || !page2Ref.current) return;
    setGenerating(true);
    setProgress('Đang khởi tạo...');
    try {
      const [html2canvas, { default: jsPDF }] = await Promise.all([
        import('html2canvas').then(m => m.default),
        import('jspdf'),
      ]);

      setProgress('Đang chụp trang 1...');
      const canvas1 = await html2canvas(page1Ref.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#fafaf7',
        width: PAGE_W,
        height: PAGE_H,
        logging: false,
      });

      setProgress('Đang chụp trang 2...');
      const canvas2 = await html2canvas(page2Ref.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#fafaf7',
        width: PAGE_W,
        height: PAGE_H,
        logging: false,
      });

      setProgress('Đang tạo PDF...');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a3' });
      pdf.addImage(canvas1.toDataURL('image/jpeg', 0.93), 'JPEG', 0, 0, 297, 420);
      pdf.addPage();
      pdf.addImage(canvas2.toDataURL('image/jpeg', 0.93), 'JPEG', 0, 0, 297, 420);

      const dateStr = pubDate.replace(/-/g, '');
      pdf.save(`BaoHaiQuan-SROV-CuoiTuan-So${issueNumber}-${dateStr}.pdf`);

      setProgress('Đang lưu số báo...');
      await supabase.from('settings').upsert({ key: SETTING_KEY, value: String(issueNumber + 1) });
      setIssueNumber(prev => prev + 1);
      setProgress('');
    } catch (err: any) {
      alert('Lỗi tạo PDF: ' + (err?.message || err));
      setProgress('');
    } finally {
      setGenerating(false);
    }
  }, [selected, issueNumber, pubDate]);

  const canGenerate = selected.length === 5 && !generating;
  const previewArticles = selected.length === 5 ? selected : [...selected, ...Array(5 - selected.length).fill(null)].map((p, i) => p || { id: -i, title: `[Chưa chọn bài ${i + 1}]`, content: '', thumbnail: '', author_name: '', published_at: '', created_at: '', slug: '', post_type: 'article', status: 'published', category_id: 0 } as Post);

  return (
    <AdminLayout title="Báo In Cuối Tuần">
      {/* Hidden capture divs - off-screen */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1, pointerEvents: 'none' }}>
        <div ref={page1Ref} style={{ width: PAGE_W, height: PAGE_H }}>
          <NewspaperPage1 articles={previewArticles} issueNumber={issueNumber} pubDate={pubDate} />
        </div>
        <div ref={page2Ref} style={{ width: PAGE_W, height: PAGE_H }}>
          <NewspaperPage2 articles={previewArticles} issueNumber={issueNumber} pubDate={pubDate} />
        </div>
      </div>

      <div className="max-w-7xl">
        {/* Page header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-[22px] font-bold text-[#0059b2]">Báo In Cuối Tuần</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">Tự động tổng hợp 5 bài báo, tạo báo in 2 trang định dạng A3 — Báo Hải Quân SROV Cuối tuần</p>
          </div>
          <button
            onClick={generatePDF}
            disabled={!canGenerate}
            className="flex items-center gap-2 bg-[#0059b2] hover:bg-[#004494] disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold text-[14px] transition shadow-sm"
          >
            {generating ? <Spinner /> : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            {generating ? progress || 'Đang tạo...' : 'Xuất PDF'}
          </button>
        </div>

        <div className="flex gap-5 items-start">
          {/* LEFT: settings + article selector */}
          <div className="flex-shrink-0 w-[340px] flex flex-col gap-4">
            {/* Settings card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3">
              <p className="text-[13px] font-bold text-[#0059b2] uppercase tracking-wider">Thông tin số báo</p>
              <div>
                <label className="block text-[12px] font-bold text-gray-500 mb-1">Số báo</label>
                <input
                  type="number"
                  min={1}
                  value={issueNumber}
                  onChange={e => setIssueNumber(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[14px] font-bold text-[#0059b2] focus:outline-none focus:ring-2 focus:ring-[#0059b2]/30"
                />
                <p className="text-[11px] text-gray-400 mt-1">Tự động +1 sau khi xuất PDF</p>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-gray-500 mb-1">Ngày đăng</label>
                <input
                  type="date"
                  value={pubDate}
                  onChange={e => setPubDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0059b2]/30"
                />
              </div>
            </div>

            {/* Selected articles */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-bold text-[#0059b2] uppercase tracking-wider">Bài đã chọn</p>
                <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${selected.length === 5 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {selected.length}/5
                </span>
              </div>
              {selected.length === 0 ? (
                <p className="text-[12px] text-gray-400 text-center py-4">Chọn bài từ danh sách bên dưới</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {selected.map((post, idx) => (
                    <div key={(post as any).id} className="flex items-center gap-2 p-2 bg-blue-50/60 rounded-lg border border-blue-100">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#0059b2] text-white text-[10px] font-bold flex items-center justify-center">{idx + 1}</span>
                      <span className="flex-1 text-[12px] font-semibold text-gray-800 line-clamp-1">{post.title}</span>
                      <div className="flex flex-col gap-0.5 flex-shrink-0">
                        <button onClick={() => moveSelected(idx, -1)} disabled={idx === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 leading-none">▲</button>
                        <button onClick={() => moveSelected(idx, 1)} disabled={idx === selected.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 leading-none">▼</button>
                      </div>
                      <button onClick={() => toggleSelect(post)} className="text-red-300 hover:text-red-500 flex-shrink-0 text-[16px] leading-none">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Article list */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-[13px] font-bold text-[#0059b2] uppercase tracking-wider mb-3">Chọn bài viết</p>
              <input
                type="text"
                placeholder="Tìm kiếm bài..."
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] mb-3 focus:outline-none focus:ring-2 focus:ring-[#0059b2]/30"
              />
              {loading ? (
                <div className="flex justify-center py-6"><Spinner /></div>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-[420px] overflow-y-auto pr-1">
                  {filteredPosts.map(post => {
                    const sel = isSelected((post as any).id);
                    const disabled = !sel && selected.length >= 5;
                    return (
                      <button
                        key={(post as any).id}
                        onClick={() => !disabled && toggleSelect(post)}
                        disabled={disabled}
                        className={`flex items-start gap-2 p-2.5 rounded-lg border text-left transition w-full ${
                          sel
                            ? 'bg-blue-50 border-[#0059b2]/40 text-[#0059b2]'
                            : disabled
                            ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                            : 'bg-white border-gray-100 hover:border-[#0059b2]/40 hover:bg-blue-50/40'
                        }`}
                      >
                        {post.thumbnail && (
                          <img src={post.thumbnail} alt="" className="w-10 h-10 object-cover rounded flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold line-clamp-2 leading-snug">{post.title}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{fmtDate(post.published_at || post.created_at || '')}</p>
                        </div>
                        {sel && <span className="text-[#0059b2] text-[16px] flex-shrink-0">✓</span>}
                      </button>
                    );
                  })}
                  {filteredPosts.length === 0 && (
                    <p className="text-[12px] text-gray-400 text-center py-4">Không tìm thấy bài</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: newspaper preview */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              {/* Page tabs */}
              <div className="flex items-center gap-3 mb-4">
                <p className="text-[13px] font-bold text-[#0059b2] uppercase tracking-wider mr-2">Xem trước</p>
                <button
                  onClick={() => setTab('p1')}
                  className={`px-4 py-1.5 rounded-lg text-[12px] font-bold border transition ${tab === 'p1' ? 'bg-[#0059b2] text-white border-[#0059b2]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#0059b2]/50'}`}
                >
                  Trang 1
                </button>
                <button
                  onClick={() => setTab('p2')}
                  className={`px-4 py-1.5 rounded-lg text-[12px] font-bold border transition ${tab === 'p2' ? 'bg-[#0059b2] text-white border-[#0059b2]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#0059b2]/50'}`}
                >
                  Trang 2
                </button>
                <span className="ml-auto text-[11px] text-gray-400">Khổ A3 — Thu nhỏ để xem trước</span>
              </div>

              {/* Preview container */}
              <div
                className="overflow-hidden rounded-lg border border-gray-200 shadow-inner bg-gray-100 flex items-center justify-center"
                style={{ width: '100%', height: Math.round(PAGE_H * SCALE) + 8 }}
              >
                <div style={{ width: PAGE_W * SCALE, height: PAGE_H * SCALE, overflow: 'hidden', borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.18)', flexShrink: 0 }}>
                  <div style={{ width: PAGE_W, height: PAGE_H, transform: `scale(${SCALE})`, transformOrigin: 'top left' }}>
                    {tab === 'p1' ? (
                      <NewspaperPage1 articles={previewArticles} issueNumber={issueNumber} pubDate={pubDate} />
                    ) : (
                      <NewspaperPage2 articles={previewArticles} issueNumber={issueNumber} pubDate={pubDate} />
                    )}
                  </div>
                </div>
              </div>

              {/* Generate info */}
              {selected.length < 5 && (
                <p className="text-[12px] text-amber-600 font-semibold text-center mt-3">
                  ⚠ Cần chọn đủ 5 bài để xuất PDF — đã chọn {selected.length}/5
                </p>
              )}
              {selected.length === 5 && !generating && (
                <p className="text-[12px] text-green-600 font-semibold text-center mt-3">
                  ✓ Sẵn sàng xuất PDF — nhấn nút "Xuất PDF" để tạo báo in
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
