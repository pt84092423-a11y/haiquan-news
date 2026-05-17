import { useState, useEffect, useRef, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import { supabase } from '@/lib/supabase';
import type { Post } from '@/lib/supabase';
import logoUrl from '@assets/logo_haiquan.png';

const PAPER_NAME = 'HẢI QUÂN VIỆT NAM';
const PAPER_SUBTITLE = 'CƠ QUAN CỦA ĐẢNG ỦY VÀ BỘ TƯ LỆNH QUÂN CHỦNG HẢI QUÂN';
const PAPER_SLOGAN = 'CHIẾN ĐẤU ANH DŨNG, MƯU TRÍ SÁNG TẠO — LÀM CHỦ VÙNG BIỂN, CHIẾN ĐẤU QUYẾT THẮNG';
const PAPER_ADDR = 'Trụ sở: Số 36, Phường Cam Ranh, Tỉnh Khánh Hoà — Hộp thư điện tử: toasoan@haiquan-srov.vn';
const WEBSITE = 'haiquan-srov.vn';
const SETTING_KEY = 'weekend_paper_issue';

const NAVY = '#003380';
const RED = '#cc0000';
const GOLD = '#c8a800';
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
  if (!ds) return '';
  const d = new Date(ds);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

interface NpProps {
  articles: Post[];
  issueNumber: number;
  pubDate: string;
}

function Img({ src, h, style }: { src?: string; h: number; style?: React.CSSProperties }) {
  if (!src) return null;
  return (
    <div style={{ width: '100%', height: h, overflow: 'hidden', flexShrink: 0, ...style }}>
      <img
        src={src}
        alt=""
        crossOrigin="anonymous"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    </div>
  );
}

function Rule({ color = '#999', thick = 1 }: { color?: string; thick?: number }) {
  return <div style={{ width: '100%', height: thick, background: color, flexShrink: 0 }} />;
}

function PaperHeader({ issueNumber, pubDate }: { issueNumber: number; pubDate: string }) {
  const dateObj = new Date(pubDate + 'T00:00:00');
  const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";
  const SANS = 'Roboto, Arial, sans-serif';

  return (
    <div style={{ width: '100%', flexShrink: 0, background: '#fff' }}>
      {/* Top slogan strip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 18px', background: '#f5f5f0', borderBottom: '1px solid #ccc' }}>
        <span style={{ fontStyle: 'italic', fontSize: 9.5, color: '#555', fontFamily: SANS, flex: 1, letterSpacing: 0.2 }}>
          {PAPER_SLOGAN}
        </span>
        <div style={{ flexShrink: 0, textAlign: 'right', marginLeft: 16 }}>
          <div style={{ fontSize: 9, color: '#444', fontFamily: SANS, fontWeight: 700, lineHeight: 1.4 }}>
            RA THỨ HAI HẰNG TUẦN
          </div>
        </div>
      </div>

      {/* Main masthead */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 18px', gap: 14, minHeight: 108 }}>
        {/* Logo */}
        <div style={{ flexShrink: 0 }}>
          <img src={logoUrl} alt="Logo" style={{ height: 84, width: 'auto', display: 'block' }} />
        </div>

        {/* Center: paper name */}
        <div style={{ flex: 1, textAlign: 'center', borderLeft: '1px solid #bbb', borderRight: '1px solid #bbb', padding: '6px 14px' }}>
          <div style={{
            fontFamily: SERIF,
            fontSize: 58,
            fontWeight: 900,
            color: RED,
            letterSpacing: 5,
            lineHeight: 1,
            textTransform: 'uppercase',
          }}>
            {PAPER_NAME}
          </div>
          <div style={{ fontFamily: SANS, fontSize: 10.5, color: NAVY, fontWeight: 700, letterSpacing: 2, marginTop: 5, textTransform: 'uppercase' }}>
            {PAPER_SUBTITLE}
          </div>
        </div>

        {/* Right: issue number & date */}
        <div style={{ flexShrink: 0, textAlign: 'center', width: 108 }}>
          <div style={{ fontSize: 10, color: '#444', fontFamily: SANS, fontWeight: 700, lineHeight: 1.5, textTransform: 'uppercase' }}>SỐ</div>
          <div style={{ fontSize: 28, color: NAVY, fontFamily: SANS, fontWeight: 900, lineHeight: 1 }}>{issueNumber}</div>
          <div style={{ fontSize: 16, color: GOLD, letterSpacing: 3, margin: '3px 0' }}>★ ★ ★</div>
          <div style={{ fontSize: 9.5, color: '#333', fontFamily: SANS, fontWeight: 700, lineHeight: 1.5 }}>
            NGÀY {String(dateObj.getDate()).padStart(2, '0')}/{String(dateObj.getMonth() + 1).padStart(2, '0')}/{dateObj.getFullYear()}
          </div>
        </div>
      </div>

      {/* Address bar */}
      <div style={{ background: NAVY, color: 'rgba(255,255,255,0.82)', fontSize: 9.5, padding: '4px 18px', fontFamily: SANS, letterSpacing: 0.3 }}>
        {PAPER_ADDR}
      </div>

      {/* Double rule */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '3px 0', background: '#fff' }}>
        <Rule color="#555" thick={2} />
        <Rule color="#999" thick={1} />
      </div>
    </div>
  );
}

function PageBand({ pageNum, issueNumber, pubDate, section }: { pageNum: number; issueNumber: number; pubDate: string; section?: string }) {
  const d = new Date(pubDate + 'T00:00:00');
  const dateStr = `SỐ ${issueNumber} - NGÀY ${String(d.getDate()).padStart(2, '0')} THÁNG ${String(d.getMonth() + 1).padStart(2, '0')} NĂM ${d.getFullYear()}`;
  const SANS = 'Roboto, Arial, sans-serif';
  const isEven = pageNum % 2 === 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '4px 16px', borderBottom: '2px solid #777', background: '#fff', flexShrink: 0, fontSize: 10, fontFamily: SANS }}>
      {isEven ? (
        <>
          <span style={{ fontWeight: 900, color: '#111', marginRight: 8 }}>{pageNum} — Hải quân Việt Nam</span>
          <div style={{ width: 1, height: 12, background: '#999', margin: '0 8px' }} />
          <span style={{ flex: 1, textAlign: 'center', textTransform: 'uppercase', fontWeight: 700, color: NAVY, letterSpacing: 1 }}>{section || 'TIN TỨC - SỰ KIỆN'}</span>
          <div style={{ width: 1, height: 12, background: '#999', margin: '0 8px' }} />
          <span style={{ color: '#555' }}>{dateStr}</span>
        </>
      ) : (
        <>
          <span style={{ color: '#555', marginRight: 8 }}>{dateStr}</span>
          <div style={{ width: 1, height: 12, background: '#999', margin: '0 8px' }} />
          <span style={{ flex: 1, textAlign: 'center', textTransform: 'uppercase', fontWeight: 700, color: NAVY, letterSpacing: 1 }}>{section || 'TIN TỨC - SỰ KIỆN'}</span>
          <div style={{ width: 1, height: 12, background: '#999', margin: '0 8px' }} />
          <span style={{ fontWeight: 900, color: '#111' }}>Hải quân Việt Nam — {pageNum}</span>
        </>
      )}
    </div>
  );
}

