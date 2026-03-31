import { useState, useEffect, useRef } from 'react';
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

const EMPTY_PAGES = Array(30).fill('');

function IssueEditor({ issue, onSave, onCancel }: {
  issue?: BaoInIssue | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(issue?.title || '');
  const [cover, setCover] = useState(issue?.thumbnail || '');
  const [pages, setPages] = useState<string[]>(() => {
    if (issue?.content) {
      try {
        const parsed = JSON.parse(issue.content);
        return [...parsed, ...EMPTY_PAGES].slice(0, 30);
      } catch {}
    }
    return [...EMPTY_PAGES];
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const setPage = (i: number, val: string) => {
    setPages(prev => { const next = [...prev]; next[i] = val; return next; });
  };

  const handleCoverUpload = async (file: File) => {
    setCoverUploading(true);
    const url = await uploadImage(file);
    if (url) setCover(url);
    else setError('Tải ảnh bìa thất bại');
    setCoverUploading(false);
  };

  const handlePageUpload = async (i: number, file: File) => {
    setUploadingIndex(i);
    const url = await uploadImage(file);
    if (url) setPage(i, url);
    else setError(`Tải ảnh trang ${i + 1} thất bại`);
    setUploadingIndex(null);
  };

  const handleSave = async (status: 'draft' | 'published') => {
    if (!title.trim()) { setError('Vui lòng nhập tiêu đề số báo'); return; }
    setSaving(true);
    setError('');
    const slug = `bao-in-${Date.now()}`;
    const payload = {
      title: title.trim(),
      thumbnail: cover.trim(),
      content: JSON.stringify(pages.map(p => p.trim()).filter(Boolean)),
      post_type: 'baoin',
      status,
      slug: issue?.slug || slug,
      published_at: new Date().toISOString(),
      view_count: 0,
    };
    if (issue?.id) {
      const { error: e } = await supabase.from('posts').update(payload).eq('id', issue.id);
      if (e) { setError(e.message); setSaving(false); return; }
    } else {
      const { error: e } = await supabase.from('posts').insert(payload);
      if (e) { setError(e.message); setSaving(false); return; }
    }
    setSaving(false);
    onSave();
  };

  const filledCount = pages.filter(p => p.trim()).length;

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-4xl">
      <h2 className="text-[18px] font-bold text-[#0059b2] mb-6">{issue?.id ? 'Chỉnh sửa số báo' : 'Thêm số báo mới'}</h2>
      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-[13px] font-bold text-[#333] mb-1">Tiêu đề số báo *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="VD: Báo Hải quân số 1"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0059b2]/30"
          />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-[#333] mb-1">URL ảnh bìa</label>
          <div className="flex gap-2">
            <input
              value={cover}
              onChange={e => setCover(e.target.value)}
              placeholder="https://..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0059b2]/30"
            />
            <label className={`flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg border font-bold text-[12px] cursor-pointer transition ${coverUploading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-[#0059b2]/10 text-[#0059b2] border-[#0059b2]/30 hover:bg-[#0059b2]/20'}`}>
              <input type="file" accept="image/*" className="hidden" disabled={coverUploading} ref={coverInputRef} onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); e.target.value = ''; }} />
              {coverUploading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              )}
              {coverUploading ? 'Đang tải...' : 'Tải ảnh'}
            </label>
          </div>
        </div>
      </div>

      {cover && (
        <div className="mb-4 flex justify-center">
          <img src={cover} alt="Bìa" className="h-40 object-contain rounded border" />
        </div>
      )}

      <div className="mb-2 flex items-center gap-2">
        <span className="text-[13px] font-bold text-[#333]">Trang báo ({filledCount}/30 trang đã nhập)</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-2">
        {pages.map((p, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-400 font-mono w-6 flex-shrink-0 text-right">{i + 1}.</span>
            <input
              value={p}
              onChange={e => setPage(i, e.target.value)}
              placeholder={`URL trang ${i + 1}...`}
              className={`flex-1 min-w-0 border rounded-lg px-2.5 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-[#0059b2]/40 ${p ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}
            />
            <label className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg border cursor-pointer transition ${uploadingIndex === i ? 'bg-gray-100 border-gray-200' : 'bg-[#0059b2]/10 border-[#0059b2]/30 hover:bg-[#0059b2]/20 text-[#0059b2]'}`} title={`Tải ảnh trang ${i + 1}`}>
              <input type="file" accept="image/*" className="hidden" disabled={uploadingIndex !== null} onChange={e => { const f = e.target.files?.[0]; if (f) handlePageUpload(i, f); e.target.value = ''; }} />
              {uploadingIndex === i ? (
                <svg className="w-3.5 h-3.5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              )}
            </label>
            {p && (
              <a href={p} target="_blank" rel="noreferrer" className="flex-shrink-0 text-[#0059b2] hover:opacity-70">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={() => handleSave('published')}
          disabled={saving}
          className="bg-[#0059b2] hover:bg-[#004494] text-white px-6 py-2 rounded-lg font-bold text-[14px] transition disabled:opacity-60"
        >
          {saving ? 'Đang lưu...' : 'Xuất bản'}
        </button>
        <button
          onClick={() => handleSave('draft')}
          disabled={saving}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-bold text-[14px] transition"
        >
          Lưu nháp
        </button>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 px-4 py-2 text-[14px] transition">
          Hủy
        </button>
      </div>
    </div>
  );
}

export default function AdminBaoIn() {
  const [issues, setIssues] = useState<BaoInIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BaoInIssue | null | 'new'>('new' as any);
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
    try { return (JSON.parse(content) as string[]).filter(Boolean).length; } catch { return 0; }
  };

  return (
    <AdminLayout title="Quản lý Báo In">
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-bold text-[#0059b2]">Quản lý Báo In</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">Thêm và quản lý các số báo in điện tử</p>
          </div>
          {!showEditor && (
            <button
              onClick={() => { setEditing(null); setShowEditor(true); }}
              className="bg-[#0059b2] hover:bg-[#004494] text-white px-5 py-2 rounded-lg font-bold text-[14px] transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Thêm số báo
            </button>
          )}
        </div>

        {showEditor && (
          <div className="mb-8">
            <IssueEditor
              issue={editing as BaoInIssue | null}
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
                  <tr key={i}><td colSpan={6} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse w-full" /></td></tr>
                ))
              ) : issues.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Chưa có số báo nào</td></tr>
              ) : issues.map((iss, idx) => (
                <tr key={(iss as any).id} className="hover:bg-blue-50/30 transition">
                  <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {iss.thumbnail && <img src={iss.thumbnail} alt="" className="w-10 h-14 object-cover rounded border flex-shrink-0" />}
                      <span className="font-bold text-[#222] line-clamp-2">{iss.title}</span>
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
