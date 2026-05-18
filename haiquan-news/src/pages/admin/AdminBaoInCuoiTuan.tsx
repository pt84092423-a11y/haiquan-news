import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import { supabase, uploadImage } from '@/lib/supabase';
import type { Post } from '@/lib/supabase';
import logoUrl from '@assets/logo_haiquan.png';

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════ */
const PAPER_NAME = 'HẢI QUÂN VIỆT NAM';
const PAPER_SUBTITLE = 'CƠ QUAN CỦA ĐẢNG ỦY VÀ BỘ TƯ LỆNH QUÂN CHỦNG HẢI QUÂN';
const PAPER_SLOGAN = 'CHIẾN ĐẤU ANH DŨNG, MƯU TRÍ SÁNG TẠO — LÀM CHỦ VÙNG BIỂN, CHIẾN ĐẤU QUYẾT THẮNG';
const PAPER_ADDR = 'Trụ sở: Số 36, Phường Cam Ranh, Tỉnh Khánh Hoà';
const WEBSITE = 'haiquan-srov.vn';
const SETTING_KEY = 'weekend_paper_issue';
const NAVY = '#003380'; const RED = '#cc0000'; const GOLD = '#c8a800';
const PAGE_W = 1122; const PAGE_H = 1587; const SCALE = 0.42;
const MAX_ARTICLES = 12;

export type LayoutType = 1 | 2 | 3 | 4 | 5;

const LAYOUTS: { id: LayoutType; name: string; sub: string; p1Count: number; cols: number[] }[] = [
  { id: 1, name: 'Cổ Điển',    sub: '3 cột + Gợi ý đọc',    p1Count: 5, cols: [27, 46, 27] },
  { id: 2, name: 'Đặc San',    sub: 'Hero trái + ngăn phải', p1Count: 5, cols: [55, 45] },
  { id: 3, name: 'Tạp Chí',    sub: 'Hero trên + 3 cột',     p1Count: 4, cols: [100, 33, 33, 33] },
  { id: 4, name: 'Phóng Sự',   sub: 'Ảnh toàn trang + 2 cột',p1Count: 3, cols: [100, 50, 50] },
  { id: 5, name: 'Chuyên Đề',  sub: '4 cột đều nhau',        p1Count: 4, cols: [25, 25, 25, 25] },
];

/* ═══════════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════════ */
function stripHtml(html: string) {
  try { const d = document.createElement('div'); d.innerHTML = html || ''; return (d.textContent || d.innerText || '').replace(/\s+/g, ' ').trim(); }
  catch { return ''; }
}
function excpt(c: string, len: number) {
  const t = stripHtml(c); return t.length <= len ? t : t.slice(0, len).replace(/\s+\S*$/, '') + '…';
}
function viDate(d: Date) {
  const days = ['Chủ nhật','Thứ hai','Thứ ba','Thứ tư','Thứ năm','Thứ sáu','Thứ bảy'];
  return `${days[d.getDay()]}, ngày ${dd(d.getDate())} tháng ${dd(d.getMonth()+1)} năm ${d.getFullYear()}`;
}
function dd(n: number) { return String(n).padStart(2,'0'); }
function fmtDate(ds: string) { if (!ds) return ''; const d = new Date(ds); return `${dd(d.getDate())}/${dd(d.getMonth()+1)}/${d.getFullYear()}`; }
function auth(a: Post) { return (a as any).author || ''; }

/* ═══════════════════════════════════════════════════════════
   SHARED COMPONENTS
═══════════════════════════════════════════════════════════ */
function Img({ src, h, bw, style }: { src?: string; h: number; bw?: boolean; style?: React.CSSProperties }) {
  if (!src) return null;
  return (
    <div style={{ width: '100%', height: h, overflow: 'hidden', flexShrink: 0, ...style }}>
      <img src={src} alt="" crossOrigin="anonymous"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: bw ? 'grayscale(1) contrast(1.08)' : undefined }}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
    </div>
  );
}
function ColRule({ bw }: { bw?: boolean }) {
  return <div style={{ width: 1, background: bw ? '#888' : '#ccc', flexShrink: 0, alignSelf: 'stretch' }} />;
}
function HRule({ thick = 1, color = '#ccc' }: { thick?: number; color?: string }) {
  return <div style={{ width: '100%', height: thick, background: color, flexShrink: 0 }} />;
}

