import { useState, useEffect, useRef, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
interface SeoGlobal {
  metaTitle: string;
  metaDesc: string;
  metaKeywords: string[];
  ogImageUrl: string;
  faviconUrl: string;
  headerScripts: string;
  footerScripts: string;
  schemaEnabled: boolean;
  schemaType: 'Organization' | 'LocalBusiness' | 'Website';
  canonicalBase: string;
  metaRobots: string;
}

interface Redirect {
  id: string;
  from: string;
  to: string;
  type: 301 | 302;
  note: string;
  createdAt: string;
}

interface SeoIssue {
  id: number;
  slug: string;
  title: string;
  severity: 'error' | 'warning' | 'info';
  issue: string;
}

interface PerfSettings {
  imgQuality: number;
  imgFormat: 'webp' | 'original';
  lazyLoad: boolean;
  cacheControl: boolean;
}

/* ══════════════════════════════════════════════════════════
   DEFAULTS
══════════════════════════════════════════════════════════ */
const DEFAULT_SEO: SeoGlobal = {
  metaTitle: 'Báo Hải Quân Việt Nam - SROV',
  metaDesc: 'Cơ quan ngôn luận của Quân chủng Hải quân Nhân dân Việt Nam. Tin tức, sự kiện, chủ quyền biển đảo.',
  metaKeywords: ['hải quân', 'quân đội', 'biển đảo', 'SROV', 'Hải quân Việt Nam'],
  ogImageUrl: 'https://baohaiquansrov.xo.je/opengraph.jpg',
  faviconUrl: '',
  headerScripts: '',
  footerScripts: '',
  schemaEnabled: true,
  schemaType: 'Organization',
  canonicalBase: 'https://baohaiquansrov.xo.je',
  metaRobots: 'index, follow',
};

const DEFAULT_ROBOTS = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

# Crawl-delay cho các bot ít quan trọng
User-agent: AhrefsBot
Crawl-delay: 10

User-agent: SemrushBot
Crawl-delay: 10

Sitemap: https://baohaiquansrov.xo.je/sitemap.xml`;

const DEFAULT_PERF: PerfSettings = {
  imgQuality: 85,
  imgFormat: 'webp',
  lazyLoad: true,
  cacheControl: true,
};

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
async function loadSetting<T>(key: string, fallback: T): Promise<T> {
  const { data } = await supabase.from('settings').select('value').eq('key', key).maybeSingle();
  if (!data?.value) return fallback;
  try { return JSON.parse(data.value) as T; } catch { return data.value as unknown as T; }
}

async function saveSetting(key: string, value: unknown) {
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  await supabase.from('settings').upsert({ key, value: str }, { onConflict: 'key' });
}

function uid() { return Math.random().toString(36).slice(2, 10); }

function validateRobots(content: string): string[] {
  const errors: string[] = [];
  const lines = content.split('\n');
  let hasUserAgent = false;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.toLowerCase().startsWith('user-agent:')) { hasUserAgent = true; continue; }
    const validDirectives = ['allow:', 'disallow:', 'crawl-delay:', 'sitemap:', 'host:'];
    const isValid = validDirectives.some(d => line.toLowerCase().startsWith(d));
    if (!isValid) errors.push(`Dòng không hợp lệ: "${line}"`);
  }
  if (!hasUserAgent) errors.push('Thiếu ít nhất một khai báo "User-agent:"');
  return errors;
}

/* ══════════════════════════════════════════════════════════
   SHARED UI
══════════════════════════════════════════════════════════ */
function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-[13px] text-gray-700 font-medium">{label}</span>
      <button onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-[#003380]' : 'bg-gray-200'}`}>
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

function Card({ title, icon, children, danger }: { title: string; icon?: React.ReactNode; children: React.ReactNode; danger?: boolean }) {
  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${danger ? 'border-red-100' : 'border-gray-100'}`}>
      <div className={`flex items-center gap-2.5 px-5 py-3.5 border-b ${danger ? 'border-red-100 bg-red-50' : 'border-gray-100 bg-gray-50'}`}>
        {icon && <span className={danger ? 'text-red-500' : 'text-[#003380]'}>{icon}</span>}
        <h3 className={`font-bold text-[13px] uppercase tracking-wide ${danger ? 'text-red-700' : 'text-[#003380]'}`}>{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wide">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, maxLen, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; maxLen?: number; type?: string }) {
  return (
    <div className="relative">
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLen}
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#003380]/30 focus:border-[#003380]/40" />
      {maxLen && <span className={`absolute right-2.5 bottom-2 text-[11px] ${value.length > maxLen * 0.9 ? 'text-amber-500' : 'text-gray-300'}`}>{value.length}/{maxLen}</span>}
    </div>
  );
}

function Textarea({ value, onChange, rows = 4, placeholder, mono }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; mono?: boolean }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
      className={`w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#003380]/30 resize-none ${mono ? 'font-mono text-[12px]' : ''}`} />
  );
}