function SectionBanner({ label, bg = NAVY, color = GOLD }: { label: string; bg?: string; color?: string }) {
  return (
    <div style={{ background: bg, padding: '5px 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: 11, color, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', fontFamily: 'Roboto, Arial, sans-serif' }}>
        ★  {label}  ★
      </span>
    </div>
  );
}

function ColRule() {
  return <div style={{ width: 1, background: '#ccc', flexShrink: 0, alignSelf: 'stretch' }} />;
}

function NewspaperPage1({ articles, issueNumber, pubDate }: NpProps) {
  const [a1, a2, a3, a4, a5] = articles;
  const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";
  const SANS = 'Roboto, Arial, sans-serif';

  return (
    <div style={{ width: PAGE_W, height: PAGE_H, background: '#fff', position: 'relative', display: 'flex', flexDirection: 'column', fontFamily: SANS, overflow: 'hidden' }}>
      {/* Masthead */}
      <PaperHeader issueNumber={issueNumber} pubDate={pubDate} />

      {/* Today's date strip */}
      <div style={{ padding: '3px 18px', background: '#f5f5f0', borderBottom: '1px solid #ddd', fontSize: 9.5, color: '#666', fontFamily: SANS, flexShrink: 0 }}>
        {viDate(new Date(pubDate + 'T00:00:00'))}
      </div>

      {/* TOP CONTENT: 3 columns */}
      <div style={{ flex: '0 0 700px', display: 'flex', borderBottom: '2px solid #777', overflow: 'hidden' }}>
        {/* Col A: left feature */}
        <div style={{ flex: '0 0 27%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {a1 && (
            <>
              <div style={{ background: RED, color: '#fff', fontSize: 9, fontWeight: 900, padding: '3px 12px', letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: SANS, flexShrink: 0 }}>
                TIN TỨC - SỰ KIỆN
              </div>
              <Img src={a1.thumbnail} h={168} />
              <div style={{ padding: '9px 12px', flex: 1, overflow: 'hidden' }}>
                <div style={{ fontFamily: SERIF, fontSize: 14.5, fontWeight: 900, color: '#111', lineHeight: 1.3, marginBottom: 6 }}>{a1.title}</div>
                {a1.author_name && (
                  <div style={{ fontSize: 8.5, color: RED, fontWeight: 700, textTransform: 'uppercase', marginBottom: 5, fontFamily: SANS }}>
                    {a1.author_name}
                  </div>
                )}
                <div style={{ fontSize: 10.5, color: '#333', lineHeight: 1.7 }}>{excpt(a1.content || '', 280)}</div>
                {a1.published_at && (
                  <div style={{ fontSize: 8.5, color: '#888', fontStyle: 'italic', marginTop: 6, fontFamily: SANS }}>{fmtDate(a1.published_at)}</div>
                )}
              </div>
            </>
          )}
        </div>

        <ColRule />

        {/* Col B: center big feature */}
        <div style={{ flex: '0 0 46%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {a2 && (
            <>
              <Img src={a2.thumbnail} h={260} />
              <div style={{ padding: '10px 14px', flex: 1, overflow: 'hidden' }}>
                <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 900, color: '#111', lineHeight: 1.25, marginBottom: 6 }}>{a2.title}</div>
                {a2.author_name && (
                  <div style={{ fontSize: 9, color: RED, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, fontFamily: SANS }}>
                    {a2.author_name}
                  </div>
                )}
                <div style={{ fontSize: 11.5, color: '#222', lineHeight: 1.75 }}>{excpt(a2.content || '', 360)}</div>
                {a2.published_at && (
                  <div style={{ fontSize: 8.5, color: '#888', fontStyle: 'italic', marginTop: 6, fontFamily: SANS }}>{fmtDate(a2.published_at)}</div>
                )}
              </div>
            </>
          )}
        </div>

        <ColRule />

        {/* Col C: right */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {a3 && (
            <>
              <Img src={a3.thumbnail} h={148} />
              <div style={{ padding: '9px 12px', flex: 1, overflow: 'hidden', borderBottom: '1px solid #ddd' }}>
                <div style={{ fontFamily: SERIF, fontSize: 13.5, fontWeight: 900, color: '#111', lineHeight: 1.3, marginBottom: 5 }}>{a3.title}</div>
                {a3.author_name && (
                  <div style={{ fontSize: 8.5, color: RED, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4, fontFamily: SANS }}>
                    {a3.author_name}
                  </div>
                )}
                <div style={{ fontSize: 10.5, color: '#333', lineHeight: 1.65 }}>{excpt(a3.content || '', 240)}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Section banner */}
      <SectionBanner label="NHỮNG BÔNG HOA BIỂN" />

      {/* BOTTOM CONTENT: 2 columns */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Bottom left: long article */}
        <div style={{ flex: '0 0 58%', padding: '11px 14px', overflow: 'hidden' }}>
          {a4 && (
            <>
              <div style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 900, color: '#111', lineHeight: 1.25, marginBottom: 5 }}>{a4.title}</div>
              {a4.author_name && (
                <div style={{ fontSize: 9, color: RED, fontWeight: 700, textTransform: 'uppercase', marginBottom: 7, fontFamily: SANS }}>
                  {a4.author_name}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, overflow: 'hidden' }}>
                {a4.thumbnail && (
                  <div style={{ flex: '0 0 172px', height: 128, overflow: 'hidden', borderRadius: 1 }}>
                    <img src={a4.thumbnail} alt="" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
                <div style={{ flex: 1, fontSize: 11.5, color: '#222', lineHeight: 1.75 }}>{excpt(a4.content || '', 400)}</div>
              </div>
              {a4.published_at && (
                <div style={{ fontSize: 8.5, color: '#888', fontStyle: 'italic', marginTop: 6, fontFamily: SANS }}>{fmtDate(a4.published_at)}</div>
              )}
            </>
          )}
        </div>

        <ColRule />

        {/* Bottom right: sidebar */}
        <div style={{ flex: 1, padding: '11px 12px', overflow: 'hidden' }}>
          {a5 && (
            <>
              <div style={{ background: RED, color: '#fff', fontSize: 9, fontWeight: 900, padding: '3px 8px', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, fontFamily: SANS }}>
                TIN TRONG NƯỚC
              </div>
              <Img src={a5.thumbnail} h={118} style={{ marginBottom: 8, borderRadius: 1 }} />
              <div style={{ fontFamily: SERIF, fontSize: 13, fontWeight: 900, color: '#111', lineHeight: 1.25, marginBottom: 5 }}>{a5.title}</div>
              {a5.author_name && (
                <div style={{ fontSize: 8.5, color: RED, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4, fontFamily: SANS }}>
                  {a5.author_name}
                </div>
              )}
              <div style={{ fontSize: 10.5, color: '#333', lineHeight: 1.65 }}>{excpt(a5.content || '', 200)}</div>
              {a5.published_at && (
                <div style={{ fontSize: 8.5, color: '#888', fontStyle: 'italic', marginTop: 5, fontFamily: SANS }}>{fmtDate(a5.published_at)}</div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ height: 30, background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', flexShrink: 0 }}>
        <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.75)', fontFamily: SANS }}>© Báo Hải Quân Việt Nam — Số {issueNumber}</span>
        <span style={{ fontSize: 9.5, color: GOLD, fontFamily: SANS, fontWeight: 700 }}>{WEBSITE}</span>
      </div>
    </div>
  );
}

function NewspaperPage2({ articles, issueNumber, pubDate }: NpProps) {
  const [a1, a2, a3, a4, a5] = articles;
  const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";
  const SANS = 'Roboto, Arial, sans-serif';

  return (
    <div style={{ width: PAGE_W, height: PAGE_H, background: '#fff', position: 'relative', display: 'flex', flexDirection: 'column', fontFamily: SANS, overflow: 'hidden' }}>
      {/* Page band */}
      <PageBand pageNum={2} issueNumber={issueNumber} pubDate={pubDate} section="TIN TỨC - SỰ KIỆN" />

      {/* 3-column content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Col 1 */}
        <div style={{ flex: '0 0 33.33%', padding: '11px 13px', overflow: 'hidden', borderRight: '1px solid #ccc' }}>
          {a1 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 900, color: '#111', lineHeight: 1.3, marginBottom: 5 }}>{a1.title}</div>
              {a1.author_name && (
                <div style={{ fontSize: 8.5, color: RED, fontWeight: 700, textTransform: 'uppercase', marginBottom: 5, fontFamily: SANS }}>
                  Tác giả: {a1.author_name}
                </div>
              )}
              <Img src={a1.thumbnail} h={168} style={{ marginBottom: 7, borderRadius: 1 }} />
              <div style={{ fontSize: 11, color: '#222', lineHeight: 1.8 }}>{excpt(a1.content || '', 520)}</div>
              {a1.published_at && (
                <div style={{ fontSize: 8.5, color: '#888', fontStyle: 'italic', marginTop: 6, textAlign: 'right', fontFamily: SANS }}>{fmtDate(a1.published_at)}</div>
              )}
            </div>
          )}
        </div>

        <ColRule />

        {/* Col 2 */}
        <div style={{ flex: '0 0 33.33%', padding: '11px 13px', overflow: 'hidden', borderRight: '1px solid #ccc' }}>
          {a2 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ background: NAVY, color: '#fff', padding: '4px 8px', fontSize: 8.5, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, fontFamily: SANS }}>
                HỌC TẬP VÀ LÀM THEO TƯ TƯỞNG, ĐẠO ĐỨC HỒ CHÍ MINH
              </div>
              <div style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 900, color: '#111', lineHeight: 1.3, marginBottom: 6 }}>{a2.title}</div>
              {a2.author_name && (
                <div style={{ fontSize: 8.5, color: RED, fontWeight: 700, textTransform: 'uppercase', marginBottom: 5, fontFamily: SANS }}>
                  Tác giả: {a2.author_name}
                </div>
              )}
              <Img src={a2.thumbnail} h={168} style={{ marginBottom: 7, borderRadius: 1 }} />
              <div style={{ fontSize: 11, color: '#222', lineHeight: 1.8 }}>{excpt(a2.content || '', 460)}</div>
              {a2.published_at && (
                <div style={{ fontSize: 8.5, color: '#888', fontStyle: 'italic', marginTop: 6, textAlign: 'right', fontFamily: SANS }}>{fmtDate(a2.published_at)}</div>
              )}
            </div>
          )}
          {a3 && (
            <div style={{ borderTop: '1px solid #ddd', paddingTop: 10 }}>
              <div style={{ fontFamily: SERIF, fontSize: 13.5, fontWeight: 900, color: '#111', lineHeight: 1.3, marginBottom: 5 }}>{a3.title}</div>
              {a3.author_name && (
                <div style={{ fontSize: 8.5, color: RED, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4, fontFamily: SANS }}>
                  Tác giả: {a3.author_name}
                </div>
              )}
              <div style={{ fontSize: 11, color: '#222', lineHeight: 1.8 }}>{excpt(a3.content || '', 280)}</div>
            </div>
          )}
        </div>

        <ColRule />

        {/* Col 3 */}
        <div style={{ flex: 1, padding: '11px 13px', overflow: 'hidden' }}>
          {a4 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 900, color: '#111', lineHeight: 1.3, marginBottom: 5 }}>{a4.title}</div>
              {a4.author_name && (
                <div style={{ fontSize: 8.5, color: RED, fontWeight: 700, textTransform: 'uppercase', marginBottom: 5, fontFamily: SANS }}>
                  Tác giả: {a4.author_name}
                </div>
              )}
              <Img src={a4.thumbnail} h={148} style={{ marginBottom: 7, borderRadius: 1 }} />
              <div style={{ fontSize: 11, color: '#222', lineHeight: 1.8 }}>{excpt(a4.content || '', 360)}</div>
              {a4.published_at && (
                <div style={{ fontSize: 8.5, color: '#888', fontStyle: 'italic', marginTop: 5, textAlign: 'right', fontFamily: SANS }}>{fmtDate(a4.published_at)}</div>
              )}
            </div>
          )}
          {a5 && (
            <div style={{ borderTop: '1px solid #ddd', paddingTop: 10 }}>
              <div style={{ fontFamily: SERIF, fontSize: 13.5, fontWeight: 900, color: '#111', lineHeight: 1.3, marginBottom: 5 }}>{a5.title}</div>
              {a5.author_name && (
                <div style={{ fontSize: 8.5, color: RED, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4, fontFamily: SANS }}>
                  Tác giả: {a5.author_name}
                </div>
              )}
              <div style={{ fontSize: 11, color: '#222', lineHeight: 1.8 }}>{excpt(a5.content || '', 240)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ height: 30, background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', flexShrink: 0 }}>
        <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.75)', fontFamily: SANS }}>© Báo Hải Quân Việt Nam — Trang 2</span>
        <span style={{ fontSize: 9.5, color: GOLD, fontFamily: SANS, fontWeight: 700 }}>{WEBSITE}</span>
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
      try {
        const [{ data: posts, error: postsError }, { data: setting }] = await Promise.all([
          supabase
            .from('posts')
            .select('id, title, thumbnail, content, author_name, published_at, created_at, slug, category_id, post_type, status')
            .in('post_type', ['article', 'longform'])
            .order('created_at', { ascending: false })
            .limit(100),
          supabase.from('settings').select('value').eq('key', SETTING_KEY).maybeSingle(),
        ]);

        if (postsError) {
          console.error('Posts query error:', postsError);
        }

        const postList = (posts as Post[]) || [];
        setAllPosts(postList);
        if (postList.length > 0) setSelected(postList.slice(0, 5));

        const num = setting?.value ? parseInt(setting.value) : 1;
        setIssueNumber(isNaN(num) ? 1 : num);
      } catch (err) {
        console.error('Load error:', err);
      } finally {
        setLoading(false);
      }
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
        scale: 2, useCORS: true, allowTaint: true,
        backgroundColor: '#ffffff', width: PAGE_W, height: PAGE_H, logging: false,
      });

      setProgress('Đang chụp trang 2...');
      const canvas2 = await html2canvas(page2Ref.current, {
        scale: 2, useCORS: true, allowTaint: true,
        backgroundColor: '#ffffff', width: PAGE_W, height: PAGE_H, logging: false,
      });

      setProgress('Đang tạo PDF...');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a3' });
      pdf.addImage(canvas1.toDataURL('image/jpeg', 0.93), 'JPEG', 0, 0, 297, 420);
      pdf.addPage();
      pdf.addImage(canvas2.toDataURL('image/jpeg', 0.93), 'JPEG', 0, 0, 297, 420);

      const dateStr = pubDate.replace(/-/g, '');
      pdf.save(`BaoHaiQuan-So${issueNumber}-${dateStr}.pdf`);

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
  const placeholder = (i: number): Post => ({
    id: -i as any, title: `[Chưa chọn bài ${i + 1}]`,
    content: '', thumbnail: '', author_name: '',
    published_at: '', created_at: '', slug: '',
    post_type: 'article', status: 'published', category_id: 0 as any,
  });
  const previewArticles = selected.length === 5
    ? selected
    : Array.from({ length: 5 }, (_, i) => selected[i] || placeholder(i + 1));

  return (
    <AdminLayout title="Báo In Hải Quân">
      {/* Hidden capture divs */}
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
            <h1 className="text-[22px] font-bold text-[#003380]">Báo In Hải Quân Việt Nam</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">Chọn 5 bài viết, tạo báo in 2 trang A3 — Hải Quân Việt Nam</p>
          </div>
          <button
            onClick={generatePDF}
            disabled={!canGenerate}
            className="flex items-center gap-2 bg-[#003380] hover:bg-[#002260] disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold text-[14px] transition shadow-sm"
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
            {/* Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3">
              <p className="text-[13px] font-bold text-[#003380] uppercase tracking-wider">Thông tin số báo</p>
              <div>
                <label className="block text-[12px] font-bold text-gray-500 mb-1">Số báo</label>
                <input
                  type="number" min={1} value={issueNumber}
                  onChange={e => setIssueNumber(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[14px] font-bold text-[#003380] focus:outline-none focus:ring-2 focus:ring-[#003380]/30"
                />
                <p className="text-[11px] text-gray-400 mt-1">Tự động +1 sau khi xuất PDF</p>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-gray-500 mb-1">Ngày đăng</label>
                <input
                  type="date" value={pubDate}
                  onChange={e => setPubDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#003380]/30"
                />
              </div>
            </div>

            {/* Selected articles */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-bold text-[#003380] uppercase tracking-wider">Bài đã chọn</p>
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
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#003380] text-white text-[10px] font-bold flex items-center justify-center">{idx + 1}</span>
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
              <p className="text-[13px] font-bold text-[#003380] uppercase tracking-wider mb-3">Chọn bài viết</p>
              <input
                type="text" placeholder="Tìm kiếm bài..."
                value={searchQ} onChange={e => setSearchQ(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] mb-3 focus:outline-none focus:ring-2 focus:ring-[#003380]/30"
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
                          sel ? 'bg-blue-50 border-[#003380]/40 text-[#003380]'
                            : disabled ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                            : 'bg-white border-gray-100 hover:border-[#003380]/40 hover:bg-blue-50/40'
                        }`}
                      >
                        {post.thumbnail && (
                          <img src={post.thumbnail} alt="" className="w-10 h-10 object-cover rounded flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold line-clamp-2 leading-snug">{post.title}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{fmtDate(post.published_at || post.created_at || '')}</p>
                        </div>
                        {sel && <span className="text-[#003380] text-[16px] flex-shrink-0">✓</span>}
                      </button>
                    );
                  })}
                  {filteredPosts.length === 0 && !loading && (
                    <p className="text-[12px] text-gray-400 text-center py-4">
                      {allPosts.length === 0 ? 'Chưa có bài viết nào được đăng' : 'Không tìm thấy bài phù hợp'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: newspaper preview */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-3 mb-4">
                <p className="text-[13px] font-bold text-[#003380] uppercase tracking-wider mr-2">Xem trước</p>
                <button
                  onClick={() => setTab('p1')}
                  className={`px-4 py-1.5 rounded-lg text-[12px] font-bold border transition ${tab === 'p1' ? 'bg-[#003380] text-white border-[#003380]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#003380]/50'}`}
                >
                  Trang 1 (Bìa)
                </button>
                <button
                  onClick={() => setTab('p2')}
                  className={`px-4 py-1.5 rounded-lg text-[12px] font-bold border transition ${tab === 'p2' ? 'bg-[#003380] text-white border-[#003380]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#003380]/50'}`}
                >
                  Trang 2 (Nội dung)
                </button>
                <span className="ml-auto text-[11px] text-gray-400">Khổ A3 — Thu nhỏ để xem trước</span>
              </div>

              <div
                className="overflow-hidden rounded-lg border border-gray-200 shadow-inner bg-gray-100 flex items-center justify-center"
                style={{ width: '100%', height: Math.round(PAGE_H * SCALE) + 8 }}
              >
                <div style={{ width: PAGE_W * SCALE, height: PAGE_H * SCALE, overflow: 'hidden', borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.2)', flexShrink: 0 }}>
                  <div style={{ width: PAGE_W, height: PAGE_H, transform: `scale(${SCALE})`, transformOrigin: 'top left' }}>
                    {tab === 'p1'
                      ? <NewspaperPage1 articles={previewArticles} issueNumber={issueNumber} pubDate={pubDate} />
                      : <NewspaperPage2 articles={previewArticles} issueNumber={issueNumber} pubDate={pubDate} />
                    }
                  </div>
                </div>
              </div>

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