function PaperHeader({ issueNumber, pubDate }: { issueNumber: number; pubDate: string }) {
  const d = new Date(pubDate + 'T00:00:00');
  const SERIF = "'Playfair Display', Georgia, serif";
  const SANS = 'Roboto, Arial, sans-serif';
  return (
    <div style={{ width: '100%', flexShrink: 0, background: '#fff' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 18px', background:'#f5f5f0', borderBottom:'1px solid #ccc' }}>
        <span style={{ fontStyle:'italic', fontSize:9.5, color:'#555', fontFamily:SANS, flex:1 }}>{PAPER_SLOGAN}</span>
        <span style={{ fontSize:9, color:'#444', fontFamily:SANS, fontWeight:700, marginLeft:16 }}>RA THỨ HAI HẰNG TUẦN</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', padding:'10px 18px', gap:14, minHeight:106 }}>
        <div style={{ flexShrink:0 }}><img src={logoUrl} alt="" style={{ height:82, width:'auto', display:'block' }} /></div>
        <div style={{ flex:1, textAlign:'center', borderLeft:'1px solid #bbb', borderRight:'1px solid #bbb', padding:'6px 14px' }}>
          <div style={{ fontFamily:SERIF, fontSize:46, fontWeight:900, color:RED, letterSpacing:5, lineHeight:1, textTransform:'uppercase', whiteSpace:'nowrap' }}>{PAPER_NAME}</div>
          <div style={{ fontFamily:SANS, fontSize:9.5, color:NAVY, fontWeight:700, letterSpacing:1.5, marginTop:6, textTransform:'uppercase' }}>{PAPER_SUBTITLE}</div>
        </div>
        <div style={{ flexShrink:0, textAlign:'center', width:108 }}>
          <div style={{ fontSize:10, color:'#444', fontFamily:SANS, fontWeight:700, textTransform:'uppercase' }}>SỐ</div>
          <div style={{ fontSize:28, color:NAVY, fontFamily:SANS, fontWeight:900, lineHeight:1 }}>{issueNumber}</div>
          <div style={{ fontSize:15, color:GOLD, letterSpacing:3, margin:'3px 0' }}>★ ★ ★</div>
          <div style={{ fontSize:9.5, color:'#333', fontFamily:SANS, fontWeight:700 }}>NGÀY {dd(d.getDate())}/{dd(d.getMonth()+1)}/{d.getFullYear()}</div>
        </div>
      </div>
      <div style={{ background:NAVY, color:'rgba(255,255,255,0.85)', fontSize:9.5, padding:'4px 18px', fontFamily:SANS }}>{PAPER_ADDR}</div>
      <div style={{ display:'flex', flexDirection:'column', gap:2, padding:'3px 0' }}>
        <HRule thick={2} color="#444" /><HRule thick={1} color="#aaa" />
      </div>
    </div>
  );
}

function ColorPageBand({ pageNum, issueNumber, pubDate, section }: { pageNum: number; issueNumber: number; pubDate: string; section?: string }) {
  const d = new Date(pubDate + 'T00:00:00');
  const ds = `SỐ ${issueNumber} — NGÀY ${dd(d.getDate())} THÁNG ${dd(d.getMonth()+1)} NĂM ${d.getFullYear()}`;
  const SANS = 'Roboto, Arial, sans-serif';
  return (
    <div style={{ display:'flex', alignItems:'center', padding:'4px 16px', borderBottom:'2px solid #666', background:'#fff', flexShrink:0, fontSize:10, fontFamily:SANS }}>
      <span style={{ color:'#555', marginRight:8 }}>{ds}</span>
      <div style={{ width:1, height:12, background:'#999', margin:'0 8px' }} />
      <span style={{ flex:1, textAlign:'center', textTransform:'uppercase', fontWeight:700, color:NAVY, letterSpacing:1 }}>{section || 'TIN TỨC - SỰ KIỆN'}</span>
      <div style={{ width:1, height:12, background:'#999', margin:'0 8px' }} />
      <span style={{ fontWeight:900, color:'#111' }}>Hải quân Việt Nam — {pageNum}</span>
    </div>
  );
}

function BWPageBand({ pageNum, issueNumber, pubDate, section }: { pageNum: number; issueNumber: number; pubDate: string; section?: string }) {
  const d = new Date(pubDate + 'T00:00:00');
  const ds = `SỐ ${issueNumber} — NGÀY ${dd(d.getDate())} THÁNG ${dd(d.getMonth()+1)} NĂM ${d.getFullYear()}`;
  const SANS = 'Roboto, Arial, sans-serif';
  return (
    <div style={{ display:'flex', alignItems:'center', padding:'5px 16px', background:'#111', flexShrink:0, fontSize:10, fontFamily:SANS }}>
      <span style={{ color:'#ccc', marginRight:8 }}>{ds}</span>
      <div style={{ width:1, height:12, background:'#555', margin:'0 8px' }} />
      <span style={{ flex:1, textAlign:'center', textTransform:'uppercase', fontWeight:700, color:'#fff', letterSpacing:1.5 }}>{section || 'TIN TỨC - SỰ KIỆN'}</span>
      <div style={{ width:1, height:12, background:'#555', margin:'0 8px' }} />
      <span style={{ fontWeight:900, color:'#fff' }}>Hải quân Việt Nam — {pageNum}</span>
    </div>
  );
}

function SectionBanner({ label, bg=NAVY, color=GOLD }: { label:string; bg?:string; color?:string }) {
  const SANS = 'Roboto, Arial, sans-serif';
  return (
    <div style={{ background:bg, padding:'4px 18px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <span style={{ fontSize:10.5, color, fontWeight:900, letterSpacing:3, textTransform:'uppercase', fontFamily:SANS }}>★  {label}  ★</span>
    </div>
  );
}

function ColorFooter({ issueNumber, page }: { issueNumber: number; page: number }) {
  const SANS = 'Roboto, Arial, sans-serif';
  return (
    <div style={{ height:28, background:NAVY, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 18px', flexShrink:0 }}>
      <span style={{ fontSize:9.5, color:'rgba(255,255,255,0.75)', fontFamily:SANS }}>© Báo Hải Quân Việt Nam — Số {issueNumber} — Trang {page}</span>
      <span style={{ fontSize:9.5, color:GOLD, fontFamily:SANS, fontWeight:700 }}>{WEBSITE}</span>
    </div>
  );
}

function BWFooter({ issueNumber, page }: { issueNumber: number; page: number }) {
  const SANS = 'Roboto, Arial, sans-serif';
  return (
    <div style={{ height:28, background:'#111', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 18px', flexShrink:0 }}>
      <span style={{ fontSize:9.5, color:'#aaa', fontFamily:SANS }}>© Báo Hải Quân Việt Nam — Số {issueNumber} — Trang {page}</span>
      <span style={{ fontSize:9.5, color:'#ddd', fontFamily:SANS, fontWeight:700 }}>{WEBSITE}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ARTICLE CARD COMPONENTS
═══════════════════════════════════════════════════════════ */
interface ArticleCardProps { art: Post; imgH?: number; titleSize?: number; contentLen?: number; bw?: boolean; label?: string; }

function ArticleCard({ art, imgH=140, titleSize=14, contentLen=280, bw=false, label }: ArticleCardProps) {
  const SERIF = "'Playfair Display', Georgia, serif";
  const SANS = 'Roboto, Arial, sans-serif';
  const accent = bw ? '#222' : RED;
  return (
    <div style={{ display:'flex', flexDirection:'column', overflow:'hidden', flex:1 }}>
      {label && <div style={{ background: bw ? '#222' : RED, color:'#fff', fontSize:8.5, fontWeight:900, padding:'3px 10px', letterSpacing:1.5, textTransform:'uppercase', fontFamily:SANS, flexShrink:0 }}>{label}</div>}
      {art.thumbnail && <Img src={art.thumbnail} h={imgH} bw={bw} />}
      <div style={{ padding:'8px 12px', flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
        <div style={{ fontFamily:SERIF, fontSize:titleSize, fontWeight:900, color:'#111', lineHeight:1.28, marginBottom:4, flexShrink:0 }}>{art.title}</div>
        {auth(art) && <div style={{ fontSize:8.5, color:accent, fontWeight:700, textTransform:'uppercase', marginBottom:4, fontFamily:SANS, flexShrink:0 }}>{auth(art)}</div>}
        <div style={{ flex:1, fontSize:10.5, color: bw ? '#111' : '#333', lineHeight:1.72, overflow:'hidden' }}>{excpt(art.content||'', contentLen)}</div>
        {art.published_at && <div style={{ fontSize:8.5, color:'#888', fontStyle:'italic', marginTop:4, fontFamily:SANS, flexShrink:0 }}>{fmtDate(art.published_at)}</div>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   BHB SECTION (shared across layouts)
═══════════════════════════════════════════════════════════ */
function BHBSection({ bhbText, bhbImg, a4, a5 }: { bhbText?: string; bhbImg?: string; a4?: Post; a5?: Post }) {
  const SERIF = "'Playfair Display', Georgia, serif";
  const SANS = 'Roboto, Arial, sans-serif';
  return (
    <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
      {/* Left: compact BHB */}
      <div style={{ flex:'0 0 30%', padding:'10px 12px', overflow:'hidden', borderRight:'1px solid #ccc', display:'flex', flexDirection:'column', gap:8 }}>
        {bhbImg && (
          <div style={{ width:'100%', height:110, overflow:'hidden', borderRadius:2, flexShrink:0 }}>
            <img src={bhbImg} alt="" crossOrigin="anonymous" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{(e.target as HTMLImageElement).style.display='none';}} />
          </div>
        )}
        <div style={{ fontSize:10, fontWeight:900, color:NAVY, textTransform:'uppercase', letterSpacing:1, fontFamily:SANS, borderBottom:`1px solid ${NAVY}`, paddingBottom:4, flexShrink:0 }}>✦ Bông Hoa Biển</div>
        <div style={{ flex:1, fontSize:10.5, color:'#222', lineHeight:1.8, fontFamily:SANS, overflow:'hidden', whiteSpace:'pre-wrap' }}>
          {bhbText || <span style={{ color:'#aaa', fontStyle:'italic' }}>Nội dung ban biên tập soạn...</span>}
        </div>
      </div>
      {/* Right: 2 suggestion boxes */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {[a4, a5].map((art, i) => art && (
          <div key={i} style={{ flex:1, display:'flex', overflow:'hidden', borderBottom: i===0 ? '1px solid #ddd' : 'none' }}>
            {art.thumbnail && (
              <div style={{ flex:'0 0 150px', overflow:'hidden', flexShrink:0 }}>
                <img src={art.thumbnail} alt="" crossOrigin="anonymous" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{(e.target as HTMLImageElement).style.display='none';}} />
              </div>
            )}
            <div style={{ flex:1, padding:'10px 13px', overflow:'hidden', display:'flex', flexDirection:'column' }}>
              <div style={{ fontSize:8.5, color:RED, fontWeight:900, textTransform:'uppercase', letterSpacing:1, fontFamily:SANS, marginBottom:4, flexShrink:0 }}>★ GỢI Ý ĐỌC BÀI {i+1}</div>
              <div style={{ fontFamily:SERIF, fontSize:14, fontWeight:900, color:'#111', lineHeight:1.28, marginBottom:4, flexShrink:0 }}>{art.title}</div>
              {auth(art) && <div style={{ fontSize:8.5, color:RED, fontWeight:700, textTransform:'uppercase', fontFamily:SANS, marginBottom:4, flexShrink:0 }}>{auth(art)}</div>}
              <div style={{ flex:1, fontSize:10.5, color:'#333', lineHeight:1.72, overflow:'hidden' }}>{excpt(art.content||'', 260)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE 1 — LAYOUT 1: CỔ ĐIỂN (Classic 3-col)
═══════════════════════════════════════════════════════════ */
function P1_Classic({ arts, issueNumber, pubDate, bhbText, bhbImg }: { arts: Post[]; issueNumber: number; pubDate: string; bhbText?: string; bhbImg?: string }) {
  const [a1,a2,a3,a4,a5] = arts;
  const SERIF = "'Playfair Display', Georgia, serif";
  const SANS = 'Roboto, Arial, sans-serif';
  return (
    <div style={{ width:PAGE_W, height:PAGE_H, background:'#fff', display:'flex', flexDirection:'column', overflow:'hidden', fontFamily:SANS }}>
      <PaperHeader issueNumber={issueNumber} pubDate={pubDate} />
      <div style={{ padding:'3px 18px', background:'#f5f5f0', borderBottom:'1px solid #ddd', fontSize:9.5, color:'#666', fontFamily:SANS, flexShrink:0 }}>{viDate(new Date(pubDate+'T00:00:00'))}</div>

      {/* 3-col main */}
      <div style={{ flex:'0 0 640px', display:'flex', borderBottom:'2px solid #666', overflow:'hidden' }}>
        <div style={{ flex:'0 0 27%', display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {a1 && <>
            <div style={{ background:RED, color:'#fff', fontSize:8.5, fontWeight:900, padding:'3px 12px', letterSpacing:1.5, textTransform:'uppercase', fontFamily:SANS, flexShrink:0 }}>TIN TỨC - SỰ KIỆN</div>
            <Img src={a1.thumbnail} h={230} />
            <div style={{ padding:'8px 12px', flex:1, overflow:'hidden' }}>
              <div style={{ fontFamily:SERIF, fontSize:14.5, fontWeight:900, color:'#111', lineHeight:1.28, marginBottom:5 }}>{a1.title}</div>
              {auth(a1) && <div style={{ fontSize:8.5, color:RED, fontWeight:700, textTransform:'uppercase', marginBottom:4, fontFamily:SANS }}>{auth(a1)}</div>}
              <div style={{ fontSize:10.5, color:'#333', lineHeight:1.7 }}>{excpt(a1.content||'',230)}</div>
              {a1.published_at && <div style={{ fontSize:8.5, color:'#888', fontStyle:'italic', marginTop:5, fontFamily:SANS }}>{fmtDate(a1.published_at)}</div>}
            </div>
          </>}
        </div>
        <ColRule />
        <div style={{ flex:'0 0 46%', display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {a2 && <>
            <Img src={a2.thumbnail} h={350} />
            <div style={{ padding:'10px 14px', flex:1, overflow:'hidden' }}>
              <div style={{ fontFamily:SERIF, fontSize:20, fontWeight:900, color:'#111', lineHeight:1.22, marginBottom:5 }}>{a2.title}</div>
              {auth(a2) && <div style={{ fontSize:9, color:RED, fontWeight:700, textTransform:'uppercase', marginBottom:5, fontFamily:SANS }}>{auth(a2)}</div>}
              <div style={{ fontSize:11, color:'#222', lineHeight:1.75 }}>{excpt(a2.content||'',270)}</div>
            </div>
          </>}
        </div>
        <ColRule />
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {a3 && <>
            <Img src={a3.thumbnail} h={155} />
            <div style={{ padding:'8px 12px', flex:1, overflow:'hidden' }}>
              <div style={{ fontFamily:SERIF, fontSize:13.5, fontWeight:900, color:'#111', lineHeight:1.28, marginBottom:4 }}>{a3.title}</div>
              {auth(a3) && <div style={{ fontSize:8.5, color:RED, fontWeight:700, textTransform:'uppercase', marginBottom:4, fontFamily:SANS }}>{auth(a3)}</div>}
              <div style={{ fontSize:10.5, color:'#333', lineHeight:1.65 }}>{excpt(a3.content||'',210)}</div>
            </div>
          </>}
        </div>
      </div>

      <SectionBanner label="NHỮNG BÔNG HOA BIỂN" />
      <BHBSection bhbText={bhbText} bhbImg={bhbImg} a4={a4} a5={a5} />
      <ColorFooter issueNumber={issueNumber} page={1} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE 1 — LAYOUT 2: ĐẶC SAN (Special Edition)
═══════════════════════════════════════════════════════════ */
function P1_Special({ arts, issueNumber, pubDate, bhbText, bhbImg }: { arts: Post[]; issueNumber: number; pubDate: string; bhbText?: string; bhbImg?: string }) {
  const [a1,a2,a3,a4,a5] = arts;
  const SERIF = "'Playfair Display', Georgia, serif";
  const SANS = 'Roboto, Arial, sans-serif';
  return (
    <div style={{ width:PAGE_W, height:PAGE_H, background:'#fff', display:'flex', flexDirection:'column', overflow:'hidden', fontFamily:SANS }}>
      <PaperHeader issueNumber={issueNumber} pubDate={pubDate} />
      <div style={{ padding:'3px 18px', background:'#f5f5f0', borderBottom:'1px solid #ddd', fontSize:9.5, color:'#666', fontFamily:SANS, flexShrink:0 }}>{viDate(new Date(pubDate+'T00:00:00'))}</div>

      <div style={{ flex:'0 0 640px', display:'flex', borderBottom:'2px solid #666', overflow:'hidden' }}>
        {/* Big left hero */}
        <div style={{ flex:'0 0 57%', display:'flex', flexDirection:'column', overflow:'hidden', borderRight:'1px solid #ccc' }}>
          {a1 && <>
            <Img src={a1.thumbnail} h={390} />
            <div style={{ padding:'10px 14px', flex:1, overflow:'hidden', borderTop:`3px solid ${RED}` }}>
              <div style={{ fontFamily:SERIF, fontSize:21, fontWeight:900, color:'#111', lineHeight:1.2, marginBottom:6 }}>{a1.title}</div>
              {auth(a1) && <div style={{ fontSize:9, color:RED, fontWeight:700, textTransform:'uppercase', marginBottom:5, fontFamily:SANS }}>{auth(a1)}</div>}
              <div style={{ fontSize:11, color:'#222', lineHeight:1.75 }}>{excpt(a1.content||'',240)}</div>
            </div>
          </>}
        </div>
        {/* Right stack */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {a2 && (
            <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', borderBottom:'1px solid #ddd' }}>
              <Img src={a2.thumbnail} h={180} />
              <div style={{ padding:'8px 12px', flex:1, overflow:'hidden' }}>
                <div style={{ fontFamily:SERIF, fontSize:14, fontWeight:900, color:'#111', lineHeight:1.28, marginBottom:4 }}>{a2.title}</div>
                {auth(a2) && <div style={{ fontSize:8.5, color:RED, fontWeight:700, textTransform:'uppercase', marginBottom:4, fontFamily:SANS }}>{auth(a2)}</div>}
                <div style={{ fontSize:10.5, color:'#333', lineHeight:1.65 }}>{excpt(a2.content||'',170)}</div>
              </div>
            </div>
          )}
          {a3 && (
            <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
              <Img src={a3.thumbnail} h={180} />
              <div style={{ padding:'8px 12px', flex:1, overflow:'hidden' }}>
                <div style={{ fontFamily:SERIF, fontSize:13.5, fontWeight:900, color:'#111', lineHeight:1.28, marginBottom:4 }}>{a3.title}</div>
                {auth(a3) && <div style={{ fontSize:8.5, color:RED, fontWeight:700, textTransform:'uppercase', marginBottom:4, fontFamily:SANS }}>{auth(a3)}</div>}
                <div style={{ fontSize:10.5, color:'#333', lineHeight:1.65 }}>{excpt(a3.content||'',160)}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <SectionBanner label="NHỮNG BÔNG HOA BIỂN" />
      <BHBSection bhbText={bhbText} bhbImg={bhbImg} a4={a4} a5={a5} />
      <ColorFooter issueNumber={issueNumber} page={1} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE 1 — LAYOUT 3: TẠP CHÍ (Magazine: full hero + 3 col)
═══════════════════════════════════════════════════════════ */
function P1_Magazine({ arts, issueNumber, pubDate, bhbText, bhbImg }: { arts: Post[]; issueNumber: number; pubDate: string; bhbText?: string; bhbImg?: string }) {
  const [a1,a2,a3,a4] = arts;
  const SERIF = "'Playfair Display', Georgia, serif";
  const SANS = 'Roboto, Arial, sans-serif';
  return (
    <div style={{ width:PAGE_W, height:PAGE_H, background:'#fff', display:'flex', flexDirection:'column', overflow:'hidden', fontFamily:SANS }}>
      <PaperHeader issueNumber={issueNumber} pubDate={pubDate} />
      <div style={{ padding:'3px 18px', background:'#f5f5f0', borderBottom:'1px solid #ddd', fontSize:9.5, color:'#666', fontFamily:SANS, flexShrink:0 }}>{viDate(new Date(pubDate+'T00:00:00'))}</div>

      {/* Full-width hero with text overlay */}
      {a1 && (
        <div style={{ flex:'0 0 380px', position:'relative', overflow:'hidden', flexShrink:0, borderBottom:`3px solid ${RED}` }}>
          {a1.thumbnail && (
            <img src={a1.thumbnail} alt="" crossOrigin="anonymous"
              style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
              onError={e=>{(e.target as HTMLImageElement).style.display='none';}} />
          )}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(transparent, rgba(0,0,0,0.85))', padding:'40px 22px 18px' }}>
            <div style={{ display:'inline-block', background:RED, color:'#fff', fontSize:8.5, fontWeight:900, padding:'2px 8px', letterSpacing:1.5, textTransform:'uppercase', fontFamily:SANS, marginBottom:8 }}>TIN NỔI BẬT</div>
            <div style={{ fontFamily:SERIF, fontSize:24, fontWeight:900, color:'#fff', lineHeight:1.22, textShadow:'0 2px 4px rgba(0,0,0,0.5)' }}>{a1.title}</div>
            {auth(a1) && <div style={{ fontSize:9, color:'rgba(255,255,255,0.8)', fontWeight:700, textTransform:'uppercase', marginTop:6, fontFamily:SANS }}>{auth(a1)}</div>}
          </div>
        </div>
      )}

      {/* 3-col below hero */}
      <div style={{ flex:'0 0 320px', display:'flex', borderBottom:'2px solid #666', overflow:'hidden' }}>
        {[a2,a3,a4].map((art,i) => art && (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', borderRight: i<2 ? '1px solid #ccc' : 'none' }}>
            <ArticleCard art={art} imgH={120} titleSize={13.5} contentLen={180} />
          </div>
        ))}
      </div>

      <SectionBanner label="NHỮNG BÔNG HOA BIỂN" />
      {/* BHB full width since no a5 */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        <div style={{ flex:'0 0 30%', padding:'10px 12px', overflow:'hidden', borderRight:'1px solid #ccc', display:'flex', flexDirection:'column', gap:8 }}>
          {bhbImg && <div style={{ width:'100%', height:110, overflow:'hidden', borderRadius:2, flexShrink:0 }}><img src={bhbImg} alt="" crossOrigin="anonymous" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{(e.target as HTMLImageElement).style.display='none';}} /></div>}
          <div style={{ fontSize:10, fontWeight:900, color:NAVY, textTransform:'uppercase', letterSpacing:1, fontFamily:'Roboto,Arial,sans-serif', borderBottom:`1px solid ${NAVY}`, paddingBottom:4, flexShrink:0 }}>✦ Bông Hoa Biển</div>
          <div style={{ flex:1, fontSize:10.5, color:'#222', lineHeight:1.8, overflow:'hidden', whiteSpace:'pre-wrap' }}>{bhbText || <span style={{ color:'#aaa', fontStyle:'italic' }}>Nội dung ban biên tập soạn...</span>}</div>
        </div>
        <div style={{ flex:1, padding:'10px 14px', overflow:'hidden' }}>
          <div style={{ fontSize:9, color:GOLD, fontWeight:900, textTransform:'uppercase', letterSpacing:2, fontFamily:'Roboto,Arial,sans-serif', marginBottom:8 }}>THÊM TRONG SỐ NÀY</div>
          <div style={{ fontSize:11.5, color:'#333', lineHeight:1.85, fontFamily:"'Playfair Display',Georgia,serif", fontStyle:'italic' }}>Tiếp tục cập nhật các tin tức, sự kiện nổi bật của Quân chủng Hải quân Việt Nam trong các trang tiếp theo của số báo này...</div>
        </div>
      </div>
      <ColorFooter issueNumber={issueNumber} page={1} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE 1 — LAYOUT 4: PHÓNG SỰ (Full-bleed photo + 2 col)
═══════════════════════════════════════════════════════════ */
function P1_Feature({ arts, issueNumber, pubDate, bhbText, bhbImg }: { arts: Post[]; issueNumber: number; pubDate: string; bhbText?: string; bhbImg?: string }) {
  const [a1,a2,a3] = arts;
  const SERIF = "'Playfair Display', Georgia, serif";
  const SANS = 'Roboto, Arial, sans-serif';
  return (
    <div style={{ width:PAGE_W, height:PAGE_H, background:'#fff', display:'flex', flexDirection:'column', overflow:'hidden', fontFamily:SANS }}>
      <PaperHeader issueNumber={issueNumber} pubDate={pubDate} />
      <div style={{ padding:'3px 18px', background:'#f5f5f0', borderBottom:'1px solid #ddd', fontSize:9.5, color:'#666', fontFamily:SANS, flexShrink:0 }}>{viDate(new Date(pubDate+'T00:00:00'))}</div>

      {/* Full-bleed hero */}
      {a1 && (
        <div style={{ flex:'0 0 500px', position:'relative', overflow:'hidden', flexShrink:0, borderBottom:`2px solid ${NAVY}` }}>
          {a1.thumbnail && (
            <img src={a1.thumbnail} alt="" crossOrigin="anonymous"
              style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
              onError={e=>{(e.target as HTMLImageElement).style.display='none';}} />
          )}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg, rgba(0,51,128,0.15) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.78) 100%)' }} />
          <div style={{ position:'absolute', top:18, left:18 }}>
            <div style={{ background:GOLD, color:NAVY, fontSize:9, fontWeight:900, padding:'3px 10px', letterSpacing:1.5, textTransform:'uppercase', fontFamily:SANS }}>PHÓNG SỰ ẢNH</div>
          </div>
          <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'60px 24px 20px' }}>
            <div style={{ fontFamily:SERIF, fontSize:28, fontWeight:900, color:'#fff', lineHeight:1.18, textShadow:'0 3px 8px rgba(0,0,0,0.7)', marginBottom:8 }}>{a1.title}</div>
            {auth(a1) && <div style={{ fontSize:9, color:GOLD, fontWeight:700, textTransform:'uppercase', fontFamily:SANS }}>{auth(a1)}</div>}
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.85)', lineHeight:1.65, marginTop:6 }}>{excpt(a1.content||'',220)}</div>
          </div>
        </div>
      )}

      {/* 2-col below */}
      <div style={{ flex:'0 0 280px', display:'flex', borderBottom:'2px solid #666', overflow:'hidden' }}>
        {[a2,a3].map((art,i) => art && (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', borderRight: i===0 ? '1px solid #ccc' : 'none' }}>
            <ArticleCard art={art} imgH={0} titleSize={15} contentLen={280} />
          </div>
        ))}
      </div>

      <SectionBanner label="NHỮNG BÔNG HOA BIỂN" />
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        <div style={{ flex:'0 0 30%', padding:'10px 12px', overflow:'hidden', borderRight:'1px solid #ccc', display:'flex', flexDirection:'column', gap:8 }}>
          {bhbImg && <div style={{ width:'100%', height:110, overflow:'hidden', borderRadius:2, flexShrink:0 }}><img src={bhbImg} alt="" crossOrigin="anonymous" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{(e.target as HTMLImageElement).style.display='none';}} /></div>}
          <div style={{ fontSize:10, fontWeight:900, color:NAVY, textTransform:'uppercase', letterSpacing:1, fontFamily:'Roboto,Arial,sans-serif', borderBottom:`1px solid ${NAVY}`, paddingBottom:4, flexShrink:0 }}>✦ Bông Hoa Biển</div>
          <div style={{ flex:1, fontSize:10.5, color:'#222', lineHeight:1.8, overflow:'hidden', whiteSpace:'pre-wrap' }}>{bhbText || <span style={{ color:'#aaa', fontStyle:'italic' }}>Nội dung ban biên tập soạn...</span>}</div>
        </div>
        <div style={{ flex:1, padding:'10px 14px', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ textAlign:'center', padding:'0 30px' }}>
            <div style={{ fontSize:9, color:'#999', textTransform:'uppercase', letterSpacing:2, fontFamily:'Roboto,Arial,sans-serif', marginBottom:10 }}>CÂU TRÍCH DẪN</div>
            <div style={{ fontFamily:SERIF, fontSize:18, color:'#111', fontStyle:'italic', lineHeight:1.6 }}>
              "Hải quân Việt Nam anh hùng — Làm chủ biển trời, chiến đấu quyết thắng"
            </div>
            <div style={{ marginTop:12 }}><div style={{ display:'inline-block', width:40, height:2, background:GOLD }} /></div>
          </div>
        </div>
      </div>
      <ColorFooter issueNumber={issueNumber} page={1} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE 1 — LAYOUT 5: CHUYÊN ĐỀ (4-col equal grid)
═══════════════════════════════════════════════════════════ */
function P1_Grid({ arts, issueNumber, pubDate, bhbText, bhbImg }: { arts: Post[]; issueNumber: number; pubDate: string; bhbText?: string; bhbImg?: string }) {
  const [a1,a2,a3,a4,a5] = arts;
  const SERIF = "'Playfair Display', Georgia, serif";
  const SANS = 'Roboto, Arial, sans-serif';
  return (
    <div style={{ width:PAGE_W, height:PAGE_H, background:'#fff', display:'flex', flexDirection:'column', overflow:'hidden', fontFamily:SANS }}>
      <PaperHeader issueNumber={issueNumber} pubDate={pubDate} />
      {/* Special topic banner */}
      <div style={{ background:`linear-gradient(135deg, ${NAVY} 0%, #005eb8 100%)`, padding:'7px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ width:60, height:2, background:GOLD }} />
        <span style={{ fontFamily:SERIF, fontSize:13, color:GOLD, fontWeight:900, letterSpacing:3, textTransform:'uppercase' }}>CHUYÊN ĐỀ TUẦN NÀY</span>
        <div style={{ width:60, height:2, background:GOLD }} />
      </div>
      <div style={{ padding:'3px 18px', background:'#f5f5f0', borderBottom:'1px solid #ddd', fontSize:9.5, color:'#666', fontFamily:SANS, flexShrink:0 }}>{viDate(new Date(pubDate+'T00:00:00'))}</div>

      {/* 4-col equal grid */}
      <div style={{ flex:'0 0 620px', display:'flex', borderBottom:'2px solid #666', overflow:'hidden' }}>
        {[a1,a2,a3,a4].map((art,i) => art && (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', borderRight: i<3 ? '1px solid #ccc' : 'none' }}>
            <div style={{ background: i===0 ? RED : i===1 ? NAVY : i===2 ? '#555' : '#333', color:'#fff', fontSize:8, fontWeight:900, padding:'3px 10px', letterSpacing:1.5, textTransform:'uppercase', fontFamily:SANS, flexShrink:0 }}>
              {['TIN NỔI BẬT','CHÍNH TRỊ','NGHIỆP VỤ','VĂN HÓA'][i]}
            </div>
            <Img src={art.thumbnail} h={195} />
            <div style={{ padding:'8px 10px', flex:1, overflow:'hidden' }}>
              <div style={{ fontFamily:SERIF, fontSize:14, fontWeight:900, color:'#111', lineHeight:1.28, marginBottom:4 }}>{art.title}</div>
              {auth(art) && <div style={{ fontSize:8.5, color:RED, fontWeight:700, textTransform:'uppercase', marginBottom:4, fontFamily:SANS }}>{auth(art)}</div>}
              <div style={{ fontSize:10.5, color:'#333', lineHeight:1.65 }}>{excpt(art.content||'',180)}</div>
            </div>
          </div>
        ))}
      </div>

      <SectionBanner label="NHỮNG BÔNG HOA BIỂN" />
      <BHBSection bhbText={bhbText} bhbImg={bhbImg} a4={a5} a5={undefined} />
      <ColorFooter issueNumber={issueNumber} page={1} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   B&W PAGE (pages 2+)
═══════════════════════════════════════════════════════════ */
function PageBW({ arts, pageNum, issueNumber, pubDate, isLast, memeUrl, chamNgon }: {
  arts: Post[]; pageNum: number; issueNumber: number; pubDate: string;
  isLast?: boolean; memeUrl?: string; chamNgon?: string;
}) {
  const SERIF = "'Playfair Display', Georgia, serif";
  const SANS = 'Roboto, Arial, sans-serif';
  const [a1,a2,a3] = arts;

  return (
    <div style={{ width:PAGE_W, height:PAGE_H, background:'#fff', display:'flex', flexDirection:'column', overflow:'hidden', fontFamily:SANS }}>
      <BWPageBand pageNum={pageNum} issueNumber={issueNumber} pubDate={pubDate} />

      {/* 3-col B&W articles */}
      <div style={{ flex:1, display:'flex', overflow:'hidden', borderBottom: isLast ? '2px solid #222' : 'none' }}>
        {[a1,a2,a3].map((art, i) => art && (
          <div key={i} style={{ flex:1, padding:'12px 13px', overflow:'hidden', display:'flex', flexDirection:'column', borderRight: i<2 ? '1px solid #bbb' : 'none' }}>
            <HRule thick={3} color="#111" />
            <div style={{ height:6 }} />
            {i===1 && (
              <div style={{ background:'#111', color:'#fff', fontSize:8.5, fontWeight:900, padding:'3px 8px', letterSpacing:1.5, textTransform:'uppercase', marginBottom:8, fontFamily:SANS, flexShrink:0 }}>
                HỌC TẬP VÀ LÀM THEO HỒ CHÍ MINH
              </div>
            )}
            <div style={{ fontFamily:SERIF, fontSize:17, fontWeight:900, color:'#000', lineHeight:1.22, marginBottom:6, flexShrink:0 }}>{art.title}</div>
            {auth(art) && <div style={{ fontSize:8.5, color:'#333', fontWeight:700, textTransform:'uppercase', marginBottom:6, fontFamily:SANS, flexShrink:0 }}>Tác giả: {auth(art)}</div>}
            <HRule thick={1} color="#bbb" />
            <div style={{ height:7 }} />
            {art.thumbnail && <Img src={art.thumbnail} h={170} bw style={{ marginBottom:8 }} />}
            <div style={{ flex:1, fontSize:11, color:'#111', lineHeight:1.8, overflow:'hidden' }}>{excpt(art.content||'', 520)}</div>
            {art.published_at && <div style={{ fontSize:8.5, color:'#666', fontStyle:'italic', marginTop:6, textAlign:'right', fontFamily:SANS, flexShrink:0 }}>{fmtDate(art.published_at)}</div>}
          </div>
        ))}
      </div>

      {/* Last page only: meme + châm ngôn */}
      {isLast && (
        <div style={{ flex:'0 0 320px', display:'flex', overflow:'hidden' }}>
          {/* Meme */}
          <div style={{ flex:'0 0 55%', padding:'10px 13px', overflow:'hidden', borderRight:'1px solid #bbb', display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, flexShrink:0 }}>
              <div style={{ flex:1, height:2, background:'#111' }} />
              <span style={{ fontSize:10.5, fontWeight:900, color:'#111', textTransform:'uppercase', letterSpacing:2, fontFamily:SANS }}>MEME OF THE WEEK</span>
              <div style={{ flex:1, height:2, background:'#111' }} />
            </div>
            {memeUrl ? (
              <div style={{ flex:1, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <img src={memeUrl} alt="Meme" crossOrigin="anonymous"
                  style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain', filter:'grayscale(1) contrast(1.05)' }}
                  onError={e=>{(e.target as HTMLImageElement).style.display='none';}} />
              </div>
            ) : (
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', border:'2px dashed #ccc', borderRadius:3 }}>
                <span style={{ color:'#bbb', fontSize:10.5, fontStyle:'italic', fontFamily:SANS }}>Chưa có ảnh meme</span>
              </div>
            )}
          </div>
          {/* Châm ngôn */}
          <div style={{ flex:1, padding:'12px 14px', overflow:'hidden', display:'flex', flexDirection:'column', justifyContent:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, flexShrink:0 }}>
              <div style={{ flex:1, height:2, background:'#111' }} />
              <span style={{ fontSize:10.5, fontWeight:900, color:'#111', textTransform:'uppercase', letterSpacing:2, fontFamily:SANS }}>CHÂM NGÔN</span>
              <div style={{ flex:1, height:2, background:'#111' }} />
            </div>
            {chamNgon ? (
              <>
                <div style={{ fontFamily:SERIF, fontSize:16, color:'#111', fontStyle:'italic', lineHeight:1.9, textAlign:'center', padding:'0 8px' }}>"{chamNgon}"</div>
                <div style={{ marginTop:12, textAlign:'center' }}><div style={{ display:'inline-block', width:40, height:2, background:'#333' }} /></div>
              </>
            ) : (
              <div style={{ textAlign:'center', color:'#bbb', fontSize:11, fontStyle:'italic', fontFamily:SANS }}>Chưa có châm ngôn...</div>
            )}
          </div>
        </div>
      )}

      <BWFooter issueNumber={issueNumber} page={pageNum} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LAYOUT HELPERS
═══════════════════════════════════════════════════════════ */
function getP1ArticleCount(layout: LayoutType): number {
  if (layout === 1 || layout === 2) return 5;
  if (layout === 3 || layout === 5) return 4;
  return 3; // layout 4
}

function buildPages(arts: Post[], layout: LayoutType): Post[][] {
  const n = getP1ArticleCount(layout);
  const remaining = arts.slice(n);
  const bwPages: Post[][] = [];
  for (let i = 0; i < remaining.length; i += 3) bwPages.push(remaining.slice(i, i+3));
  if (bwPages.length === 0) bwPages.push([]);
  return bwPages;
}

/* ═══════════════════════════════════════════════════════════
   SPINNER + UPLOAD BUTTON
═══════════════════════════════════════════════════════════ */
function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function ImgUploadBtn({ label, url, uploading, onChange }: { label:string; url:string; uploading:boolean; onChange:(f:File)=>void; }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-1.5">
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)onChange(f);e.target.value='';}} />
      <button type="button" onClick={()=>ref.current?.click()} disabled={uploading}
        className="flex items-center gap-2 border border-dashed border-gray-300 hover:border-[#003380] bg-gray-50 hover:bg-blue-50/40 text-gray-500 hover:text-[#003380] rounded-lg px-3 py-2 text-[12px] font-semibold transition w-full justify-center disabled:opacity-50">
        {uploading ? <Spinner /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>}
        {uploading ? 'Đang tải ImgBB...' : label}
      </button>
      {url && <img src={url} alt="" className="w-full h-20 object-contain rounded border border-gray-100 bg-gray-50" onError={e=>{(e.target as HTMLImageElement).style.display='none';}} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LAYOUT PICKER
═══════════════════════════════════════════════════════════ */
const LAYOUT_DIAGRAMS: Record<LayoutType, React.ReactNode> = {
  1: <div className="flex gap-0.5 h-8 items-stretch"><div className="flex-[27] bg-gray-300 rounded-sm"/><div className="flex-[46] bg-gray-400 rounded-sm"/><div className="flex-[27] bg-gray-300 rounded-sm"/></div>,
  2: <div className="flex gap-0.5 h-8 items-stretch"><div className="flex-[55] bg-gray-400 rounded-sm"/><div className="flex-[45] flex flex-col gap-0.5"><div className="flex-1 bg-gray-300 rounded-sm"/><div className="flex-1 bg-gray-300 rounded-sm"/></div></div>,
  3: <div className="flex flex-col gap-0.5 h-8"><div className="flex-[55] bg-gray-400 rounded-sm"/><div className="flex-[45] flex gap-0.5"><div className="flex-1 bg-gray-300 rounded-sm"/><div className="flex-1 bg-gray-300 rounded-sm"/><div className="flex-1 bg-gray-300 rounded-sm"/></div></div>,
  4: <div className="flex flex-col gap-0.5 h-8"><div className="flex-[55] bg-gray-400 rounded-sm"/><div className="flex-[45] flex gap-0.5"><div className="flex-1 bg-gray-300 rounded-sm"/><div className="flex-1 bg-gray-300 rounded-sm"/></div></div>,
  5: <div className="flex gap-0.5 h-8 items-stretch"><div className="flex-1 bg-gray-300 rounded-sm"/><div className="flex-1 bg-gray-300 rounded-sm"/><div className="flex-1 bg-gray-300 rounded-sm"/><div className="flex-1 bg-gray-300 rounded-sm"/></div>,
};

function LayoutPicker({ value, onChange }: { value: LayoutType; onChange: (l: LayoutType) => void }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <p className="text-[13px] font-bold text-[#003380] uppercase tracking-wider mb-3">Bố cục trang bìa</p>
      <div className="grid grid-cols-1 gap-2">
        {LAYOUTS.map(l => (
          <button key={l.id} onClick={() => onChange(l.id as LayoutType)}
            className={`flex items-center gap-3 p-2.5 rounded-lg border text-left transition ${value===l.id ? 'bg-blue-50 border-[#003380] text-[#003380]' : 'bg-white border-gray-100 hover:border-[#003380]/40 hover:bg-blue-50/30'}`}>
            <div className="flex-shrink-0 w-20">{LAYOUT_DIAGRAMS[l.id as LayoutType]}</div>
            <div>
              <div className="text-[12px] font-bold leading-tight">{l.id}. {l.name}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{l.sub} · P1 dùng {l.p1Count} bài</div>
            </div>
            {value===l.id && <span className="ml-auto text-[#003380] text-[16px]">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN ADMIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function AdminBaoInCuoiTuan() {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [selected, setSelected] = useState<Post[]>([]);
  const [issueNumber, setIssueNumber] = useState(1);
  const [pubDate, setPubDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [previewPage, setPreviewPage] = useState(0);
  const [layout, setLayout] = useState<LayoutType>(1);
  const [bhbText, setBhbText] = useState('');
  const [bhbImg, setBhbImg] = useState('');
  const [bhbUploading, setBhbUploading] = useState(false);
  const [chamNgon, setChamNgon] = useState('');
  const [memeUrl, setMemeUrl] = useState('');
  const [memeUploading, setMemeUploading] = useState(false);

  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [{ data: posts, error }, { data: setting }] = await Promise.all([
          supabase.from('posts').select('id, title, thumbnail, content, author, published_at, created_at, slug, category_id, post_type, status')
            .in('post_type', ['article', 'longform']).order('created_at', { ascending: false }).limit(100),
          supabase.from('settings').select('value').eq('key', SETTING_KEY).maybeSingle(),
        ]);
        if (error) console.error('Posts error:', error);
        const list = (posts as Post[]) || [];
        setAllPosts(list);
        if (list.length > 0) setSelected(list.slice(0, Math.min(5, list.length)));
        const num = setting?.value ? parseInt(setting.value) : 1;
        setIssueNumber(isNaN(num) ? 1 : num);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleUpload = useCallback(async (file: File, set: (u:string)=>void, setUpl:(v:boolean)=>void) => {
    if (!file.name) { set(''); return; }
    setUpl(true);
    try {
      const url = await uploadImage(file);
      if (url) set(url); else alert('Tải ảnh lên ImgBB thất bại.');
    } finally { setUpl(false); }
  }, []);

  const filteredPosts = allPosts.filter(p => !searchQ || p.title.toLowerCase().includes(searchQ.toLowerCase()));
  const isSelected = (id: number) => selected.some(p => (p as any).id === id);
  const toggleSelect = (post: Post) => {
    const id = (post as any).id;
    if (isSelected(id)) setSelected(prev => prev.filter(p => (p as any).id !== id));
    else if (selected.length < MAX_ARTICLES) setSelected(prev => [...prev, post]);
  };
  const moveSelected = (idx: number, dir: -1|1) => {
    setSelected(prev => {
      const next = [...prev]; const t = idx+dir;
      if (t<0||t>=next.length) return prev;
      [next[idx],next[t]]=[next[t],next[idx]]; return next;
    });
  };

  const bwPageGroups = useMemo(() => buildPages(selected, layout), [selected, layout]);
  const totalPages = 1 + bwPageGroups.length;
  const p1Arts = selected.slice(0, getP1ArticleCount(layout));
  const minRequired = getP1ArticleCount(layout);
  const canGenerate = selected.length >= minRequired && !generating;

  const placeholder = (i: number): Post => ({
    id: -i as any, title: `[Chọn bài ${i+1}]`, content: '', thumbnail: '', author: '' as any,
    published_at: '', created_at: '', slug: '', post_type: 'article', status: 'published', category_id: 0 as any,
  });
  const previewP1Arts = p1Arts.length >= 1 ? p1Arts : Array.from({ length: getP1ArticleCount(layout) }, (_, i) => selected[i] || placeholder(i+1));

  const generatePDF = useCallback(async () => {
    if (selected.length < minRequired) { alert(`Vui lòng chọn ít nhất ${minRequired} bài cho bố cục này.`); return; }
    setGenerating(true); setProgress('Đang khởi tạo...');
    try {
      const [html2canvas, { default: jsPDF }] = await Promise.all([
        import('html2canvas').then(m => m.default), import('jspdf'),
      ]);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a3' });
      for (let i = 0; i < totalPages; i++) {
        const el = pageRefs.current[i];
        if (!el) continue;
        setProgress(`Đang chụp trang ${i+1}/${totalPages}...`);
        const canvas = await html2canvas(el, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', width: PAGE_W, height: PAGE_H, logging: false });
        if (i > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.93), 'JPEG', 0, 0, 297, 420);
      }
      pdf.save(`BaoHaiQuan-So${issueNumber}-${pubDate.replace(/-/g,'')}.pdf`);
      setProgress('Đang lưu số báo...');
      await supabase.from('settings').upsert({ key: SETTING_KEY, value: String(issueNumber+1) });
      setIssueNumber(prev => prev+1);
      setProgress('');
    } catch (err: any) { alert('Lỗi tạo PDF: '+(err?.message||err)); setProgress(''); }
    finally { setGenerating(false); }
  }, [selected, issueNumber, pubDate, layout, totalPages, minRequired]);

  const renderPage1 = (arts: Post[]) => {
    const props = { arts, issueNumber, pubDate, bhbText, bhbImg };
    if (layout===1) return <P1_Classic {...props} />;
    if (layout===2) return <P1_Special {...props} />;
    if (layout===3) return <P1_Magazine {...props} />;
    if (layout===4) return <P1_Feature {...props} />;
    return <P1_Grid {...props} />;
  };

  return (
    <AdminLayout title="Báo In Hải Quân">
      {/* Hidden capture divs */}
      <div style={{ position:'fixed', left:'-9999px', top:0, zIndex:-1, pointerEvents:'none' }}>
        {/* Page 1 */}
        <div ref={el => { pageRefs.current[0] = el; }} style={{ width:PAGE_W, height:PAGE_H }}>
          {renderPage1(previewP1Arts)}
        </div>
        {/* B&W pages */}
        {bwPageGroups.map((pageArts, i) => (
          <div key={i} ref={el => { pageRefs.current[i+1] = el; }} style={{ width:PAGE_W, height:PAGE_H }}>
            <PageBW arts={pageArts.length ? pageArts : [placeholder(1)]}
              pageNum={i+2} issueNumber={issueNumber} pubDate={pubDate}
              isLast={i===bwPageGroups.length-1}
              memeUrl={memeUrl} chamNgon={chamNgon} />
          </div>
        ))}
      </div>

      <div className="max-w-7xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-[22px] font-bold text-[#003380]">Báo In Hải Quân Việt Nam</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">{totalPages} trang · Bố cục: {LAYOUTS.find(l=>l.id===layout)?.name} · Bài viết: {selected.length}/{MAX_ARTICLES}</p>
          </div>
          <button onClick={generatePDF} disabled={!canGenerate}
            className="flex items-center gap-2 bg-[#003380] hover:bg-[#002260] disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold text-[14px] transition shadow-sm">
            {generating ? <Spinner /> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>}
            {generating ? progress||'Đang tạo...' : `Xuất PDF (${totalPages} trang)`}
          </button>
        </div>

        <div className="flex gap-5 items-start">
          {/* LEFT */}
          <div className="flex-shrink-0 w-[340px] flex flex-col gap-4">
            <LayoutPicker value={layout} onChange={l => { setLayout(l); setPreviewPage(0); }} />

            {/* Issue info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3">
              <p className="text-[13px] font-bold text-[#003380] uppercase tracking-wider">Thông tin số báo</p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[12px] font-bold text-gray-500 mb-1">Số báo</label>
                  <input type="number" min={1} value={issueNumber}
                    onChange={e=>setIssueNumber(Math.max(1,parseInt(e.target.value)||1))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[14px] font-bold text-[#003380] focus:outline-none focus:ring-2 focus:ring-[#003380]/30" />
                </div>
                <div className="flex-1">
                  <label className="block text-[12px] font-bold text-gray-500 mb-1">Ngày đăng</label>
                  <input type="date" value={pubDate} onChange={e=>setPubDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#003380]/30" />
                </div>
              </div>
            </div>

            {/* BHB */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-2">
              <p className="text-[13px] font-bold text-[#003380] uppercase tracking-wider">✦ Những Bông Hoa Biển <span className="text-[11px] text-gray-400 normal-case font-normal">(Trang 1)</span></p>
              <ImgUploadBtn label="Tải ảnh lên ImgBB" url={bhbImg} uploading={bhbUploading} onChange={f=>handleUpload(f,setBhbImg,setBhbUploading)} />
              <textarea value={bhbText} onChange={e=>setBhbText(e.target.value)} placeholder="Nhập nội dung..." rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#003380]/30 resize-none" />
            </div>

            {/* Meme */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-2">
              <p className="text-[13px] font-bold text-[#cc0000] uppercase tracking-wider">★ Meme of the Week <span className="text-[11px] text-gray-400 normal-case font-normal">(Trang cuối)</span></p>
              <ImgUploadBtn label="Tải ảnh meme lên ImgBB" url={memeUrl} uploading={memeUploading} onChange={f=>handleUpload(f,setMemeUrl,setMemeUploading)} />
              <div className="flex items-center gap-2"><div className="flex-1 h-px bg-gray-100"/><span className="text-[11px] text-gray-400">hoặc dán URL</span><div className="flex-1 h-px bg-gray-100"/></div>
              <input type="url" value={memeUrl} onChange={e=>setMemeUrl(e.target.value)} placeholder="https://..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#cc0000]/30" />
            </div>

            {/* Châm Ngôn */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-2">
              <p className="text-[13px] font-bold text-[#c8a800] uppercase tracking-wider">★ Châm Ngôn <span className="text-[11px] text-gray-400 normal-case font-normal">(Trang cuối)</span></p>
              <textarea value={chamNgon} onChange={e=>setChamNgon(e.target.value)} placeholder="Nhập câu châm ngôn..." rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#c8a800]/30 resize-none" />
            </div>

            {/* Selected list */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-bold text-[#003380] uppercase tracking-wider">Bài đã chọn</p>
                <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${selected.length>=minRequired ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{selected.length}/{MAX_ARTICLES}</span>
              </div>
              {selected.length===0 ? <p className="text-[12px] text-gray-400 text-center py-4">Chọn bài từ danh sách bên dưới</p> : (
                <div className="flex flex-col gap-1.5">
                  {selected.map((post, idx) => {
                    const p1n = getP1ArticleCount(layout);
                    const tag = idx < p1n ? { label: 'T.1 Màu', cls: 'bg-blue-100 text-blue-700' } : { label: `T.${Math.floor((idx-p1n)/3)+2} B&W`, cls: 'bg-gray-100 text-gray-500' };
                    return (
                      <div key={(post as any).id} className="flex items-center gap-2 p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#003380] text-white text-[10px] font-bold flex items-center justify-center">{idx+1}</span>
                        <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0 rounded-full ${tag.cls}`}>{tag.label}</span>
                        <span className="flex-1 text-[11px] font-semibold text-gray-800 line-clamp-1">{post.title}</span>
                        <div className="flex flex-col gap-0.5 flex-shrink-0">
                          <button onClick={()=>moveSelected(idx,-1)} disabled={idx===0} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 leading-none text-[11px]">▲</button>
                          <button onClick={()=>moveSelected(idx,1)} disabled={idx===selected.length-1} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 leading-none text-[11px]">▼</button>
                        </div>
                        <button onClick={()=>toggleSelect(post)} className="text-red-300 hover:text-red-500 flex-shrink-0 text-[16px] leading-none">×</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Article list */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-[13px] font-bold text-[#003380] uppercase tracking-wider mb-3">Chọn bài viết</p>
              <input type="text" placeholder="Tìm kiếm..." value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] mb-3 focus:outline-none focus:ring-2 focus:ring-[#003380]/30" />
              {loading ? <div className="flex justify-center py-6"><Spinner /></div> : (
                <div className="flex flex-col gap-1.5 max-h-[380px] overflow-y-auto pr-1">
                  {filteredPosts.map(post => {
                    const sel = isSelected((post as any).id);
                    const disabled = !sel && selected.length>=MAX_ARTICLES;
                    return (
                      <button key={(post as any).id} onClick={()=>!disabled&&toggleSelect(post)} disabled={disabled}
                        className={`flex items-start gap-2 p-2.5 rounded-lg border text-left transition w-full ${sel ? 'bg-blue-50 border-[#003380]/40' : disabled ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' : 'bg-white border-gray-100 hover:border-[#003380]/40 hover:bg-blue-50/40'}`}>
                        {post.thumbnail && <img src={post.thumbnail} alt="" className="w-10 h-10 object-cover rounded flex-shrink-0"/>}
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold line-clamp-2 leading-snug">{post.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[10px] text-gray-400">{fmtDate(post.published_at||post.created_at||'')}</p>
                            <span className={`text-[10px] font-bold px-1.5 rounded-full ${post.status==='published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-600'}`}>{post.status==='published'?'Đăng':'Nháp'}</span>
                          </div>
                        </div>
                        {sel && <span className="text-[#003380] text-[14px] flex-shrink-0">✓</span>}
                      </button>
                    );
                  })}
                  {filteredPosts.length===0 && <p className="text-[12px] text-gray-400 text-center py-4">{allPosts.length===0?'Chưa có bài viết nào':'Không tìm thấy'}</p>}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: preview */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <p className="text-[13px] font-bold text-[#003380] uppercase tracking-wider mr-1">Xem trước</p>
                {/* Page tabs */}
                <button onClick={()=>setPreviewPage(0)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-bold border transition ${previewPage===0 ? 'bg-[#003380] text-white border-[#003380]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#003380]/50'}`}>
                  T.1 — Màu
                </button>
                {bwPageGroups.map((_,i) => (
                  <button key={i} onClick={()=>setPreviewPage(i+1)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-bold border transition ${previewPage===i+1 ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-500'}`}>
                    T.{i+2} — B&W{i===bwPageGroups.length-1?' ★':''}
                  </button>
                ))}
                <span className="ml-auto text-[11px] text-gray-400">Khổ A3 · {totalPages} trang</span>
              </div>

              <div className="overflow-hidden rounded-lg border border-gray-200 shadow-inner bg-gray-100 flex items-center justify-center"
                style={{ width:'100%', height: Math.round(PAGE_H*SCALE)+8 }}>
                <div style={{ width:PAGE_W*SCALE, height:PAGE_H*SCALE, overflow:'hidden', borderRadius:2, boxShadow:'0 2px 12px rgba(0,0,0,0.2)', flexShrink:0 }}>
                  <div style={{ width:PAGE_W, height:PAGE_H, transform:`scale(${SCALE})`, transformOrigin:'top left' }}>
                    {previewPage===0
                      ? renderPage1(previewP1Arts)
                      : <PageBW
                          arts={bwPageGroups[previewPage-1]?.length ? bwPageGroups[previewPage-1] : [placeholder(1),placeholder(2),placeholder(3)]}
                          pageNum={previewPage+1} issueNumber={issueNumber} pubDate={pubDate}
                          isLast={previewPage===bwPageGroups.length}
                          memeUrl={memeUrl} chamNgon={chamNgon} />
                    }
                  </div>
                </div>
              </div>

              <div className="mt-3 text-center">
                {selected.length < minRequired ? (
                  <p className="text-[12px] text-amber-600 font-semibold">⚠ Bố cục "{LAYOUTS.find(l=>l.id===layout)?.name}" cần ít nhất {minRequired} bài — đang chọn {selected.length}</p>
                ) : (
                  <p className="text-[12px] text-green-600 font-semibold">✓ Sẵn sàng xuất PDF {totalPages} trang — {selected.length} bài</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