function SaveBtn({ saving, onClick, label = 'Lưu cấu hình' }: { saving: boolean; onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} disabled={saving}
      className="flex items-center gap-2 bg-[#003380] hover:bg-[#002260] disabled:opacity-60 text-white px-5 py-2.5 rounded-lg font-bold text-[13px] transition">
      {saving
        ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Đang lưu...</>
        : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg> {label}</>
      }
    </button>
  );
}

function Badge({ type }: { type: 'error' | 'warning' | 'info' }) {
  const map = {
    error: 'bg-red-100 text-red-700 border-red-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
  };
  const label = { error: 'Lỗi', warning: 'Cảnh báo', info: 'Gợi ý' };
  return <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${map[type]}`}>{label[type]}</span>;
}

/* ══════════════════════════════════════════════════════════
   TAB 1: GLOBAL SEO SETTINGS
══════════════════════════════════════════════════════════ */
function TabGlobalSEO() {
  const [form, setForm] = useState<SeoGlobal>(DEFAULT_SEO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [kwInput, setKwInput] = useState('');

  useEffect(() => {
    loadSetting('seo_global', DEFAULT_SEO).then(v => { setForm(v); setLoading(false); });
  }, []);

  const set = <K extends keyof SeoGlobal>(k: K, v: SeoGlobal[K]) => setForm(prev => ({ ...prev, [k]: v }));

  const addKeyword = () => {
    const kw = kwInput.trim();
    if (!kw || form.metaKeywords.includes(kw)) return;
    set('metaKeywords', [...form.metaKeywords, kw]);
    setKwInput('');
  };

  const save = async () => {
    setSaving(true);
    await saveSetting('seo_global', form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <div className="flex justify-center py-12"><svg className="w-6 h-6 animate-spin text-[#003380]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>;

  return (
    <div className="grid grid-cols-2 gap-5">
      {/* Meta basics */}
      <Card title="Meta Tags Trang Chủ" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>}>
        <Field label="Meta Title" hint="Tối ưu 50–60 ký tự">
          <Input value={form.metaTitle} onChange={v => set('metaTitle', v)} maxLen={60} placeholder="Tiêu đề trang chính..." />
        </Field>
        <Field label="Meta Description" hint="Tối ưu 150–160 ký tự">
          <div className="relative">
            <Textarea value={form.metaDesc} onChange={v => set('metaDesc', v)} rows={3} placeholder="Mô tả ngắn hiển thị trên Google..." />
            <span className={`absolute right-2.5 bottom-2 text-[11px] ${form.metaDesc.length > 145 ? 'text-amber-500' : 'text-gray-300'}`}>{form.metaDesc.length}/160</span>
          </div>
        </Field>
        <Field label="Meta Keywords">
          <div className="flex gap-2 mb-2">
            <input value={kwInput} onChange={e => setKwInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addKeyword()}
              placeholder="Nhập từ khóa rồi Enter..." className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#003380]/30" />
            <button onClick={addKeyword} className="bg-[#003380] text-white px-3 py-2 rounded-lg text-[12px] font-bold">+Thêm</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {form.metaKeywords.map(kw => (
              <span key={kw} className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 text-[12px] font-medium px-2.5 py-1 rounded-full">
                {kw}
                <button onClick={() => set('metaKeywords', form.metaKeywords.filter(k => k !== kw))} className="text-blue-400 hover:text-red-500 ml-0.5 leading-none">×</button>
              </span>
            ))}
          </div>
        </Field>
        <Field label="Canonical Base URL">
          <Input value={form.canonicalBase} onChange={v => set('canonicalBase', v)} placeholder="https://example.com" />
        </Field>
        <Field label="Meta Robots">
          <select value={form.metaRobots} onChange={e => set('metaRobots', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#003380]/30">
            <option value="index, follow">index, follow (Mặc định — lập chỉ mục)</option>
            <option value="noindex, follow">noindex, follow (Không lập chỉ mục)</option>
            <option value="index, nofollow">index, nofollow (Không theo liên kết)</option>
            <option value="noindex, nofollow">noindex, nofollow (Ẩn hoàn toàn)</option>
          </select>
        </Field>
      </Card>

      {/* OG + Social */}
      <Card title="Ảnh & Mạng Xã Hội" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>}>
        <Field label="OG Image (ảnh chia sẻ MXH)" hint="Khuyến nghị 1200×630px">
          <Input value={form.ogImageUrl} onChange={v => set('ogImageUrl', v)} placeholder="https://example.com/og.jpg" />
          {form.ogImageUrl && <img src={form.ogImageUrl} alt="" className="mt-2 w-full h-28 object-cover rounded-lg border border-gray-100" onError={e=>{(e.target as HTMLImageElement).style.display='none';}} />}
        </Field>
        <Field label="Favicon URL" hint="URL đến file .ico hoặc .png 32×32">
          <Input value={form.faviconUrl} onChange={v => set('faviconUrl', v)} placeholder="https://example.com/favicon.ico" />
        </Field>
      </Card>

      {/* Schema Markup */}
      <Card title="Schema Markup (JSON-LD)" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>}>
        <Toggle value={form.schemaEnabled} onChange={v => set('schemaEnabled', v)} label="Bật Schema Markup tự động" />
        {form.schemaEnabled && (
          <div className="mt-3">
            <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Loại Schema</label>
            <div className="flex gap-2 flex-wrap">
              {(['Organization', 'LocalBusiness', 'Website'] as const).map(t => (
                <button key={t} onClick={() => set('schemaType', t)}
                  className={`px-3 py-1.5 rounded-lg border text-[12px] font-bold transition ${form.schemaType === t ? 'bg-[#003380] text-white border-[#003380]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#003380]/40'}`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
              <p className="text-[11px] text-gray-500 font-mono leading-relaxed">
                {`{ "@context": "https://schema.org", "@type": "${form.schemaType}", "name": "${form.metaTitle}", "url": "${form.canonicalBase}" }`}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Header/Footer Scripts */}
      <Card title="Nhúng Script Phân Tích" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>}>
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4 text-[12px] text-amber-700">
          ⚠ Script được nhúng vào HTML trên server. Có hiệu lực sau khi deploy lại.
        </div>
        <Field label="Header Scripts (trước </head>)" hint="GA4, GTM, GSC verification...">
          <Textarea value={form.headerScripts} onChange={v => set('headerScripts', v)} rows={5} placeholder={'<!-- Google Analytics -->\n<script>...</script>'} mono />
        </Field>
        <Field label="Footer Scripts (trước </body>)" hint="Facebook Pixel, chat widget...">
          <Textarea value={form.footerScripts} onChange={v => set('footerScripts', v)} rows={5} placeholder={'<!-- Facebook Pixel -->\n<script>...</script>'} mono />
        </Field>
      </Card>

      <div className="col-span-2 flex items-center gap-3">
        <SaveBtn saving={saving} onClick={save} />
        {saved && <span className="text-green-600 text-[13px] font-semibold flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg> Đã lưu thành công!</span>}
        <span className="text-[12px] text-gray-400 ml-auto">Thay đổi có hiệu lực ngay sau khi lưu (robots, sitemap) hoặc sau deploy (scripts).</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB 2: SITEMAP & ROBOTS.TXT
══════════════════════════════════════════════════════════ */
function TabSitemapRobots() {
  const [robots, setRobots] = useState(DEFAULT_ROBOTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [sitemapCount, setSitemapCount] = useState<number | null>(null);
  const [fetchingCount, setFetchingCount] = useState(false);

  useEffect(() => {
    loadSetting('robots_txt', DEFAULT_ROBOTS).then(v => { setRobots(v as string); setLoading(false); });
  }, []);

  const validate = useCallback((content: string) => {
    setErrors(validateRobots(content));
  }, []);

  const handleRobotsChange = (v: string) => { setRobots(v); validate(v); };

  const saveRobots = async () => {
    const errs = validateRobots(robots);
    if (errs.length) { setErrors(errs); return; }
    setSaving(true);
    await saveSetting('robots_txt', robots);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const fetchSitemapCount = async () => {
    setFetchingCount(true);
    try {
      const { count } = await supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'published');
      setSitemapCount(count || 0);
    } finally { setFetchingCount(false); }
  };

  useEffect(() => { fetchSitemapCount(); }, []);

  if (loading) return <div className="flex justify-center py-12"><svg className="w-6 h-6 animate-spin text-[#003380]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>;

  return (
    <div className="grid grid-cols-2 gap-5">
      {/* Sitemap info */}
      <Card title="Sitemap XML" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>}>
        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl mb-4">
          <div>
            <p className="text-[13px] font-bold text-green-700">Sitemap đang hoạt động</p>
            <p className="text-[12px] text-green-600 mt-0.5">
              {fetchingCount ? 'Đang đếm...' : sitemapCount !== null ? `${sitemapCount + 7} URL (${sitemapCount} bài viết + 7 trang tĩnh)` : 'Không xác định'}
            </p>
          </div>
          <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-green-700 hover:bg-green-800 text-white text-[12px] font-bold px-3 py-2 rounded-lg transition">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            Xem sitemap.xml
          </a>
        </div>
        <div className="space-y-2 text-[13px] text-gray-600">
          <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"/><span>Tự động cập nhật khi có bài viết mới</span></div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"/><span>Bao gồm tất cả trang tĩnh quan trọng</span></div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"/><span>Cache 1 giờ, tự làm mới</span></div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-[12px] font-bold text-gray-500 mb-2">URL Sitemap để khai báo với Google Search Console:</p>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
            <code className="flex-1 text-[12px] text-[#003380] font-mono">https://baohaiquansrov.xo.je/sitemap.xml</code>
            <button onClick={() => navigator.clipboard.writeText('https://baohaiquansrov.xo.je/sitemap.xml')}
              className="text-gray-400 hover:text-[#003380] transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            </button>
          </div>
        </div>
      </Card>

      {/* Robots.txt editor */}
      <Card title="Robots.txt — Trình Chỉnh Sửa Trực Tiếp" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>}>
        {errors.length > 0 && (
          <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-3">
            {errors.map((e, i) => <p key={i} className="text-[12px] text-red-600 font-medium">⚠ {e}</p>)}
          </div>
        )}
        <textarea value={robots} onChange={e => handleRobotsChange(e.target.value)} rows={16}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[12px] font-mono focus:outline-none focus:ring-2 focus:ring-[#003380]/30 resize-none" />
        <div className="flex items-center justify-between mt-3">
          <a href="/robots.txt" target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#003380] hover:underline">Xem robots.txt hiện tại ↗</a>
          <div className="flex items-center gap-3">
            {saved && <span className="text-green-600 text-[13px] font-semibold">✓ Đã lưu</span>}
            <SaveBtn saving={saving} onClick={saveRobots} label="Lưu robots.txt" />
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB 3: URL REDIRECTS & CANONICAL
══════════════════════════════════════════════════════════ */
function TabRedirects() {
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newFrom, setNewFrom] = useState('');
  const [newTo, setNewTo] = useState('');
  const [newType, setNewType] = useState<301 | 302>(301);
  const [newNote, setNewNote] = useState('');
  const [filterQ, setFilterQ] = useState('');

  useEffect(() => {
    loadSetting<Redirect[]>('seo_redirects', []).then(v => { setRedirects(Array.isArray(v) ? v : []); setLoading(false); });
  }, []);

  const save = async (updated: Redirect[]) => {
    setSaving(true);
    await saveSetting('seo_redirects', updated);
    setSaving(false);
  };

  const add = async () => {
    if (!newFrom.trim() || !newTo.trim()) return;
    const from = newFrom.trim().startsWith('/') ? newFrom.trim() : '/' + newFrom.trim();
    const entry: Redirect = { id: uid(), from, to: newTo.trim(), type: newType, note: newNote.trim(), createdAt: new Date().toISOString() };
    const updated = [entry, ...redirects];
    setRedirects(updated);
    await save(updated);
    setNewFrom(''); setNewTo(''); setNewNote('');
  };

  const remove = async (id: string) => {
    const updated = redirects.filter(r => r.id !== id);
    setRedirects(updated);
    await save(updated);
  };

  const filtered = redirects.filter(r => !filterQ || r.from.includes(filterQ) || r.to.includes(filterQ) || r.note.includes(filterQ));

  return (
    <div className="flex flex-col gap-5">
      {/* Add form */}
      <Card title="Thêm Chuyển Hướng Mới" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>}>
        <div className="grid grid-cols-12 gap-3 items-end">
          <div className="col-span-4">
            <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wide block mb-1.5">URL Nguồn (FROM)</label>
            <input value={newFrom} onChange={e => setNewFrom(e.target.value)} placeholder="/duong-dan-cu"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-[#003380]/30" />
          </div>
          <div className="col-span-4">
            <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wide block mb-1.5">URL Đích (TO)</label>
            <input value={newTo} onChange={e => setNewTo(e.target.value)} placeholder="/duong-dan-moi hoặc https://..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-[#003380]/30" />
          </div>
          <div className="col-span-2">
            <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Loại</label>
            <select value={newType} onChange={e => setNewType(Number(e.target.value) as 301 | 302)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#003380]/30">
              <option value={301}>301 — Vĩnh viễn</option>
              <option value={302}>302 — Tạm thời</option>
            </select>
          </div>
          <div className="col-span-2">
            <button onClick={add} disabled={!newFrom || !newTo || saving}
              className="w-full bg-[#003380] hover:bg-[#002260] disabled:opacity-50 text-white py-2.5 rounded-lg font-bold text-[13px] transition">
              + Thêm
            </button>
          </div>
          <div className="col-span-8">
            <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Ghi chú (tuỳ chọn)</label>
            <input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Lý do chuyển hướng..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#003380]/30" />
          </div>
        </div>
      </Card>

      {/* List */}
      <Card title={`Danh Sách Redirect (${redirects.length})`} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>}>
        {loading ? <div className="flex justify-center py-6"><svg className="w-5 h-5 animate-spin text-[#003380]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div> : (
          <>
            <div className="mb-4">
              <input value={filterQ} onChange={e => setFilterQ(e.target.value)} placeholder="Tìm kiếm redirect..."
                className="w-full max-w-sm border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#003380]/30" />
            </div>
            {filtered.length === 0 ? (
              <p className="text-center text-gray-400 text-[13px] py-6">{redirects.length === 0 ? 'Chưa có redirect nào. Thêm ở trên.' : 'Không tìm thấy.'}</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full text-[13px]">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-bold text-gray-500 uppercase tracking-wide text-[11px]">Từ (FROM)</th>
                      <th className="text-left px-4 py-2.5 font-bold text-gray-500 uppercase tracking-wide text-[11px]">Đến (TO)</th>
                      <th className="text-center px-3 py-2.5 font-bold text-gray-500 uppercase tracking-wide text-[11px]">Loại</th>
                      <th className="text-left px-4 py-2.5 font-bold text-gray-500 uppercase tracking-wide text-[11px]">Ghi chú</th>
                      <th className="px-3 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-mono text-[12px] text-[#003380]">{r.from}</td>
                        <td className="px-4 py-3 font-mono text-[12px] text-gray-600">{r.to}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${r.type === 301 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>{r.type}</span>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-gray-400 italic">{r.note || '—'}</td>
                        <td className="px-3 py-3">
                          <button onClick={() => remove(r.id)} className="text-gray-300 hover:text-red-500 transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB 4: WEB PERFORMANCE OPTIMIZATION
══════════════════════════════════════════════════════════ */
function TabPerformance() {
  const [form, setForm] = useState<PerfSettings>(DEFAULT_PERF);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearMsg, setClearMsg] = useState('');

  useEffect(() => {
    loadSetting('perf_settings', DEFAULT_PERF).then(v => { setForm(v); setLoading(false); });
  }, []);

  const set = <K extends keyof PerfSettings>(k: K, v: PerfSettings[K]) => setForm(prev => ({ ...prev, [k]: v }));

  const save = async () => {
    setSaving(true);
    await saveSetting('perf_settings', form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const clearCache = async () => {
    setClearing(true);
    setClearMsg('');
    try {
      const res = await fetch('/api/admin/clear-cache', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const data = await res.json();
      setClearMsg(data.ok ? '✓ Đã xóa cache thành công!' : `⚠ Lỗi: ${data.error}`);
    } catch { setClearMsg('⚠ Không thể kết nối server.'); }
    finally { setClearing(false); setTimeout(() => setClearMsg(''), 5000); }
  };

  if (loading) return <div className="flex justify-center py-12"><svg className="w-6 h-6 animate-spin text-[#003380]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>;

  return (
    <div className="grid grid-cols-2 gap-5">
      {/* Image Optimization */}
      <Card title="Tối Ưu Hình Ảnh" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>}>
        <div className="mb-4">
          <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wide block mb-2">Định dạng xuất</label>
          <div className="flex gap-2">
            {(['webp', 'original'] as const).map(f => (
              <button key={f} onClick={() => set('imgFormat', f)}
                className={`px-4 py-2 rounded-lg border text-[13px] font-bold transition ${form.imgFormat === f ? 'bg-[#003380] text-white border-[#003380]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#003380]/40'}`}>
                {f === 'webp' ? 'WebP (Khuyến nghị)' : 'Giữ nguyên'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wide">Chất lượng nén</label>
            <span className={`text-[13px] font-bold ${form.imgQuality >= 90 ? 'text-amber-500' : form.imgQuality >= 75 ? 'text-green-600' : 'text-red-500'}`}>{form.imgQuality}%</span>
          </div>
          <input type="range" min={50} max={100} step={5} value={form.imgQuality} onChange={e => set('imgQuality', Number(e.target.value))}
            className="w-full accent-[#003380]" />
          <div className="flex justify-between text-[11px] text-gray-400 mt-1">
            <span>Nén mạnh (nhỏ hơn)</span>
            <span>Chất lượng cao</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[{ q: 85, l: 'Khuyến nghị', s: '~65KB' }, { q: 92, l: 'Cân bằng', s: '~95KB' }, { q: 100, l: 'Tối đa', s: '~180KB' }].map(p => (
              <button key={p.q} onClick={() => set('imgQuality', p.q)}
                className={`px-2 py-1.5 rounded-lg border text-[11px] transition ${form.imgQuality === p.q ? 'bg-blue-50 border-[#003380]/40 text-[#003380]' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'}`}>
                <div className="font-bold">{p.l}</div>
                <div className="opacity-60">{p.s}</div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Loading & Cache */}
      <Card title="Lazy Load & Bộ Nhớ Đệm" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>}>
        <Toggle value={form.lazyLoad} onChange={v => set('lazyLoad', v)} label="Lazy Loading hình ảnh & iframe" />
        <Toggle value={form.cacheControl} onChange={v => set('cacheControl', v)} label="Cache-Control tài nguyên tĩnh (1 ngày)" />
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-3">Xóa bộ nhớ đệm Server</p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-[12px] text-amber-700 mb-3">
            Xóa cache YouTube, Redirects và các dữ liệu tạm thời trên server ngay lập tức.
          </div>
          <button onClick={clearCache} disabled={clearing}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg font-bold text-[13px] transition">
            {clearing
              ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Đang xóa...</>
              : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg> Xóa Cache Ngay</>
            }
          </button>
          {clearMsg && <p className={`mt-2 text-[13px] font-semibold ${clearMsg.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>{clearMsg}</p>}
        </div>
      </Card>

      <div className="col-span-2 flex items-center gap-3">
        <SaveBtn saving={saving} onClick={save} />
        {saved && <span className="text-green-600 text-[13px] font-semibold flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg> Đã lưu!</span>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB 5: SEO HEALTH DASHBOARD
══════════════════════════════════════════════════════════ */
function TabSeoHealth() {
  const [issues, setIssues] = useState<SeoIssue[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [stats, setStats] = useState({ total: 0, errors: 0, warnings: 0, info: 0, ok: 0 });
  const [filterSev, setFilterSev] = useState<'all' | 'error' | 'warning' | 'info'>('all');

  const runAudit = async () => {
    setScanning(true);
    setIssues([]);
    try {
      const { data: posts } = await supabase.from('posts')
        .select('id, title, slug, thumbnail, content, excerpt, meta_description, author, category_id, status, published_at')
        .eq('status', 'published').limit(500);

      if (!posts) return;
      const found: SeoIssue[] = [];

      const titlesSeen = new Map<string, number>();
      for (const p of posts) {
        const base = { id: p.id as number, slug: p.slug || '', title: p.title || '(không có tiêu đề)' };

        if (!p.title || p.title.trim().length === 0) found.push({ ...base, severity: 'error', issue: 'Bài viết không có tiêu đề' });
        else if (p.title.length < 20) found.push({ ...base, severity: 'warning', issue: `Tiêu đề quá ngắn (${p.title.length} ký tự, tối ưu ≥ 40)` });
        else if (p.title.length > 70) found.push({ ...base, severity: 'warning', issue: `Tiêu đề quá dài (${p.title.length} ký tự, tối ưu ≤ 60)` });

        if (titlesSeen.has(p.title)) found.push({ ...base, severity: 'error', issue: `Tiêu đề bị trùng với bài ID ${titlesSeen.get(p.title)}` });
        else titlesSeen.set(p.title, p.id as number);

        if (!p.thumbnail) found.push({ ...base, severity: 'warning', issue: 'Không có ảnh đại diện (thumbnail)' });
        if (!p.excerpt && !p.meta_description) found.push({ ...base, severity: 'warning', issue: 'Thiếu excerpt / meta description' });
        if ((p.meta_description || '').length > 160) found.push({ ...base, severity: 'info', issue: `Meta description quá dài (${(p.meta_description || '').length} ký tự, tối ưu ≤ 160)` });
        if (!p.author) found.push({ ...base, severity: 'info', issue: 'Không có thông tin tác giả' });
        if (!p.category_id) found.push({ ...base, severity: 'warning', issue: 'Bài viết chưa được phân chuyên mục' });
        if (!p.content || (p.content || '').replace(/<[^>]+>/g, '').length < 200) found.push({ ...base, severity: 'warning', issue: 'Nội dung quá ngắn (< 200 ký tự)' });
        if (!p.slug || p.slug.includes(' ') || /[A-Z]/.test(p.slug)) found.push({ ...base, severity: 'error', issue: 'Slug URL không chuẩn (có dấu cách hoặc chữ hoa)' });
      }

      setIssues(found);
      setStats({
        total: posts.length,
        errors: found.filter(i => i.severity === 'error').length,
        warnings: found.filter(i => i.severity === 'warning').length,
        info: found.filter(i => i.severity === 'info').length,
        ok: posts.length - new Set(found.map(i => i.id)).size,
      });
      setScanned(true);
    } finally { setScanning(false); }
  };

  const filtered = issues.filter(i => filterSev === 'all' || i.severity === filterSev);

  const scoreColor = () => {
    if (!scanned) return 'text-gray-400';
    const rate = stats.ok / Math.max(stats.total, 1);
    if (rate >= 0.85) return 'text-green-600';
    if (rate >= 0.65) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Score + run button */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Tổng bài', val: scanned ? stats.total : '—', color: 'text-[#003380]', bg: 'bg-blue-50 border-blue-100' },
          { label: 'Lỗi nghiêm trọng', val: scanned ? stats.errors : '—', color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
          { label: 'Cảnh báo', val: scanned ? stats.warnings : '—', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
          { label: 'Gợi ý cải thiện', val: scanned ? stats.info : '—', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
          { label: 'Bài viết OK', val: scanned ? stats.ok : '—', color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 text-center ${s.bg}`}>
            <div className={`text-3xl font-black ${s.color}`}>{s.val}</div>
            <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wide mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button onClick={runAudit} disabled={scanning}
          className="flex items-center gap-2 bg-[#003380] hover:bg-[#002260] disabled:opacity-60 text-white px-6 py-2.5 rounded-xl font-bold text-[14px] transition shadow-sm">
          {scanning
            ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Đang kiểm tra...</>
            : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg> Chạy SEO Audit</>
          }
        </button>
        {scanned && (
          <div className="flex items-center gap-2">
            <span className={`text-[22px] font-black ${scoreColor()}`}>
              {Math.round(stats.ok / Math.max(stats.total, 1) * 100)}%
            </span>
            <span className="text-[13px] text-gray-500">bài viết không có vấn đề</span>
          </div>
        )}
        {scanned && issues.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[12px] text-gray-500 font-medium">Lọc:</span>
            {(['all', 'error', 'warning', 'info'] as const).map(s => (
              <button key={s} onClick={() => setFilterSev(s)}
                className={`px-3 py-1.5 rounded-lg border text-[12px] font-bold transition ${filterSev === s ? 'bg-[#003380] text-white border-[#003380]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#003380]/40'}`}>
                {s === 'all' ? `Tất cả (${issues.length})` : s === 'error' ? `Lỗi (${stats.errors})` : s === 'warning' ? `Cảnh báo (${stats.warnings})` : `Gợi ý (${stats.info})`}
              </button>
            ))}
          </div>
        )}
      </div>

      {scanned && filtered.length === 0 && <div className="text-center py-12 text-green-600 font-bold text-[16px]">🎉 Tuyệt vời! Không tìm thấy vấn đề SEO nào.</div>}

      {scanned && filtered.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase tracking-wide text-[11px]">Mức độ</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase tracking-wide text-[11px]">Bài viết</th>
                  <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase tracking-wide text-[11px]">Vấn đề phát hiện</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.slice(0, 200).map((issue, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/40">
                    <td className="px-4 py-3"><Badge type={issue.severity} /></td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[13px] line-clamp-1">{issue.title}</div>
                      <div className="text-[11px] text-gray-400 font-mono mt-0.5">/{issue.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-gray-600">{issue.issue}</td>
                    <td className="px-4 py-3">
                      <a href={`/admin/bai-viet/${issue.id}`}
                        className="text-[12px] text-[#003380] hover:underline font-semibold whitespace-nowrap">
                        Sửa nhanh →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > 200 && <p className="text-center text-[12px] text-gray-400 py-3">Hiển thị 200/{filtered.length} vấn đề. Hãy sửa các lỗi trên trước.</p>}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
const TABS = [
  { id: 'global', label: 'Cấu hình SEO', icon: '⚙️' },
  { id: 'sitemap', label: 'Sitemap & Robots', icon: '🗺️' },
  { id: 'redirects', label: 'Chuyển hướng URL', icon: '↪️' },
  { id: 'perf', label: 'Hiệu năng', icon: '⚡' },
  { id: 'health', label: 'SEO Audit', icon: '🔍' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function AdminSEO() {
  const [activeTab, setActiveTab] = useState<TabId>('global');
  const session = getSession();

  if (session?.role !== 'HADMIN') {
    return (
      <AdminLayout title="Siêu Quản Lý SEO">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
          </div>
          <h2 className="text-[20px] font-bold text-gray-800 mb-2">Truy cập bị từ chối</h2>
          <p className="text-gray-500 text-[14px]">Chỉ tài khoản <strong>HADMIN</strong> mới có thể truy cập trang này.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Siêu Quản Lý SEO & Website">
      <div className="max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-[#003380] rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <h1 className="text-[22px] font-black text-[#003380]">Siêu Quản Lý SEO & Website</h1>
            <span className="bg-amber-100 text-amber-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200">HADMIN Only</span>
          </div>
          <p className="text-[13px] text-gray-500 ml-11">Toàn quyền cấu hình, theo dõi và tối ưu hóa SEO mà không cần chỉnh sửa code.</p>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-semibold transition whitespace-nowrap ${activeTab === t.id ? 'bg-white text-[#003380] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div>
          {activeTab === 'global' && <TabGlobalSEO />}
          {activeTab === 'sitemap' && <TabSitemapRobots />}
          {activeTab === 'redirects' && <TabRedirects />}
          {activeTab === 'perf' && <TabPerformance />}
          {activeTab === 'health' && <TabSeoHealth />}
        </div>
      </div>
    </AdminLayout>
  );
}
