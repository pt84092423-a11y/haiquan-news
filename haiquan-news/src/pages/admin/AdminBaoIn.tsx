import { useState, useEffect, useRef, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import { supabase, uploadImage } from '@/lib/supabase';

interface BaoInIssue {
  id?: number;
  title: string;
  thumbnail: string;
  content: string;
  status: string;
  post_type: string;
  published_at?: string;
  slug: string;
}

interface PageEntry {
  url: string;
  type: 'image' | 'canva';
}

type InputMode = 'manual' | 'canva' | 'pdf';

const MAX_PAGES = 60;

function parseContent(content: string): PageEntry[] {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed.map((p: any) => {
        if (typeof p === 'string') return { url: p, type: 'image' as const };
        return p as PageEntry;
      }).filter((p: PageEntry) => p.url);
    }
  } catch {}
  return [];
}

function Spinner({ size = 4 }: { size?: number }) {
  return (
    <svg className={`w-${size} h-${size} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function convertCanvaLinkToEmbed(url: string): string {
  url = url.trim();
  if (url.includes('canva.com/design/') && url.includes('/view')) return url;
  if (url.includes('canva.com/design/')) {
    const match = url.match(/canva\.com\/design\/([^/]+)/);
    if (match) return `https://www.canva.com/design/${match[1]}/view?embed`;
  }
  return url;
}

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs';
const PDFJS_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';

async function getPdfjsLib(): Promise<any> {
  const win = window as any;
  if (win.__pdfjsLib) return win.__pdfjsLib;
  const mod = await import(/* @vite-ignore */ PDFJS_CDN);
  const lib = mod.default ?? mod;
  lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
  win.__pdfjsLib = lib;
  return lib;
}

async function pdfToImages(
  file: File,
  onProgress: (done: number, total: number) => void
): Promise<Blob[]> {
  const pdfjsLib = await getPdfjsLib();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const total = pdf.numPages;
  const blobs: Blob[] = [];

  for (let i = 1; i <= total; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport }).promise;
    const blob = await new Promise<Blob>((res) =>
      canvas.toBlob((b) => res(b!), 'image/jpeg', 0.88)
    );
    blobs.push(blob);
    onProgress(i, total);
  }
  return blobs;
}

function IssueEditor({ issue, onSave, onCancel }: {
  issue?: BaoInIssue | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(issue?.title || '');
  const [cover, setCover] = useState(issue?.thumbnail || '');
  const [pages, setPages] = useState<PageEntry[]>(() => parseContent(issue?.content || ''));
  const [mode, setMode] = useState<InputMode>('manual');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [pdfProgress, setPdfProgress] = useState<{ done: number; total: number } | null>(null);
  const [canvaLink, setCanvaLink] = useState('');
  const [canvaPreview, setCanvaPreview] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const coverRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const imgBatchRef = useRef<HTMLInputElement>(null);

  const setPage = (i: number, val: PageEntry) => {
    setPages(prev => { const n = [...prev]; n[i] = val; return n; });
  };
  const removePage = (i: number) => setPages(prev => prev.filter((_, idx) => idx !== i));

  const handleCoverUpload = async (file: File) => {
    setCoverUploading(true);
    const url = await uploadImage(file);
    if (url) setCover(url);
    else setError('Tải ảnh bìa thất bại');
    setCoverUploading(false);
  };

  const handlePageImageUpload = async (i: number, file: File) => {
    setUploadingIdx(i);
    const url = await uploadImage(file);
    if (url) setPage(i, { url, type: 'image' });
    else setError(`Tải ảnh trang ${i + 1} thất bại`);
    setUploadingIdx(null);
  };

  const handlePdfUpload = async (file: File) => {
    setError('');
    setPdfProgress({ done: 0, total: 1 });
    try {
      const blobs = await pdfToImages(file, (done, total) => setPdfProgress({ done, total }));
      setPdfProgress({ done: blobs.length, total: blobs.length });
      const uploaded: PageEntry[] = [];
      for (let i = 0; i < blobs.length; i++) {
        setPdfProgress({ done: i, total: blobs.length * 2 });
        const f = new File([blobs[i]], `page-${i + 1}.jpg`, { type: 'image/jpeg' });
        const url = await uploadImage(f);
        if (url) uploaded.push({ url, type: 'image' as const });
        setPdfProgress({ done: blobs.length + i + 1, total: blobs.length * 2 });
      }
      setPages(prev => {
        const combined = [...prev, ...uploaded];
        return combined.slice(0, MAX_PAGES);
      });
      if (!cover && uploaded.length > 0) setCover(uploaded[0].url);
    } catch (e: any) {
      setError('Lỗi đọc PDF: ' + (e?.message || e));
    } finally {
      setPdfProgress(null);
    }
  };

  const handleBatchImageUpload = async (files: FileList) => {
    const arr = Array.from(files).slice(0, MAX_PAGES - pages.length);
    if (arr.length === 0) { setError(`Đã đủ tối đa ${MAX_PAGES} trang`); return; }
    setError('');
    for (let i = 0; i < arr.length; i++) {
      setUploadingIdx(pages.length + i);
      const url = await uploadImage(arr[i]);
      if (url) setPages(prev => [...prev, { url, type: 'image' as const }].slice(0, MAX_PAGES));
    }
    setUploadingIdx(null);
    if (!cover && pages.length === 0) {
      const first = await uploadImage(arr[0]);
      if (first) setCover(first);
    }
  };

  const handleAddCanva = useCallback(() => {
    if (!canvaLink.trim()) return;
    const embedUrl = convertCanvaLinkToEmbed(canvaLink.trim());
    setCanvaPreview(embedUrl);
    setPages(prev => {
      const filtered = prev.filter(p => p.type !== 'canva');
      return [{ url: embedUrl, type: 'canva' as const }, ...filtered].slice(0, MAX_PAGES);
    });
    setCanvaLink('');
  }, [canvaLink]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (!files.length) return;
    const file = files[0];
    if (file.type === 'application/pdf') {
      handlePdfUpload(file);
    } else if (file.type.startsWith('image/')) {
      handleBatchImageUpload(files);
    }
  };

  const handleSave = async (status: 'draft' | 'published') => {
    if (!title.trim()) { setError('Vui lòng nhập tiêu đề số báo'); return; }
    if (pages.length === 0) { setError('Vui lòng thêm ít nhất 1 trang'); return; }
    setSaving(true);
    setError('');
    const payload = {
      title: title.trim(),
      thumbnail: cover.trim(),
      content: JSON.stringify(pages),
      post_type: 'baoin',
      status,
      slug: (issue as any)?.slug || `bao-in-${Date.now()}`,
      published_at: new Date().toISOString(),
      view_count: 0,
    };
    if ((issue as any)?.id) {
      const { error: e } = await supabase.from('posts').update(payload).eq('id', (issue as any).id);
      if (e) { setError(e.message); setSaving(false); return; }
    } else {
      const { error: e } = await supabase.from('posts').insert(payload);
      if (e) { setError(e.message); setSaving(false); return; }
    }
    setSaving(false);
    onSave();
  };

  const canvaPages = pages.filter(p => p.type === 'canva');
  const imagePages = pages.filter(p => p.type === 'image');

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-5xl">
      <h2 className="text-[18px] font-bold text-[#0059b2] mb-5">
        {(issue as any)?.id ? 'Chỉnh sửa số báo' : 'Thêm số báo mới'}
      </h2>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-[13px] font-bold text-[#333] mb-1">Tiêu đề số báo *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="VD: Báo Hải quân số 1234"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0059b2]/30"
          />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-[#333] mb-1">Ảnh bìa</label>
          <div className="flex gap-2">
            <input
              value={cover}
              onChange={e => setCover(e.target.value)}
              placeholder="URL ảnh bìa hoặc tải lên..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0059b2]/30"
            />
            <label className={`flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg border font-bold text-[12px] cursor-pointer transition ${coverUploading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-[#0059b2]/10 text-[#0059b2] border-[#0059b2]/30 hover:bg-[#0059b2]/20'}`}>
              <input type="file" accept="image/*" className="hidden" disabled={coverUploading} ref={coverRef}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); e.target.value = ''; }} />
              {coverUploading ? <Spinner /> : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              )}
              {coverUploading ? 'Đang tải...' : 'Tải ảnh'}
            </label>
          </div>
        </div>
      </div>

      {cover && (
        <div className="mb-5 flex justify-center">
          <img src={cover} alt="Bìa" className="h-36 object-contain rounded border shadow-sm" />
        </div>
      )}

      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[13px] font-bold text-[#333]">Trang báo</span>
          <span className="text-[12px] text-gray-400">({pages.length}/{MAX_PAGES} trang)</span>
        </div>

        <div className="flex gap-2 mb-4">
          {(['manual', 'canva', 'pdf'] as InputMode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 rounded-lg text-[12px] font-bold border transition ${mode === m
                ? 'bg-[#0059b2] text-white border-[#0059b2]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[#0059b2]/50 hover:text-[#0059b2]'}`}
            >
              {m === 'manual' ? 'Ảnh thủ công' : m === 'canva' ? 'Canva Link' : 'Upload PDF'}
            </button>
          ))}
        </div>

        {mode === 'canva' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <p className="text-[12px] text-blue-700 font-bold mb-2">Nhập link chia sẻ Canva (Share → Copy link → dạng xem)</p>
            <p className="text-[11px] text-blue-500 mb-3">
              Ví dụ: <code className="bg-blue-100 px-1 rounded">https://www.canva.com/design/DAHxxxx/view</code>
              &nbsp;hoặc link edit — hệ thống tự chuyển sang embed
            </p>
            <div className="flex gap-2">
              <input
                value={canvaLink}
                onChange={e => setCanvaLink(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCanva()}
                placeholder="https://www.canva.com/design/..."
                className="flex-1 border border-blue-300 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-400/40 bg-white"
              />
              <button
                onClick={handleAddCanva}
                disabled={!canvaLink.trim()}
                className="bg-[#0059b2] text-white px-4 py-2 rounded-lg font-bold text-[13px] hover:bg-[#004494] transition disabled:opacity-50"
              >
                Thêm
              </button>
            </div>

            {canvaPreview && (
              <div className="mt-3">
                <p className="text-[11px] text-blue-600 font-bold mb-1">Xem trước trang Canva:</p>
                <iframe
                  src={canvaPreview}
                  className="w-full rounded-lg border border-blue-200 shadow-sm"
                  style={{ height: 420 }}
                  allowFullScreen
                  title="Canva Preview"
                />
              </div>
            )}

            {canvaPages.length > 0 && (
              <p className="mt-2 text-[11px] text-green-700 font-bold">
                ✓ Đã thêm {canvaPages.length} trang Canva embed
              </p>
            )}
          </div>
        )}

        {mode === 'pdf' && (
          <div
            className={`border-2 border-dashed rounded-xl p-8 mb-4 text-center transition ${dragOver ? 'border-[#0059b2] bg-blue-50' : 'border-gray-200 bg-gray-50'}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {pdfProgress ? (
              <div className="flex flex-col items-center gap-3">
                <Spinner size={8} />
                <p className="text-[13px] font-bold text-[#0059b2]">
                  {pdfProgress.done <= pdfProgress.total / 2
                    ? `Đang chuyển trang ${pdfProgress.done}/${Math.round(pdfProgress.total / 2)}...`
                    : `Đang tải lên trang ${pdfProgress.done - Math.round(pdfProgress.total / 2)}/${Math.round(pdfProgress.total / 2)}...`}
                </p>
                <div className="w-64 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#0059b2] h-2 rounded-full transition-all"
                    style={{ width: `${Math.round((pdfProgress.done / pdfProgress.total) * 100)}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-[13px] font-bold text-gray-600 mb-1">Kéo thả file PDF vào đây</p>
                <p className="text-[12px] text-gray-400 mb-3">hoặc</p>
                <label className="inline-block bg-[#0059b2] text-white px-5 py-2 rounded-lg font-bold text-[13px] cursor-pointer hover:bg-[#004494] transition">
                  <input ref={pdfRef} type="file" accept="application/pdf" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handlePdfUpload(f); e.target.value = ''; }} />
                  Chọn file PDF
                </label>
                <p className="text-[11px] text-gray-400 mt-2">Hệ thống tự tách từng trang PDF thành ảnh và upload lên</p>
                <p className="text-[11px] text-orange-500 mt-1">Trang 1 PDF = Trang bìa (trang số 1 của báo)</p>
              </>
            )}
          </div>
        )}

        {mode === 'manual' && (
          <div className="mb-4">
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center mb-4 transition ${dragOver ? 'border-[#0059b2] bg-blue-50' : 'border-gray-200 bg-gray-50'}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-[13px] font-bold text-gray-600 mb-1">Kéo thả nhiều ảnh vào đây</p>
              <p className="text-[12px] text-gray-400 mb-3">hoặc</p>
              <label className="inline-block bg-[#0059b2] text-white px-5 py-2 rounded-lg font-bold text-[13px] cursor-pointer hover:bg-[#004494] transition">
                <input ref={imgBatchRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={e => { if (e.target.files) handleBatchImageUpload(e.target.files); e.target.value = ''; }} />
                Chọn nhiều ảnh
              </label>
              <p className="text-[11px] text-gray-400 mt-2">PNG, JPG — tối đa {MAX_PAGES} trang tổng cộng</p>
            </div>

            {pages.length === 0 && (
              <div className="text-center py-4 text-gray-400 text-[13px]">Chưa có trang nào. Hãy thêm ảnh hoặc dùng Canva / PDF.</div>
            )}
          </div>
        )}

        {pages.length > 0 && (
          <div className="mt-3">
            <p className="text-[12px] font-bold text-gray-500 mb-2 uppercase tracking-wide">Danh sách trang đã thêm</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto pr-1">
              {pages.map((p, i) => (
                <div key={i} className="relative group">
                  <div className="aspect-[3/4] rounded-lg overflow-hidden border bg-gray-100 flex items-center justify-center">
                    {p.type === 'canva' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
                        <svg className="w-8 h-8 text-purple-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span className="text-[10px] text-purple-500 font-bold text-center px-1">Canva Embed</span>
                      </div>
                    ) : (
                      <img src={p.url} alt={`Trang ${i + 1}`} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1">
                    <span className="text-white text-[11px] font-bold">Trang {i + 1}</span>
                    {p.type === 'image' && (
                      <label className="bg-white/20 hover:bg-white/30 text-white text-[10px] px-2 py-0.5 rounded cursor-pointer">
                        <input type="file" accept="image/*" className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) handlePageImageUpload(i, f); e.target.value = ''; }} />
                        Đổi ảnh
                      </label>
                    )}
                    <button
                      onClick={() => removePage(i)}
                      className="bg-red-500/80 hover:bg-red-600 text-white text-[10px] px-2 py-0.5 rounded"
                    >
                      Xóa
                    </button>
                  </div>
                  {uploadingIdx === i && (
                    <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center">
                      <Spinner size={5} />
                    </div>
                  )}
                  <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">{i + 1}</div>
                  {p.type === 'canva' && (
                    <div className="absolute top-1 right-1 bg-purple-500/80 text-white text-[9px] px-1 py-0.5 rounded font-bold">Canva</div>
                  )}
                </div>
              ))}

              {mode === 'manual' && pages.length < MAX_PAGES && (
                <label className="aspect-[3/4] rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-[#0059b2]/50 hover:bg-blue-50/30 transition group">
                  <input type="file" accept="image/*" multiple className="hidden"
                    onChange={e => { if (e.target.files) handleBatchImageUpload(e.target.files); e.target.value = ''; }} />
                  <svg className="w-6 h-6 text-gray-300 group-hover:text-[#0059b2] transition mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-[10px] text-gray-400 group-hover:text-[#0059b2]">Thêm</span>
                </label>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
        <button
          onClick={() => handleSave('published')}
          disabled={saving || !!pdfProgress}
          className="bg-[#0059b2] hover:bg-[#004494] text-white px-6 py-2 rounded-lg font-bold text-[14px] transition disabled:opacity-60 flex items-center gap-2"
        >
          {saving && <Spinner />}
          {saving ? 'Đang lưu...' : 'Xuất bản'}
        </button>
        <button
          onClick={() => handleSave('draft')}
          disabled={saving || !!pdfProgress}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-bold text-[14px] transition disabled:opacity-60"
        >
          Lưu nháp
        </button>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 px-4 py-2 text-[14px] transition">
          Hủy
        </button>
        {pages.length > 0 && (
          <span className="ml-auto text-[12px] text-gray-400">
            {imagePages.length} ảnh{canvaPages.length > 0 ? ` + ${canvaPages.length} Canva` : ''}
          </span>
        )}
      </div>
    </div>
  );
}

export default function AdminBaoIn() {
  const [issues, setIssues] = useState<BaoInIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BaoInIssue | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const loadIssues = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('post_type', 'baoin')
      .order('created_at', { ascending: false });
    setIssues((data as BaoInIssue[]) || []);
    setLoading(false);
  };

  useEffect(() => { loadIssues(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa số báo này?')) return;
    setDeleting(id);
    await supabase.from('posts').delete().eq('id', id);
    await loadIssues();
    setDeleting(null);
  };

  const formatDate = (d?: string) => {
    if (!d) return '—';
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
  };

  const countPages = (content: string) => {
    try { return (JSON.parse(content) as any[]).filter(Boolean).length; } catch { return 0; }
  };

  return (
    <AdminLayout title="Quản lý Báo In">
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-bold text-[#0059b2]">Quản lý Báo In</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">Thêm và quản lý các số báo in điện tử — hỗ trợ Canva embed, PDF và ảnh</p>
          </div>
          {!showEditor && (
            <button
              onClick={() => { setEditing(null); setShowEditor(true); }}
              className="bg-[#0059b2] hover:bg-[#004494] text-white px-5 py-2 rounded-lg font-bold text-[14px] transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm số báo
            </button>
          )}
        </div>

        {showEditor && (
          <div className="mb-8">
            <IssueEditor
              issue={editing}
              onSave={() => { setShowEditor(false); setEditing(null); loadIssues(); }}
              onCancel={() => { setShowEditor(false); setEditing(null); }}
            />
          </div>
        )}

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-[13.5px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-gray-500 w-12">#</th>
                <th className="px-4 py-3 text-left font-bold text-gray-500">Tiêu đề</th>
                <th className="px-4 py-3 text-left font-bold text-gray-500 hidden md:table-cell">Ngày</th>
                <th className="px-4 py-3 text-left font-bold text-gray-500 hidden md:table-cell">Trang</th>
                <th className="px-4 py-3 text-left font-bold text-gray-500">Trạng thái</th>
                <th className="px-4 py-3 text-right font-bold text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
                    </td>
                  </tr>
                ))
              ) : issues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">Chưa có số báo nào</td>
                </tr>
              ) : issues.map((iss, idx) => (
                <tr key={(iss as any).id} className="hover:bg-blue-50/30 transition">
                  <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {iss.thumbnail && (
                        <img src={iss.thumbnail} alt="" className="w-10 h-14 object-cover rounded border flex-shrink-0" />
                      )}
                      <div>
                        <span className="font-bold text-[#222] line-clamp-2">{iss.title}</span>
                        {(() => {
                          try {
                            const pages = JSON.parse(iss.content) as any[];
                            const hasCanva = pages.some((p: any) => p?.type === 'canva');
                            if (hasCanva) return (
                              <span className="inline-flex items-center gap-1 text-[10px] text-purple-600 font-bold mt-0.5">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Có Canva embed
                              </span>
                            );
                          } catch {}
                          return null;
                        })()}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{formatDate((iss as any).published_at)}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{countPages(iss.content)} trang</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${iss.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {iss.status === 'published' ? 'Đã xuất bản' : 'Nháp'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setEditing(iss); setShowEditor(true); }}
                        className="text-[#0059b2] hover:text-[#004494] font-bold text-[12px] px-3 py-1 rounded border border-[#0059b2]/30 hover:bg-blue-50 transition"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete((iss as any).id)}
                        disabled={deleting === (iss as any).id}
                        className="text-red-400 hover:text-red-600 font-bold text-[12px] px-3 py-1 rounded border border-red-200 hover:bg-red-50 transition disabled:opacity-50"
                      >
                        {deleting === (iss as any).id ? '...' : 'Xóa'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
